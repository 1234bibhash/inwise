'use client'

import { useEffect, useState } from 'react'
import { getAllServiceCalls, updateServiceCallStatus, updateServiceCall, createServiceCall, type ServiceCall } from '@/lib/services/serviceCallService'
import { getCustomers, type CustomerRecord } from '@/lib/services/customerService'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Plus, 
  Search, 
  Wrench, 
  MoreHorizontal,
  Filter,
  User,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  Send
} from 'lucide-react'
import { chatWithMistral } from '@/lib/services/mistralService'
import { sendGmailReminder } from '@/lib/services/emailService'
import { type WarrantyMilestone } from '@/lib/services/serviceCallService'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const COLUMNS = [
  { id: 'pending', label: 'Pending', color: '#f59e0b' },
  { id: 'scheduled', label: 'Scheduled', color: '#3b82f6' },
  { id: 'in_progress', label: 'In Progress', color: '#8b5cf6' },
  { id: 'completed', label: 'Completed', color: '#10b981' }
]

export default function ServiceCallsPage() {
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([])
  const [customers, setCustomers] = useState<CustomerRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  
  // Edit/Expand State
  const [selectedTicket, setSelectedTicket] = useState<ServiceCall | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [isProcessingMilestone, setIsProcessingMilestone] = useState<number | null>(null)

  const DEFAULT_MILESTONES: WarrantyMilestone[] = [
    { id: 1, label: '3-Month Checkup', months: 3, status: 'pending' },
    { id: 2, label: '6-Month Service', months: 6, status: 'pending' },
    { id: 3, label: '9-Month Review', months: 9, status: 'pending' },
    { id: 4, label: '12-Month Renewal', months: 12, status: 'pending' }
  ]

  useEffect(() => {
    setMounted(true)
    loadPageData()
  }, [])

  async function loadPageData() {
    setIsLoading(true)
    try {
      const [data, customerData] = await Promise.all([
        getAllServiceCalls(),
        getCustomers(),
      ])
      setServiceCalls(data)
      setCustomers(customerData)
    } catch (error) {
      console.error('Error loading service calls:', error)
    } finally {
      setTimeout(() => setIsLoading(false), 800)
    }
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId as ServiceCall['status']
    const ticketId = draggableId

    // Optimistic Update
    const updatedCalls = serviceCalls.map(call => 
      call.id === ticketId ? { ...call, status: newStatus } : call
    )
    setServiceCalls(updatedCalls)

    try {
      await updateServiceCallStatus(ticketId, newStatus)
      toast.success(`Status updated to ${newStatus}`)
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast.error('Failed to update status')
      loadPageData() // Rollback
    }
  }

  const handleUpdateTicket = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTicket) return

    try {
      await updateServiceCall(selectedTicket.id, {
        issue_description: selectedTicket.issue_description,
        status: selectedTicket.status,
        service_type: selectedTicket.service_type
      })
      toast.success('Ticket updated successfully')
      setIsEditModalOpen(false)
      loadPageData()
    } catch (error) {
      toast.error('Failed to update ticket')
    }
  }

  const getFilteredCalls = (status: string) => {
    return serviceCalls
      .filter(call => call.status === status)
      .filter(call => {
        const normalizedQuery = searchQuery.toLowerCase()
        const matchesSearch = (call.issue_description || '').toLowerCase().includes(normalizedQuery) ||
                             (call.customers?.profile?.full_name || '').toLowerCase().includes(normalizedQuery) ||
                             call.id.toLowerCase().includes(searchQuery.toLowerCase())
        
        const matchesType = filterType === 'all' || call.service_type === filterType
        
        return matchesSearch && matchesType
      })
  }

  const [newTicket, setNewTicket] = useState({
    customer_id: '',
    service_type: 'repair' as ServiceCall['service_type'],
    issue_description: ''
  })

  const handleCreateTicket = async () => {
    const selectedCustomer = customers.find((customer) => customer.id === newTicket.customer_id)

    if (!selectedCustomer) {
      toast.error('Select a customer before creating the ticket')
      return
    }

    try {
      await createServiceCall(
        newTicket.customer_id,
        newTicket.service_type,
        undefined,
        undefined,
        newTicket.issue_description,
        {
          contact_email: selectedCustomer.contact_email,
          contact_phone: selectedCustomer.contact_phone,
          profile: { full_name: selectedCustomer.profile?.full_name || 'Unknown customer' }
        }
      )
      toast.success('New service ticket created')
      setIsNewModalOpen(false)
      setNewTicket({ customer_id: '', service_type: 'repair', issue_description: '' })
      loadPageData()
    } catch (error) {
      toast.error('Failed to create ticket')
    }
  }

  const handleProcessMilestone = async (milestoneId: number) => {
    if (!selectedTicket || !selectedTicket.customers) return
    
    setIsProcessingMilestone(milestoneId)
    try {
      const milestone = (selectedTicket.warranty_schedule || DEFAULT_MILESTONES).find(m => m.id === milestoneId)
      if (!milestone) return

      // 1. Generate Email with Mistral
      const prompt = `Write a professional and friendly maintenance reminder email for a customer.
      Customer Name: ${selectedTicket.customers.profile?.full_name || 'Valued Customer'}
      Service Type: ${milestone.label}
      Context: This is a ${milestone.months}-month warranty checkup for their recently serviced appliance.
      Goal: Remind them to schedule their checkup and mention that our team is ready to assist.
      Tone: Premium, helpful, concise.`

      const emailBody = await chatWithMistral([
        { role: 'system', content: 'You are a helpful customer service assistant for Hooghly Electronics.' },
        { role: 'user', content: prompt }
      ])

      // 2. Send via Gmail (Simulated)
      await sendGmailReminder({
        to: selectedTicket.customers.contact_email || 'customer@example.com',
        subject: `Reminder: ${milestone.label} - Hooghly Electronics`,
        body: emailBody,
        customerName: selectedTicket.customers.profile?.full_name
      })

      // 3. Update Local State
      const currentSchedule = selectedTicket.warranty_schedule || DEFAULT_MILESTONES
      const updatedSchedule = currentSchedule.map(m => 
        m.id === milestoneId 
          ? { ...m, status: 'completed' as const, completed_at: new Date().toISOString(), email_preview: emailBody } 
          : m
      )

      const updatedTicket = { ...selectedTicket, warranty_schedule: updatedSchedule }
      setSelectedTicket(updatedTicket)

      // 4. Persist to DB
      await updateServiceCall(selectedTicket.id, {
        warranty_schedule: updatedSchedule
      })

      toast.success(`${milestone.label} processed and email sent!`)
    } catch (error) {
      console.error('Error processing milestone:', error)
      toast.error('Failed to process reminder')
    } finally {
      setIsProcessingMilestone(null)
    }
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-[#fcfcfb] flex flex-col">
      {/* Notion-style Header - Cleaned up */}
      <header className="h-14 bg-white border-b border-[#f1f1f0] flex items-center justify-between px-6 sticky top-0 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-[#37352f] rounded-lg flex items-center justify-center text-white shadow-sm">
              <Wrench className="h-4.5 w-4.5" />
            </div>
            <h1 className="text-sm font-semibold text-gray-900">Service Management</h1>
            <div className="flex items-center gap-1.5 ml-2">
              <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-500">System Online</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#acaba9]" />
            <input 
              type="text" 
              placeholder="Search tickets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#f7f7f5] border border-transparent rounded-lg pl-9 pr-4 py-1.5 text-xs focus:bg-white focus:border-[#e9e9e8] focus:outline-none w-48 transition-all"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-8 w-[130px] rounded-lg bg-[#f7f7f5] border-transparent text-xs font-semibold focus:ring-0">
              <Filter className="h-3 w-3 mr-2" />
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#e9e9e8] shadow-xl">
              <SelectItem value="all" className="text-xs">All Services</SelectItem>
              <SelectItem value="repair" className="text-xs">Repair</SelectItem>
              <SelectItem value="installation" className="text-xs">Installation</SelectItem>
              <SelectItem value="warranty" className="text-xs">Warranty</SelectItem>
              <SelectItem value="consultation" className="text-xs">Consultation</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setIsNewModalOpen(true)}
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold px-4 shadow-sm border-none transition-all"
          >
            <Plus className="h-3.5 w-3.5 mr-2" />
            New Ticket
          </Button>
        </div>
      </header>

      {/* Kanban Board Layout */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 p-6 overflow-hidden">
          <div className="grid grid-cols-4 gap-6 h-full">
            {COLUMNS.map(column => (
              <div key={column.id} className="flex flex-col h-full min-w-0">
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: column.color }} />
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">{column.label}</h3>
                    <span className="text-xs text-gray-400 ml-1">{getFilteredCalls(column.id).length}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-[#acaba9] hover:bg-[#f1f1f0]"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                </div>

                {/* Droppable Area */}
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex-1 overflow-y-auto space-y-3 px-1 custom-scrollbar pb-6 transition-colors rounded-xl ${snapshot.isDraggingOver ? 'bg-[#f7f7f5]/50' : ''}`}
                    >
                      {isLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="bg-white rounded-xl p-4 border border-[#e9e9e8] space-y-3 shadow-sm animate-pulse">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ))
                      ) : (
                        getFilteredCalls(column.id).map((call, index) => (
                          <Draggable key={call.id} draggableId={call.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => {
                                  setSelectedTicket(call)
                                  setIsEditModalOpen(true)
                                }}
                                className={`bg-white rounded-xl p-4 border transition-all cursor-pointer group relative ${
                                  snapshot.isDragging 
                                    ? 'shadow-2xl border-blue-400 rotate-2' 
                                    : 'border-[#e9e9e8] shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.06)] hover:border-[#d1d1d0]'
                                }`}
                              >
                                {/* Ticket Content */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                     <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                                       call.service_type === 'repair' ? 'bg-red-50 text-red-600' :
                                       call.service_type === 'installation' ? 'bg-blue-50 text-blue-600' :
                                       'bg-orange-50 text-orange-600'
                                     }`}>
                                        <Wrench className="h-3.5 w-3.5" />
                                     </div>
                                      <div className="min-w-0">
                                        <h4 className="text-xs font-semibold text-gray-900 leading-none capitalize">{call.service_type}</h4>
                                        <p className="text-[10px] text-gray-500 mt-1">Ticket #{call.id.slice(0, 8)}</p>
                                     </div>
                                  </div>
                                </div>

                                {call.issue_description && (
                                  <p className="text-[11px] text-[#787774] line-clamp-2 mb-3 leading-relaxed font-medium">
                                    {call.issue_description}
                                  </p>
                                )}

                                <div className="flex items-center gap-2 pt-3 border-t border-[#f1f1f0]">
                                  <div className="h-6 w-6 bg-gray-100 rounded-full flex items-center justify-center shrink-0 border border-gray-200">
                                    <span className="text-[10px] font-medium text-gray-600">
                                      {call.customers?.profile?.full_name?.charAt(0) || 'A'}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-medium text-gray-700 truncate">
                                    {call.customers?.profile?.full_name || 'Anonymous'}
                                  </span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                      
                      {!isLoading && getFilteredCalls(column.id).length === 0 && (
                        <div className="py-8 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                          <p className="text-xs text-gray-400">No active tickets</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Expand/Edit Ticket Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="!max-w-none w-[960px] h-[640px] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-white rounded-[20px] outline-none flex flex-col">
          {selectedTicket && (
            <div className="flex flex-col h-full max-h-[90vh]">
              <DialogHeader className="p-6 border-b border-[#f1f1f0] bg-[#fcfcfb]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-[#37352f] rounded-xl flex items-center justify-center text-white">
                      <Wrench className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-semibold text-gray-900">Ticket #{selectedTicket.id.slice(0, 8)}</DialogTitle>
                      <p className="text-xs text-gray-500">Service Record</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    selectedTicket.status === 'completed' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                  }`}>
                    {selectedTicket.status}
                  </div>
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Customer Section */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Customer Profile</Label>
                    <div className="bg-[#f7f7f5] p-4 rounded-2xl space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-[#37352f]" />
                        <span className="text-sm font-bold text-[#37352f]">{selectedTicket.customers?.profile?.full_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-[#acaba9]" />
                        <span className="text-xs font-medium text-[#787774]">{selectedTicket.customers?.contact_phone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-[#acaba9]" />
                        <span className="text-xs font-medium text-[#787774]">{selectedTicket.customers?.contact_email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Service Details</Label>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold">Service Type</Label>
                        <Select 
                          value={selectedTicket.service_type} 
                          onValueChange={(val: any) => setSelectedTicket({...selectedTicket, service_type: val})}
                        >
                          <SelectTrigger className="h-9 rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="repair">Repair</SelectItem>
                            <SelectItem value="installation">Installation</SelectItem>
                            <SelectItem value="warranty">Warranty</SelectItem>
                            <SelectItem value="consultation">Consultation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold">Scheduled Date</Label>
                        <div className="flex items-center gap-2 px-3 h-9 bg-[#f7f7f5] rounded-lg border border-transparent text-xs text-[#37352f] font-bold">
                          <CalendarIcon className="h-3.5 w-3.5 text-[#acaba9]" />
                          {selectedTicket.scheduled_date ? new Date(selectedTicket.scheduled_date).toLocaleDateString() : 'Unscheduled'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-[#f1f1f0]">
                  <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Issue Description</Label>
                  <Textarea 
                    value={selectedTicket.issue_description || ''}
                    onChange={(e) => setSelectedTicket({...selectedTicket, issue_description: e.target.value})}
                    className="rounded-2xl bg-[#fcfcfb] border-[#e9e9e8] min-h-[120px] text-sm focus:ring-blue-100 p-4"
                  />
                </div>

                {/* Warranty Maintenance Timeline */}
                {selectedTicket.service_type === 'warranty' && (
                  <div className="space-y-6 pt-6 border-t border-[#f1f1f0]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <Label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Warranty Maintenance Timeline</Label>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Automated Reminders</span>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      {(selectedTicket.warranty_schedule || DEFAULT_MILESTONES).map((milestone) => (
                        <div 
                          key={milestone.id} 
                          className={`relative p-4 rounded-2xl border transition-all ${
                            milestone.status === 'completed' 
                              ? 'bg-green-50/30 border-green-100 shadow-sm' 
                              : 'bg-white border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex flex-col gap-3">
                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                              milestone.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                            }`}>
                              {milestone.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-900 leading-tight">{milestone.label}</p>
                              <p className="text-[9px] text-gray-500 mt-1">{milestone.months} Months Post-Service</p>
                            </div>
                            
                            {milestone.status === 'completed' ? (
                              <div className="flex items-center gap-1.5 text-[9px] font-bold text-green-600 mt-1">
                                <Send className="h-3 w-3" />
                                <span>Sent {new Date(milestone.completed_at!).toLocaleDateString()}</span>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessingMilestone !== null}
                                onClick={() => handleProcessMilestone(milestone.id)}
                                className="h-7 w-full text-[9px] font-bold rounded-lg bg-white border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all"
                              >
                                {isProcessingMilestone === milestone.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                ) : (
                                  <Mail className="h-3 w-3 mr-1.5" />
                                )}
                                {isProcessingMilestone === milestone.id ? 'Processing...' : 'Process Reminder'}
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} className="rounded-lg font-medium h-10 px-6">Cancel</Button>
                <Button onClick={handleUpdateTicket} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg h-10 px-8 font-semibold shadow-sm">
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Ticket Modal */}
      <Dialog open={isNewModalOpen} onOpenChange={setIsNewModalOpen}>
        <DialogContent className="!max-w-none w-[720px] p-8 rounded-[20px] border-none shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-white">
           <DialogHeader className="mb-6">
              <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                <Plus className="h-6 w-6" />
              </div>
               <DialogTitle className="text-xl font-bold text-gray-900">Create Service Ticket</DialogTitle>
               <p className="text-sm text-gray-500 mt-1">Start a new service request for a customer.</p>
           </DialogHeader>
           
           <div className="space-y-6">
              <div className="space-y-2">
                 <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Customer</Label>
                 <Select
                   value={newTicket.customer_id}
                   onValueChange={(value) => setNewTicket({ ...newTicket, customer_id: value })}
                 >
                   <SelectTrigger className="h-12 rounded-xl bg-[#fcfcfb]">
                     <SelectValue placeholder="Select a billed customer..." />
                   </SelectTrigger>
                   <SelectContent className="rounded-xl">
                     {customers.map((customer) => (
                       <SelectItem key={customer.id} value={customer.id}>
                         {customer.profile?.full_name || customer.contact_phone || customer.contact_email || customer.id}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
                 {newTicket.customer_id && (
                   <div className="rounded-2xl bg-[#f7f7f5] p-4 space-y-1">
                     <p className="text-sm font-bold text-[#37352f]">
                       {customers.find((customer) => customer.id === newTicket.customer_id)?.profile?.full_name || 'Unknown customer'}
                     </p>
                     <p className="text-xs font-medium text-[#787774]">
                       {customers.find((customer) => customer.id === newTicket.customer_id)?.contact_phone || 'No phone saved'}
                     </p>
                     <p className="text-xs font-medium text-[#787774]">
                       {customers.find((customer) => customer.id === newTicket.customer_id)?.contact_email || 'No email saved'}
                     </p>
                   </div>
                 )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Service Logic</Label>
                    <Select 
                      value={newTicket.service_type}
                      onValueChange={(val: any) => setNewTicket({...newTicket, service_type: val})}
                    >
                       <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl">
                          <SelectItem value="repair">Repair</SelectItem>
                          <SelectItem value="installation">Installation</SelectItem>
                          <SelectItem value="warranty">Warranty</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Initial Priority</Label>
                    <Select defaultValue="medium">
                       <SelectTrigger className="h-12 rounded-xl">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent className="rounded-xl">
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">Urgent</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="space-y-2">
                 <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Issue Narrative</Label>
                 <Textarea 
                    placeholder="Describe the service requirement..." 
                    value={newTicket.issue_description}
                    onChange={(e) => setNewTicket({...newTicket, issue_description: e.target.value})}
                    className="rounded-xl min-h-[100px] bg-[#fcfcfb]" 
                 />
              </div>
           </div>

           <DialogFooter className="mt-8 gap-3">
              <Button variant="ghost" onClick={() => setIsNewModalOpen(false)} className="h-12 px-6 rounded-xl font-bold">Cancel</Button>
              <Button
                onClick={handleCreateTicket}
                disabled={!newTicket.customer_id || !newTicket.issue_description.trim()}
                className="h-12 px-10 bg-[#3b82f6] text-white rounded-xl font-bold shadow-lg shadow-blue-100 flex-1 disabled:opacity-50"
              >
                Create Ticket
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e9e9e8;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d1d0;
        }
      `}</style>
    </div>
  )
}
