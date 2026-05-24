'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  CheckCircle2, 
  MessageSquare, 
  FileText, 
  History,
  ShieldAlert,
  Wrench,
  ChevronRight,
  MoreHorizontal,
  Mail,
  MapPin,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface ServiceCall {
  id: string
  customer_id: string
  product_id: string | null
  service_type: string
  status: string
  scheduled_date: string | null
  issue_description: string | null
  created_at: string
  customers: {
    contact_email: string
    contact_phone: string
    profile: {
      full_name: string
    } | null
  } | null
}

export default function ServiceTicketDetail() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  
  const [ticket, setTicket] = useState<ServiceCall | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTicket()
  }, [ticketId])

  async function loadTicket() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('service_calls')
        .select('*, customers(contact_email, contact_phone, profile:profiles(full_name))')
        .eq('id', ticketId)
        .single()

      if (error) throw error
      setTicket(data)
    } catch (error) {
      console.error('Error loading ticket:', error)
      setTicket(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="bg-white border border-[#e9e9e8] rounded-3xl px-8 py-10 text-center shadow-sm">
          <p className="text-lg font-black text-[#37352f]">Service ticket not found</p>
          <p className="text-sm font-medium text-[#787774] mt-2">This record could not be loaded from the live ledger.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] pb-20">
      {/* Notion-style Document Header */}
      <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#e9e9e8] sticky top-0 z-10 px-8 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-[#f7f7f5] rounded-lg transition-all">
               <ArrowLeft className="h-5 w-5 text-[#acaba9]" />
            </button>
            <div className="flex items-center gap-2 text-xs font-bold text-[#acaba9] uppercase tracking-widest">
               Service Hub <ChevronRight className="h-3 w-3" /> Ticket <span className="text-[#37352f]">#{ticket.id.slice(0, 8)}</span>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <Button variant="outline" className="h-10 rounded-xl border-[#e9e9e8] font-black text-[10px] uppercase tracking-widest px-4 hover:bg-[#f7f7f5]">
               Edit Log
            </Button>
            <Button className="h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest px-4 shadow-lg shadow-blue-100 border-none">
               Update Status
            </Button>
         </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-12 space-y-12">
         {/* Title Section */}
         <div className="space-y-6 text-left">
            <div className="flex items-center gap-3">
               <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Wrench className="h-6 w-6 text-blue-600" />
               </div>
               <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                 ticket.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
               }`}>
                 {ticket.status.replace('_', ' ')}
               </span>
            </div>
            <h1 className="text-5xl font-black text-[#37352f] tracking-tighter leading-tight">
               {ticket.service_type.charAt(0).toUpperCase() + ticket.service_type.slice(1)}: Tech Assessment
            </h1>
            <div className="flex items-center gap-8 text-[#acaba9]">
               <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs font-bold">Created {new Date(ticket.created_at).toLocaleDateString()}</span>
               </div>
            </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content: The "Document" */}
            <div className="lg:col-span-2 space-y-12">
               <section className="space-y-6">
                  <div className="flex items-center gap-2 text-xs font-black text-[#37352f] uppercase tracking-widest border-b border-[#f1f1f0] pb-2">
                     <FileText className="h-4 w-4 text-blue-600" />
                     Incident Overview
                  </div>
                  <div className="p-8 bg-white rounded-[32px] border border-[#e9e9e8] shadow-sm">
                     <p className="text-base text-[#37352f] font-medium leading-relaxed">
                        {ticket.issue_description || 'No description provided.'}
                     </p>
                  </div>
               </section>

               <section className="space-y-6">
                  <div className="flex items-center gap-2 text-xs font-black text-[#37352f] uppercase tracking-widest border-b border-[#f1f1f0] pb-2">
                     <History className="h-4 w-4 text-blue-600" />
                     Activity Timeline
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-blue-600 border-2 border-white shadow-sm z-10" />
                        <div className="h-full w-[1px] bg-[#e9e9e8] my-1" />
                      </div>
                      <div className="flex-1 bg-white rounded-2xl p-4 border border-[#e9e9e8] flex items-center justify-between group-hover:shadow-md transition-shadow">
                        <span className="text-sm font-bold text-[#37352f]">Ticket created</span>
                        <span className="text-[10px] font-black text-[#acaba9] uppercase">{new Date(ticket.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {ticket.scheduled_date && (
                      <div className="flex gap-4 group">
                        <div className="flex flex-col items-center">
                          <div className="h-3 w-3 rounded-full bg-blue-600 border-2 border-white shadow-sm z-10" />
                        </div>
                        <div className="flex-1 bg-white rounded-2xl p-4 border border-[#e9e9e8] flex items-center justify-between group-hover:shadow-md transition-shadow">
                          <span className="text-sm font-bold text-[#37352f]">Scheduled visit</span>
                          <span className="text-[10px] font-black text-[#acaba9] uppercase">{new Date(ticket.scheduled_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
               </section>
            </div>

            {/* Sidebar: Metadata */}
            <div className="space-y-8">
               <section className="bg-white rounded-[40px] p-8 border border-[#e9e9e8] shadow-sm space-y-8 text-left">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Customer Profile</p>
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#f7f7f5] flex items-center justify-center font-black text-[#37352f] text-lg">
                           {ticket.customers?.profile?.full_name?.charAt(0) || 'U'}
                        </div>
                        <div>
                           <p className="text-sm font-black text-[#37352f]">{ticket.customers?.profile?.full_name || 'Anonymous'}</p>
                           <p className="text-[10px] font-bold text-[#acaba9] uppercase">Verified Hooghly Client</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4 pt-8 border-t border-[#f1f1f0]">
                     <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-[#acaba9]" />
                        <span className="text-xs font-bold text-[#37352f] truncate">{ticket.customers?.contact_email}</span>
                     </div>
                  </div>

                  <div className="space-y-4 pt-8 border-t border-[#f1f1f0]">
                     <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Appointment</p>
                     <div className="p-4 bg-[#f7f7f5] rounded-2xl border border-[#e9e9e8]">
                        <div className="flex items-center gap-2 mb-1">
                           <Calendar className="h-4 w-4 text-[#37352f]" />
                           <span className="text-xs font-bold text-[#37352f]">
                              {ticket.scheduled_date ? new Date(ticket.scheduled_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unscheduled'}
                           </span>
                        </div>
                        <p className="text-[10px] font-bold text-[#acaba9] uppercase">Live schedule from service ledger</p>
                     </div>
                  </div>
               </section>

               <section className="bg-[#37352f] rounded-[40px] p-8 text-white shadow-2xl space-y-6 text-left">
                  <div className="flex items-center gap-3">
                     <ShieldAlert className="h-6 w-6 text-orange-400" />
                     <h4 className="text-base font-black">Admin Protocol</h4>
                  </div>
                  <p className="text-xs text-white/60 font-medium leading-relaxed">
                     This is a live enterprise document. All modifications are logged to the Hooghly audit trail.
                  </p>
                  <Button className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all">
                     View Audit Logs
                  </Button>
               </section>
            </div>
         </div>
      </div>
    </div>
  )
}
