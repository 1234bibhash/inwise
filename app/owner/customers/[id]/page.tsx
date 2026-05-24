'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  Clock,
  MessageCircle,
  MoreVertical
} from 'lucide-react'
import Link from 'next/link'

export default function CustomerDetailPage() {
  const params = useParams()
  const customerId = params.id as string
  const [customer, setCustomer] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCustomer()
  }, [customerId])

  async function loadCustomer() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('customers')
        .select('*, profile:profiles(full_name)')
        .eq('id', customerId)
        .single()

      if (error) throw error
      setCustomer(data)
    } catch (error) {
      console.error('Error loading customer:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>
  if (!customer) return <div className="p-8">Customer not found</div>

  return (
    <div className="min-h-screen">
      <header className="h-20 bg-white border-b border-gray-50 flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/owner/customers">
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-400 font-medium">
            Management <span className="text-gray-200">/</span> <span className="text-gray-900">Customer Details</span>
          </div>
        </div>
      </header>

      <div className="p-8 max-w-[1200px] mx-auto space-y-8">
        <div className="bg-white rounded-[40px] p-10 border border-gray-50 shadow-sm">
          <div className="flex items-start justify-between mb-12">
            <div className="flex items-center gap-8">
              <div className="h-24 w-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-blue-100">
                {customer.profile?.full_name?.charAt(0) || 'C'}
              </div>
              <div>
                <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                  {customer.profile?.full_name || 'Anonymous Customer'}
                </h2>
                <div className="flex items-center gap-4 text-gray-500 font-bold text-sm uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Joined {new Date(customer.created_at).toLocaleDateString()}</span>
                  <span className="h-1 w-1 bg-gray-300 rounded-full" />
                  <span className="text-blue-600">Active Customer</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold gap-2">
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700 rounded-2xl h-12 px-8 font-bold shadow-lg shadow-blue-100">
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 border-t border-gray-50">
            <div className="space-y-6">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Contact Information</p>
              <div className="space-y-4">
                 <div className="flex items-center gap-4 group">
                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">Email Address</p>
                      <p className="text-sm font-bold text-gray-900">{customer.contact_email}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 group">
                    <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400">Phone Number</p>
                      <p className="text-sm font-bold text-gray-900">{customer.contact_phone}</p>
                    </div>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
               <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Billing Address</p>
               <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-relaxed">
                      123 Business Avenue<br />
                      Suite 456<br />
                      New York, NY 10001
                    </p>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Lifetime Stats</p>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                     <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Orders</p>
                     <p className="text-xl font-black text-gray-900">12</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                     <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Revenue</p>
                     <p className="text-xl font-black text-blue-900">$4,250</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
