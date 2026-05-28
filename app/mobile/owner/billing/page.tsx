'use client'

import { useEffect, useState } from 'react'
import { getInvoices, type Invoice } from '@/lib/services/invoiceService'
import { Search, FileText, CheckCircle2, Clock, Plus, Receipt, User, ArrowUpRight, ArrowRight, MapPin, Building2, Phone } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { getBusinessSettings, type BusinessSettings } from '@/lib/services/settingsService'
import { DocumentRenderer } from '@/components/DocumentRenderer'
import { Printer } from 'lucide-react'

export default function MobileBillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [previewDocument, setPreviewDocument] = useState<{ type: 'invoice' | 'receipt', id: string, data: any } | null>(null)
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const [isNewBillOpen, setIsNewBillOpen] = useState(false)
  const router = useRouter()

  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    alternate_phone: '',
    email: '',
    address_billing: '',
    address_delivery: '',
    pin_code: '',
    state: 'WEST BENGAL',
    gstin: ''
  })

  const handleNextNewBill = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerForm.name || !customerForm.phone) return
    sessionStorage.setItem('inwise_draft_customer', JSON.stringify(customerForm))
    router.push('/mobile/owner/billing/new')
  }

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const [invData, settingsData] = await Promise.all([
        getInvoices(),
        getBusinessSettings()
      ])
      setInvoices(invData || [])
      setBusinessSettings(settingsData)
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const parentInvoices = invoices.filter(inv => !inv.is_receipt_invoice && !inv.invoice_number.startsWith('RCPT-'))
  
  const filteredInvoices = parentInvoices.filter(inv => {
    const query = searchQuery.toLowerCase()
    return inv.invoice_number.toLowerCase().includes(query) || 
           inv.customer_name.toLowerCase().includes(query) ||
           (inv.customer_phone && inv.customer_phone.includes(query))
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const totalRevenue = parentInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
  const paidRevenue = parentInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0)
  const pendingRevenue = parentInvoices.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + (inv.total_amount || 0), 0)

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans pb-24">
      {/* Header & Search */}
      <div className="bg-white px-4 py-3 shadow-sm border-b border-[#e9e9e8] sticky top-0 z-20 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-black text-gray-900 tracking-tight">Billing & Invoices</h1>
          <button 
            onClick={() => setIsNewBillOpen(true)}
            className="h-8 px-3 bg-[#37352f] text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Plus className="w-3.5 h-3.5" /> New Bill
          </button>
        </div>
        
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by name, phone or invoice..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#f7f7f5] border border-[#ededeb] rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4CB963] focus:ring-1 focus:ring-[#4CB963] placeholder:text-gray-400 transition-all"
          />
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Metric Cards (Swipeable) */}
        <div className="flex overflow-x-auto gap-4 pb-2 -mx-4 px-4 custom-scrollbar snap-x">
          <div className="bg-white p-4 rounded-2xl border border-[#ededeb] shadow-sm min-w-[200px] shrink-0 snap-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Revenue</h3>
            <p className="text-xl font-black text-blue-600">₹{totalRevenue.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#ededeb] shadow-sm min-w-[200px] shrink-0 snap-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Paid Revenue</h3>
            <p className="text-xl font-black text-emerald-600">₹{paidRevenue.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#ededeb] shadow-sm min-w-[200px] shrink-0 snap-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-orange-500" />
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Pending Dues</h3>
            <p className="text-xl font-black text-orange-600">₹{pendingRevenue.toLocaleString('en-IN')}</p>
          </div>
        </div>

        {/* Invoice List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-gray-800">Recent Invoices</h2>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{filteredInvoices.length} Found</span>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <Skeleton className="h-4 w-1/2 bg-gray-100" />
                <Skeleton className="h-3 w-1/3 bg-gray-100" />
              </div>
            ))
          ) : filteredInvoices.length > 0 ? (
            filteredInvoices.map(inv => (
              <div 
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${inv.status === 'paid' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
                <div className="flex justify-between items-start gap-4 pl-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-black text-gray-900 truncate">{inv.customer_name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{inv.invoice_number.split('-').pop()}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(inv.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[14px] font-black ${inv.status === 'paid' ? 'text-emerald-600' : 'text-orange-600'}`}>
                      ₹{Math.abs(inv.total_amount || 0).toLocaleString()}
                    </p>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{inv.status}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <Receipt className="h-8 w-8 text-gray-300 mb-2" />
              <h3 className="text-xs font-bold text-gray-600">No invoices found</h3>
              <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Create your first invoice to get started.</p>
            </div>
          )}
        </div>
      </div>

      {/* Invoice Details Bottom Sheet */}
      <Sheet open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-0 max-h-[85vh] flex flex-col bg-[#f7f7f5]">
          {selectedInvoice && (
            <>
              {/* Header */}
              <div className="bg-white p-5 pt-6 pb-5 rounded-t-3xl border-b border-[#ededeb] shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-[18px] font-black text-gray-900 leading-snug break-words">
                      {selectedInvoice.customer_name}
                    </h2>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      {selectedInvoice.invoice_number}
                    </p>
                  </div>
                  <div className={`w-10 h-10 mr-6 rounded-full flex items-center justify-center shrink-0 ${selectedInvoice.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                    {selectedInvoice.status === 'paid' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                  </div>
                </div>

                {/* Amount Pill */}
                <div className="flex items-center justify-between bg-[#f7f7f5] px-4 py-3 rounded-2xl border border-[#ededeb]">
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Amount</span>
                   <span className="text-[20px] font-black text-gray-900">₹{Math.abs(selectedInvoice.total_amount || 0).toLocaleString()}</span>
                </div>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 space-y-6">
                
                {/* Items List */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Purchased Items</h3>
                  <div className="bg-white rounded-2xl border border-[#ededeb] overflow-hidden divide-y divide-gray-50">
                    {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                      selectedInvoice.items.map((item: any, idx: number) => (
                        <div key={idx} className="p-4 flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-gray-900 leading-snug">{item.name}</p>
                            <p className="text-[10px] font-semibold text-gray-400 mt-1">Qty: {item.quantity}</p>
                          </div>
                          <span className="text-[13px] font-black text-gray-900 shrink-0">₹{(item.amount || (item.base_price * item.quantity)).toLocaleString()}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-[12px] text-gray-400 font-medium">No items found.</div>
                    )}
                  </div>
                </div>

                {/* Payment Info */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Payment Details</h3>
                  <div className="bg-white rounded-2xl border border-[#ededeb] p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Mode</span>
                      <span className="text-[12px] font-semibold text-gray-900 capitalize">{selectedInvoice.payment_info?.mode || 'Cash'}</span>
                    </div>
                    {selectedInvoice.payment_info?.finance_provider && (
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Provider</span>
                        <span className="text-[12px] font-semibold text-gray-900">{selectedInvoice.payment_info.finance_provider}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Paid Amount</span>
                      <span className="text-[12px] font-black text-emerald-600">₹{(selectedInvoice.payment_info?.paid_amount || 0).toLocaleString()}</span>
                    </div>
                    {(selectedInvoice.payment_info?.pending_amount || 0) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Pending Due</span>
                        <span className="text-[12px] font-black text-orange-600">₹{(selectedInvoice.payment_info?.pending_amount || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex gap-3">
                  <button 
                    onClick={() => {
                      setPreviewDocument({ type: selectedInvoice.is_receipt_invoice ? 'receipt' : 'invoice', id: selectedInvoice.id, data: selectedInvoice })
                      setSelectedInvoice(null)
                    }}
                    className="flex-1 h-12 bg-white border border-[#ededeb] text-[#37352f] rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2"
                  >
                    <ArrowUpRight className="w-4 h-4" /> View PDF
                  </button>
                  <button 
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: `Invoice ${selectedInvoice.invoice_number}`,
                          text: `Invoice ${selectedInvoice.invoice_number} for ₹${selectedInvoice.total_amount}. Click below to print or share as PDF.`,
                          url: window.location.origin + `/owner/dashboard?preview=${selectedInvoice.id}`
                        }).catch(() => {})
                      } else {
                        setPreviewDocument({ type: selectedInvoice.is_receipt_invoice ? 'receipt' : 'invoice', id: selectedInvoice.id, data: selectedInvoice })
                        setSelectedInvoice(null)
                        setTimeout(() => window.print(), 500)
                      }
                    }}
                    className="flex-1 h-12 bg-[#37352f] text-white rounded-xl font-bold text-sm shadow-sm flex items-center justify-center gap-2"
                  >
                    <Receipt className="w-4 h-4" /> Share Receipt
                  </button>
                </div>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Full Screen PDF Preview Sheet */}
      <Sheet open={!!previewDocument} onOpenChange={(open) => !open && setPreviewDocument(null)}>
        <SheetContent side="bottom" className="h-[95vh] rounded-t-3xl border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-0 flex flex-col bg-[#f7f7f5]">
          <div className="bg-white p-4 flex items-center justify-between border-b border-[#ededeb] shrink-0 rounded-t-3xl">
            <h2 className="text-[15px] font-black text-gray-900">
              {previewDocument?.type === 'receipt' ? 'Receipt PDF' : 'Invoice PDF'}
            </h2>
            <button 
              onClick={() => window.print()}
              className="h-8 px-4 bg-[#37352f] text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Save
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {previewDocument && (
              <div className="scale-[0.8] origin-top max-w-full">
                <DocumentRenderer 
                   document={previewDocument.data} 
                   type={previewDocument.type} 
                   businessSettings={businessSettings} 
                />
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* New Bill - Customer Details Sheet */}
      <Sheet open={isNewBillOpen} onOpenChange={setIsNewBillOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-0 flex flex-col bg-[#f7f7f5]">
          <div className="bg-white p-5 pt-6 pb-4 border-b border-[#ededeb] shrink-0 rounded-t-3xl">
            <h2 className="text-[18px] font-black text-gray-900 leading-snug">New Bill</h2>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Step 1: Customer Details</p>
          </div>
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            <form id="customer-form" onSubmit={handleNextNewBill} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Basic Info
                </h3>
                <div className="bg-white rounded-2xl border border-[#ededeb] p-1 shadow-sm">
                  <div className="px-3 py-2 border-b border-gray-50">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Client Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={customerForm.name}
                      onChange={e => setCustomerForm({...customerForm, name: e.target.value})}
                      className="w-full text-[14px] font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 mt-1"
                    />
                  </div>
                  <div className="px-3 py-2 border-b border-gray-50">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Primary Phone <span className="text-rose-500">*</span></label>
                    <input 
                      type="tel" 
                      required
                      placeholder="10-digit number"
                      value={customerForm.phone}
                      onChange={e => setCustomerForm({...customerForm, phone: e.target.value})}
                      className="w-full text-[14px] font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 mt-1"
                    />
                  </div>
                  <div className="px-3 py-2 border-b border-gray-50">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Alternate Phone</label>
                    <input 
                      type="tel" 
                      placeholder="Optional"
                      value={customerForm.alternate_phone}
                      onChange={e => setCustomerForm({...customerForm, alternate_phone: e.target.value})}
                      className="w-full text-[14px] font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 mt-1"
                    />
                  </div>
                  <div className="px-3 py-2">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Email Address</label>
                    <input 
                      type="email" 
                      placeholder="Optional"
                      value={customerForm.email}
                      onChange={e => setCustomerForm({...customerForm, email: e.target.value})}
                      className="w-full text-[14px] font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Address Details
                </h3>
                <div className="bg-white rounded-2xl border border-[#ededeb] p-1 shadow-sm">
                  <div className="px-3 py-2 border-b border-gray-50">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Billing Address</label>
                    <textarea 
                      rows={1}
                      placeholder="Full address..."
                      value={customerForm.address_billing}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      onChange={e => setCustomerForm({...customerForm, address_billing: e.target.value})}
                      className="w-full text-[13px] font-semibold text-gray-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 mt-1 resize-none overflow-hidden"
                    />
                  </div>
                  <div className="px-3 py-2 border-b border-gray-50">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Delivery Address (If Different)</label>
                    <textarea 
                      rows={1}
                      placeholder="Optional"
                      value={customerForm.address_delivery}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      onChange={e => setCustomerForm({...customerForm, address_delivery: e.target.value})}
                      className="w-full text-[13px] font-semibold text-gray-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 mt-1 resize-none overflow-hidden"
                    />
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-50">
                    <div className="px-3 py-2">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">State</label>
                      <input 
                        type="text" 
                        value={customerForm.state}
                        onChange={e => setCustomerForm({...customerForm, state: e.target.value})}
                        className="w-full text-[13px] font-semibold text-gray-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 mt-1"
                      />
                    </div>
                    <div className="px-3 py-2">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pincode</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 700001"
                        value={customerForm.pin_code}
                        onChange={e => setCustomerForm({...customerForm, pin_code: e.target.value})}
                        className="w-full text-[13px] font-semibold text-gray-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5" /> Tax Info (Corporate)
                </h3>
                <div className="bg-white rounded-2xl border border-[#ededeb] p-1 shadow-sm">
                  <div className="px-3 py-2">
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">GSTIN</label>
                    <input 
                      type="text" 
                      placeholder="Optional"
                      value={customerForm.gstin}
                      onChange={e => setCustomerForm({...customerForm, gstin: e.target.value})}
                      className="w-full text-[14px] font-bold text-gray-900 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 mt-1 uppercase"
                    />
                  </div>
                </div>
              </div>
              
              {/* Padding block so scroll clears the sticky button */}
              <div className="h-20"></div> 
            </form>
          </div>
          
          <div className="bg-white p-4 border-t border-[#ededeb] shrink-0 sticky bottom-0 z-10 pb-safe">
            <button 
              type="submit" 
              form="customer-form"
              className="w-full h-14 rounded-2xl font-black bg-[#4CB963] text-white shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            >
              Continue to Products <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
