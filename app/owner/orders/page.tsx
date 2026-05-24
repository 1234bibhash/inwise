'use client'

import { useEffect, useState } from 'react'
import { getOrders, type Order } from '@/lib/services/orderService'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Search, 
  Eye, 
  Truck, 
  CheckCircle2, 
  ShoppingBag, 
  MoreVertical, 
  Filter, 
  ArrowUpRight,
  Package,
  Calendar,
  CreditCard,
  Sparkles
} from 'lucide-react'

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    setMounted(true)
    loadOrders()
  }, [])

  useEffect(() => {
    let filtered = orders
    if (filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === filterStatus)
    }
    if (searchQuery) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customers?.contact_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.customers?.profile?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    setFilteredOrders(filtered)
  }, [searchQuery, filterStatus, orders])

  if (!mounted) return null

  async function loadOrders() {
    setIsLoading(true)
    try {
      const data = await getOrders()
      setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setTimeout(() => setIsLoading(false), 800)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-50 text-green-600'
      case 'shipped': return 'bg-blue-50 text-blue-600'
      case 'confirmed': return 'bg-cyan-50 text-cyan-600'
      case 'pending': return 'bg-yellow-50 text-yellow-600'
      case 'cancelled': return 'bg-red-50 text-red-600'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Premium Admin Header */}
      <header className="h-20 bg-white border-b border-[#e9e9e8] flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-blue-600" />
           </div>
            <div>
               <h1 className="text-xl font-bold text-gray-900 tracking-tight">Orders</h1>
               <div className="flex items-center gap-2 mt-0.5">
                  <div className="h-2 w-2 bg-green-500 rounded-full" />
                  <span className="text-xs text-gray-500">System Active</span>
               </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#acaba9]" />
            <input 
              type="text" 
              placeholder="Search orders..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#f7f7f5] border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 w-80 transition-all"
            />
          </div>
        </div>
      </header>

      <div className="p-10 max-w-[1600px] mx-auto space-y-10">
        {/* Order Filters */}
        <div className="flex items-center justify-between">
           <div className="flex gap-2 p-1 bg-white rounded-2xl border border-[#e9e9e8] shadow-sm overflow-x-auto no-scrollbar">
             {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-6 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
             ))}
           </div>
           <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                  <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-700">₹{orders.reduce((s,o) => s+o.total_amount, 0).toLocaleString()} Total Volume</span>
               </div>
           </div>
        </div>

        {/* Orders Table */}
        {isLoading ? (
          <div className="bg-white rounded-[40px] border border-[#e9e9e8] overflow-hidden">
             <div className="p-10 space-y-6">
                {Array.from({ length: 6 }).map((_, i) => (
                   <div key={i} className="flex items-center justify-between gap-8 py-4 border-b border-[#f1f1f0] last:border-none">
                      <Skeleton className="h-8 w-1/4" />
                      <Skeleton className="h-8 w-1/4" />
                      <Skeleton className="h-8 w-1/6" />
                      <Skeleton className="h-8 w-1/6" />
                      <Skeleton className="h-10 w-10 rounded-xl" />
                   </div>
                ))}
             </div>
          </div>
         ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-3xl p-24 text-center border border-dashed border-gray-200 space-y-4">
             <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="h-8 w-8 text-gray-300" />
             </div>
             <p className="text-sm font-medium text-gray-500">No orders found</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden text-left">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-10 py-6">Order</th>
                    <th className="px-10 py-6">Customer</th>
                    <th className="px-10 py-6">Amount</th>
                    <th className="px-10 py-6">Status</th>
                    <th className="px-10 py-6">Date</th>
                    <th className="px-10 py-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f1f0]">
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="group hover:bg-[#fcfcfc] transition-colors">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                           <div className="h-10 w-10 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-blue-50 transition-colors border border-gray-100">
                              <Package className="h-5 w-5 text-gray-400 group-hover:text-blue-600" />
                           </div>
                           <p className="font-semibold text-gray-900">{order.order_number}</p>
                        </div>
                      </td>
                       <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <p className="font-semibold text-gray-900">{order.customers?.profile?.full_name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-500">{order.customers?.contact_email}</p>
                        </div>
                      </td>
                       <td className="px-10 py-6">
                        <p className="font-bold text-gray-900 text-lg">₹{order.total_amount.toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">{order.payment_method || 'Electronic'}</p>
                      </td>
                       <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                       <td className="px-10 py-6">
                        <div className="flex items-center gap-2">
                           <Calendar className="h-3.5 w-3.5 text-gray-400" />
                           <span className="text-xs font-medium text-gray-900">{new Date(order.created_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedOrder(order)}
                              className="rounded-xl hover:bg-blue-50 text-blue-600 transition-all"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-[#f7f7f5]">
                             <MoreVertical className="h-4 w-4 text-[#acaba9]" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="!max-w-none w-[960px] h-[640px] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-white rounded-[20px] outline-none flex flex-col">
          {selectedOrder && (
            <>
              <DialogHeader className="px-8 py-6 border-b border-[#efefed] bg-[#fcfcfb]">
                <DialogTitle className="text-[22px] font-black text-[#37352f] tracking-tight">
                  {selectedOrder.order_number}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 grid grid-cols-2 gap-0">
                <div className="p-8 border-r border-[#efefed] space-y-6 bg-[#fbfbfa]">
                  <div>
                    <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest mb-2">Customer</p>
                    <h3 className="text-xl font-black text-[#37352f]">{selectedOrder.customers?.profile?.full_name || 'Anonymous'}</h3>
                    <p className="text-sm font-medium text-[#787774] mt-2">{selectedOrder.customers?.contact_phone || 'No phone saved'}</p>
                    <p className="text-sm font-medium text-[#787774]">{selectedOrder.customers?.contact_email || 'No email saved'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest mb-2">Delivery Address</p>
                    <p className="text-sm font-medium text-[#37352f] leading-relaxed">{selectedOrder.delivery_address || 'No delivery address saved'}</p>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest mb-2">Status</p>
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest mb-2">Payment</p>
                      <p className="text-sm font-black text-[#37352f]">{selectedOrder.payment_method || 'Electronic'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest mb-2">Order Date</p>
                      <p className="text-sm font-black text-[#37352f]">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest mb-2">Total Amount</p>
                      <p className="text-2xl font-black text-[#37352f]">Rs {selectedOrder.total_amount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
