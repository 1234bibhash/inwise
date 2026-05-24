'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  ShoppingBag, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Plus,
  Bell,
  Calendar,
  Download,
  Zap,
  Globe,
  DollarSign,
  TrendingUp,
  FileText,
  Trash2,
  Save,
  Edit2
} from 'lucide-react'
import { cx } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'

import { getInvoices, Invoice } from '@/lib/services/invoiceService'
import { getCustomers } from '@/lib/services/customerService'
import { getAllServiceCalls } from '@/lib/services/serviceCallService'
import { getLedgers, LedgerRecord } from '@/lib/services/accountService'
import { 
  getBalanceSheetEntries, 
  addBalanceSheetEntry, 
  deleteBalanceSheetEntry, 
  BalanceSheetEntry 
} from '@/lib/services/balanceSheetService'

interface DashboardStats {
  totalRevenue: number
  activeOrders: number
  totalCustomers: number
  pendingServiceCalls: number
  revenueChange: number
  ordersChange: number
  customersChange: number
  servicesChange: number
}

function StatCard({ label, value, change, isPositiveTarget, accentColor, icon: Icon }: any) {
  const isPositive = isPositiveTarget ? change >= 0 : change <= 0;
  const bgColors: Record<string, string> = {
    "#2563eb": "bg-blue-50 text-blue-700",
    "#9333ea": "bg-purple-50 text-purple-700",
    "#16a34a": "bg-green-50 text-green-700",
    "#ea580c": "bg-orange-50 text-orange-700",
  }
  const iconStyle = bgColors[accentColor] || "bg-gray-50 text-gray-700";

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between h-full hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-3 mb-6">
        <div className={cx("h-10 w-10 rounded-lg flex items-center justify-center border border-gray-100", iconStyle)}>
          {Icon && <Icon className="h-5 w-5" />}
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <div>
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">{value}</h2>
        <div className="flex items-center gap-2">
           <div className={cx(
             "px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1",
             isPositive ? "bg-green-50 text-green-700" : "bg-rose-50 text-rose-700"
           )}>
              {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change)}%
           </div>
           <span className="text-xs text-gray-500">from last period</span>
        </div>
      </div>
    </div>
  )
}

export default function OwnerDashboard() {
  type DateRangeMode = 'day' | 'month' | 'year' | 'custom'
  const [dateRange, setDateRange] = useState<DateRangeMode>('month')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [selectedDayOption, setSelectedDayOption] = useState<'today' | 'yesterday' | 'day_before' | 'custom_day'>('today')
  const [customSingleDate, setCustomSingleDate] = useState<string>('')
  const [openingBalance, setOpeningBalance] = useState<number>(0)
  
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    activeOrders: 0,
    totalCustomers: 0,
    pendingServiceCalls: 0,
    revenueChange: 0,
    ordersChange: 0,
    customersChange: 0,
    servicesChange: 0,
  })
  
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Balance Sheet Data
  const [balanceEntries, setBalanceEntries] = useState<BalanceSheetEntry[]>([])
  const [systemInvoices, setSystemInvoices] = useState<Invoice[]>([])
  const [systemLedgers, setSystemLedgers] = useState<LedgerRecord[]>([])

  // Modal / Form state for custom entry
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEntryForm, setNewEntryForm] = useState({
    description: '',
    amount: '',
    type: 'Expense',
    category: 'General'
  })

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [dateRange, customStartDate, customEndDate, selectedMonth, selectedYear, selectedDayOption, customSingleDate])

  async function fetchData() {
    setIsLoading(true)
    try {
      const [invoices, customers, serviceCalls, ledgers, customEntries] = await Promise.all([
        getInvoices(),
        getCustomers(),
        getAllServiceCalls(),
        getLedgers(),
        getBalanceSheetEntries()
      ])

      const now = new Date()
      let currentPeriodStart: Date, previousPeriodStart: Date, previousPeriodEnd: Date, currentPeriodEnd: Date

      if (dateRange === 'year') {
        currentPeriodStart = new Date(selectedYear, 3, 1) // April 1
        currentPeriodEnd = new Date(selectedYear + 1, 2, 31, 23, 59, 59) // March 31
        previousPeriodStart = new Date(selectedYear - 1, 3, 1)
        previousPeriodEnd = new Date(selectedYear, 2, 31, 23, 59, 59)
      } else if (dateRange === 'month') {
        const actualYear = selectedMonth < 3 ? selectedYear + 1 : selectedYear;
        currentPeriodStart = new Date(actualYear, selectedMonth, 1)
        currentPeriodEnd = new Date(actualYear, selectedMonth + 1, 0, 23, 59, 59)
        previousPeriodStart = new Date(actualYear, selectedMonth - 1, 1)
        previousPeriodEnd = new Date(actualYear, selectedMonth, 0, 23, 59, 59)
      } else if (dateRange === 'day') {
        let offset = 0;
        if (selectedDayOption === 'yesterday') offset = 1;
        else if (selectedDayOption === 'day_before') offset = 2;
        
        if (selectedDayOption === 'custom_day' && customSingleDate) {
          const parsed = new Date(customSingleDate);
          currentPeriodStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
          currentPeriodEnd = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 23, 59, 59)
          previousPeriodStart = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() - 1)
          previousPeriodEnd = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() - 1, 23, 59, 59)
        } else {
          currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)
          currentPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset, 23, 59, 59)
          previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset - 1)
          previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset - 1, 23, 59, 59)
        }
      } else {
        if (customStartDate) {
          currentPeriodStart = new Date(customStartDate)
          currentPeriodStart.setHours(0,0,0,0)
          
          if (customEndDate) {
            currentPeriodEnd = new Date(customEndDate)
          } else {
            currentPeriodEnd = new Date(customStartDate)
          }
          currentPeriodEnd.setHours(23,59,59,999)
          
          const duration = currentPeriodEnd.getTime() - currentPeriodStart.getTime()
          previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1)
          previousPeriodStart = new Date(previousPeriodEnd.getTime() - duration)
        } else {
          currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          currentPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
          previousPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59)
        }
      }

      const isCurrent = (dStr: string) => {
        const d = new Date(dStr)
        return d >= currentPeriodStart && d <= currentPeriodEnd
      }
      
      setSystemInvoices(invoices.filter(i => isCurrent(i.created_at)))
      setSystemLedgers(ledgers.filter(l => !l.created_at || isCurrent(l.created_at)))
      setBalanceEntries(customEntries.filter(e => isCurrent(e.date || e.created_at)))
      const isPrevious = (dStr: string) => {
        const d = new Date(dStr)
        return d >= previousPeriodStart && d < previousPeriodEnd
      }

      // Calculate Opening Balance (Net Total of all Cash transactions strictly BEFORE currentPeriodStart)
      const isBefore = (dStr: string) => new Date(dStr) < currentPeriodStart
      
      const isLedgerInflow = (l: any) => {
        if (l.under_group === 'Trade Advance') return false;
        if (l.under_group === 'Cheque Receipt' && !l.is_cashed) return false;
        if (l.under_group === 'Cheque Receipt' && l.is_cashed) return true;
        return l.balance_type === 'Cr';
      }
      
      const isLedgerOutflow = (l: any) => {
        if (l.under_group === 'Trade Advance') return true;
        if (l.under_group === 'Cheque Receipt' && !l.is_cashed) return true;
        if (l.under_group === 'Cheque Receipt' && l.is_cashed) return false;
        return l.balance_type === 'Dr';
      }
      
      // Past Inflows: Invoices (Sales) + Custom Income + Ledgers with Cr balance (Liabilities/Equity/Cashed Cheques)
      const pastLedgerInflows = ledgers.filter(l => isLedgerInflow(l) && (!l.created_at || isBefore(l.created_at))).reduce((sum, l) => sum + (l.opening_balance || 0), 0)
      
      const prevInflows = invoices.filter(i => isBefore(i.created_at)).reduce((sum, i) => sum + i.total_amount, 0)
         + customEntries.filter(e => isBefore(e.date || e.created_at) && e.type === 'Income').reduce((sum, e) => sum + e.amount, 0)
         + pastLedgerInflows
         
      // Past Outflows: Custom Expenses + Ledgers with Dr balance (Assets/Advances/Pending Cheques)
      const pastLedgerOutflows = ledgers.filter(l => isLedgerOutflow(l) && (!l.created_at || isBefore(l.created_at))).reduce((sum, l) => sum + (l.opening_balance || 0), 0)
         
      const prevOutflows = customEntries.filter(e => isBefore(e.date || e.created_at) && e.type === 'Expense').reduce((sum, e) => sum + e.amount, 0)
         + pastLedgerOutflows
      
      // Net Cash Balance = Total Inflows - Total Outflows
      const calculatedOpeningBalance = prevInflows - prevOutflows
      setOpeningBalance(calculatedOpeningBalance)

      // 1. Revenue
      const currentRevenue = invoices.filter(i => isCurrent(i.created_at)).reduce((sum, i) => sum + i.total_amount, 0)
      const prevRevenue = invoices.filter(i => isPrevious(i.created_at)).reduce((sum, i) => sum + i.total_amount, 0)
      const revChange = prevRevenue === 0 ? 100 : Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)

      // 2. Orders (Invoices)
      const currentOrders = invoices.filter(i => isCurrent(i.created_at)).length
      const prevOrders = invoices.filter(i => isPrevious(i.created_at)).length
      const ordChange = prevOrders === 0 ? 100 : Math.round(((currentOrders - prevOrders) / prevOrders) * 100)

      // 3. Customers
      const currentCust = customers.filter(c => c.created_at && isCurrent(c.created_at)).length
      const prevCust = customers.filter(c => c.created_at && isPrevious(c.created_at)).length
      const custChange = prevCust === 0 ? 100 : Math.round(((currentCust - prevCust) / prevCust) * 100)

      // 4. Pending Service Calls
      const currentServicesVol = serviceCalls.filter(s => isCurrent(s.created_at)).length
      const prevServicesVol = serviceCalls.filter(s => isPrevious(s.created_at)).length
      const servChange = prevServicesVol === 0 ? 100 : Math.round(((currentServicesVol - prevServicesVol) / prevServicesVol) * 100)
      const currentPendingServices = serviceCalls.filter(s => isCurrent(s.created_at) && s.status === 'pending').length

      setStats({
        totalRevenue: currentRevenue,
        activeOrders: currentOrders,
        totalCustomers: currentCust,
        pendingServiceCalls: currentPendingServices,
        revenueChange: revChange,
        ordersChange: ordChange,
        customersChange: custChange,
        servicesChange: servChange,
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEntryForm.description || !newEntryForm.amount) return

    await addBalanceSheetEntry({
      description: newEntryForm.description,
      amount: Number(newEntryForm.amount),
      type: newEntryForm.type as any,
      category: newEntryForm.category,
      date: new Date().toISOString().split('T')[0]
    })
    
    setShowAddModal(false)
    setNewEntryForm({ description: '', amount: '', type: 'Expense', category: 'General' })
    fetchData()
  }

  const handleDeleteEntry = async (id: string) => {
    await deleteBalanceSheetEntry(id)
    fetchData()
  }

  if (!mounted) return null

  // Compute Balance Sheet Aggregates
  const isLedgerInflow = (l: any) => {
    if (l.under_group === 'Trade Advance') return false;
    if (l.under_group === 'Cheque Receipt' && !l.is_cashed) return false;
    if (l.under_group === 'Cheque Receipt' && l.is_cashed) return true;
    return l.balance_type === 'Cr';
  }
  
  const isLedgerOutflow = (l: any) => {
    if (l.under_group === 'Trade Advance') return true;
    if (l.under_group === 'Cheque Receipt' && !l.is_cashed) return true;
    if (l.under_group === 'Cheque Receipt' && l.is_cashed) return false;
    return l.balance_type === 'Dr';
  }

  const currentLedgerInflows = systemLedgers.filter(l => isLedgerInflow(l)).reduce((sum, l) => sum + (l.opening_balance || 0), 0)
  const currentLedgerOutflows = systemLedgers.filter(l => isLedgerOutflow(l)).reduce((sum, l) => sum + (l.opening_balance || 0), 0)
  
  const totalInflow = systemInvoices.reduce((sum, inv) => sum + inv.total_amount, 0) + 
                      balanceEntries.filter(e => e.type === 'Income').reduce((sum, e) => sum + e.amount, 0) +
                      currentLedgerInflows
                      
  const totalOutflow = balanceEntries.filter(e => e.type === 'Expense').reduce((sum, e) => sum + e.amount, 0) +
                       currentLedgerOutflows

  return (
    <div className="min-h-screen pb-20 bg-[#fbfbfa]">
      {/* Premium Admin Header */}
      <header className="h-14 bg-white border-b border-[#e9e9e8] flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">Financial Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-[#f1f1f0] p-0.5 rounded-lg flex items-center">
              <button 
                onClick={() => setDateRange('day')}
                className={cx("px-3 py-1 text-xs font-medium rounded-md transition-all", dateRange === 'day' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}
              >
                Day-wise
              </button>
              <button 
                onClick={() => setDateRange('month')}
                className={cx("px-3 py-1 text-xs font-medium rounded-md transition-all", dateRange === 'month' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}
              >
                Month-wise
              </button>
              <button 
                onClick={() => setDateRange('year')}
                className={cx("px-3 py-1 text-xs font-medium rounded-md transition-all", dateRange === 'year' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}
              >
                Year-wise
              </button>
              <button 
                onClick={() => setDateRange('custom')}
                className={cx("px-3 py-1 text-xs font-medium rounded-md transition-all", dateRange === 'custom' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700")}
              >
                Custom Range
              </button>
            </div>
            
            
          </div>
          <div className="flex items-center gap-1 border-l border-[#e9e9e8] pl-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-[#787774] hover:bg-[#efefed] hover:text-[#37352f]">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-[1400px] mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center justify-between text-left">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-[#37352f] tracking-tight flex items-center gap-4">
               Financial Overview
               <div className="flex items-center gap-3 text-sm font-medium bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm">
                  <span className="text-gray-500">Opening:</span>
                  <span className={openingBalance >= 0 ? "text-green-600" : "text-red-600"}>₹{openingBalance.toLocaleString('en-IN')}</span>
                  <div className="w-px h-4 bg-gray-200" />
                  <span className="text-gray-500">Closing:</span>
                  <span className={(openingBalance + totalInflow - totalOutflow) >= 0 ? "text-green-600" : "text-red-600"}>
                     ₹{(openingBalance + totalInflow - totalOutflow).toLocaleString('en-IN')}
                  </span>
               </div>
            </h2>
            <p className="text-[#787774] text-sm tracking-tight">
              Displaying aggregates for: <span className="text-[#37352f] font-semibold">
                {dateRange === 'month' ? 'This Month' : 
                 dateRange === 'year' ? 'This Year' : 
                 dateRange === 'day' ? (
                   selectedDayOption === 'today' ? 'Today' : 
                   selectedDayOption === 'yesterday' ? 'Yesterday' : 
                   selectedDayOption === 'day_before' ? 'Day before yesterday' : 
                   (customSingleDate ? new Date(customSingleDate).toLocaleDateString('en-IN') : 'Specific Day')
                 ) : 'Custom Period'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
             {dateRange === 'day' && (
               <div className="flex items-center gap-2">
                 <select 
                   value={selectedDayOption} 
                   onChange={(e) => setSelectedDayOption(e.target.value as any)}
                   className="h-9 text-xs rounded-md border-gray-200 px-2 border focus:ring-blue-500 outline-none bg-white text-gray-700 shadow-sm"
                 >
                   <option value="today">Today</option>
                   <option value="yesterday">Yesterday</option>
                   <option value="day_before">Day before yesterday</option>
                   <option value="custom_day">Select specific day...</option>
                 </select>
                 
                 {selectedDayOption === 'custom_day' && (
                   <input 
                     type="date" 
                     value={customSingleDate}
                     onChange={(e) => setCustomSingleDate(e.target.value)}
                     className="h-9 text-xs rounded-md border-gray-200 px-2 border focus:ring-blue-500 outline-none bg-white text-gray-700 shadow-sm"
                   />
                 )}
               </div>
             )}

             {dateRange === 'month' && (
               <div className="flex items-center gap-2">
                 <select 
                   value={selectedMonth} 
                   onChange={(e) => setSelectedMonth(Number(e.target.value))}
                   className="h-9 text-xs rounded-md border-gray-200 px-2 border focus:ring-blue-500 outline-none bg-white text-gray-700 shadow-sm"
                 >
                   {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                     <option key={m} value={i}>{m}</option>
                   ))}
                 </select>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="h-9 text-xs rounded-md border-gray-200 px-2 border focus:ring-blue-500 outline-none bg-white text-gray-700 shadow-sm"
                  >
                    {[...Array(10)].map((_, i) => {
                      const y = new Date().getFullYear() - 5 + i
                      return <option key={y} value={y}>{`FY ${y}-${(y+1).toString().slice(2)}`}</option>
                    })}
                  </select>
               </div>
             )}

             {dateRange === 'year' && (
               <div className="flex items-center gap-2">
                  <select 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="h-9 text-xs rounded-md border-gray-200 px-2 border focus:ring-blue-500 outline-none bg-white text-gray-700 shadow-sm"
                  >
                    {[...Array(10)].map((_, i) => {
                      const y = new Date().getFullYear() - 5 + i
                      return <option key={y} value={y}>{`FY ${y}-${(y+1).toString().slice(2)}`}</option>
                    })}
                  </select>
               </div>
             )}

             {dateRange === 'custom' && (
               <div className="flex items-center gap-2">
                 <input 
                   type="date" 
                   value={customStartDate}
                   onChange={(e) => setCustomStartDate(e.target.value)}
                   className="h-9 text-xs rounded-md border-gray-200 px-2 border focus:ring-blue-500 outline-none bg-white text-gray-700 shadow-sm"
                 />
                 <span className="text-xs text-gray-500">to</span>
                 <input 
                   type="date" 
                   value={customEndDate}
                   onChange={(e) => setCustomEndDate(e.target.value)}
                   className="h-9 text-xs rounded-md border-gray-200 px-2 border focus:ring-blue-500 outline-none bg-white text-gray-700 shadow-sm"
                 />
               </div>
             )}

             <Button variant="outline" className="h-9 rounded-md border border-[#e9e9e8] font-medium px-4 text-xs hover:bg-[#efefed] transition-all text-[#37352f]">
               <Download className="h-4 w-4 mr-2" />
               Export Sheet
             </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label={`Revenue (${dateRange === 'month' ? 'Month' : 'Day'})`}
            value={`₹${(stats.totalRevenue).toLocaleString('en-IN')}`}
            change={stats.revenueChange}
            isPositiveTarget={true}
            accentColor="#2563eb"
            icon={DollarSign}
          />
          <StatCard
            label={`Invoices (${dateRange === 'month' ? 'Month' : 'Day'})`}
            value={stats.activeOrders.toString()}
            change={stats.ordersChange}
            isPositiveTarget={true}
            accentColor="#9333ea"
            icon={FileText}
          />
          <StatCard
            label="Total Customers"
            value={stats.totalCustomers.toString()}
            change={stats.customersChange}
            isPositiveTarget={true}
            accentColor="#16a34a"
            icon={Globe}
          />
          <StatCard
            label="Pending Services"
            value={stats.pendingServiceCalls.toString()}
            change={stats.servicesChange}
            isPositiveTarget={false}
            accentColor="#ea580c"
            icon={Zap}
          />
        </div>

        {/* Unified Editable Balance Sheet */}
        <div className="bg-white rounded-2xl border border-[#e9e9e8] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[#e9e9e8] flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Unified Balance Sheet</h3>
              <p className="text-sm text-gray-500">Connected to Invoices, Ledgers, and Service Hub. Add manual adjustments below.</p>
            </div>
            <Button onClick={() => setShowAddModal(!showAddModal)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs px-4 h-9">
              <Plus className="h-4 w-4 mr-2" />
              Add Manual Entry
            </Button>
          </div>

          {showAddModal && (
            <form onSubmit={handleAddEntry} className="p-6 border-b border-gray-100 bg-blue-50/30 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-gray-600">Description</label>
                <input required value={newEntryForm.description} onChange={e => setNewEntryForm({...newEntryForm, description: e.target.value})} placeholder="e.g. Office Rent" className="w-full h-9 rounded-md border-gray-200 text-sm px-3 border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Amount (₹)</label>
                <input required type="number" value={newEntryForm.amount} onChange={e => setNewEntryForm({...newEntryForm, amount: e.target.value})} placeholder="0.00" className="w-full h-9 rounded-md border-gray-200 text-sm px-3 border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-600">Type</label>
                <select value={newEntryForm.type} onChange={e => setNewEntryForm({...newEntryForm, type: e.target.value})} className="w-full h-9 rounded-md border-gray-200 text-sm px-3 border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                  <option value="Expense">Expense</option>
                  <option value="Income">Income</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                </select>
              </div>
              <Button type="submit" className="w-full h-9 bg-gray-900 text-white hover:bg-gray-800">
                <Save className="h-4 w-4 mr-2" />
                Save Entry
              </Button>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 bg-gray-50/50 uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Source / Description</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Inflow (Dr)</th>
                  <th className="px-6 py-4 text-right">Outflow (Cr)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* System Generated Invoices */}
                {/* System Generated Invoices */}
                {systemInvoices.map(invoice => (
                  <tr key={invoice.id} className="bg-gray-50/30">
                    <td className="px-6 py-4 font-medium text-gray-600">{new Date(invoice.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">Invoice - {invoice.customer_name || invoice.invoice_number}</td>
                    <td className="px-6 py-4 text-gray-600">Sales</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Income</span></td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">+ ₹{invoice.total_amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-right text-gray-400">-</td>
                    <td className="px-6 py-4 text-right text-gray-400 text-xs">Read-only</td>
                  </tr>
                ))}

                {/* System Generated Ledgers */}
                {systemLedgers.map(ledger => {
                  let isCr = ledger.balance_type === 'Cr';
                  if (ledger.under_group === 'Trade Advance') isCr = false;
                  if (ledger.under_group === 'Cheque Receipt') isCr = !!ledger.is_cashed;
                  
                  return (
                    <tr key={ledger.id} className="bg-gray-50/30">
                      <td className="px-6 py-4 font-medium text-gray-600">{ledger.created_at ? new Date(ledger.created_at).toLocaleDateString('en-IN') : 'Auto-Synced'}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">Ledger - {ledger.ledger_name}</td>
                      <td className="px-6 py-4 text-gray-600">{ledger.under_group === 'Trade Advance' ? 'TA - Trade Advance' : ledger.under_group === 'Cheque Receipt' ? (ledger.is_cashed ? 'Cashed Cheque' : 'Pending Cheque') : ledger.under_group}</td>
                      <td className="px-6 py-4">
                        <span className={cx("px-2 py-1 rounded-md text-xs font-medium", isCr ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                          {isCr ? 'Credit (Cr)' : 'Debit (Dr)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-green-600">{isCr ? `+ ₹${(ledger.opening_balance || 0).toLocaleString('en-IN')}` : '-'}</td>
                      <td className="px-6 py-4 text-right font-medium text-red-600">{!isCr ? `- ₹${(ledger.opening_balance || 0).toLocaleString('en-IN')}` : '-'}</td>
                      <td className="px-6 py-4 text-right text-gray-400 text-xs">Read-only</td>
                    </tr>
                  )
                })}

                {/* Manual Entries */}
                {balanceEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4 text-gray-600">{new Date(entry.date).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{entry.description}</td>
                    <td className="px-6 py-4 text-gray-600">{entry.category}</td>
                    <td className="px-6 py-4">
                      <span className={cx("px-2 py-1 rounded-md text-xs font-medium", 
                        entry.type === 'Income' ? 'bg-green-100 text-green-700' :
                        entry.type === 'Expense' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      )}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">
                      {(entry.type === 'Income' || entry.type === 'Asset') ? `+ ₹${entry.amount.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-red-600">
                      {(entry.type === 'Expense' || entry.type === 'Liability') ? `- ₹${entry.amount.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button onClick={() => handleDeleteEntry(entry.id)} variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white font-medium border-t-2 border-[#ededeb]">
                {/* Closing Balance (Carried Down) Row */}
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right text-[#37352f]/70 text-[13px] tracking-wide">
                    Balance c/d (Closing Balance)
                  </td>
                  <td className="px-6 py-4 text-right text-green-600 font-semibold text-[14px]">
                    {totalInflow < totalOutflow ? `+ ₹${(totalOutflow - totalInflow).toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-red-600 font-semibold text-[14px]">
                    {totalInflow > totalOutflow ? `- ₹${(totalInflow - totalOutflow).toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
                
                {/* Tally Row */}
                <tr className="bg-[#f7f7f5] border-t border-[#ededeb]">
                  <td colSpan={4} className="px-6 py-5 text-right text-[#37352f] font-bold text-[14px] uppercase tracking-widest">
                    Balance Sheet Total
                  </td>
                  <td className="px-6 py-5 text-right text-[#37352f] font-black text-[16px] border-double border-b-4 border-gray-400">
                    ₹{Math.max(totalInflow, totalOutflow).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-5 text-right text-[#37352f] font-black text-[16px] border-double border-b-4 border-gray-400">
                    ₹{Math.max(totalInflow, totalOutflow).toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-5"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
