import { createClient } from '@/lib/supabase/client'

export interface Warranty {
  id: string
  invoice_number: string
  product_id: string
  product_name: string
  customer_name: string
  purchase_date: string
  expiry_date: string
  status: 'active' | 'expired' | 'void'
}

const MOCK_WARRANTIES: Warranty[] = []

function normalizeWarranty(warranty: any): Warranty {
  return {
    id: warranty.id,
    invoice_number: warranty.invoice_number,
    product_id: warranty.product_id,
    product_name: warranty.product_name,
    customer_name: warranty.customer_name,
    purchase_date: warranty.purchase_date,
    expiry_date: warranty.expiry_date,
    status: warranty.status || 'active',
  }
}

function mergeWarranties(primary: Warranty[], fallback: Warranty[]) {
  const merged = new Map<string, Warranty>()

  for (const warranty of [...primary, ...fallback]) {
    const normalized = normalizeWarranty(warranty)
    const key = `${normalized.invoice_number}-${normalized.product_id}`
    if (!merged.has(key)) {
      merged.set(key, normalized)
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.purchase_date).getTime() - new Date(a.purchase_date).getTime()
  )
}

export async function createWarranty(warrantyData: Omit<Warranty, 'id' | 'status'>) {
  const supabase = createClient()
  const duplicateLocal = MOCK_WARRANTIES.find((warranty) =>
    warranty.invoice_number === warrantyData.invoice_number &&
    warranty.product_id === warrantyData.product_id
  )

  if (duplicateLocal) {
    return duplicateLocal
  }
  
  const newWarranty: Warranty = {
    ...warrantyData,
    id: Math.random().toString(36).substr(2, 9),
    status: 'active'
  }

  try {
    const { data: existingWarranty } = await supabase
      .from('warranties')
      .select('*')
      .eq('invoice_number', warrantyData.invoice_number)
      .eq('product_id', warrantyData.product_id)
      .limit(1)
      .maybeSingle()

    if (existingWarranty) {
      return existingWarranty
    }

    const { data, error } = await supabase
      .from('warranties')
      .insert([newWarranty])
      .select()
      .single()

    if (error) throw error
    MOCK_WARRANTIES.unshift({ ...newWarranty, id: data.id })
    return normalizeWarranty(data)
  } catch (err) {
    console.warn('DB Warranty creation bypassed - implementing local asset commitment')
    MOCK_WARRANTIES.unshift(newWarranty)
    return newWarranty
  }
}

export async function getWarranties() {
  const supabase = createClient()
  try {
    const { data, error } = await supabase
      .from('warranties')
      .select('*')
      .order('purchase_date', { ascending: false })
    
    if (error) throw error
    return mergeWarranties((data || []).map(normalizeWarranty), MOCK_WARRANTIES)
  } catch (err) {
    return mergeWarranties([], MOCK_WARRANTIES)
  }
}
