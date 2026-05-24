import { createClient } from '@/lib/supabase/client'

export interface CustomerRecord {
  id: string
  contact_email: string
  contact_phone: string
  preferred_contact?: string | null
  notification_enabled?: boolean
  created_at?: string
  alternate_phone?: string | null
  address_billing?: string | null
  address_delivery?: string | null
  pin_code?: string | null
  state?: string | null
  gstin?: string | null
  profile?: {
    full_name?: string
  } | null
}

const globalForCustomers = globalThis as unknown as {
  LOCAL_CUSTOMERS: CustomerRecord[]
}

let LOCAL_CUSTOMERS: CustomerRecord[] = globalForCustomers.LOCAL_CUSTOMERS || []

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('inwise_mock_customers')
  if (saved) {
    try {
      LOCAL_CUSTOMERS = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to restore customers from localStorage', e)
    }
  }

  if (LOCAL_CUSTOMERS.length === 0) {
    LOCAL_CUSTOMERS = [
      {
        id: 'demo-customer-001',
        contact_email: 'bibhash@example.com',
        contact_phone: '9876543210',
        preferred_contact: 'phone',
        notification_enabled: true,
        created_at: new Date().toISOString(),
        alternate_phone: '9876543211',
        address_billing: '12, Hooghly Street, Kolkata',
        address_delivery: '12, Hooghly Street, Kolkata',
        pin_code: '700001',
        state: 'West Bengal',
        gstin: '19AAAAA1111A1Z1',
        profile: { full_name: 'Bibhash Roy' }
      }
    ]
    localStorage.setItem('inwise_mock_customers', JSON.stringify(LOCAL_CUSTOMERS))
  }
}

globalForCustomers.LOCAL_CUSTOMERS = LOCAL_CUSTOMERS

function saveCustomersToLocal() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('inwise_mock_customers', JSON.stringify(LOCAL_CUSTOMERS))
  }
}

function normalizeCustomer(record: any): CustomerRecord {
  return {
    id: record.id,
    contact_email: record.contact_email || '',
    contact_phone: record.contact_phone || '',
    preferred_contact: record.preferred_contact || null,
    notification_enabled: record.notification_enabled ?? true,
    created_at: record.created_at,
    alternate_phone: record.alternate_phone || null,
    address_billing: record.address_billing || null,
    address_delivery: record.address_delivery || null,
    pin_code: record.pin_code || null,
    state: record.state || null,
    gstin: record.gstin || null,
    profile: record.profile || { full_name: record.full_name || '' },
  }
}

function mergeCustomers(primary: CustomerRecord[], fallback: CustomerRecord[]) {
  const merged = new Map<string, CustomerRecord>()

  for (const customer of [...primary, ...fallback]) {
    const normalized = normalizeCustomer(customer)
    if (!merged.has(normalized.id)) {
      merged.set(normalized.id, normalized)
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) =>
      new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )
}

export async function getCustomers() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*, profile:profiles(full_name)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return mergeCustomers((data || []).map(normalizeCustomer), LOCAL_CUSTOMERS)
  } catch (error) {
    return mergeCustomers([], LOCAL_CUSTOMERS)
  }
}

export async function upsertCustomerFromInvoice(input: {
  fullName: string
  phone?: string
  email?: string
  alternate_phone?: string
  address_billing?: string
  address_delivery?: string
  pin_code?: string
  state?: string
  gstin?: string
}) {
  const fullName = input.fullName.trim()
  const phone = input.phone?.trim() || ''
  const email = input.email?.trim() || ''
  const alternate_phone = input.alternate_phone?.trim() || ''
  const address_billing = input.address_billing?.trim() || ''
  const address_delivery = input.address_delivery?.trim() || ''
  const pin_code = input.pin_code?.trim() || ''
  const state = input.state?.trim() || ''
  const gstin = input.gstin?.trim() || ''

  if (!fullName && !phone && !email) {
    return null
  }

  const supabase = createClient()

  try {
    let existingCustomer: any = null

    if (phone) {
      const { data } = await supabase
        .from('customers')
        .select('*, profile:profiles(full_name)')
        .eq('contact_phone', phone)
        .maybeSingle()

      existingCustomer = data
    }

    if (!existingCustomer && email) {
      const { data } = await supabase
        .from('customers')
        .select('*, profile:profiles(full_name)')
        .eq('contact_email', email)
        .maybeSingle()

      existingCustomer = data
    }

    if (existingCustomer) {
      const nextCustomer = {
        contact_email: email || existingCustomer.contact_email || '',
        contact_phone: phone || existingCustomer.contact_phone || '',
        alternate_phone: alternate_phone || existingCustomer.alternate_phone || null,
        address_billing: address_billing || existingCustomer.address_billing || null,
        address_delivery: address_delivery || existingCustomer.address_delivery || null,
        pin_code: pin_code || existingCustomer.pin_code || null,
        state: state || existingCustomer.state || null,
        gstin: gstin || existingCustomer.gstin || null,
      }

      await supabase
        .from('customers')
        .update(nextCustomer)
        .eq('id', existingCustomer.id)

      if (fullName) {
        await supabase
          .from('profiles')
          .upsert({ id: existingCustomer.id, full_name: fullName })
      }

      const normalized = normalizeCustomer({
        ...existingCustomer,
        ...nextCustomer,
        profile: { full_name: fullName || existingCustomer.profile?.full_name || '' },
      })

      const localIndex = LOCAL_CUSTOMERS.findIndex((customer) => customer.id === normalized.id)
      if (localIndex === -1) {
        LOCAL_CUSTOMERS.unshift(normalized)
      } else {
        LOCAL_CUSTOMERS[localIndex] = normalized
      }
      saveCustomersToLocal()

      return normalized
    }

    const { data: insertedCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        contact_email: email,
        contact_phone: phone,
        preferred_contact: phone ? 'phone' : 'email',
        notification_enabled: true,
        alternate_phone: alternate_phone || null,
        address_billing: address_billing || null,
        address_delivery: address_delivery || null,
        pin_code: pin_code || null,
        state: state || null,
        gstin: gstin || null,
      })
      .select()
      .single()

    if (insertError) throw insertError

    if (fullName) {
      await supabase
        .from('profiles')
        .upsert({ id: insertedCustomer.id, full_name: fullName })
    }

    const normalized = normalizeCustomer({
      ...insertedCustomer,
      profile: { full_name: fullName },
    })

    LOCAL_CUSTOMERS.unshift(normalized)
    saveCustomersToLocal()
    return normalized
  } catch (error) {
    const existingLocal = LOCAL_CUSTOMERS.find((customer) => {
      const matchesPhone = phone && customer.contact_phone === phone
      const matchesEmail = email && customer.contact_email === email
      return matchesPhone || matchesEmail
    })

    if (existingLocal) {
      existingLocal.contact_phone = phone || existingLocal.contact_phone
      existingLocal.contact_email = email || existingLocal.contact_email
      existingLocal.alternate_phone = alternate_phone || existingLocal.alternate_phone
      existingLocal.address_billing = address_billing || existingLocal.address_billing
      existingLocal.address_delivery = address_delivery || existingLocal.address_delivery
      existingLocal.pin_code = pin_code || existingLocal.pin_code
      existingLocal.state = state || existingLocal.state
      existingLocal.gstin = gstin || existingLocal.gstin
      existingLocal.profile = { full_name: fullName || existingLocal.profile?.full_name || '' }
      saveCustomersToLocal()
      return existingLocal
    }

    const fallbackCustomer = normalizeCustomer({
      id: `local-customer-${Math.random().toString(36).slice(2, 9)}`,
      contact_email: email,
      contact_phone: phone,
      alternate_phone: alternate_phone || null,
      address_billing: address_billing || null,
      address_delivery: address_delivery || null,
      pin_code: pin_code || null,
      state: state || null,
      gstin: gstin || null,
      created_at: new Date().toISOString(),
      profile: { full_name: fullName },
    })

    LOCAL_CUSTOMERS.unshift(fallbackCustomer)
    saveCustomersToLocal()
    return fallbackCustomer
  }
}
