import { createClient } from '@/lib/supabase/client'
import { triggerInvoiceReminder } from './voiceService'

export interface InvoiceItem {
  product_id?: string
  name: string
  sku?: string
  brand?: string
  model_number?: string
  variant?: string
  color?: string
  serial_number?: string
  quantity: number
  unit?: string
  base_price: number
  discount_type?: 'percent' | 'fixed'
  discount_value?: number
  gst_rate: number
  final_amount: number
  tax_rate?: number // legacy fallback
  tax_amount?: number // legacy fallback
  price?: number // legacy fallback
  total?: number // legacy fallback
}

export interface Invoice {
  id: string
  invoice_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  status: 'paid' | 'pending' | 'overdue'
  total_amount: number
  items: InvoiceItem[]
  created_at: string
  tax_split?: {
    cgst: number
    sgst: number
    igst: number
  }
  payment_info?: {
    mode: string
    finance_provider?: string
    partial_payment: boolean
    paid_amount: number
    pending_amount: number
    ref_id?: string
    dp_amount?: number
    emi_amount?: number
    emi_months?: number
    cheque_start_date?: string
    cheque_end_date?: string
  }
  delivery_info?: {
    delivery_date?: string
    status: 'pending' | 'dispatched' | 'delivered'
    dispatch_through?: string
    vehicle_number?: string
    delivery_person?: string
  }
  installation_info?: {
    required: boolean
    date?: string
    status?: 'pending' | 'completed'
    service_category?: string
    assigned_technician_id?: string
  }
}

const globalForInvoices = globalThis as unknown as {
  MOCK_INVOICES: Invoice[]
}

let MOCK_INVOICES: Invoice[] = globalForInvoices.MOCK_INVOICES || []

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('inwise_mock_invoices')
  if (saved) {
    try {
      MOCK_INVOICES = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to restore invoices from localStorage', e)
    }
  }
}

globalForInvoices.MOCK_INVOICES = MOCK_INVOICES

function saveInvoicesToLocal() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('inwise_mock_invoices', JSON.stringify(MOCK_INVOICES))
  }
}

function normalizeInvoice(invoice: any): Invoice {
  return {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    customer_name: invoice.customer_name || 'Unknown customer',
    customer_phone: invoice.customer_phone || '',
    customer_email: invoice.customer_email || '',
    status: invoice.status || 'paid',
    total_amount: Number(invoice.total_amount || 0),
    items: Array.isArray(invoice.items) ? invoice.items.map((item: any) => ({
      product_id: item.product_id,
      name: item.name,
      sku: item.sku || '',
      brand: item.brand || '',
      model_number: item.model_number || '',
      variant: item.variant || '',
      color: item.color || '',
      serial_number: item.serial_number || '',
      quantity: Number(item.quantity || 1),
      unit: item.unit || 'pcs',
      base_price: Number(item.base_price || item.price || 0),
      discount_type: item.discount_type || 'percent',
      discount_value: Number(item.discount_value || item.discount || 0),
      gst_rate: Number(item.gst_rate || item.tax_rate || 18),
      final_amount: Number(item.final_amount || item.total || 0),
      // Fallbacks
      price: Number(item.price || item.base_price || 0),
      total: Number(item.total || item.final_amount || 0),
      tax_rate: Number(item.tax_rate || item.gst_rate || 18),
      tax_amount: Number(item.tax_amount || 0),
    })) : [],
    created_at: invoice.created_at || new Date().toISOString(),
    tax_split: invoice.tax_split || { cgst: 0, sgst: 0, igst: 0 },
    payment_info: invoice.payment_info || {
      mode: 'cash',
      finance_provider: '',
      partial_payment: false,
      paid_amount: Number(invoice.total_amount || 0),
      pending_amount: 0,
      ref_id: '',
      dp_amount: 0,
      emi_amount: 0,
      emi_months: 0,
    },
    delivery_info: invoice.delivery_info || {
      status: 'pending',
    },
    installation_info: invoice.installation_info || {
      required: false,
      status: 'pending',
    },
  }
}

function mergeInvoices(primary: Invoice[], fallback: Invoice[]) {
  const merged = new Map<string, Invoice>()

  for (const invoice of [...primary, ...fallback]) {
    const normalized = normalizeInvoice(invoice)
    const key = normalized.id || normalized.invoice_number
    if (!merged.has(key)) {
      merged.set(key, normalized)
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

export async function getInvoices() {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('BillingTerminal: Operating in Local Ledger mode (Cloud Sync Bypassed)')
      return mergeInvoices([], MOCK_INVOICES)
    }
    
    return mergeInvoices((data || []).map(normalizeInvoice), MOCK_INVOICES)
  } catch (err) {
    return mergeInvoices([], MOCK_INVOICES)
  }
}

export async function createInvoice(invoiceData: Omit<Invoice, 'id' | 'created_at'>) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single()

    if (error) {
      console.warn('Supabase invoice sync blocked, implementing local ledger fallback:', error)
      const mockInvoice = {
        ...invoiceData,
        id: `inv-${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString()
      } as Invoice
      MOCK_INVOICES.unshift(mockInvoice)
      saveInvoicesToLocal()
      triggerInvoiceReminder(mockInvoice.id)
      return mockInvoice
    }
    const normalized = normalizeInvoice(data)
    MOCK_INVOICES.unshift(normalized)
    saveInvoicesToLocal()
    triggerInvoiceReminder(normalized.id)
    return normalized
  } catch (err) {
    console.error('Data pipeline failed during invoice settlement, anchoring to local ledger:', err)
    const mockInvoice = {
      ...invoiceData,
      id: `inv-${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    } as Invoice
    MOCK_INVOICES.unshift(mockInvoice)
    saveInvoicesToLocal()
    triggerInvoiceReminder(mockInvoice.id)
    return mockInvoice
  }
}

export async function deleteInvoice(id: string) {
  const supabase = createClient()
  try {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
  } catch (err) {
    console.warn('Supabase invoice delete blocked, removing from local ledger fallback:', err)
  }

  const index = MOCK_INVOICES.findIndex(i => i.id === id)
  if (index !== -1) {
    MOCK_INVOICES.splice(index, 1)
    saveInvoicesToLocal()
  }
  return true
}

export async function updateInvoice(id: string, invoiceData: Partial<Invoice>) {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update(invoiceData)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      const normalized = normalizeInvoice(data)
      const index = MOCK_INVOICES.findIndex(i => i.id === id)
      if (index !== -1) {
        MOCK_INVOICES[index] = { ...MOCK_INVOICES[index], ...normalized }
      }
      saveInvoicesToLocal()
      return MOCK_INVOICES[index]
    }
  } catch (err) {
    console.warn('Supabase invoice update failed:', err)
  }

  // Local fallback
  const index = MOCK_INVOICES.findIndex(i => i.id === id)
  if (index !== -1) {
    MOCK_INVOICES[index] = { ...MOCK_INVOICES[index], ...invoiceData }
    saveInvoicesToLocal()
    return MOCK_INVOICES[index]
  }
  return null
}
