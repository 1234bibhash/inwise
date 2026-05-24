import { createClient } from '@/lib/supabase/client'

export interface AuditEntry {
  id: string
  created_at: string
  action: string
  resource_type: string
  resource_id: string
  details: string
  user_id: string
  financial_year?: string
}

function getFinancialYear(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth()
  const year = date.getFullYear()
  
  if (month >= 3) { // April or later
    return `FY ${year}-${year + 1}`
  } else {
    return `FY ${year - 1}-${year}`
  }
}

export async function getAuditLogs(): Promise<AuditEntry[]> {
  const supabase = createClient()
  
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      
    if (error) {
      // If table doesn't exist, we fallback to mock data
      if (error.code === '42P01') {
        console.warn('audit_logs table does not exist. Using mock data.')
        return getMockAuditLogs()
      }
      throw error
    }
    
    return (data || []).map(log => ({
      ...log,
      financial_year: getFinancialYear(log.created_at)
    }))
  } catch (error: any) {
    console.error('Error fetching audit logs:', error)
    return getMockAuditLogs()
  }
}

function getMockAuditLogs(): AuditEntry[] {
  const now = new Date()
  
  // Create some dates for current and previous FY
  const currentFYDate1 = new Date(now)
  const currentFYDate2 = new Date(now)
  currentFYDate2.setDate(now.getDate() - 5)
  
  const prevFYDate = new Date(now)
  prevFYDate.setMonth(now.getMonth() - 14) // Guaranteed previous FY
  
  const logs: AuditEntry[] = [
    {
      id: 'mock-1',
      created_at: currentFYDate1.toISOString(),
      action: 'CREATE',
      resource_type: 'INVOICE',
      resource_id: 'INV-2026-001',
      details: 'Generated new tax invoice for ₹14,500',
      user_id: 'owner'
    },
    {
      id: 'mock-2',
      created_at: currentFYDate2.toISOString(),
      action: 'UPDATE',
      resource_type: 'PRODUCT',
      resource_id: 'PRD-8821',
      details: 'Updated base price from ₹3,500 to ₹3,772.88',
      user_id: 'owner'
    },
    {
      id: 'mock-3',
      created_at: prevFYDate.toISOString(),
      action: 'DELETE',
      resource_type: 'CUSTOMER',
      resource_id: 'CUS-9912',
      details: 'Removed duplicate customer record',
      user_id: 'admin'
    }
  ]
  
  return logs.map(log => ({
    ...log,
    financial_year: getFinancialYear(log.created_at)
  }))
}
