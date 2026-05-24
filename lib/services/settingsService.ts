import { createClient } from '@/lib/supabase/client'

export interface BusinessSettings {
  id?: string
  name: string
  gst_number?: string
  pan_number?: string
  phone_primary: string
  phone_secondary?: string
  email: string
  address_regd: string
  address_work: string
  bank_name: string
  account_number: string
  ifsc_code: string
  upi_id: string
  logo_url?: string
  brand_color?: string
  signature_url?: string
  bank_accounts?: { bank_name: string; account_number: string; ifsc_code: string }[]
  upi_ids?: string[]
}

const DEFAULT_SETTINGS: BusinessSettings = {
  name: '',
  gst_number: '',
  pan_number: '',
  phone_primary: '',
  phone_secondary: '',
  email: '',
  address_regd: '',
  address_work: '',
  bank_name: '',
  account_number: '',
  ifsc_code: '',
  upi_id: '',
  logo_url: '',
  brand_color: '#3b82f6',
  signature_url: '',
  bank_accounts: [],
  upi_ids: []
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const supabase = createClient()
  
  const migrateLegacy = (d: BusinessSettings) => {
    if (!d.bank_accounts) d.bank_accounts = []
    if (d.bank_accounts.length === 0 && d.bank_name) {
      d.bank_accounts.push({ bank_name: d.bank_name, account_number: d.account_number || '', ifsc_code: d.ifsc_code || '' })
    }
    
    if (!d.upi_ids) d.upi_ids = []
    if (d.upi_ids.length === 0 && d.upi_id) {
      d.upi_ids.push(d.upi_id)
    }
    return d
  }
  
  try {
    const { data, error } = await supabase
      .from('business_settings')
      .select('*')
      .single()

    if (error) {
      console.warn('Error fetching settings, using defaults:', error.message)
      const local = typeof window !== 'undefined' ? localStorage.getItem('business_settings') : null
      return migrateLegacy(local ? JSON.parse(local) : DEFAULT_SETTINGS)
    }

    return migrateLegacy(data)
  } catch (err) {
    const local = typeof window !== 'undefined' ? localStorage.getItem('business_settings') : null
    return migrateLegacy(local ? JSON.parse(local) : DEFAULT_SETTINGS)
  }
}

export async function updateBusinessSettings(settings: BusinessSettings): Promise<void> {
  const supabase = createClient()
  
  // Update local storage first for immediate UI feedback
  if (typeof window !== 'undefined') {
    localStorage.setItem('business_settings', JSON.stringify(settings))
  }

  try {
    const { error } = await supabase
      .from('business_settings')
      .upsert({ ...settings, updated_at: new Date().toISOString() })

    if (error) throw error
  } catch (err) {
    console.error('Failed to sync settings to cloud, saved locally:', err)
  }
}
