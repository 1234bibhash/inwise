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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

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

  // Opening Stock explicit modal
  const [showOpeningStockModal, setShowOpeningStockModal] = useState(false)
  const [openingStockAmount, setOpeningStockAmount] = useState('')

  // Group Details Modal
  const [selectedGroup, setSelectedGroup] = useState<{
    name: string,
    type: 'LedgerGroup' | 'Sales' | 'ManualGroup',
    items: any[]
  } | null>(null)

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
    if (!newEntryForm.amount || isNaN(Number(newEntryForm.amount))) return

    const entry: Omit<BalanceSheetEntry, 'id'> = {
      description: newEntryForm.description,
      amount: Number(newEntryForm.amount),
      type: newEntryForm.type as any,
      category: newEntryForm.category,
      date: new Date().toISOString()
    }
    
    await addBalanceSheetEntry(entry)
    setShowAddModal(false)
    setNewEntryForm({ description: '', amount: '', type: 'Expense', category: 'General' })
    fetchData()
  }

  const handleSetOpeningStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!openingStockAmount || isNaN(Number(openingStockAmount))) return

    const entry: Omit<BalanceSheetEntry, 'id'> = {
      description: 'Opening Stock for Period',
      amount: Number(openingStockAmount),
      type: 'Expense', // Debited to Trading A/c
      category: 'Opening Stock',
      date: new Date().toISOString()
    }
    
    await addBalanceSheetEntry(entry)
    setShowOpeningStockModal(false)
    setOpeningStockAmount('')
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

  // Grouping logic for the condensed view
  const groupedLedgers = Object.values(systemLedgers.reduce((acc, ledger) => {
    const group = ledger.under_group || 'Other';
    if (!acc[group]) {
      acc[group] = { groupName: group, inflows: 0, outflows: 0, ledgers: [] };
    }
    const isCr = isLedgerInflow(ledger);
    if (isCr) {
      acc[group].inflows += (ledger.opening_balance || 0);
    } else {
      acc[group].outflows += (ledger.opening_balance || 0);
    }
    acc[group].ledgers.push(ledger);
    return acc;
  }, {} as Record<string, { groupName: string, inflows: number, outflows: number, ledgers: LedgerRecord[] }>)).filter(g => g.inflows > 0 || g.outflows > 0);

  const totalSalesInflow = systemInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

  const groupedManual = Object.values(balanceEntries.reduce((acc, entry) => {
    const group = entry.category || 'General';
    if (!acc[group]) {
      acc[group] = { groupName: group, inflows: 0, outflows: 0, entries: [] };
    }
    if (entry.type === 'Income' || entry.type === 'Asset') {
      acc[group].inflows += entry.amount;
    } else {
      acc[group].outflows += entry.amount;
    }
    acc[group].entries.push(entry);
    return acc;
  }, {} as Record<string, { groupName: string, inflows: number, outflows: number, entries: BalanceSheetEntry[] }>));

  return (
    <div className="min-h-screen pb-20 bg-[#fbfbfa]">
      {/* Premium Admin Header */}
      <header className="h-14 bg-white border-b border-[#e9e9e8] flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900 hidden sm:block">Financial Dashboard</span>
          <span className="text-sm font-semibold text-gray-900 sm:hidden">Dashboard</span>
        </div>
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-white border border-[#e9e9e8] rounded-lg flex items-center shadow-sm">
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-2 md:px-3 py-1.5 text-xs font-medium text-gray-700 bg-transparent outline-none focus:ring-0 cursor-pointer appearance-none"
              >
                <option value="day">Day-wise</option>
                <option value="month">Month-wise</option>
                <option value="year">Year-wise</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            
          </div>
          <div className="flex items-center gap-1 border-l border-[#e9e9e8] pl-2 md:pl-4">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-[#787774] hover:bg-[#efefed] hover:text-[#37352f]">
              <Bell className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="p-4 md:p-8 max-w-[1400px] mx-auto space-y-6 md:space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between text-left gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-[#37352f] tracking-tight flex flex-col sm:flex-row sm:items-center gap-2 md:gap-4">
               Financial Overview
               <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm font-medium bg-white px-3 py-1 rounded-md border border-gray-200 shadow-sm w-fit">
                  <span className="text-gray-500">Opening:</span>
                  <span className={openingBalance >= 0 ? "text-green-600" : "text-red-600"}>₹{openingBalance.toLocaleString('en-IN')}</span>
                  <div className="w-px h-4 bg-gray-200" />
                  <span className="text-gray-500">Closing:</span>
                  <span className={(openingBalance + totalInflow - totalOutflow) >= 0 ? "text-green-600" : "text-red-600"}>
                     ₹{(openingBalance + totalInflow - totalOutflow).toLocaleString('en-IN')}
                  </span>
               </div>
            </h2>
            <p className="text-[#787774] text-xs md:text-sm tracking-tight">
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
          <div className="flex flex-wrap items-center gap-2 md:gap-4">
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
          <div className="p-6 border-b border-[#e9e9e8] flex flex-col md:flex-row md:items-center justify-between bg-gray-50/50 gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Unified Balance Sheet</h3>
              <p className="text-sm text-gray-500">Connected to Invoices, Ledgers, and Service Hub. Add manual adjustments below.</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button onClick={() => setShowOpeningStockModal(true)} variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 bg-white font-semibold rounded-md text-xs px-4 h-9">
                Set Opening Stock
              </Button>
              <Button onClick={() => setShowAddModal(!showAddModal)} className="bg-gray-900 hover:bg-gray-800 text-white rounded-md text-xs px-4 h-9">
                <Plus className="h-4 w-4 mr-2" />
                Add Manual Entry
              </Button>
            </div>
          </div>

          {showOpeningStockModal && (
            <form onSubmit={handleSetOpeningStock} className="p-6 border-b border-gray-100 bg-blue-50/30 flex items-end gap-4">
              <div className="space-y-1.5 flex-1">
                <label className="text-xs font-semibold text-gray-600">Exact Opening Stock Amount (₹)</label>
                <input required type="number" value={openingStockAmount} onChange={e => setOpeningStockAmount(e.target.value)} placeholder="0.00" className="w-full h-9 rounded-md border-gray-200 text-sm px-3 border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" />
              </div>
              <Button type="submit" className="h-9 bg-blue-600 text-white hover:bg-blue-700 px-6 shrink-0">
                <Save className="h-4 w-4 mr-2" />
                Save Stock
              </Button>
            </form>
          )}

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

          {(() => {
            const TRADING_DR_GROUPS = ['Opening Stock', 'Purchase Accounts', 'Direct Expenses'];
            const TRADING_CR_GROUPS = ['Sales Accounts', 'Direct Incomes', 'Closing Stock'];
            const PNL_DR_GROUPS = ['Indirect Expenses'];
            const PNL_CR_GROUPS = ['Indirect Incomes'];

            const isPnlGroup = (name: string) => [...TRADING_DR_GROUPS, ...TRADING_CR_GROUPS, ...PNL_DR_GROUPS, ...PNL_CR_GROUPS].includes(name);

            const liabilityGroups: any[] = [];
            const assetGroups: any[] = [];
            const pnlData = {
              tradingDr: [] as any[],
              tradingCr: [] as any[],
              pnlDr: [] as any[],
              pnlCr: [] as any[]
            };

            groupedLedgers.forEach(g => {
              if (isPnlGroup(g.groupName)) {
                 const isDr = g.outflows > g.inflows;
                 const amount = Math.abs(g.outflows - g.inflows);
                 const entry = { name: g.groupName, amount, items: g.ledgers };

                 if (TRADING_DR_GROUPS.includes(g.groupName)) pnlData.tradingDr.push(entry);
                 else if (TRADING_CR_GROUPS.includes(g.groupName)) pnlData.tradingCr.push(entry);
                 else if (PNL_DR_GROUPS.includes(g.groupName)) pnlData.pnlDr.push(entry);
                 else if (PNL_CR_GROUPS.includes(g.groupName)) pnlData.pnlCr.push(entry);
                 else {
                   if (isDr) pnlData.pnlDr.push(entry);
                   else pnlData.pnlCr.push(entry);
                 }
              } else {
                 if (g.inflows > g.outflows) {
                   liabilityGroups.push({ name: g.groupName, amount: g.inflows - g.outflows, type: 'LedgerGroup', items: g.ledgers });
                 } else if (g.outflows > g.inflows) {
                   assetGroups.push({ name: g.groupName, amount: g.outflows - g.inflows, type: 'LedgerGroup', items: g.ledgers });
                 }
              }
            });

            groupedManual.forEach(g => {
              const assetLiabEntries = g.entries.filter((e: any) => e.type === 'Asset' || e.type === 'Liability');
              const incomeExpEntries = g.entries.filter((e: any) => e.type === 'Income' || e.type === 'Expense');

              if (assetLiabEntries.length > 0) {
                let inf = 0;
                let out = 0;
                assetLiabEntries.forEach((e: any) => {
                  if (e.type === 'Asset') inf += e.amount;
                  else out += e.amount;
                });
                if (inf > out) {
                  liabilityGroups.push({ name: g.groupName, amount: inf - out, type: 'ManualGroup', items: assetLiabEntries });
                } else if (out > inf) {
                  assetGroups.push({ name: g.groupName, amount: out - inf, type: 'ManualGroup', items: assetLiabEntries });
                }
              }

              if (incomeExpEntries.length > 0) {
                let inc = 0;
                let exp = 0;
                incomeExpEntries.forEach((e: any) => {
                  if (e.type === 'Income') inc += e.amount;
                  else exp += e.amount;
                });
                if (inc > exp) {
                  if (TRADING_CR_GROUPS.includes(g.groupName)) pnlData.tradingCr.push({ name: g.groupName, amount: inc - exp, items: incomeExpEntries });
                  else pnlData.pnlCr.push({ name: g.groupName + ' (Income)', amount: inc - exp, items: incomeExpEntries });
                } else if (exp > inc) {
                  if (TRADING_DR_GROUPS.includes(g.groupName)) pnlData.tradingDr.push({ name: g.groupName, amount: exp - inc, items: incomeExpEntries });
                  else pnlData.pnlDr.push({ name: g.groupName + ' (Expense)', amount: exp - inc, items: incomeExpEntries });
                }
              }
            });

            if (totalSalesInflow > 0) {
              pnlData.tradingCr.push({ name: 'Sales Accounts', amount: totalSalesInflow, items: systemInvoices });
            }

            // AUTO-BALANCE LOGIC: Derive Opening Stock or Capital to balance the books
            const baseLiabilities = liabilityGroups.reduce((s, g) => s + g.amount, 0);
            const baseAssets = assetGroups.reduce((s, g) => s + g.amount, 0);
            const tempTradingDr = pnlData.tradingDr.reduce((s, x) => s + x.amount, 0);
            const tempTradingCr = pnlData.tradingCr.reduce((s, x) => s + x.amount, 0);
            const tempPnlDr = pnlData.pnlDr.reduce((s, x) => s + x.amount, 0);
            const tempPnlCr = pnlData.pnlCr.reduce((s, x) => s + x.amount, 0);

            const tempNetPnl = (tempTradingCr + tempPnlCr) - (tempTradingDr + tempPnlDr);
            
            const tempTotalLiab = baseLiabilities + (tempNetPnl > 0 ? tempNetPnl : 0);
            const tempTotalAssets = baseAssets + (tempNetPnl < 0 ? Math.abs(tempNetPnl) : 0);

            if (tempTotalLiab > tempTotalAssets) {
               const missing = tempTotalLiab - tempTotalAssets;
               pnlData.tradingDr.unshift({ name: 'Opening Stock (Calculated)', amount: missing, items: [] });
            } else if (tempTotalAssets > tempTotalLiab) {
               const missing = tempTotalAssets - tempTotalLiab;
               liabilityGroups.unshift({ name: 'Capital Account (Calculated)', amount: missing, type: 'System', items: [] });
            }

            // Final Calculations
            const totalTradingDr = pnlData.tradingDr.reduce((s, x) => s + x.amount, 0);
            const totalTradingCr = pnlData.tradingCr.reduce((s, x) => s + x.amount, 0);
            let grossProfit = 0;
            let grossLoss = 0;

            if (totalTradingCr > totalTradingDr) {
              grossProfit = totalTradingCr - totalTradingDr;
              pnlData.pnlCr.unshift({ name: 'Gross Profit b/f', amount: grossProfit, items: [] });
            } else if (totalTradingDr > totalTradingCr) {
              grossLoss = totalTradingDr - totalTradingCr;
              pnlData.pnlDr.unshift({ name: 'Gross Loss b/f', amount: grossLoss, items: [] });
            }

            const totalPnlDr = pnlData.pnlDr.reduce((s, x) => s + x.amount, 0);
            const totalPnlCr = pnlData.pnlCr.reduce((s, x) => s + x.amount, 0);
            let netProfit = 0;
            let netLoss = 0;

            if (totalPnlCr > totalPnlDr) {
              netProfit = totalPnlCr - totalPnlDr;
              liabilityGroups.push({ name: 'Profit & Loss A/c', amount: netProfit, type: 'PnL', items: pnlData });
            } else if (totalPnlDr > totalPnlCr) {
              netLoss = totalPnlDr - totalPnlCr;
              assetGroups.push({ name: 'Profit & Loss A/c', amount: netLoss, type: 'PnL', items: pnlData });
            }

            const currentTotalLiabilities = liabilityGroups.reduce((s, g) => s + g.amount, 0);
            const currentTotalAssets = assetGroups.reduce((s, g) => s + g.amount, 0);
            
            const finalTotal = Math.max(currentTotalLiabilities, currentTotalAssets);

            return (
              <div className="p-0 sm:p-0 overflow-x-hidden border-t border-[#e9e9e8]">
                <div className="w-full flex flex-col font-sans text-sm text-[#37352f] bg-white">
                  
                  {/* Desktop Header (Hidden on Mobile) */}
                  <div className="hidden md:flex border-b border-[#e9e9e8] bg-[#f7f7f5] text-[#787774] text-xs font-semibold uppercase tracking-wider">
                    <div className="flex-1 border-r border-[#e9e9e8] p-4 flex justify-between items-center">
                      <span className="font-bold">Liabilities</span>
                    </div>
                    <div className="flex-1 p-4 flex justify-between items-center">
                      <span className="font-bold">Assets</span>
                    </div>
                  </div>

                  {/* Body Container */}
                  <div className="flex flex-col md:flex-row md:min-h-[350px]">
                    
                    {/* Liabilities Section */}
                    <div className="flex-1 md:border-r border-[#e9e9e8] flex flex-col">
                      {/* Mobile Liabilities Header */}
                      <div className="md:hidden border-b border-[#e9e9e8] bg-[#f7f7f5] p-3 text-[#787774] text-xs font-bold uppercase tracking-wider">
                        Liabilities
                      </div>
                      <div className="p-4 gap-1 flex flex-col flex-1">
                        {liabilityGroups.map(g => (
                          <div 
                            key={g.name} 
                            className="flex justify-between hover:bg-gray-50/80 p-2 -mx-2 rounded-lg cursor-pointer group transition-colors"
                            onClick={() => g.type !== 'System' && setSelectedGroup(g)}
                          >
                            <span className={`font-medium group-hover:text-blue-600 transition-colors ${g.type === 'System' ? 'text-gray-400 italic' : 'text-gray-900'}`}>{g.name}</span>
                            <span className={`font-bold ${g.type === 'System' ? 'text-gray-400' : 'text-gray-900'}`}>{g.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Mobile Liabilities Total (Optional but helpful if list is long) */}
                      <div className="md:hidden border-t border-[#e9e9e8] bg-[#fbfbfa] p-4 flex justify-between font-black text-lg border-b-4 border-b-gray-300">
                        <span>Total</span>
                        <span>{finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                    </div>

                    {/* Assets Section */}
                    <div className="flex-1 flex flex-col border-t-8 border-t-gray-100 md:border-t-0">
                      {/* Mobile Assets Header */}
                      <div className="md:hidden border-b border-[#e9e9e8] bg-[#f7f7f5] p-3 text-[#787774] text-xs font-bold uppercase tracking-wider">
                        Assets
                      </div>
                      <div className="p-4 gap-1 flex flex-col flex-1">
                        {assetGroups.map(g => (
                          <div 
                            key={g.name} 
                            className="flex justify-between hover:bg-gray-50/80 p-2 -mx-2 rounded-lg cursor-pointer group transition-colors"
                            onClick={() => g.type !== 'System' && setSelectedGroup(g)}
                          >
                            <span className={`font-medium group-hover:text-blue-600 transition-colors ${g.type === 'System' ? 'text-gray-400 italic' : 'text-gray-900'}`}>{g.name}</span>
                            <span className={`font-bold ${g.type === 'System' ? 'text-gray-400' : 'text-gray-900'}`}>{g.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                          </div>
                        ))}
                      </div>

                      {/* Mobile Assets Total */}
                      <div className="md:hidden border-t border-[#e9e9e8] bg-[#fbfbfa] p-4 flex justify-between font-black text-lg border-b-4 border-b-gray-300 mb-6">
                        <span>Total</span>
                        <span>{finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Footer (Hidden on Mobile) */}
                  <div className="hidden md:flex border-t border-[#e9e9e8] bg-[#fbfbfa] text-[#37352f]">
                    <div className="flex-1 border-r border-[#e9e9e8] p-4 flex justify-between font-black text-lg border-b-4 border-double border-t-2 border-t-[#e9e9e8] border-b-gray-300">
                      <span>Total</span>
                      <span>{finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex-1 p-4 flex justify-between font-black text-lg border-b-4 border-double border-t-2 border-t-[#e9e9e8] border-b-gray-300">
                      <span>Total</span>
                      <span>{finalTotal.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>

      </div>

      {/* Details Sheet Modal */}
      <Sheet open={!!selectedGroup} onOpenChange={(open) => !open && setSelectedGroup(null)}>
        <SheetContent className="sm:max-w-[700px] w-full p-0 flex flex-col bg-[#fbfbfa]">
          {selectedGroup && selectedGroup.type === 'PnL' ? (
            <>
              <SheetHeader className="p-6 bg-white border-b border-[#e9e9e8]">
                <SheetTitle className="text-xl font-bold text-[#37352f]">
                  Profit & Loss A/c
                </SheetTitle>
                <p className="text-sm text-gray-500 font-medium">Trading and Profit & Loss Account for the period</p>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar bg-[#fbfbfa]">
                <div className="border border-[#e9e9e8] bg-white rounded-lg shadow-sm flex flex-col font-sans text-sm text-[#37352f] overflow-hidden">
                  
                  {/* Top Section: Trading Account */}
                  <div className="bg-[#f7f7f5] px-4 py-2 border-b border-[#e9e9e8] font-bold text-[#787774] text-xs uppercase tracking-wider text-center">
                    Trading Account
                  </div>
                  <div className="flex border-b border-[#e9e9e8] bg-[#fbfbfa] text-[#787774] text-xs font-semibold uppercase tracking-wider">
                    <div className="flex-1 border-r border-[#e9e9e8] p-3 flex justify-between items-center"><span className="font-bold">Particulars</span><span className="font-bold">Amount</span></div>
                    <div className="flex-1 p-3 flex justify-between items-center"><span className="font-bold">Particulars</span><span className="font-bold">Amount</span></div>
                  </div>
                  <div className="flex min-h-[150px]">
                    <div className="flex-1 border-r border-[#e9e9e8] p-3 flex flex-col gap-1">
                      {selectedGroup.items.tradingDr.map((g: any) => (
                        <div key={g.name} className="flex justify-between py-1 border-b border-dashed border-gray-100 last:border-0">
                           <span className={`font-medium ${g.name.includes('Gross Loss') ? 'text-gray-500 italic' : 'text-gray-900'}`}>{g.name}</span>
                           <span className="font-bold">{g.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 p-3 flex flex-col gap-1">
                      {selectedGroup.items.tradingCr.map((g: any) => (
                        <div key={g.name} className="flex justify-between py-1 border-b border-dashed border-gray-100 last:border-0">
                           <span className={`font-medium ${g.name.includes('Gross Profit') ? 'text-gray-500 italic' : 'text-gray-900'}`}>{g.name}</span>
                           <span className="font-bold">{g.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex border-t border-b-2 border-[#e9e9e8] bg-[#fbfbfa] text-[#37352f]">
                    <div className="flex-1 border-r border-[#e9e9e8] p-3 flex justify-between font-bold">
                      <span>Total</span>
                      <span>{Math.max(
                        selectedGroup.items.tradingDr.reduce((s:number, x:any)=>s+x.amount, 0),
                        selectedGroup.items.tradingCr.reduce((s:number, x:any)=>s+x.amount, 0)
                      ).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex-1 p-3 flex justify-between font-bold">
                      <span>Total</span>
                      <span>{Math.max(
                        selectedGroup.items.tradingDr.reduce((s:number, x:any)=>s+x.amount, 0),
                        selectedGroup.items.tradingCr.reduce((s:number, x:any)=>s+x.amount, 0)
                      ).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>

                  {/* Bottom Section: P&L Account */}
                  <div className="bg-[#f7f7f5] px-4 py-2 border-b border-[#e9e9e8] font-bold text-[#787774] text-xs uppercase tracking-wider text-center mt-2">
                    Profit & Loss Account
                  </div>
                  <div className="flex border-b border-[#e9e9e8] bg-[#fbfbfa] text-[#787774] text-xs font-semibold uppercase tracking-wider">
                    <div className="flex-1 border-r border-[#e9e9e8] p-3 flex justify-between items-center"><span className="font-bold">Particulars</span><span className="font-bold">Amount</span></div>
                    <div className="flex-1 p-3 flex justify-between items-center"><span className="font-bold">Particulars</span><span className="font-bold">Amount</span></div>
                  </div>
                  <div className="flex min-h-[150px]">
                    <div className="flex-1 border-r border-[#e9e9e8] p-3 flex flex-col gap-1">
                      {selectedGroup.items.pnlDr.map((g: any) => (
                        <div key={g.name} className="flex justify-between py-1 border-b border-dashed border-gray-100 last:border-0">
                           <span className={`font-medium ${g.name.includes('Loss') || g.name.includes('Profit') ? 'text-gray-500 italic' : 'text-gray-900'}`}>{g.name}</span>
                           <span className="font-bold">{g.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 p-3 flex flex-col gap-1">
                      {selectedGroup.items.pnlCr.map((g: any) => (
                        <div key={g.name} className="flex justify-between py-1 border-b border-dashed border-gray-100 last:border-0">
                           <span className={`font-medium ${g.name.includes('Profit') || g.name.includes('Loss') ? 'text-gray-500 italic' : 'text-gray-900'}`}>{g.name}</span>
                           <span className="font-bold">{g.amount.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex border-t border-[#e9e9e8] bg-[#fbfbfa] text-[#37352f]">
                    <div className="flex-1 border-r border-[#e9e9e8] p-3 flex justify-between font-black text-lg border-b-4 border-double border-t-2 border-t-[#e9e9e8] border-b-gray-300">
                      <span>Total</span>
                      <span>{Math.max(
                        selectedGroup.items.pnlDr.reduce((s:number, x:any)=>s+x.amount, 0),
                        selectedGroup.items.pnlCr.reduce((s:number, x:any)=>s+x.amount, 0)
                      ).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                    <div className="flex-1 p-3 flex justify-between font-black text-lg border-b-4 border-double border-t-2 border-t-[#e9e9e8] border-b-gray-300">
                      <span>Total</span>
                      <span>{Math.max(
                        selectedGroup.items.pnlDr.reduce((s:number, x:any)=>s+x.amount, 0),
                        selectedGroup.items.pnlCr.reduce((s:number, x:any)=>s+x.amount, 0)
                      ).toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                    </div>
                  </div>

                </div>
              </div>
            </>
          ) : selectedGroup && (
            <>
              <SheetHeader className="p-6 bg-white border-b border-[#e9e9e8]">
                <SheetTitle className="text-xl font-bold text-[#37352f]">
                  {selectedGroup.name}
                </SheetTitle>
                <p className="text-sm text-gray-500 font-medium">Detailed breakdown of {selectedGroup.items.length} items</p>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="bg-white border border-[#e9e9e8] rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#f7f7f5] text-[#787774] text-xs font-semibold uppercase tracking-wider border-b border-[#e9e9e8]">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Inflow (Dr)</th>
                        <th className="px-4 py-3 text-right">Outflow (Cr)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e9e9e8]">
                      {selectedGroup.type === 'LedgerGroup' && selectedGroup.items.map((l: any) => {
                        const isCr = isLedgerInflow(l);
                        return (
                          <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3 text-gray-500">{l.created_at ? new Date(l.created_at).toLocaleDateString('en-IN') : '-'}</td>
                            <td className="px-4 py-3 font-medium text-gray-900">{l.ledger_name}</td>
                            <td className="px-4 py-3 text-right text-green-600 font-semibold">{isCr ? `+ ₹${(l.opening_balance||0).toLocaleString('en-IN')}` : '-'}</td>
                            <td className="px-4 py-3 text-right text-red-600 font-semibold">{!isCr ? `- ₹${(l.opening_balance||0).toLocaleString('en-IN')}` : '-'}</td>
                          </tr>
                        )
                      })}

                      {selectedGroup.type === 'ManualGroup' && selectedGroup.items.map((e: any) => (
                        <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-gray-500">{new Date(e.date).toLocaleDateString('en-IN')}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{e.description}</td>
                          <td className="px-4 py-3 text-right text-green-600 font-semibold">{(e.type === 'Income' || e.type === 'Asset') ? `+ ₹${e.amount.toLocaleString('en-IN')}` : '-'}</td>
                          <td className="px-4 py-3 text-right text-red-600 font-semibold">{(e.type === 'Expense' || e.type === 'Liability') ? `- ₹${e.amount.toLocaleString('en-IN')}` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
