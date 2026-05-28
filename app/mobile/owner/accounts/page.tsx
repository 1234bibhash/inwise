'use client'

import { useEffect, useState } from 'react'
import { getLedgers, type LedgerRecord } from '@/lib/services/accountService'
import { Search, Users, Building2, Wallet, Filter, X, Phone, MapPin, ReceiptText } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const GROUPS = [
  'Sundry Creditors', 'Sundry Debtors', 'Secured Loans', 'Unsecured Loans', 
  'Bank Accounts', 'Cash-in-hand', 'Direct Expenses', 'Indirect Expenses',
  'Cash Receipt', 'UPI Receipt', 'Finance Receipt', 'Cheque Receipt', 'NEFT Receipt',
  'Opening Stock', 'Closing Stock', 'TA - Trade Advance'
]

export default function MobileAccountsPage() {
  const [ledgers, setLedgers] = useState<LedgerRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState('All')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedLedger, setSelectedLedger] = useState<LedgerRecord | null>(null)

  useEffect(() => {
    loadLedgers()
  }, [])

  async function loadLedgers() {
    setIsLoading(true)
    try {
      const data = await getLedgers()
      setLedgers(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLedgers = ledgers.filter(ldg => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = ldg.ledger_name.toLowerCase().includes(query) || (ldg.customer_phone && ldg.customer_phone.includes(query))
    const matchesGroup = groupFilter === 'All' || ldg.under_group === groupFilter
    return matchesSearch && matchesGroup
  }).sort((a, b) => a.ledger_name.localeCompare(b.ledger_name))

  const totalDebtors = ledgers
    .filter(l => l.under_group === 'Sundry Debtors')
    .reduce((acc, curr) => acc + (curr.balance_type === 'Dr' ? curr.opening_balance : -curr.opening_balance), 0)
    
  const totalCreditors = ledgers
    .filter(l => l.under_group === 'Sundry Creditors')
    .reduce((acc, curr) => acc + (curr.balance_type === 'Cr' ? curr.opening_balance : -curr.opening_balance), 0)

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans pb-24">
      {/* Header & Search */}
      <div className="bg-white px-4 py-3 shadow-sm border-b border-[#e9e9e8] sticky top-0 z-20 space-y-4">
        <h1 className="text-lg font-black text-gray-900 tracking-tight">Accounts</h1>
        
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search ledgers..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f7f7f5] border border-[#ededeb] rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4CB963] focus:ring-1 focus:ring-[#4CB963] placeholder:text-gray-400 transition-all"
            />
          </div>
          
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <button className="h-10 px-3 bg-[#f7f7f5] border border-[#ededeb] rounded-xl flex items-center justify-center relative active:scale-95 transition-transform">
                <Filter className="h-4 w-4 text-gray-600" />
                {groupFilter !== 'All' && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4CB963] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4CB963] border-2 border-white"></span>
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-5">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-lg font-bold text-gray-900 text-left">Filter by Group</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 mb-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Account Group</label>
                  <Select value={groupFilter} onValueChange={setGroupFilter}>
                    <SelectTrigger className="w-full h-10 bg-[#f7f7f5] border-[#ededeb] rounded-xl text-sm font-semibold focus:ring-[#4CB963]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#ededeb] max-h-[40vh]">
                      <SelectItem value="All" className="text-sm font-medium">All Groups</SelectItem>
                      {GROUPS.map((g: any) => <SelectItem key={g} value={g} className="text-sm font-medium">{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setGroupFilter('All')}
                  className="flex-1 h-10 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm bg-white hover:bg-gray-50"
                >
                  Clear
                </button>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 h-10 bg-[#37352f] text-white rounded-xl font-bold text-sm shadow-sm"
                >
                  Apply
                </button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Metric Cards (Swipeable/Scrollable row) */}
        <div className="flex overflow-x-auto gap-4 pb-2 -mx-4 px-4 custom-scrollbar snap-x">
          <div className="bg-white p-4 rounded-2xl border border-[#ededeb] shadow-sm min-w-[240px] shrink-0 snap-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sundry Debtors</h3>
              <Users className="h-4 w-4 text-emerald-500/30" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl font-black text-[#37352f]">₹{Math.abs(totalDebtors).toLocaleString('en-IN')}</p>
              <span className="text-[10px] font-bold text-emerald-600">{totalDebtors >= 0 ? 'Dr' : 'Cr'}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#ededeb] shadow-sm min-w-[240px] shrink-0 snap-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sundry Creditors</h3>
              <Building2 className="h-4 w-4 text-rose-500/30" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <p className="text-xl font-black text-[#37352f]">₹{Math.abs(totalCreditors).toLocaleString('en-IN')}</p>
              <span className="text-[10px] font-bold text-rose-600">{totalCreditors >= 0 ? 'Cr' : 'Dr'}</span>
            </div>
          </div>
        </div>

        {/* Ledger List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-gray-800">Ledger Accounts</h2>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{filteredLedgers.length} Ledgers</span>
          </div>

          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                <Skeleton className="h-4 w-1/2 bg-gray-100" />
                <Skeleton className="h-3 w-1/3 bg-gray-100" />
              </div>
            ))
          ) : filteredLedgers.length > 0 ? (
            filteredLedgers.map(ldg => (
              <div 
                key={ldg.id}
                onClick={() => setSelectedLedger(ldg)}
                className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm active:scale-[0.98] transition-transform cursor-pointer relative overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${ldg.under_group === 'Sundry Debtors' ? 'bg-emerald-400' : ldg.under_group === 'Sundry Creditors' ? 'bg-rose-400' : 'bg-blue-400'}`} />
                <div className="flex justify-between items-start gap-4 pl-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-black text-gray-900 truncate">{ldg.ledger_name}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">
                      {ldg.under_group}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[14px] font-black ${ldg.balance_type === 'Dr' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      ₹{Math.abs(ldg.opening_balance || 0).toLocaleString()}
                    </p>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{ldg.balance_type}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <Wallet className="h-8 w-8 text-gray-300 mb-2" />
              <h3 className="text-xs font-bold text-gray-600">No ledgers found</h3>
              <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">Try adjusting your search or filter.</p>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Details Bottom Sheet */}
      <Sheet open={!!selectedLedger} onOpenChange={(open) => !open && setSelectedLedger(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-0 max-h-[85vh] flex flex-col bg-[#f7f7f5]">
          {selectedLedger && (
            <>
              {/* Header */}
              <div className="bg-white p-5 pt-6 pb-5 rounded-t-3xl border-b border-[#ededeb] shrink-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selectedLedger.under_group === 'Sundry Debtors' ? 'bg-emerald-100 text-emerald-600' : selectedLedger.under_group === 'Sundry Creditors' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                    {selectedLedger.under_group === 'Sundry Creditors' ? <Building2 className="w-5 h-5" /> : selectedLedger.under_group === 'Sundry Debtors' ? <Users className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-[17px] font-black text-gray-900 leading-snug break-words line-clamp-2">
                      {selectedLedger.ledger_name}
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                      {selectedLedger.under_group}
                    </p>
                  </div>
                </div>

                {/* Balance Pill */}
                <div className="flex items-center justify-between bg-[#f7f7f5] px-4 py-3 rounded-2xl border border-[#ededeb]">
                   <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Balance</span>
                   <div className="flex items-baseline gap-1.5">
                     <span className="text-[17px] font-black text-gray-900">₹{Math.abs(selectedLedger.opening_balance || 0).toLocaleString()}</span>
                     <Badge className={`${selectedLedger.balance_type === 'Dr' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'} border-none text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest`}>
                       {selectedLedger.balance_type}
                     </Badge>
                   </div>
                </div>
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 space-y-6">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Contact Information</h3>
                  <div className="bg-white rounded-2xl border border-[#ededeb] overflow-hidden">
                    <div className="flex items-center gap-3 p-4 border-b border-gray-50">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <span className="text-[13px] font-semibold text-gray-700">{selectedLedger.customer_phone || 'No phone number'}</span>
                    </div>
                    <div className="flex items-start gap-3 p-4">
                      <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                      <span className="text-[13px] font-semibold text-gray-700 leading-relaxed">
                        {selectedLedger.address ? `${selectedLedger.address}${selectedLedger.state ? `, ${selectedLedger.state}` : ''}${selectedLedger.pincode ? ` - ${selectedLedger.pincode}` : ''}` : 'No address provided'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tax & Banking Info */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tax & Financial</h3>
                  <div className="bg-white rounded-2xl border border-[#ededeb] p-4 grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">GSTIN</span>
                      <span className="text-[12px] font-semibold text-gray-900">{selectedLedger.gstin || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">PAN</span>
                      <span className="text-[12px] font-semibold text-gray-900">{selectedLedger.pan_no || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Credit Limit</span>
                      <span className="text-[12px] font-semibold text-gray-900">{selectedLedger.credit_limit_amount ? `₹${selectedLedger.credit_limit_amount}` : 'None'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Credit Period</span>
                      <span className="text-[12px] font-semibold text-gray-900">{selectedLedger.credit_period_days ? `${selectedLedger.credit_period_days} Days` : 'None'}</span>
                    </div>
                  </div>
                </div>

                {/* Mock Transaction History (for view layout demo) */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Recent Transactions</h3>
                  <div className="bg-white rounded-2xl border border-[#ededeb] overflow-hidden">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                          <ReceiptText className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-gray-900">Payment Received</p>
                          <p className="text-[9px] font-semibold text-gray-400">12 May 2026</p>
                        </div>
                      </div>
                      <span className="text-[13px] font-black text-emerald-600">+₹5,000</span>
                    </div>
                    <div className="p-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                          <ReceiptText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-gray-900">Sales Invoice #102</p>
                          <p className="text-[9px] font-semibold text-gray-400">10 May 2026</p>
                        </div>
                      </div>
                      <span className="text-[13px] font-black text-rose-600">-₹12,400</span>
                    </div>
                  </div>
                </div>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
