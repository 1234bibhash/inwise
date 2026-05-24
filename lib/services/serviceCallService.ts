import { createClient } from '@/lib/supabase/client'

export interface ServiceCall {
  id: string
  customer_id: string
  product_id?: string | null
  service_type: 'installation' | 'repair' | 'warranty' | 'consultation'
  status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  scheduled_date?: string | null
  scheduled_end_date?: string | null
  issue_description?: string | null
  notes?: string | null
  video_call_link?: string | null
  created_at: string
  updated_at: string
  customers?: {
    contact_email?: string
    contact_phone?: string
    profile?: {
      full_name?: string
    } | null
  } | null
  warranty_schedule?: WarrantyMilestone[] | null
}

export interface WarrantyMilestone {
  id: number
  label: string
  months: number
  status: 'pending' | 'completed'
  completed_at?: string
  email_preview?: string
}

export let MOCK_SERVICE_CALLS: ServiceCall[] = []

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('inwise_mock_service_calls')
  if (saved) {
    try {
      MOCK_SERVICE_CALLS = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to restore service calls from localStorage', e)
    }
  }
}

function saveServiceCallsToLocal() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('inwise_mock_service_calls', JSON.stringify(MOCK_SERVICE_CALLS))
  }
}

function normalizeServiceCall(call: any): ServiceCall {
  return {
    id: call.id,
    customer_id: call.customer_id,
    product_id: call.product_id ?? null,
    service_type: call.service_type || 'repair',
    status: call.status || 'pending',
    scheduled_date: call.scheduled_date ?? null,
    scheduled_end_date: call.scheduled_end_date ?? null,
    issue_description: call.issue_description ?? null,
    notes: call.notes ?? null,
    video_call_link: call.video_call_link ?? null,
    created_at: call.created_at || new Date().toISOString(),
    updated_at: call.updated_at || call.created_at || new Date().toISOString(),
    customers: call.customers || null,
    warranty_schedule: call.warranty_schedule || null,
  }
}

function mergeServiceCalls(primary: ServiceCall[], fallback: ServiceCall[]) {
  const merged = new Map<string, ServiceCall>()

  for (const ticket of [...primary, ...fallback]) {
    const normalized = normalizeServiceCall(ticket)
    const createdBucket = normalized.created_at
      ? new Date(normalized.created_at).toISOString().slice(0, 16)
      : 'no-date'
    const key = normalized.service_type === 'warranty'
      ? [
          normalized.service_type,
          normalized.customer_id,
          normalized.product_id || '',
          normalized.issue_description || '',
          createdBucket,
        ].join(':')
      : normalized.id

    if (!merged.has(key)) {
      merged.set(key, normalized)
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function createServiceCall(
  customerId: string,
  serviceType: ServiceCall['service_type'],
  productId?: string,
  scheduledDate?: string,
  issueDescription?: string,
  customerDetails?: any
) {
  const supabase = createClient()
  const dedupeWindow = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const duplicateLocal = MOCK_SERVICE_CALLS.find((ticket) =>
    ticket.customer_id === customerId &&
    ticket.product_id === productId &&
    ticket.service_type === serviceType &&
    (ticket.issue_description || '') === (issueDescription || '') &&
    ticket.created_at >= dedupeWindow
  )

  if (duplicateLocal) {
    return duplicateLocal
  }

  const newTicket: ServiceCall = {
    id: Math.random().toString(36).substr(2, 9),
    customer_id: customerId,
    product_id: productId,
    service_type: serviceType,
    status: 'pending',
    scheduled_date: scheduledDate,
    issue_description: issueDescription,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    customers: customerDetails || { profile: { full_name: customerId } }
  }

  try {
    const { data: existingTicket } = await supabase
      .from('service_calls')
      .select('*')
      .eq('customer_id', customerId)
      .eq('service_type', serviceType)
      .eq('product_id', productId || null)
      .eq('issue_description', issueDescription || null)
      .gte('created_at', dedupeWindow)
      .limit(1)
      .maybeSingle()

    if (existingTicket) {
      return existingTicket
    }

    const initialSchedule = serviceType === 'warranty' ? [
      { id: 1, label: '3-Month Checkup', months: 3, status: 'pending' },
      { id: 2, label: '6-Month Service', months: 6, status: 'pending' },
      { id: 3, label: '9-Month Review', months: 9, status: 'pending' },
      { id: 4, label: '12-Month Renewal', months: 12, status: 'pending' }
    ] : null

    const { data, error } = await supabase
      .from('service_calls')
      .insert({
        customer_id: customerId,
        product_id: productId,
        service_type: serviceType,
        status: 'pending',
        scheduled_date: scheduledDate,
        issue_description: issueDescription,
        warranty_schedule: initialSchedule
      })
      .select()
      .single()

    if (error) throw error
    MOCK_SERVICE_CALLS.unshift({ ...newTicket, id: data.id })
    saveServiceCallsToLocal()
    return normalizeServiceCall({ ...newTicket, ...data })
  } catch (err) {
    console.warn('DB Service Call creation bypassed - implementing local asset commitment')
    MOCK_SERVICE_CALLS.unshift(newTicket)
    saveServiceCallsToLocal()
    return newTicket
  }
}

export async function getAllServiceCalls() {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('service_calls')
      .select('*, customers(contact_email, contact_phone, profile:profiles(full_name))')
      .order('created_at', { ascending: false })

    if (error) throw error
    return mergeServiceCalls((data || []).map(normalizeServiceCall), MOCK_SERVICE_CALLS)
  } catch (err) {
    return mergeServiceCalls([], MOCK_SERVICE_CALLS)
  }
}

export async function getServiceCalls(customerId: string) {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('service_calls')
      .select('*, products(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return mergeServiceCalls(
      (data || []).map(normalizeServiceCall),
      MOCK_SERVICE_CALLS.filter(s => s.customer_id === customerId)
    )
  } catch (err) {
    return mergeServiceCalls([], MOCK_SERVICE_CALLS.filter(s => s.customer_id === customerId))
  }
}

export async function getServiceCall(id: string) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('service_calls')
      .select('*, products(*)')
      .eq('id', id)
      .single()

    if (error) throw error
    return data ? normalizeServiceCall(data) : MOCK_SERVICE_CALLS.find(s => s.id === id)
  } catch (err) {
    return MOCK_SERVICE_CALLS.find(s => s.id === id)
  }
}

export async function updateServiceCallStatus(
  id: string,
  status: ServiceCall['status']
) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('service_calls')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    const index = MOCK_SERVICE_CALLS.findIndex(s => s.id === id)
    if (index !== -1) {
      MOCK_SERVICE_CALLS[index].status = status
      saveServiceCallsToLocal()
    }

    if (error) throw error
    return data
  } catch (err) {
    const index = MOCK_SERVICE_CALLS.findIndex(s => s.id === id)
    if (index !== -1) {
      MOCK_SERVICE_CALLS[index].status = status
      saveServiceCallsToLocal()
      return MOCK_SERVICE_CALLS[index]
    }
    return null
  }
}

export async function updateServiceCall(id: string, updates: Partial<ServiceCall>) {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('service_calls')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    const index = MOCK_SERVICE_CALLS.findIndex(s => s.id === id)
    if (index !== -1) {
      MOCK_SERVICE_CALLS[index] = { ...MOCK_SERVICE_CALLS[index], ...updates }
      saveServiceCallsToLocal()
    }

    if (error) throw error
    return data
  } catch (err) {
    const index = MOCK_SERVICE_CALLS.findIndex(s => s.id === id)
    if (index !== -1) {
      MOCK_SERVICE_CALLS[index] = { ...MOCK_SERVICE_CALLS[index], ...updates }
      saveServiceCallsToLocal()
      return MOCK_SERVICE_CALLS[index]
    }
    return null
  }
}
