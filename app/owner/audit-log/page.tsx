'use client'

import { useEffect, useState } from 'react'
import { AuditEntry, getAuditLogs } from '@/lib/services/auditService'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Download, 
  History, 
  Search, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFY, setSelectedFY] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [availableFYs, setAvailableFYs] = useState<string[]>([])

  useEffect(() => {
    loadLogs()
  }, [])

  async function loadLogs() {
    setIsLoading(true)
    try {
      const data = await getAuditLogs()
      setLogs(data)
      
      // Extract unique financial years
      const uniqueFYs = Array.from(new Set(data.map(log => log.financial_year || 'Unknown'))).sort().reverse()
      setAvailableFYs(uniqueFYs)
      
      if (uniqueFYs.length > 0 && selectedFY === 'all') {
        setSelectedFY(uniqueFYs[0])
      }
    } catch (err) {
      toast.error('Failed to load audit logs')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchFY = selectedFY === 'all' || log.financial_year === selectedFY
    const matchSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource_id.toLowerCase().includes(searchQuery.toLowerCase())
      
    return matchFY && matchSearch
  })

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      toast.error('No data to export')
      return
    }

    const headers = ['Timestamp', 'Financial Year', 'Action', 'Resource Type', 'Resource ID', 'Details', 'User ID']
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        `"${new Date(log.created_at).toLocaleString()}"`,
        `"${log.financial_year}"`,
        `"${log.action}"`,
        `"${log.resource_type}"`,
        `"${log.resource_id}"`,
        `"${log.details.replace(/"/g, '""')}"`,
        `"${log.user_id}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Audit_Log_${selectedFY.replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Audit log exported successfully')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcfcfb] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfcfb] font-sans">
      <header className="h-16 bg-white border-b border-[#f1f1f0] flex items-center justify-between px-8 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
            <ShieldAlert className="h-4 w-4 text-blue-600" />
          </div>
          <h1 className="text-lg font-black text-[#37352f] tracking-tight">Enterprise Audit Trail</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleExportCSV}
            variant="outline" 
            className="h-9 px-4 rounded-xl border-[#e9e9e8] text-[11px] font-black uppercase tracking-widest hover:bg-[#f7f7f5]"
          >
            <Download className="h-3.5 w-3.5 mr-2" /> Export CSV
          </Button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto py-8 px-8 space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#e9e9e8] shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search audit trail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl border-[#e9e9e8] bg-[#f7f7f5] focus-visible:ring-blue-100 font-medium"
              />
            </div>
            
            <Select value={selectedFY} onValueChange={setSelectedFY}>
              <SelectTrigger className="w-[180px] h-10 rounded-xl border-[#e9e9e8] font-bold text-[12px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-[#e9e9e8]">
                <SelectItem value="all" className="font-bold text-[12px]">All Years</SelectItem>
                {availableFYs.map(fy => (
                  <SelectItem key={fy} value={fy} className="font-bold text-[12px]">{fy}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-[11px] font-bold text-[#acaba9] uppercase tracking-widest">
            {filteredLogs.length} Records Found
          </div>
        </div>

        <div className="bg-white border border-[#e9e9e8] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f1f1f0] bg-[#fdfdfc]">
                <th className="p-4 text-[10px] font-black text-[#acaba9] uppercase tracking-widest w-40">Timestamp</th>
                <th className="p-4 text-[10px] font-black text-[#acaba9] uppercase tracking-widest w-32">Action</th>
                <th className="p-4 text-[10px] font-black text-[#acaba9] uppercase tracking-widest w-32">Resource</th>
                <th className="p-4 text-[10px] font-black text-[#acaba9] uppercase tracking-widest w-40">Identifier</th>
                <th className="p-4 text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Detailed Context</th>
                <th className="p-4 text-[10px] font-black text-[#acaba9] uppercase tracking-widest w-32">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f1f0]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#acaba9] text-sm font-medium">
                    No audit records match your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#fcfcfb] transition-colors">
                    <td className="p-4 align-top">
                      <div className="text-[12px] font-bold text-[#37352f]">{new Date(log.created_at).toLocaleDateString()}</div>
                      <div className="text-[10px] font-medium text-[#acaba9] mt-0.5">{new Date(log.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-4 align-top">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        log.action === 'CREATE' ? 'bg-green-50 text-green-700' :
                        log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700' :
                        log.action === 'DELETE' ? 'bg-red-50 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-[11px] font-bold text-[#787774]">{log.resource_type}</div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-[12px] font-mono font-bold text-[#37352f] bg-[#f7f7f5] px-2 py-0.5 rounded-md w-fit">
                        {log.resource_id}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="text-[12px] font-medium text-[#37352f] leading-relaxed">
                        {log.details}
                      </div>
                    </td>
                    <td className="p-4 align-top">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-[8px] font-black text-orange-700 uppercase">{log.user_id.charAt(0)}</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#37352f]">{log.user_id}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
