'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  Search, 
  ChevronDown, 
  X, 
  Star, 
  Package, 
  RefreshCcw, 
  MessageSquare,
  ChevronRight,
  MoreHorizontal,
  Box,
  Truck,
  ShieldCheck
} from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  id: string
  product_name: string
  product_image: string
  price: number
  quantity: number
}

interface Order {
  id: string
  order_number: string
  total_amount: number
  status: string
  created_at: string
  ship_to: string
  delivered_at?: string
  items: OrderItem[]
}

const MOCK_ORDERS: Order[] = [
  {
    id: '1',
    order_number: 'HE-ORD-5390023',
    total_amount: 105990,
    status: 'delivered',
    created_at: '2023-06-02T10:00:00Z',
    ship_to: 'Salung Prastyo',
    delivered_at: '2023-06-05T14:00:00Z',
    items: [
      {
        id: 'i1',
        product_name: 'NeoVision OLED TV 65" - Ultra-thin display with cinematic sound',
        product_image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=2070&auto=format&fit=crop',
        price: 105990,
        quantity: 1
      }
    ]
  },
  {
    id: '2',
    order_number: 'HE-ORD-5390024',
    total_amount: 14999,
    status: 'delivered',
    created_at: '2023-06-07T09:30:00Z',
    ship_to: 'Salung Prastyo',
    delivered_at: '2023-06-10T11:00:00Z',
    items: [
      {
        id: 'i2',
        product_name: 'Pulse Audio Wireless Buds - Premium noise-canceling technology',
        product_image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=2128&auto=format&fit=crop',
        price: 14999,
        quantity: 1
      }
    ]
  }
]

export default function CustomerOrders() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS)
  const [activeTab, setActiveTab] = useState('orders')
  const [timeFilter, setTimeFilter] = useState('Past 3 Months')

  return (
    <div className="max-w-6xl mx-auto p-12 bg-[#f7f7f5] min-h-screen">
      <div className="flex items-center justify-between mb-12">
        <div className="flex items-baseline gap-4">
          <h1 className="text-3xl font-black text-[#37352f] tracking-tight">Purchase History</h1>
          <span className="bg-[#efefed] px-3 py-1 rounded-full text-xs font-black text-[#acaba9]">{orders.length} Orders</span>
        </div>
        <div className="relative">
           <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#acaba9]" />
           <input 
             type="text" 
             placeholder="Search your orders..." 
             className="bg-white border border-[#e9e9e8] rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-100 w-64 transition-all outline-none"
           />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-8">
          {/* Tabs & Filter (Notion-style) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#e9e9e8] pb-1">
             <div className="flex gap-8">
                {['Orders', 'Not Shipped', 'Cancelled'].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase())}
                    className={`pb-4 text-sm font-black transition-all relative ${
                      activeTab === tab.toLowerCase() ? 'text-[#37352f]' : 'text-[#acaba9] hover:text-[#37352f]'
                    }`}
                  >
                    {tab}
                    {activeTab === tab.toLowerCase() && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                  </button>
                ))}
             </div>
             <div className="flex items-center gap-2 text-xs font-black text-[#37352f] bg-white px-4 py-2 rounded-xl border border-[#e9e9e8] shadow-sm cursor-pointer hover:bg-[#f7f7f5] transition-all">
                {timeFilter} <ChevronDown className="h-3.5 w-3.5 text-[#acaba9]" />
             </div>
          </div>

          {/* Orders List */}
          <div className="space-y-8">
             {orders.map(order => (
               <div key={order.id} className="border border-[#e9e9e8] rounded-[32px] overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  {/* Order Header (Clean Notion Style) */}
                  <div className="bg-[#fcfcfc] px-8 py-6 border-b border-[#e9e9e8] flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="flex flex-wrap gap-10">
                        <div>
                           <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest mb-1">Order Date</p>
                           <p className="text-sm font-bold text-[#37352f]">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest mb-1">Total Amount</p>
                           <p className="text-sm font-black text-blue-600">₹{order.total_amount.toLocaleString()}</p>
                        </div>
                        <div>
                           <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest mb-1">Recipient</p>
                           <div className="flex items-center gap-1.5 cursor-pointer hover:text-blue-600 group">
                             <p className="text-sm font-bold text-[#37352f] group-hover:text-blue-600 transition-colors">{order.ship_to}</p>
                             <ChevronDown className="h-3 w-3 text-[#acaba9]" />
                           </div>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest mb-1">Order ID: {order.order_number}</p>
                        <div className="flex items-center justify-end gap-4 text-xs font-black text-blue-600">
                           <button className="hover:underline">Order details</button>
                           <div className="h-3 w-[1px] bg-[#e9e9e8]" />
                           <button className="hover:underline">Invoice</button>
                        </div>
                     </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-8">
                     <div className="bg-blue-50/50 border border-blue-100 rounded-2xl px-5 py-3 flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                           <Sparkles className="h-4 w-4 text-blue-500" />
                           <span className="text-xs font-bold text-blue-900">Your feedback helps us improve Hooghly Electronics</span>
                        </div>
                        <X className="h-4 w-4 text-blue-400 cursor-pointer hover:text-blue-600 transition-colors" />
                     </div>

                     <div className="space-y-10">
                        <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center">
                              <Truck className="h-4 w-4 text-green-600" />
                           </div>
                           <h3 className="text-lg font-black text-[#37352f]">Delivered {new Date(order.delivered_at!).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h3>
                        </div>

                        {order.items.map(item => (
                          <div key={item.id} className="flex flex-col md:flex-row gap-8">
                             <div className="h-32 w-32 bg-[#f7f7f5] rounded-2xl overflow-hidden flex-shrink-0 border border-[#e9e9e8] p-4 flex items-center justify-center">
                                <img src={item.product_image} className="w-full h-full object-contain mix-blend-multiply" />
                             </div>
                             <div className="flex-1 space-y-6">
                                <div className="space-y-2">
                                   <p className="text-sm font-black text-[#37352f] hover:text-blue-600 cursor-pointer leading-tight line-clamp-2 transition-colors">
                                     {item.product_name}
                                   </p>
                                   <div className="flex items-center gap-2">
                                      <ShieldCheck className="h-3.5 w-3.5 text-[#acaba9]" />
                                      <p className="text-[11px] font-medium text-[#acaba9]">Coverage active through {new Date(new Date(order.delivered_at!).getTime() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                   </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                   <Button className="bg-[#37352f] hover:bg-black text-white rounded-xl px-6 h-10 text-xs font-black shadow-lg transition-all border-none">
                                      <RefreshCcw className="h-3.5 w-3.5 mr-2" />
                                      Order Again
                                   </Button>
                                   <Button variant="outline" className="rounded-xl px-6 h-10 text-xs font-black border-[#e9e9e8] hover:bg-[#f7f7f5] text-[#37352f]">Track shipment</Button>
                                   <Button variant="outline" className="rounded-xl px-6 h-10 text-xs font-black border-[#e9e9e8] hover:bg-[#f7f7f5] text-[#37352f]">Return policy</Button>
                                   <Button variant="outline" size="icon" className="rounded-xl h-10 w-10 border-[#e9e9e8] hover:bg-[#f7f7f5] text-[#acaba9]">
                                      <MoreHorizontal className="h-4 w-4" />
                                   </Button>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Support Sidebar (Notion Style) */}
        <div className="w-full lg:w-72 flex-shrink-0">
           <div className="bg-white border border-[#e9e9e8] rounded-[32px] p-8 shadow-sm sticky top-24">
              <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                 <MessageSquare className="h-7 w-7 text-blue-600" />
              </div>
              <h4 className="text-xl font-black text-[#37352f] mb-3">Hooghly Support</h4>
              <p className="text-sm text-[#acaba9] font-medium leading-relaxed mb-8">
                 Need assistance with your purchase? Our local tech experts are available 24/7 to help you.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl h-12 font-black shadow-xl shadow-blue-100 border-none transition-all active:scale-95">
                 Contact Support
              </Button>
              <p className="text-center text-[10px] font-bold text-[#acaba9] mt-6 uppercase tracking-widest">Typical response: 15 mins</p>
           </div>
        </div>
      </div>
    </div>
  )
}

// Missing icon fallback
function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
