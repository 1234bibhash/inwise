'use client'

import { useEffect, useState } from 'react'
import { getInvoices, Invoice } from '@/lib/services/invoiceService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function ChildInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const allInvoices = await getInvoices()
        const childInvoices = allInvoices.filter(inv => (inv as any).is_receipt_invoice === true)
        setInvoices(childInvoices.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      } catch (e) {
        console.error(e)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  if (isLoading) {
    return <div className="p-8 text-gray-500 font-medium">Loading child invoices...</div>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-[#37352f]">Child Invoices</h1>
          <p className="text-gray-500 font-medium mt-2">Hidden developer view of all receipt (child) invoices.</p>
        </div>
      </div>

      <div className="bg-white border border-[#ededeb] rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px] font-medium">
          <thead className="bg-[#f7f7f5] text-[#acaba9] text-[10px] uppercase tracking-widest font-bold border-b border-[#ededeb]">
            <tr>
              <th className="px-6 py-4 border-r border-[#ededeb]">Invoice #</th>
              <th className="px-6 py-4 border-r border-[#ededeb]">Date</th>
              <th className="px-6 py-4 border-r border-[#ededeb]">Customer</th>
              <th className="px-6 py-4 border-r border-[#ededeb]">Payment Mode</th>
              <th className="px-6 py-4 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-medium">
                  No child invoices found
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-[#ededeb] hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 border-r border-[#ededeb] font-bold text-[#37352f]">
                    {inv.invoice_number}
                  </td>
                  <td className="px-6 py-4 border-r border-[#ededeb] text-gray-500">
                    {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 border-r border-[#ededeb]">
                    <div className="font-bold text-[#37352f]">{inv.customer_name}</div>
                    {inv.customer_phone && <div className="text-[11px] text-gray-400">{inv.customer_phone}</div>}
                  </td>
                  <td className="px-6 py-4 border-r border-[#ededeb]">
                    <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-[#fdfdfc]">
                      {inv.payment_info?.mode || 'Unknown'}
                      {inv.payment_info?.mode === 'finance' && inv.payment_info.finance_provider && ` - ${inv.payment_info.finance_provider}`}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-[#37352f]">
                    {inv.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
