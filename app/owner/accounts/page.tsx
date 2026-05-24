'use client'

import { useEffect, useState } from 'react'
import { getLedgers, addLedger, updateLedger, deleteLedger, LedgerRecord, UnderGroup, BalanceType, DealerType } from '@/lib/services/accountService'
import { getInvoices, Invoice, createInvoice, updateInvoice, deleteInvoice } from '@/lib/services/invoiceService'
import { getBusinessSettings, BusinessSettings } from '@/lib/services/settingsService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet'
import { 
  Search, 
  Plus, 
  Building2, 
  Wallet, 
  Users, 
  PiggyBank, 
  ArrowRight,
  ChevronRight,
  FileText,
  FileDigit,
  Landmark,
  Scale,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'

const GROUPS: string[] = [
  'Sundry Creditors', 'Sundry Debtors', 'Secured Loans', 'Unsecured Loans', 
  'Bank Accounts', 'Cash-in-hand', 'Direct Expenses', 'Indirect Expenses',
  'Cash Receipt', 'UPI Receipt', 'Finance Receipt', 'Cheque Receipt', 'NEFT Receipt',
  'TA - Trade Advance'
]

export default function AccountsPage() {
  const router = useRouter()
  const [ledgers, setLedgers] = useState<LedgerRecord[]>([])
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [selectedLedger, setSelectedLedger] = useState<LedgerRecord | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [listStartDate, setListStartDate] = useState('')
  const [listEndDate, setListEndDate] = useState('')
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<string[]>([])

  const [creationMode, setCreationMode] = useState<'ledger' | 'ta'>('ledger')

  // Receipt Form State inside Detail Drawer
  const [isReceiptFormOpen, setIsReceiptFormOpen] = useState(false)
  const [activeReceiptType, setActiveReceiptType] = useState<UnderGroup | null>(null)
  const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null)
  const [previewInvoice, setPreviewInvoice] = useState<any>(null)
  const [receiptFormData, setReceiptFormData] = useState({
    amount: '',
    receipt_destination_type: 'bank' as 'bank' | 'upi',
    receipt_destination_bank: '',
    receipt_destination_id: '',
    registration_type: 'Regular' as string
  })
  const [mockReceipts, setMockReceipts] = useState<{ id: string, date: string, type: string, amount: number, vchNo: string, destType?: string, destId?: string, destBank?: string, registrationType?: string }[]>([])

  // Form State
  const [formData, setFormData] = useState({
    ledger_name: '',
    under_group: 'Sundry Creditors' as UnderGroup,
    maintain_balances_bill_by_bill: true,
    credit_period_days: '',
    credit_limit_amount: '',
    address: '',
    state: '',
    pincode: '',
    pan_no: '',
    registration_type: 'Regular' as DealerType,
    gstin: '',
    opening_balance: '',
    balance_type: 'Cr' as BalanceType,
    bank_accounts: [] as { bank_name: string; account_number: string; ifsc: string }[],
    upi_ids: [] as string[],
    receipt_destination_type: 'bank' as 'bank' | 'upi',
    receipt_destination_id: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Report State
  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false)
  const [reportFilters, setReportFilters] = useState({ fy: 'FY 2026-2027', month: 'All' })

  useEffect(() => {
    loadLedgers()
    const saved = localStorage.getItem('inwise_mock_receipts')
    if (saved) {
      try { setMockReceipts(JSON.parse(saved)) } catch {}
    }
  }, [])

  async function loadLedgers() {
    setIsLoading(true)
    try {
      const [data, loadedSettings, loadedInvoices] = await Promise.all([
        getLedgers(),
        getBusinessSettings(),
        getInvoices()
      ])
      setLedgers(data)
      setSettings(loadedSettings)
      setInvoices(loadedInvoices)
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddLedger = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.ledger_name) {
      toast.error('Ledger name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await addLedger({
        ledger_name: formData.ledger_name,
        under_group: formData.under_group,
        maintain_balances_bill_by_bill: formData.maintain_balances_bill_by_bill,
        credit_period_days: Number(formData.credit_period_days) || 0,
        credit_limit_amount: Number(formData.credit_limit_amount) || 0,
        address: formData.address,
        state: formData.state,
        pincode: formData.pincode,
        pan_no: formData.pan_no?.toUpperCase(),
        registration_type: formData.registration_type,
        gstin: formData.gstin?.toUpperCase(),
        opening_balance: Number(formData.opening_balance) || 0,
        balance_type: formData.balance_type,
        bank_accounts: formData.bank_accounts,
        upi_ids: formData.upi_ids
      })
      toast.success('Ledger created successfully')
      setIsAddSheetOpen(false)
      
      // Reset form
      setFormData({
        ledger_name: '',
        under_group: 'Sundry Creditors',
        maintain_balances_bill_by_bill: true,
        credit_period_days: '',
        credit_limit_amount: '',
        address: '',
        state: '',
        pincode: '',
        pan_no: '',
        registration_type: 'Regular',
        gstin: '',
        opening_balance: '',
        balance_type: 'Cr',
        bank_accounts: [],
        upi_ids: []
      })
      
      loadLedgers()
    } catch (err) {
      toast.error('Failed to create ledger')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddReceipt = async () => {
    if (!receiptFormData.amount || isNaN(Number(receiptFormData.amount))) {
      toast.error('Valid amount is required')
      return
    }

    if (selectedLedger) {
      const customerInvoices = invoices.filter(inv => 
        inv.customer_name.toLowerCase() === selectedLedger.ledger_name.toLowerCase()
      ).sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      const parentInv = customerInvoices.length > 0 ? customerInvoices[0] : null;

      let itemsToCopy = [];
      if (parentInv && parentInv.items && parentInv.items.length > 0) {
         const origItem = parentInv.items[0];
         itemsToCopy = [{
            ...origItem,
            base_price: Number(receiptFormData.amount),
            final_amount: Number(receiptFormData.amount),
            tax_amount: 0,
            quantity: 1,
            tax_rate: 0,
            gst_rate: 0
         }];
      } else {
         itemsToCopy = [{
            name: 'Payment / Installment',
            quantity: 1,
            base_price: Number(receiptFormData.amount),
            final_amount: Number(receiptFormData.amount),
            tax_amount: 0,
            gst_rate: 0
         }];
      }

      if (editingReceiptId && editingReceiptId.startsWith('inv-')) {
        const existingInv = invoices.find(i => i.id === editingReceiptId);
        if (existingInv) {
          const updatedInv = {
            ...existingInv,
            total_amount: Number(receiptFormData.amount),
            items: itemsToCopy,
            tax_split: { cgst: 0, sgst: 0, igst: 0 },
            payment_info: {
              ...existingInv.payment_info,
              mode: activeReceiptType === 'Cash Receipt' ? 'cash' : (activeReceiptType === 'UPI Receipt' ? 'upi' : 'finance'),
              paid_amount: Number(receiptFormData.amount),
              finance_provider: activeReceiptType === 'Finance Receipt' ? receiptFormData.registration_type : undefined
            }
          };
          await updateInvoice(editingReceiptId, updatedInv as any);
          toast.success('Receipt Invoice updated successfully');
        }
      } else {
        const newInvoice: any = {
           id: `inv-rcpt-${Date.now()}`,
           invoice_number: `RCPT-${Math.floor(1000 + Math.random() * 9000)}`,
           customer_name: selectedLedger.ledger_name,
           customer_phone: selectedLedger.customer_phone || '',
           customer_email: parentInv?.customer_email || '',
           status: 'paid',
           total_amount: Number(receiptFormData.amount),
           items: itemsToCopy,
           tax_split: { cgst: 0, sgst: 0, igst: 0 },
           tax_type: parentInv?.tax_type || 'intra-state',
           delivery_info: parentInv?.delivery_info,
           created_at: new Date().toISOString(),
           is_receipt_invoice: true,
           payment_info: {
             mode: activeReceiptType === 'Cash Receipt' ? 'cash' : (activeReceiptType === 'UPI Receipt' ? 'upi' : 'finance'),
             partial_payment: false,
             paid_amount: Number(receiptFormData.amount),
             pending_amount: 0,
             finance_provider: activeReceiptType === 'Finance Receipt' ? receiptFormData.registration_type : undefined
           }
        };
        await createInvoice(newInvoice);
        toast.success('Receipt Invoice generated successfully');
      }
      
      const invs = await getInvoices();
      setInvoices(invs);
    } else {
      let newReceipts = [...mockReceipts];
      if (editingReceiptId) {
        newReceipts = newReceipts.map(r => r.id === editingReceiptId ? {
          ...r,
          amount: Number(receiptFormData.amount),
          type: activeReceiptType!,
          destType: receiptFormData.receipt_destination_type,
          destBank: receiptFormData.receipt_destination_bank,
          destId: receiptFormData.receipt_destination_id,
          registrationType: receiptFormData.registration_type
        } : r)
        toast.success('Receipt updated successfully')
      } else {
        const newReceipt = {
          id: `rcpt-${Date.now()}`,
          ledgerId: selectedLedger?.id,
          date: new Date().toISOString(),
          type: activeReceiptType!,
          amount: Number(receiptFormData.amount),
          vchNo: `RCPT-${Math.floor(Math.random() * 1000)}`,
          destType: receiptFormData.receipt_destination_type,
          destBank: receiptFormData.receipt_destination_bank,
          destId: receiptFormData.receipt_destination_id,
          registrationType: receiptFormData.registration_type
        }
        newReceipts.push(newReceipt as any)
        toast.success('Receipt added successfully')
      }
      
      setMockReceipts(newReceipts)
      localStorage.setItem('inwise_mock_receipts', JSON.stringify(newReceipts))
    }
    
    // reset
    setReceiptFormData({
      amount: '',
      receipt_destination_type: 'bank',
      receipt_destination_bank: '',
      receipt_destination_id: '',
      registration_type: 'Regular'
    })
    setIsReceiptFormOpen(false)
    setActiveReceiptType(null)
    setEditingReceiptId(null)
  }

  const handleEditClick = (txn: any) => {
    const r = mockReceipts.find(receipt => receipt.id === txn.id);
    if (!r) return;
    
    setActiveReceiptType(r.type as UnderGroup)
    setReceiptFormData({
      amount: r.amount.toString(),
      receipt_destination_type: r.destType || 'bank',
      receipt_destination_bank: r.destBank || '',
      receipt_destination_id: r.destId || '',
      registration_type: r.registrationType || 'Regular'
    })
    setEditingReceiptId(r.id)
    setIsReceiptFormOpen(true)
  }

  const handleDeleteReceipt = async (receiptId: string) => {
    if (receiptId.startsWith('inv-')) {
      const success = await deleteInvoice(receiptId);
      if (success) {
        toast.success('Receipt Invoice deleted successfully');
        const invs = await getInvoices();
        setInvoices(invs);
      }
    } else {
      const newReceipts = mockReceipts.filter(r => r.id !== receiptId)
      setMockReceipts(newReceipts)
      localStorage.setItem('inwise_mock_receipts', JSON.stringify(newReceipts))
      toast.success('Receipt deleted successfully');
    }
  }

  const handleDeleteLedgerAction = async (ledgerId: string) => {
    if (confirm('Are you sure you want to delete this ledger?')) {
      const success = await deleteLedger(ledgerId);
      if (success) {
        toast.success('Ledger deleted successfully');
        if (selectedLedger?.id === ledgerId) {
          setIsDetailSheetOpen(false);
          setSelectedLedger(null);
        }
        loadLedgers();
      } else {
        toast.error('Failed to delete ledger');
      }
    }
  }

  const handleUpdateLedgerProperty = async (updates: Partial<LedgerRecord>) => {
    if (!selectedLedger) return;
    const updated = { ...selectedLedger, ...updates };
    setSelectedLedger(updated as LedgerRecord);
    setLedgers(ledgers.map(l => l.id === selectedLedger.id ? updated : l) as LedgerRecord[]);
    await updateLedger(selectedLedger.id, updates);
  }

  const mockTransactions = ledgers
    .filter(l => l.under_group === 'Sundry Creditors')
    .flatMap(l => {
      // Generate some fake transactions for the report
      const baseDate = new Date(l.created_at)
      return [
        {
          id: `txn-${l.id}-1`,
          date: new Date(baseDate.getTime() + 86400000).toISOString(),
          supplier: l.ledger_name,
          type: 'Payment Made',
          amount: Math.abs(l.opening_balance * 0.2),
          balance: Math.abs(l.opening_balance * 0.8)
        },
        {
          id: `txn-${l.id}-2`,
          date: new Date(baseDate.getTime() + 172800000).toISOString(),
          supplier: l.ledger_name,
          type: 'Purchase Invoice',
          amount: Math.abs(l.opening_balance * 0.5),
          balance: Math.abs(l.opening_balance * 1.3)
        }
      ]
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filteredTransactions = mockTransactions.filter(txn => {
    // Simple filter by month (if not 'All')
    if (reportFilters.month !== 'All') {
      const monthName = new Date(txn.date).toLocaleString('default', { month: 'long' })
      if (monthName !== reportFilters.month) return false
    }
    return true
  })

  const filteredLedgers = ledgers.filter(ldg => {
    const matchesName = ldg.ledger_name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPhone = ldg.customer_phone?.includes(searchQuery)
    const matchesSearch = matchesName || matchesPhone
    
    let matchesGroup = false;
    const isTA = ldg.under_group === 'Trade Advance';

    if (groupFilter === 'all') {
      matchesGroup = true;
    } else if (groupFilter === 'TA - Trade Advance') {
      matchesGroup = isTA;
    } else {
      matchesGroup = ldg.under_group === groupFilter;
    }

    let matchesDate = true;
    if (listStartDate || listEndDate) {
      const compareDateStr = isTA ? ldg.ta_start_date || ldg.created_at : ldg.created_at;
      const compareDate = new Date(compareDateStr).getTime();
      
      if (listStartDate) {
        matchesDate = matchesDate && compareDate >= new Date(listStartDate).getTime();
      }
      if (listEndDate) {
        const end = new Date(listEndDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && compareDate <= end.getTime();
      }
    }

    return matchesSearch && matchesGroup && matchesDate;
  }).sort((a, b) => {
    // Time-based sort on Search match
    if (searchQuery.trim().length > 0) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    // Alphabetical sort by default
    return a.ledger_name.localeCompare(b.ledger_name);
  })

  // Calculations for Metric Cards
  const totalDebtorsRaw = ledgers
    .filter(l => l.under_group === 'Sundry Debtors')
    .reduce((acc, curr) => acc + (curr.balance_type === 'Dr' ? curr.opening_balance : -curr.opening_balance), 0)
  const totalDebtors = Math.round(totalDebtorsRaw)
    
  const totalCreditorsRaw = ledgers
    .filter(l => l.under_group === 'Sundry Creditors')
    .reduce((acc, curr) => acc + (curr.balance_type === 'Cr' ? curr.opening_balance : -curr.opening_balance), 0)
  const totalCreditors = Math.round(totalCreditorsRaw)

  const getGroupIcon = (group: string) => {
    if (group === 'Sundry Creditors') return <Building2 className="h-4 w-4 text-rose-600" />
    if (group === 'Sundry Debtors') return <Users className="h-4 w-4 text-emerald-600" />
    if (group.includes('Loans')) return <Landmark className="h-4 w-4 text-purple-600" />
    if (group.includes('Bank') || group.includes('Cash')) return <Wallet className="h-4 w-4 text-blue-600" />
    return <FileText className="h-4 w-4 text-gray-600" />
  }

  const getGroupBadgeColor = (group: string) => {
    if (group === 'Sundry Creditors') return 'bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-100'
    if (group === 'Sundry Debtors') return 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100'
    if (group.includes('Loans')) return 'bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-100'
    if (group.includes('Bank') || group.includes('Cash')) return 'bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-100'
    return 'bg-gray-50 text-gray-700 hover:bg-gray-50 border-gray-100'
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex flex-col font-sans selection:bg-blue-50">
      <header className="h-14 flex items-center justify-between px-8 sticky top-0 z-30 bg-white/80 backdrop-blur-md shrink-0 border-b border-[#ededeb] shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-[#37352f]">Chart of Accounts</span>
        </div>
        <div className="flex items-center gap-4 text-[13px] font-medium text-[#37352f]/40">
           <span className="flex items-center gap-2"><Scale className="h-4 w-4" /> {ledgers.length} Ledgers</span>
        </div>
      </header>

      <main className="flex-1 p-8 max-w-[1400px] mx-auto w-full">
        {/* Metric Cards - Tally Style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl border border-[#ededeb] shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Sundry Debtors</h3>
              <Users className="h-5 w-5 text-emerald-500/20" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-[#37352f]">₹{Math.abs(totalDebtors).toLocaleString('en-IN')}</p>
              <span className="text-sm font-bold text-emerald-600">{totalDebtors >= 0 ? 'Dr' : 'Cr'}</span>
            </div>
            <p className="text-[11px] font-medium text-gray-400 mt-1">Total receivables from customers</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[#ededeb] shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Sundry Creditors</h3>
              <Building2 className="h-5 w-5 text-rose-500/20" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-[#37352f]">₹{Math.abs(totalCreditors).toLocaleString('en-IN')}</p>
              <span className="text-sm font-bold text-rose-600">{totalCreditors >= 0 ? 'Cr' : 'Dr'}</span>
            </div>
            <p className="text-[11px] font-medium text-gray-400 mt-1">Total payables to suppliers</p>
          </div>

          <div 
            onClick={() => setIsReportSheetOpen(true)}
            className="bg-white p-6 rounded-xl border border-[#ededeb] shadow-sm flex flex-col justify-between relative overflow-hidden cursor-pointer hover:border-blue-200 transition-colors group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Cash & Bank Balances</h3>
              <Wallet className="h-5 w-5 text-blue-500/20 group-hover:text-blue-500/40 transition-colors" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-[#37352f] group-hover:text-blue-600 transition-colors">View Report</p>
            </div>
            <p className="text-[11px] font-medium text-gray-400 mt-1">Check cash flow statement</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3 flex-1 max-w-[70%]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search ledgers..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-md border-[#ededeb] bg-white text-[13px] shadow-sm focus-visible:ring-1 focus-visible:ring-blue-500/20"
              />
            </div>
            <Select value={groupFilter} onValueChange={setGroupFilter}>
              <SelectTrigger className="h-9 w-[220px] rounded-md border-[#ededeb] bg-white text-[13px] shadow-sm font-medium">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 bg-white border border-[#ededeb] rounded-md h-9 px-2 shadow-sm">
              <input 
                type="date" 
                value={listStartDate} 
                onChange={e => setListStartDate(e.target.value)}
                className="text-[12px] font-medium text-gray-600 bg-transparent outline-none w-[110px]"
              />
              <span className="text-gray-300 text-[10px]">to</span>
              <input 
                type="date" 
                value={listEndDate} 
                onChange={e => setListEndDate(e.target.value)}
                className="text-[12px] font-medium text-gray-600 bg-transparent outline-none w-[110px]"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Sheet open={isReportSheetOpen} onOpenChange={setIsReportSheetOpen}>
              <SheetContent className="sm:max-w-[800px] w-full p-0 border-l border-[#ededeb] flex flex-col bg-[#fcfcfb]">
                <SheetHeader className="px-8 py-6 bg-white shrink-0 border-b border-[#ededeb] shadow-sm z-10">
                  <SheetTitle className="text-xl font-black text-[#37352f]">Cash Flow Report</SheetTitle>
                  <p className="text-xs font-medium text-gray-500">Supplier transaction history and ledger statements.</p>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
                  
                  <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#ededeb] shadow-sm">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Financial Year</Label>
                      <Select value={reportFilters.fy} onValueChange={val => setReportFilters({...reportFilters, fy: val})}>
                        <SelectTrigger className="h-9 w-[180px] rounded-md border-[#ededeb] bg-white text-[13px] shadow-sm font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FY 2026-2027">FY 2026-2027</SelectItem>
                          <SelectItem value="FY 2025-2026">FY 2025-2026</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Month</Label>
                      <Select value={reportFilters.month} onValueChange={val => setReportFilters({...reportFilters, month: val})}>
                        <SelectTrigger className="h-9 w-[180px] rounded-md border-[#ededeb] bg-white text-[13px] shadow-sm font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All">All Months</SelectItem>
                          <SelectItem value="April">April</SelectItem>
                          <SelectItem value="May">May</SelectItem>
                          <SelectItem value="June">June</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-white border border-[#ededeb] rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="bg-[#f7f7f5] border-b border-[#ededeb] text-[#37352f]/60 uppercase tracking-widest text-[10px] font-bold">
                          <th className="px-4 py-3">Date & Time</th>
                          <th className="px-4 py-3">Supplier Name</th>
                          <th className="px-4 py-3">Transaction Type</th>
                          <th className="px-4 py-3 text-right">Amount (₹)</th>
                          <th className="px-4 py-3 text-right">Balance (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ededeb]">
                        {filteredTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-12 text-center text-gray-400 font-medium">No transactions found for this period.</td>
                          </tr>
                        ) : (
                          filteredTransactions.map(txn => (
                            <tr key={txn.id} className="hover:bg-[#fcfcfb] transition-colors">
                              <td className="px-4 py-3">
                                <div className="font-bold text-[#37352f]">{new Date(txn.date).toLocaleDateString()}</div>
                                <div className="text-[10px] font-medium text-gray-400">{new Date(txn.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                              </td>
                              <td className="px-4 py-3 font-bold text-[#37352f]">{txn.supplier}</td>
                              <td className="px-4 py-3">
                                <span className={`text-[11px] font-bold px-2 py-1 rounded border ${
                                  txn.type === 'Payment Made' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {txn.type}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-[#37352f]">{txn.amount.toLocaleString('en-IN')}</td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-gray-500">{txn.balance.toLocaleString('en-IN')} Cr</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                </div>
              </SheetContent>
            </Sheet>
            {selectedLedgerIds.length > 0 && (
              <Button 
                variant="destructive"
                className="h-9 rounded-md text-[13px] font-semibold px-4 shadow-sm"
                onClick={async () => {
                  if (confirm(`Are you sure you want to delete ${selectedLedgerIds.length} ledgers?`)) {
                    for (const id of selectedLedgerIds) {
                      await deleteLedger(id)
                    }
                    toast.success(`${selectedLedgerIds.length} ledgers deleted`)
                    setSelectedLedgerIds([])
                    loadLedgers()
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete Selected ({selectedLedgerIds.length})
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="h-9 bg-[#37352f] hover:bg-black text-white rounded-md text-[13px] font-semibold px-5 shadow-sm">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => { setCreationMode('ledger'); setFormData({...formData, under_group: 'Sundry Creditors'}); setIsAddSheetOpen(true); }} className="font-semibold text-[#37352f] cursor-pointer">
                  Standard Ledger
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setCreationMode('ta'); setFormData({...formData, under_group: 'Trade Advance', balance_type: 'Dr', ledger_name: 'Bajaj Finserv'}); setIsAddSheetOpen(true); }} className="font-semibold text-blue-600 cursor-pointer">
                  TA - Trade Advance (Finance Provider)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
            <SheetContent className="sm:max-w-[600px] w-full p-0 border-l border-[#ededeb] flex flex-col bg-[#fdfdfc]">
              <SheetHeader className="px-8 py-5 bg-white shrink-0 border-b border-[#ededeb] shadow-sm z-10">
                <SheetTitle className="text-xl font-bold text-[#37352f]">Ledger Creation</SheetTitle>
                <p className="text-xs text-gray-500">Enter details exactly as per statutory records.</p>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <form id="add-ledger-form" onSubmit={handleAddLedger} className="space-y-10">
                  
                  {/* TA Mode Section */}
                  {creationMode === 'ta' ? (
                    <div className="space-y-5">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-[#ededeb] pb-2">TA / Finance Provider Details</h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-[#37352f]">Provider Name</Label>
                          <Select value={formData.ledger_name} onValueChange={(val: string) => setFormData({...formData, ledger_name: val})}>
                            <SelectTrigger className="h-9 rounded-md border-[#ededeb] bg-white text-[13px] shadow-sm font-semibold">
                              <SelectValue placeholder="Select Provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bajaj Finserv">Bajaj Finserv</SelectItem>
                              <SelectItem value="IDFC First Bank">IDFC First Bank</SelectItem>
                              <SelectItem value="HDFC Bank">HDFC Bank</SelectItem>
                              <SelectItem value="TVS Credit">TVS Credit</SelectItem>
                              <SelectItem value="Home Credit">Home Credit</SelectItem>
                              <SelectItem value="Mahindra Finance">Mahindra Finance</SelectItem>
                              <SelectItem value="Cholamandalam">Cholamandalam</SelectItem>
                              <SelectItem value="Shriram Finance">Shriram Finance</SelectItem>
                              <SelectItem value="L&T Finance">L&T Finance</SelectItem>
                              <SelectItem value="Muthoot Finance">Muthoot Finance</SelectItem>
                              <SelectItem value="Kotak Mahindra">Kotak Mahindra</SelectItem>
                              <SelectItem value="Hero Fincorp">Hero Fincorp</SelectItem>
                              <SelectItem value="Tata Capital">Tata Capital</SelectItem>
                              <SelectItem value="SBI Card">SBI Card</SelectItem>
                              <SelectItem value="ICICI Bank">ICICI Bank</SelectItem>
                              <SelectItem value="IndusInd Bank">IndusInd Bank</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-[#37352f]">Opening Balance (Advance Amount)</Label>
                          <div className="flex items-center gap-4">
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-[13px]">₹</span>
                              <Input 
                                type="number"
                                required
                                value={formData.opening_balance}
                                onChange={e => setFormData({...formData, opening_balance: e.target.value})}
                                placeholder="0.00"
                                className="h-10 pl-7 rounded-md border-[#ededeb] bg-white text-[14px] font-black shadow-sm"
                              />
                            </div>
                            <div className="h-10 px-4 flex items-center justify-center rounded-md border border-[#ededeb] bg-[#f7f7f5] text-[14px] font-bold text-[#37352f] shadow-sm">
                              Dr
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* General Section */}
                      <div className="space-y-5">
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-[#ededeb] pb-2">General Information</h4>
                        <div className="space-y-4">
                          <div className="space-y-2 col-span-2">
                            <Label className="text-[11px] font-bold text-[#37352f]">Account Name</Label>
                            <Input 
                              required
                              value={formData.ledger_name}
                              onChange={e => setFormData({...formData, ledger_name: e.target.value})}
                              className="h-9 rounded-md border-[#ededeb] bg-white text-[13px] shadow-sm font-semibold"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-[#37352f]">Under</Label>
                              <Select value={formData.under_group} onValueChange={(val: UnderGroup) => {
                                let newBalanceType = formData.balance_type;
                                if (val === 'Sundry Debtors') newBalanceType = 'Dr';
                                else if (val === 'Sundry Creditors') newBalanceType = 'Cr';
                                setFormData({...formData, under_group: val, balance_type: newBalanceType});
                              }}>
                                <SelectTrigger className="h-9 rounded-md border-[#ededeb] bg-white text-[13px] shadow-sm font-medium">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-bold text-[#37352f]">Registration Type</Label>
                              <Select value={formData.registration_type} onValueChange={(val: DealerType) => setFormData({...formData, registration_type: val})}>
                                <SelectTrigger className="h-9 rounded-md border-[#ededeb] bg-white text-[13px] shadow-sm font-medium">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Regular">Regular</SelectItem>
                                  <SelectItem value="Composition">Composition</SelectItem>
                                  <SelectItem value="Unregistered">Unregistered</SelectItem>
                                  <SelectItem value="Consumer">Consumer</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Inventory Values */}
                      {['Sundry Creditors', 'Sundry Debtors'].includes(formData.under_group) && (
                        <div className="space-y-5">
                          <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-[#ededeb] pb-2">Bill-wise Details</h4>
                          <div className="space-y-4 bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                            <div className="flex items-center justify-between">
                              <Label className="text-[12px] font-bold text-[#37352f]">Maintain balances bill-by-bill</Label>
                              <Switch 
                                checked={formData.maintain_balances_bill_by_bill}
                                onCheckedChange={v => setFormData({...formData, maintain_balances_bill_by_bill: v})}
                              />
                            </div>
                            {formData.maintain_balances_bill_by_bill && (
                               <div className="grid grid-cols-2 gap-4 pt-2">
                                 <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-[#37352f]">Default Credit Period (Days)</Label>
                                    <Input 
                                      type="number"
                                      value={formData.credit_period_days}
                                      onChange={e => setFormData({...formData, credit_period_days: e.target.value})}
                                      className="h-9 rounded-md border-emerald-200 bg-white text-[13px] shadow-sm"
                                    />
                                 </div>
                                 <div className="space-y-2">
                                    <Label className="text-[11px] font-bold text-[#37352f]">Credit Limit (₹)</Label>
                                    <Input 
                                      type="number"
                                      value={formData.credit_limit_amount}
                                      onChange={e => setFormData({...formData, credit_limit_amount: e.target.value})}
                                      className="h-9 rounded-md border-emerald-200 bg-white text-[13px] shadow-sm"
                                    />
                                 </div>
                               </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-5">
                        <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest border-b border-[#ededeb] pb-2">Total Amount</h4>
                        <div className="flex items-center gap-4">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-[13px]">₹</span>
                            <Input 
                              type="number"
                              value={formData.opening_balance}
                              onChange={e => setFormData({...formData, opening_balance: e.target.value})}
                              placeholder="0.00"
                              className="h-10 pl-7 rounded-md border-[#ededeb] bg-white text-[14px] font-black shadow-sm"
                            />
                          </div>
                          <Select value={formData.balance_type} onValueChange={(val: BalanceType) => setFormData({...formData, balance_type: val})}>
                            <SelectTrigger className="w-[80px] h-10 rounded-md border-[#ededeb] bg-[#f7f7f5] text-[14px] font-bold text-[#37352f] shadow-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Dr">Dr</SelectItem>
                              <SelectItem value="Cr">Cr</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Bank Accounts */}
                  {!['Cash Receipt', 'UPI Receipt'].includes(formData.under_group) && (
                    <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-[#ededeb] pb-2">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Bank Accounts</h4>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                        onClick={() => setFormData({...formData, bank_accounts: [...formData.bank_accounts, { bank_name: '', account_number: '', ifsc: '' }]})}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Bank
                      </Button>
                    </div>
                    {formData.bank_accounts.length > 0 ? (
                      <div className="space-y-3">
                        {formData.bank_accounts.map((bank, index) => (
                          <div key={index} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center bg-gray-50 p-2 rounded-md border border-gray-100">
                            <Input
                              placeholder="Bank Name"
                              value={bank.bank_name}
                              onChange={e => {
                                const newBanks = [...formData.bank_accounts]
                                newBanks[index].bank_name = e.target.value
                                setFormData({...formData, bank_accounts: newBanks})
                              }}
                              className="h-8 text-[12px] bg-white"
                            />
                            <Input
                              placeholder="A/C Number"
                              value={bank.account_number}
                              onChange={e => {
                                const newBanks = [...formData.bank_accounts]
                                newBanks[index].account_number = e.target.value
                                setFormData({...formData, bank_accounts: newBanks})
                              }}
                              className="h-8 text-[12px] bg-white"
                            />
                            <Input
                              placeholder="IFSC Code"
                              value={bank.ifsc}
                              onChange={e => {
                                const newBanks = [...formData.bank_accounts]
                                newBanks[index].ifsc = e.target.value.toUpperCase()
                                setFormData({...formData, bank_accounts: newBanks})
                              }}
                              className="h-8 text-[12px] bg-white uppercase"
                            />
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-gray-400 hover:text-red-500"
                              onClick={() => {
                                const newBanks = formData.bank_accounts.filter((_, i) => i !== index)
                                setFormData({...formData, bank_accounts: newBanks})
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">No bank accounts added.</p>
                    )}
                    </div>
                  )}

                  {/* UPI IDs */}
                  {!['Cash Receipt', 'UPI Receipt'].includes(formData.under_group) && (
                    <div className="space-y-5">
                    <div className="flex items-center justify-between border-b border-[#ededeb] pb-2">
                      <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">UPI IDs</h4>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px] font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2"
                        onClick={() => setFormData({...formData, upi_ids: [...formData.upi_ids, '']})}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add UPI
                      </Button>
                    </div>
                    {formData.upi_ids.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {formData.upi_ids.map((upi, index) => (
                          <div key={index} className="flex items-center gap-1 bg-purple-50 border border-purple-100 rounded-full pl-3 pr-1 py-1">
                            <input
                              type="text"
                              placeholder="username@bank"
                              value={upi}
                              onChange={e => {
                                const newUpis = [...formData.upi_ids]
                                newUpis[index] = e.target.value
                                setFormData({...formData, upi_ids: newUpis})
                              }}
                              className="bg-transparent border-none outline-none text-[12px] font-medium text-purple-900 w-[140px]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newUpis = formData.upi_ids.filter((_, i) => i !== index)
                                setFormData({...formData, upi_ids: newUpis})
                              }}
                              className="text-purple-400 hover:text-purple-600 p-1 rounded-full hover:bg-purple-100 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-gray-400 italic">No UPI IDs added.</p>
                    )}
                    </div>
                  )}

                  {/* UPI Receipt Options */}
                  {formData.under_group === 'UPI Receipt' && (
                    <div className="space-y-5">
                      <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-[#ededeb] pb-2">Receipt Destination</h4>
                      <div className="flex gap-4">
                        <label className={`flex-1 flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-colors ${formData.receipt_destination_type === 'bank' ? 'border-blue-500 bg-blue-50/50' : 'border-[#ededeb] hover:bg-gray-50'}`}>
                          <input type="radio" name="dest_type" value="bank" checked={formData.receipt_destination_type === 'bank'} onChange={() => setFormData({...formData, receipt_destination_type: 'bank', receipt_destination_id: ''})} className="accent-blue-600" />
                          <span className="text-[13px] font-bold text-[#37352f]">Bank Account</span>
                        </label>
                        <label className={`flex-1 flex items-center gap-2 cursor-pointer p-3 border rounded-lg transition-colors ${formData.receipt_destination_type === 'upi' ? 'border-purple-500 bg-purple-50/50' : 'border-[#ededeb] hover:bg-gray-50'}`}>
                          <input type="radio" name="dest_type" value="upi" checked={formData.receipt_destination_type === 'upi'} onChange={() => setFormData({...formData, receipt_destination_type: 'upi', receipt_destination_id: ''})} className="accent-purple-600" />
                          <span className="text-[13px] font-bold text-[#37352f]">UPI Account</span>
                        </label>
                      </div>

                      {formData.receipt_destination_type === 'bank' && settings?.bank_accounts && settings.bank_accounts.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-[#37352f]">Select Bank Account</Label>
                          <Select value={formData.receipt_destination_id} onValueChange={(val) => setFormData({...formData, receipt_destination_id: val})}>
                            <SelectTrigger className="h-9 rounded-md border-[#ededeb] bg-white text-[13px] shadow-sm font-medium">
                              <SelectValue placeholder="Select Bank" />
                            </SelectTrigger>
                            <SelectContent>
                              {settings.bank_accounts.map((bank, i) => (
                                <SelectItem key={i} value={`${bank.bank_name} - ${bank.account_number}`}>
                                  {bank.bank_name} - {bank.account_number}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {formData.receipt_destination_type === 'upi' && settings?.upi_ids && settings.upi_ids.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold text-[#37352f]">Select UPI ID</Label>
                          <Select value={formData.receipt_destination_id} onValueChange={(val) => setFormData({...formData, receipt_destination_id: val})}>
                            <SelectTrigger className="h-9 rounded-md border-[#ededeb] bg-white text-[13px] shadow-sm font-medium">
                              <SelectValue placeholder="Select UPI ID" />
                            </SelectTrigger>
                            <SelectContent>
                              {settings.upi_ids.map((upi, i) => (
                                <SelectItem key={i} value={upi}>{upi}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )}

                </form>
              </div>
              <SheetFooter className="p-6 bg-white border-t border-[#ededeb] shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddSheetOpen(false)}
                  className="rounded-md h-9 px-6 font-semibold border-[#ededeb]"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  form="add-ledger-form"
                  disabled={isSubmitting}
                  className="rounded-md h-9 px-8 bg-[#37352f] hover:bg-black text-white font-semibold"
                >
                  {isSubmitting ? 'Saving...' : 'Accept'}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
          </div>
        </div>

        {/* Data Table - Tally Style */}
        <div className="bg-white border border-[#ededeb] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="bg-[#f7f7f5] border-b border-[#ededeb] text-[#37352f]/60 uppercase tracking-widest text-[10px] font-bold">
                <th className="px-6 py-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedLedgerIds.length === filteredLedgers.length && filteredLedgers.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedLedgerIds(filteredLedgers.map(l => l.id))
                      } else {
                        setSelectedLedgerIds([])
                      }
                    }}
                    className="rounded border-gray-300 w-3.5 h-3.5 accent-[#37352f] cursor-pointer"
                  />
                </th>
                <th className="px-6 py-3 w-[40%]">Particulars</th>
                <th className="px-6 py-3">Under Group</th>
                <th className="px-6 py-3 text-center">GSTIN / PAN</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Closing Balance</th>
                <th className="px-6 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ededeb]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">Loading ledgers...</td>
                </tr>
              ) : filteredLedgers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">No ledgers found.</td>
                </tr>
              ) : (
                filteredLedgers.map(ledger => (
                  <tr 
                    key={ledger.id} 
                    className={`cursor-pointer transition-colors group ${selectedLedgerIds.includes(ledger.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}
                    onClick={() => {
                      setSelectedLedger(ledger)
                      setIsDetailSheetOpen(true)
                    }}
                  >
                    <td className="px-6 py-3.5" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedLedgerIds.includes(ledger.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLedgerIds([...selectedLedgerIds, ledger.id])
                          } else {
                            setSelectedLedgerIds(selectedLedgerIds.filter(id => id !== ledger.id))
                          }
                        }}
                        className="rounded border-gray-300 w-3.5 h-3.5 accent-[#37352f] cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-3.5 font-bold text-[#37352f]">{ledger.ledger_name}</td>
                    <td className="px-6 py-3.5">
                      {ledger.under_group === 'Cheque Receipt' ? (
                        <div className="flex items-center gap-2">
                           {ledger.is_cashed ? (
                              <span className="text-[11px] font-bold text-white bg-green-500 px-2.5 py-1 rounded shadow-sm">
                                Cashed (Cleared)
                              </span>
                           ) : (
                              <span className="text-[11px] font-bold text-white bg-amber-500 px-2.5 py-1 rounded shadow-sm">
                                Pending
                              </span>
                           )}
                           <Button 
                             size="sm" 
                             variant="outline" 
                             className="h-6 text-[10px] px-2 py-0 border-gray-300 bg-white shadow-sm"
                             onClick={async (e) => {
                               e.stopPropagation()
                               await updateLedger(ledger.id, { is_cashed: !ledger.is_cashed })
                               loadLedgers()
                               toast.success(`Cheque marked as ${!ledger.is_cashed ? 'Cashed' : 'Pending'}`)
                             }}
                           >
                             {ledger.is_cashed ? 'Undo' : 'Mark Cashed'}
                           </Button>
                        </div>
                      ) : ledger.under_group === 'Trade Advance' ? (
                        <span className="text-[11px] font-bold text-black bg-yellow-400 px-2 py-1 rounded shadow-sm">
                          TA - Trade Advance
                        </span>
                      ) : ledger.under_group === 'UPI Receipt' ? (
                        <span className="text-[11px] font-bold text-white bg-[#485696] px-2.5 py-1 rounded shadow-sm">
                          UPI Receipt
                        </span>
                      ) : ledger.under_group === 'Cash Receipt' ? (
                        <span className="text-[11px] font-bold text-white bg-[#72B01D] px-2.5 py-1 rounded shadow-sm">
                          Cash Receipt
                        </span>
                      ) : ledger.under_group === 'Finance Receipt' ? (
                        <span className="text-[11px] font-bold text-white bg-[#454955] px-2.5 py-1 rounded shadow-sm">
                          Finance Receipt
                        </span>
                      ) : ledger.under_group === 'NEFT Receipt' ? (
                        <span className="text-[11px] font-bold text-white bg-[#4F4789] px-2.5 py-1 rounded shadow-sm">
                          NEFT Receipt
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-gray-500 bg-[#f7f7f5] px-2 py-1 rounded border border-[#ededeb]">
                          {ledger.under_group}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                       {ledger.gstin ? (
                          <span className="font-mono text-[11px] font-semibold text-gray-600">{ledger.gstin}</span>
                       ) : ledger.pan_no ? (
                          <span className="font-mono text-[11px] font-semibold text-gray-600">{ledger.pan_no}</span>
                       ) : (
                          <span className="text-[11px] text-gray-400 italic">N/A</span>
                       )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {(() => {
                        const isTA = ledger.under_group === 'Trade Advance';

                        if (!isTA) return null;

                        const ledgerReceipts = mockReceipts.filter(r => (r as any).ledgerId === ledger.id);
                        const taReceipts = mockReceipts.filter(r => r.type === 'Finance Receipt' && r.registrationType === ledger.ledger_name);

                        const openingBalance = ledger.opening_balance || 0;
                        const isCr = ledger.balance_type === 'Cr';

                        let totalDr = ledgerReceipts.reduce((acc, r: any) => acc + (['Cash Receipt', 'UPI Receipt'].includes(r.type) ? r.amount : 0), 0);
                        let totalCr = ledgerReceipts.reduce((acc, r: any) => acc + (['Finance Receipt', 'Cheque Receipt', 'NEFT Receipt'].includes(r.type) ? r.amount : 0), 0);

                        totalCr += taReceipts.reduce((acc, r: any) => acc + r.amount, 0);

                        let grandDr = totalDr + (isCr ? 0 : openingBalance);
                        let grandCr = totalCr + (isCr ? openingBalance : 0);

                        let balanceCdDr = 0;
                        let balanceCdCr = 0;
                        if (grandDr > grandCr) {
                          balanceCdCr = grandDr - grandCr;
                        } else if (grandCr > grandDr) {
                          balanceCdDr = grandCr - grandDr;
                        }

                        const isBalanced = balanceCdDr === 0 && balanceCdCr === 0;

                        if (isBalanced) {
                          const allRelatedReceipts = [...ledgerReceipts, ...taReceipts];
                          let completionDate = null;
                          if (allRelatedReceipts.length > 0) {
                            const latestReceipt = allRelatedReceipts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                            completionDate = new Date(latestReceipt.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                          }
                          return <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Completed: {completionDate || 'N/A'}</span>;
                        } else {
                          if (ledger.ta_end_date && new Date() > new Date(ledger.ta_end_date)) {
                            return <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">Due</span>;
                          }
                          return <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">Started</span>;
                        }
                      })()}
                    </td>
                    <td className={`px-6 py-3.5 text-right font-black ${ledger.opening_balance === 0 ? 'text-gray-400' : 'text-[#37352f]'}`}>
                      {ledger.opening_balance > 0 ? (
                        <>
                          {ledger.opening_balance.toLocaleString('en-IN')}
                          <span className="text-[10px] font-bold ml-1.5 opacity-60">
                            {ledger.balance_type}
                          </span>
                        </>
                      ) : (
                         <span className="font-normal italic">Nil</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors ml-auto"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLedgerAction(ledger.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Ledger Voucher View (Tally-Style) */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="sm:max-w-[95vw] w-full p-0 border-l border-[#ededeb] flex flex-col">
          <SheetTitle className="sr-only">Ledger Details</SheetTitle>
          {selectedLedger && (
            <>
              {/* Report Header */}
              <div className="px-8 py-8 bg-[#fdfdfc] border-b border-[#ededeb] shrink-0 text-center relative group">
                 <h2 className="text-2xl font-black text-[#37352f] tracking-tight uppercase">{selectedLedger.ledger_name}</h2>
                 <div className="text-[12px] font-bold text-gray-500 mt-1 uppercase tracking-widest flex items-center justify-center gap-3">
                    <span>Ledger Account</span>
                    <button 
                      onClick={() => handleDeleteLedgerAction(selectedLedger.id)}
                      className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded inline-flex items-center transition-all border border-transparent hover:border-rose-200"
                    >
                      <Trash2 className="h-3 w-3 mr-1.5"/> Delete
                    </button>
                 </div>
                 <p className="text-[11px] font-medium text-gray-400 mt-1">1-Apr-2026 to 31-Mar-2027</p>
                      {(() => {
                    const isTA = selectedLedger.under_group === 'Trade Advance';
                    return (
                      <>
                        <div className="absolute left-8 top-8 text-left hidden sm:block">
                          {isTA ? (
                            <>
                              <p className="text-[10px] font-bold text-gray-500 uppercase">Created At</p>
                              <p className="text-[12px] font-semibold text-[#37352f]">
                                {new Date(selectedLedger.created_at || new Date()).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-[10px] font-bold text-gray-500 uppercase">Under</p>
                              <p className="text-[12px] font-semibold text-[#37352f]">{selectedLedger.under_group}</p>
                            </>
                          )}
                        </div>
                        
                        <div className="absolute right-8 top-8 text-right hidden sm:block">
                          {isTA ? (
                            <>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">TA Duration</p>
                              <div className="flex items-center justify-end gap-2">
                                <input 
                                  type="date" 
                                  value={selectedLedger.ta_start_date || ''} 
                                  onChange={(e) => handleUpdateLedgerProperty({ ta_start_date: e.target.value })}
                                  className="w-[120px] h-9 text-[11px] font-medium border border-[#ededeb] rounded px-2"
                                />
                                <span className="text-[10px] text-gray-400">to</span>
                                <input 
                                  type="date" 
                                  value={selectedLedger.ta_end_date || ''} 
                                  onChange={(e) => handleUpdateLedgerProperty({ ta_end_date: e.target.value })}
                                  className="w-[120px] h-9 text-[11px] font-medium border border-[#ededeb] rounded px-2"
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Registration Type</p>
                              <Select value={selectedLedger.registration_type} onValueChange={(val: DealerType) => handleUpdateLedgerProperty({ registration_type: val })}>
                                <SelectTrigger className="w-[140px] h-9 text-[13px] font-medium border-[#ededeb]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Regular">Regular</SelectItem>
                                  <SelectItem value="Composition">Composition</SelectItem>
                                  <SelectItem value="Unregistered">Unregistered</SelectItem>
                                  <SelectItem value="Consumer">Consumer</SelectItem>
                                </SelectContent>
                              </Select>
                            </>
                          )}
                        </div>
                      </>
                    );
                  })()}
              </div>
              
              <div className="flex-1 overflow-y-auto bg-[#fdfdfc] p-8 custom-scrollbar">
                
                {(() => {
                  const ledgerReceipts = mockReceipts.filter(r => (r as any).ledgerId === selectedLedger.id);
                  let taReceipts: any[] = [];
                  
                  if (selectedLedger.under_group === 'Unsecured Loans' || selectedLedger.under_group === 'Secured Loans') {
                    taReceipts = mockReceipts.filter(r => r.type === 'Finance Receipt' && r.registrationType === selectedLedger.ledger_name);
                  }

                  const customerInvoices = invoices.filter(inv => 
                    inv.customer_name.toLowerCase() === selectedLedger.ledger_name.toLowerCase() && 
                    (selectedLedger.customer_phone ? inv.customer_phone === selectedLedger.customer_phone : true)
                  );

                  const allTransactions: any[] = [];
                  // Always map customer invoices, regardless of under_group, to handle mistakenly categorized ledgers
                  customerInvoices.forEach(inv => {
                    const isReceipt = inv.invoice_number.startsWith('RCPT-') || (inv as any).is_receipt_invoice;
                    
                    if (isReceipt) {
                      let particulars = 'Receipt';
                      if (inv.payment_info?.mode === 'Cash' || inv.payment_info?.mode === 'cash') particulars = 'Cash';
                      else if (inv.payment_info?.mode === 'UPI' || inv.payment_info?.mode === 'upi') particulars = 'UPI / Bank';
                      else particulars = `${inv.payment_info?.finance_provider || 'Finance'} to Bank`;

                      allTransactions.push({
                        id: inv.id,
                        date: inv.created_at || new Date().toISOString(),
                        particulars: particulars,
                        vchType: 'Receipt',
                        vchNo: inv.invoice_number,
                        debit: 0,
                        credit: inv.total_amount,
                        isInvoice: true,
                        isReceiptInvoice: true,
                        rawInvoice: inv
                      });
                    } else {
                      allTransactions.push({
                        id: inv.id,
                        date: inv.created_at || new Date().toISOString(),
                        particulars: 'SALES @ 18%',
                        details: inv.items.map((i: any) => `${i.name}${i.serial_number ? ` (S/N: ${i.serial_number})` : ''}`).join(', '),
                        vchType: 'Gst Sales',
                        vchNo: inv.invoice_number,
                        debit: inv.total_amount,
                        credit: 0,
                        isInvoice: true,
                        isReceiptInvoice: false,
                        rawInvoice: inv
                      });
                    }
                  });

                  ledgerReceipts.forEach(r => {
                    let particulars = r.type;
                    if (r.type === 'Cash Receipt') {
                      particulars = 'Cash';
                    } else if (r.type === 'Finance Receipt') {
                      const financeBank = r.registrationType || 'Finance';
                      const destBank = r.destBank ? `${r.destBank} A/c` : 'Bank';
                      const destAcc = r.destId ? ` - ${r.destId}` : '';
                      particulars = `${financeBank} to ${destBank}${destAcc}`;
                    } else {
                      particulars = r.destBank ? `${r.destBank} A/c` : 'UPI / Bank';
                    }

                    allTransactions.push({
                      id: r.id,
                      date: r.date,
                      particulars: particulars,
                      vchType: 'Receipt',
                      vchNo: r.vchNo,
                      debit: 0,
                      credit: r.amount
                    });
                  });

                  taReceipts.forEach(r => {
                    allTransactions.push({
                      id: r.id,
                      date: r.date,
                      particulars: `${r.registrationType || 'Finance'} TRADE ADVANCE`,
                      vchType: 'Journal',
                      vchNo: r.vchNo,
                      debit: 0,
                      credit: r.amount
                    });
                  });

                  allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                  const runningTotalDr = allTransactions.reduce((sum, t) => sum + t.debit, 0);
                  const runningTotalCr = allTransactions.reduce((sum, t) => sum + t.credit, 0);
                  const isTA = selectedLedger.under_group === 'Trade Advance';

                  // Force Debtors to ALWAYS use 'Dr' for math and display as requested by user
                  const effectiveBalType = 'Dr';

                  // Calculate Current Total (Debit Side total)
                  const currentTotalDr = (effectiveBalType === 'Dr' ? selectedLedger.opening_balance : 0) + runningTotalDr;
                  const currentTotalCr = (effectiveBalType === 'Cr' ? selectedLedger.opening_balance : 0) + runningTotalCr;
                  
                  const isBalanced = currentTotalDr === currentTotalCr;

                  const ledgerStart = new Date(selectedLedger.created_at || new Date());
                  const firstTxn = allTransactions.length > 0 ? new Date(allTransactions[0].date) : null;
                  const actualStart = firstTxn && firstTxn < ledgerStart ? firstTxn : ledgerStart;

                  const startDateStr = actualStart.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ /g, '-');
                  const endDateStr = allTransactions.length > 0 ? new Date(allTransactions[allTransactions.length - 1].date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/ /g, '-') : startDateStr;
                  const dateRangeStr = `${startDateStr} to ${endDateStr}`;

                  // Calculate running balances for the transactions
                  let currentBalDr = effectiveBalType === 'Dr' ? selectedLedger.opening_balance : 0;
                  let currentBalCr = effectiveBalType === 'Cr' ? selectedLedger.opening_balance : 0;

                  const transactionsWithBalance = allTransactions.map(txn => {
                    currentBalDr += txn.debit;
                    currentBalCr += txn.credit;
                    
                    const netBal = currentBalDr - currentBalCr;
                    const isDr = netBal > 0;
                    const isCr = netBal < 0;
                    
                    return {
                      ...txn,
                      runningBalance: Math.abs(netBal),
                      runningBalanceType: isDr ? 'Dr' : (isCr ? 'Cr' : '')
                    }
                  });

                  return (
                    <div className="flex flex-col bg-white border border-[#ededeb] rounded-xl overflow-hidden shadow-sm">
                      {/* Modern Header */}
                      <div className="bg-[#f7f7f5] text-[#37352f] flex justify-between px-4 py-3 text-[11px] font-bold border-b border-[#ededeb]">
                         <div className="flex gap-4">
                           <span>Ledger: <span className="text-[#37352f] ml-1">{selectedLedger.ledger_name}</span></span>
                           {selectedLedger.customer_phone && <span className="text-gray-400">/ {selectedLedger.customer_phone}</span>}
                         </div>
                         <div className="text-gray-500">
                           {dateRangeStr}
                         </div>
                      </div>

                      {/* Modern Table */}
                      <div className="bg-white border-x border-[#ededeb]">
                        <table className="w-full text-left text-[12px] font-mono whitespace-nowrap">
                          <thead className="bg-[#f7f7f5] shadow-sm border-b border-[#ededeb]">
                            <tr className="text-[#acaba9] text-[10px] uppercase tracking-widest font-black">
                              <th className="px-3 py-2 w-[100px] border-r border-[#ededeb]">Date</th>
                              <th className="px-3 py-2 border-r border-[#ededeb]">Particulars</th>
                              <th className="px-3 py-2 w-[150px] border-r border-[#ededeb]">Vch Type</th>
                              <th className="px-3 py-2 w-[180px] border-r border-[#ededeb]">Vch No.</th>
                              <th className="px-3 py-2 w-[120px] text-right border-r border-[#ededeb]">Debit (₹)</th>
                              <th className="px-3 py-2 w-[120px] text-right border-r border-[#ededeb]">Credit (₹)</th>
                              <th className="px-3 py-2 w-[130px] text-right">Balance (₹)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {/* Opening Balance Row */}
                            {selectedLedger.opening_balance > 0 && (
                              <tr 
                                className={`border-b border-[#ededeb] transition-colors ${customerInvoices.length > 0 ? 'hover:bg-gray-50/50 cursor-pointer' : ''}`}
                                onClick={() => {
                                  if (customerInvoices.length > 0) {
                                    // Sort to find the oldest (parent) invoice
                                    const sortedInvs = [...customerInvoices].sort((a,b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());
                                    router.push(`/owner/billing?invoice_id=${sortedInvs[0].id}`);
                                  }
                                }}
                              >
                                <td className="px-3 py-2 border-r border-[#ededeb] text-gray-400">{startDateStr}</td>
                                <td className="px-3 py-2 font-bold text-gray-600 italic border-r border-[#ededeb]">Opening Balance</td>
                                <td className="px-3 py-2 border-r border-[#ededeb]"></td>
                                <td className="px-3 py-2 border-r border-[#ededeb]"></td>
                                <td className="px-3 py-2 text-right font-bold border-r border-[#ededeb] text-[#37352f]">
                                  {effectiveBalType === 'Dr' ? selectedLedger.opening_balance.toLocaleString('en-IN', {minimumFractionDigits: 2}) : ''}
                                </td>
                                <td className="px-3 py-2 text-right font-bold border-r border-[#ededeb] text-[#37352f]">
                                  {effectiveBalType === 'Cr' ? selectedLedger.opening_balance.toLocaleString('en-IN', {minimumFractionDigits: 2}) : ''}
                                </td>
                                <td className="px-3 py-2 text-right font-bold text-gray-500">
                                  {selectedLedger.opening_balance.toLocaleString('en-IN', {minimumFractionDigits: 2})} 
                                  <span 
                                    className="ml-1.5 cursor-pointer text-blue-600 hover:text-blue-800 hover:underline border border-blue-200 rounded px-1 bg-blue-50/50 transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateLedgerProperty({ balance_type: selectedLedger.balance_type === 'Dr' ? 'Cr' : 'Dr' });
                                    }}
                                    title="Click to toggle Debit/Credit"
                                  >
                                    {effectiveBalType}
                                  </span>
                                </td>
                              </tr>
                            )}

                            {transactionsWithBalance.map(txn => (
                              <tr key={txn.id} className="hover:bg-gray-50/50 border-b border-[#ededeb] transition-colors cursor-pointer group" onClick={() => {
                                if (txn.isReceiptInvoice) {
                                  setPreviewInvoice(txn.rawInvoice);
                                } else if (txn.isInvoice) {
                                  router.push(`/owner/billing?invoice_id=${txn.id}`);
                                } else if (txn.vchType === 'Receipt' || txn.vchType === 'Journal') {
                                  handleEditClick(txn);
                                }
                              }}>
                                <td className="px-3 py-2 border-r border-[#ededeb] align-top text-gray-500">{new Date(txn.date).toLocaleDateString('en-GB').replace(/\//g, '-')}</td>
                                <td className="px-3 py-2 border-r border-[#ededeb]">
                                  <div className="font-bold text-[#37352f]">{txn.particulars}</div>
                                </td>
                                <td className="px-3 py-2 border-r border-[#ededeb] align-top text-gray-500">{txn.vchType}</td>
                                <td className="px-3 py-2 border-r border-[#ededeb] align-top text-gray-400">{txn.vchNo}</td>
                                <td className="px-3 py-2 text-right font-bold border-r border-[#ededeb] align-top text-[#37352f]">
                                  {txn.debit > 0 ? txn.debit.toLocaleString('en-IN', {minimumFractionDigits: 2}) : ''}
                                </td>
                                <td className="px-3 py-2 text-right font-bold border-r border-[#ededeb] align-top text-[#37352f]">
                                  {txn.credit > 0 ? txn.credit.toLocaleString('en-IN', {minimumFractionDigits: 2}) : ''}
                                </td>
                                <td className="px-3 py-2 text-right font-bold align-top text-gray-500 flex justify-end gap-2 items-center">
                                  {txn.runningBalance.toLocaleString('en-IN', {minimumFractionDigits: 2})} {txn.runningBalanceType}
                                  {(txn.vchType === 'Receipt' || txn.vchType === 'Journal') && (
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteReceipt(txn.id); }} className="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-600 transition-opacity ml-2">
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Modern Footer */}
                      <div className="bg-[#f7f7f5] border-x border-b border-[#ededeb] px-4 py-3 text-[12px] font-mono flex flex-col">
                        <div className="flex justify-end gap-16 mb-2 text-gray-500">
                          <div className="w-[150px] text-right font-bold uppercase tracking-widest text-[10px]">Opening Balance :</div>
                          <div className="w-[120px] text-right font-bold">{selectedLedger.opening_balance.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                        </div>
                        <div className="flex justify-end gap-16 mb-2 text-gray-500">
                          <div className="w-[150px] text-right font-bold uppercase tracking-widest text-[10px]">Current Total :</div>
                          <div className="flex">
                            <div className="w-[120px] text-right font-bold px-2">{currentTotalDr.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                            <div className="w-[120px] text-right font-bold">{currentTotalCr.toLocaleString('en-IN', {minimumFractionDigits: 2})}</div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-16 text-[#37352f] pt-2 border-t border-[#ededeb]">
                          <div className="w-[150px] text-right font-black uppercase tracking-widest text-[11px]">Closing Balance :</div>
                          <div className="w-[120px] text-right font-black">{Math.abs(currentTotalDr - currentTotalCr).toLocaleString('en-IN', {minimumFractionDigits: 2})} {currentTotalDr > currentTotalCr ? 'Dr' : (currentTotalCr > currentTotalDr ? 'Cr' : '')}</div>
                        </div>
                      </div>
                      
                      {/* Form section will follow below */}
                      <div className="mt-6 bg-white p-6 rounded-xl border border-[#ededeb]">
                        <div className="pt-4">
                          {isTA ? (
                            <div className="flex flex-col gap-3">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Manual Link Customer Receipt:</span>
                              <div className="bg-[#f7f7f5] p-4 rounded-xl border border-[#ededeb] flex flex-col gap-2">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Customer</p>
                                <Select onValueChange={(val) => {
                                     const newReceipt = {
                                       id: Date.now().toString(),
                                       ledgerId: val,
                                       type: 'Finance Receipt',
                                       amount: 0,
                                       date: new Date().toISOString().split('T')[0],
                                       registrationType: selectedLedger.ledger_name,
                                       vchNo: `RCPT-${Math.floor(Math.random() * 1000)}`
                                     };
                                     setMockReceipts([...mockReceipts, newReceipt]);
                                }}>
                                  <SelectTrigger className="w-full h-9 bg-white">
                                    <SelectValue placeholder="Select Customer Ledger" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {(() => {
                                      const unlinkedCustomers = ledgers.filter(l => {
                                        const isCustomer = l.under_group.includes('Debtor') || l.under_group === 'Consumer';
                                        if (!isCustomer) return false;
                                        const alreadyLinked = taReceipts.some(r => r.ledgerId === l.id);
                                        return !alreadyLinked;
                                      });

                                      if (unlinkedCustomers.length === 0) {
                                        return <div className="p-3 text-center text-[12px] font-bold text-gray-500 bg-[#f7f7f5] m-1 rounded border border-[#ededeb]">0</div>;
                                      }

                                      return unlinkedCustomers.map(l => (
                                        <SelectItem key={l.id} value={l.id}>{l.ledger_name}</SelectItem>
                                      ));
                                    })()}
                                  </SelectContent>
                                </Select>
                                <p className="text-[11px] text-gray-500 italic mt-1">
                                  Selecting a customer will create a linked 0₹ Finance Receipt. Click the created receipt in the list above to set the amount.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-3">
                              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Add More Receipt:</span>
                              <div className="flex items-center gap-3">
                                {['Cash Receipt', 'UPI Receipt', 'Finance Receipt'].map(type => (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      setActiveReceiptType(type as UnderGroup);
                                      if (type === 'Finance Receipt') {
                                        setReceiptFormData(prev => ({...prev, receipt_destination_type: 'bank'}));
                                      }
                                      setIsReceiptFormOpen(true);
                                    }}
                                    className="px-4 py-2 bg-white border border-[#ededeb] rounded-lg text-[12px] font-bold text-[#37352f] shadow-sm hover:bg-gray-50 transition-colors flex items-center gap-2"
                                  >
                                  <Plus className="h-3 w-3 text-emerald-600" />
                                  {type}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <Dialog open={isReceiptFormOpen && !isTA} onOpenChange={(open) => {
                          if (!open) {
                            setIsReceiptFormOpen(false);
                            setActiveReceiptType(null);
                            setEditingReceiptId(null);
                          }
                        }}>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold">Add {activeReceiptType}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                              {/* Receipt Form Header */}
                              <div className="flex justify-between items-start mb-6">
                                 <div>
                                   <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Under</p>
                                   <div className="mt-1 h-9 flex items-center px-3 border border-[#ededeb] rounded-md bg-[#f7f7f5] text-[13px] font-bold text-[#37352f]">
                                     {activeReceiptType}
                                   </div>
                                 </div>
                                 {activeReceiptType === 'Finance Receipt' && (
                                   <div className="text-right">
                                     <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Finance Provider</p>
                                     <Select value={receiptFormData.registration_type} onValueChange={(val: any) => setReceiptFormData({...receiptFormData, registration_type: val})}>
                                       <SelectTrigger className="w-[140px] h-9 text-[13px] font-medium border-[#ededeb]">
                                         <SelectValue placeholder="Select Provider" />
                                       </SelectTrigger>
                                       <SelectContent>
                                         <SelectItem value="Bajaj Finserv">Bajaj Finserv</SelectItem>
                                         <SelectItem value="IDFC First Bank">IDFC First Bank</SelectItem>
                                         <SelectItem value="HDFC Bank">HDFC Bank</SelectItem>
                                         <SelectItem value="TVS Credit">TVS Credit</SelectItem>
                                         <SelectItem value="Home Credit">Home Credit</SelectItem>
                                         <SelectItem value="Mahindra Finance">Mahindra Finance</SelectItem>
                                         <SelectItem value="Cholamandalam">Cholamandalam</SelectItem>
                                         <SelectItem value="Shriram Finance">Shriram Finance</SelectItem>
                                         <SelectItem value="L&T Finance">L&T Finance</SelectItem>
                                         <SelectItem value="Muthoot Finance">Muthoot Finance</SelectItem>
                                         <SelectItem value="Kotak Mahindra">Kotak Mahindra</SelectItem>
                                         <SelectItem value="Hero Fincorp">Hero Fincorp</SelectItem>
                                         <SelectItem value="Tata Capital">Tata Capital</SelectItem>
                                         <SelectItem value="SBI Card">SBI Card</SelectItem>
                                         <SelectItem value="ICICI Bank">ICICI Bank</SelectItem>
                                         <SelectItem value="IndusInd Bank">IndusInd Bank</SelectItem>
                                       </SelectContent>
                                     </Select>
                                   </div>
                                 )}
                              </div>

                              {/* Total Amount */}
                              <div className="mb-6">
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2">Total Amount</p>
                                <div className="flex items-center gap-3">
                                   <div className="flex-1 relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                                      <Input 
                                        type="number"
                                        value={receiptFormData.amount}
                                        onChange={e => setReceiptFormData({...receiptFormData, amount: e.target.value})}
                                        className="h-10 pl-8 font-mono text-[15px] font-bold text-[#37352f]"
                                        placeholder="0.00"
                                      />
                                   </div>
                                   <div className="h-10 px-4 flex items-center justify-center bg-[#f7f7f5] border border-[#ededeb] rounded-md font-bold text-[13px] text-[#37352f]">
                                     Cr
                                   </div>
                                </div>
                              </div>

                              {/* Receipt Destination */}
                              {activeReceiptType !== 'Cash Receipt' && (
                                <div className="mb-8 border-t border-[#ededeb] pt-6">
                                   <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-4">Receipt Destination</p>
                                    {activeReceiptType !== 'Finance Receipt' && (
                                      <div className="flex gap-4 mb-4">
                                        <button 
                                          onClick={() => setReceiptFormData({...receiptFormData, receipt_destination_type: 'bank', receipt_destination_bank: '', receipt_destination_id: ''})}
                                          className={`flex-1 py-3 px-4 rounded-lg border text-[13px] font-bold flex items-center gap-3 transition-colors ${receiptFormData.receipt_destination_type === 'bank' ? 'border-blue-500 bg-blue-50/30' : 'border-[#ededeb] hover:bg-gray-50'}`}
                                        >
                                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${receiptFormData.receipt_destination_type === 'bank' ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {receiptFormData.receipt_destination_type === 'bank' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                          </div>
                                          Bank Account
                                        </button>
                                        <button 
                                          onClick={() => setReceiptFormData({...receiptFormData, receipt_destination_type: 'upi', receipt_destination_id: ''})}
                                          className={`flex-1 py-3 px-4 rounded-lg border text-[13px] font-bold flex items-center gap-3 transition-colors ${receiptFormData.receipt_destination_type === 'upi' ? 'border-blue-500 bg-blue-50/30' : 'border-[#ededeb] hover:bg-gray-50'}`}
                                        >
                                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${receiptFormData.receipt_destination_type === 'upi' ? 'border-blue-500' : 'border-gray-300'}`}>
                                            {receiptFormData.receipt_destination_type === 'upi' && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                                          </div>
                                          UPI Account
                                        </button>
                                      </div>
                                    )}

                                    {(receiptFormData.receipt_destination_type === 'bank' || activeReceiptType === 'Finance Receipt') && (
                                      <div className="flex gap-4">
                                        <div className="flex-1">
                                          <p className="text-[11px] font-bold text-[#37352f] mb-2">Select Bank</p>
                                          <Select value={receiptFormData.receipt_destination_bank} onValueChange={val => setReceiptFormData({...receiptFormData, receipt_destination_bank: val, receipt_destination_id: ''})}>
                                            <SelectTrigger className="w-full h-9 text-[13px] font-medium border-[#ededeb]">
                                              <SelectValue placeholder="Select Bank" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              {Array.from(new Set(settings?.bank_accounts?.map((b: any) => b.bank_name) || [])).filter(Boolean).map((bankName: any, i: number) => (
                                                <SelectItem key={i} value={bankName}>
                                                  {bankName}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        
                                        {receiptFormData.receipt_destination_bank && (
                                          <div className="flex-1">
                                            <p className="text-[11px] font-bold text-[#37352f] mb-2">Account Number</p>
                                            <Select value={receiptFormData.receipt_destination_id} onValueChange={val => setReceiptFormData({...receiptFormData, receipt_destination_id: val})}>
                                              <SelectTrigger className="w-full h-9 text-[13px] font-medium border-[#ededeb]">
                                                <SelectValue placeholder="Select Account" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {settings?.bank_accounts?.filter((b: any) => b.bank_name === receiptFormData.receipt_destination_bank && b.account_number).map((b: any, i: number) => (
                                                  <SelectItem key={i} value={b.account_number}>
                                                    {b.account_number}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        )}
                                      </div>
                                    )}

                                   {receiptFormData.receipt_destination_type === 'upi' && (
                                     <div>
                                       <p className="text-[11px] font-bold text-[#37352f] mb-2">Select UPI ID</p>
                                       <Select value={receiptFormData.receipt_destination_id} onValueChange={val => setReceiptFormData({...receiptFormData, receipt_destination_id: val})}>
                                         <SelectTrigger className="w-[240px] h-9 text-[13px] font-medium border-[#ededeb]">
                                           <SelectValue placeholder="Select UPI ID" />
                                         </SelectTrigger>
                                         <SelectContent>
                                           {settings?.upi_ids?.filter(Boolean).map((u: any, i: number) => (
                                             <SelectItem key={i} value={u}>
                                               {u}
                                             </SelectItem>
                                           ))}
                                         </SelectContent>
                                       </Select>
                                     </div>
                                   )}
                                </div>
                              )}

                              <div className="flex flex-col gap-2 mt-8">
                                 <Button onClick={handleAddReceipt} className="w-full h-11 bg-[#37352f] hover:bg-black text-white text-[13px] font-bold">
                                   Accept Receipt
                                 </Button>
                                 <Button onClick={() => { setIsReceiptFormOpen(false); setActiveReceiptType(null); setEditingReceiptId(null); }} variant="outline" className="w-full h-11 text-[13px] font-bold border-[#ededeb]">
                                   Cancel
                                 </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!previewInvoice} onOpenChange={(open) => !open && setPreviewInvoice(null)}>
        <SheetContent className="sm:max-w-md w-full border-l border-[#ededeb]">
          <SheetHeader>
            <SheetTitle className="text-xl font-black text-[#37352f]">Receipt Preview</SheetTitle>
          </SheetHeader>
          {previewInvoice && (
            <div className="space-y-6 mt-8">
              <div className="bg-[#fcfcfb] rounded-lg border border-[#ededeb] p-6 space-y-4">
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500 font-medium text-sm">Receipt No:</span>
                  <span className="font-bold text-[#37352f] text-sm">{previewInvoice.invoice_number}</span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500 font-medium text-sm">Date:</span>
                  <span className="font-bold text-[#37352f] text-sm">
                    {new Date(previewInvoice.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between border-b border-gray-100 pb-3">
                  <span className="text-gray-500 font-medium text-sm">Amount:</span>
                  <span className="font-black text-[#37352f] text-lg">₹{previewInvoice.total_amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-gray-500 font-medium text-sm">Payment Mode:</span>
                  <span className="font-bold text-[#37352f] text-sm uppercase">
                    {previewInvoice.payment_info?.mode} 
                    {previewInvoice.payment_info?.finance_provider ? ` (${previewInvoice.payment_info.finance_provider})` : ''}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 pt-4">
                <Button 
                   className="w-full h-11 font-bold bg-[#37352f] text-white hover:bg-black"
                   onClick={() => router.push('/owner/child')}
                >
                  View / Print Receipt
                </Button>
                <Button variant="outline" className="w-full h-11 font-bold border-[#ededeb]" onClick={() => setPreviewInvoice(null)}>Close</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
