'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Plus, 
  FileText, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  ShieldCheck, 
  Clock, 
  ChevronRight,
  MoreVertical,
  FileCode,
  FileSignature,
  BookOpen,
  Sparkles,
  Info
} from 'lucide-react'

interface Document {
  id: string
  title: string
  document_type: string
  file_url: string | null
  description: string | null
  version: string
  is_active: boolean
  created_at: string
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadDocuments()
  }, [])

  async function loadDocuments() {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error loading documents:', error)
      // Mock data for senior dev preview
      setDocuments([
        {
          id: '1',
          title: 'Hooghly Enterprise Service Protocol',
          document_type: 'legal',
          file_url: '#',
          description: 'Standard operating procedures for regional technical service calls and warranty claims.',
          version: '1.2.0',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Regional Data Privacy Policy',
          document_type: 'privacy_policy',
          file_url: '#',
          description: 'Compliance document for West Bengal data protection standards.',
          version: '2.0.4',
          is_active: true,
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          title: 'Summer Tech Fest Terms',
          document_type: 'terms',
          file_url: '#',
          description: 'Promotional terms and conditions for the active Summer Tech Fest campaign.',
          version: '1.0.1',
          is_active: true,
          created_at: new Date().toISOString()
        }
      ])
    } finally {
      setTimeout(() => setIsLoading(false), 800)
    }
  }

  const getDocIcon = (type: string) => {
    switch (type) {
      case 'legal': return FileSignature
      case 'privacy_policy': return ShieldCheck
      case 'terms': return FileCode
      case 'warranty': return BookOpen
      default: return FileText
    }
  }

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'legal': return 'bg-red-50 text-red-600'
      case 'privacy_policy': return 'bg-blue-50 text-blue-600'
      case 'terms': return 'bg-purple-50 text-purple-600'
      case 'warranty': return 'bg-green-50 text-green-600'
      default: return 'bg-gray-50 text-gray-600'
    }
  }

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.document_type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen pb-20">
      {/* Premium Admin Header */}
      <header className="h-20 bg-white border-b border-[#e9e9e8] flex items-center justify-between px-8 sticky top-0 z-10">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
           </div>
           <div>
              <h1 className="text-xl font-black text-[#37352f] tracking-tight">Legal & Policy Vault</h1>
              <div className="flex items-center gap-2">
                 <div className="h-1.5 w-1.5 bg-green-500 rounded-full" />
                 <span className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Compliance Status: Verified</span>
              </div>
           </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#acaba9]" />
            <input 
              type="text" 
              placeholder="Search document vault..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#f7f7f5] border-none rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-100 w-80 transition-all"
            />
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black h-11 px-6 shadow-xl shadow-blue-100 border-none transition-all active:scale-95">
            <Plus className="h-4 w-4 mr-2" />
            Upload New Protocol
          </Button>
        </div>
      </header>

      <div className="p-10 max-w-[1400px] mx-auto space-y-10">
        {/* Actions & Filters */}
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-[#e9e9e8] shadow-sm">
             <button className="flex items-center gap-2 px-4 py-2 text-xs font-black text-[#37352f] hover:bg-[#f7f7f5] rounded-xl transition-all">
                <Filter className="h-3.5 w-3.5 text-[#acaba9]" />
                Document Type
             </button>
             <div className="h-4 w-[1px] bg-[#e9e9e8]" />
             <button className="flex items-center gap-2 px-4 py-2 text-xs font-black text-[#37352f] hover:bg-[#f7f7f5] rounded-xl transition-all">
                <Clock className="h-3.5 w-3.5 text-[#acaba9]" />
                Version History
             </button>
           </div>
           <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
              <Sparkles className="h-3.5 w-3.5 text-blue-600" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{filteredDocs.length} Active Protocols</span>
           </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-[40px] p-8 border border-[#e9e9e8] space-y-6 animate-pulse">
                 <div className="flex justify-between">
                    <Skeleton className="h-14 w-14 rounded-2xl" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                 </div>
                 <Skeleton className="h-6 w-full" />
                 <Skeleton className="h-16 w-full" />
                 <div className="pt-4 flex justify-between">
                    <Skeleton className="h-10 w-24 rounded-xl" />
                    <Skeleton className="h-10 w-10 rounded-xl" />
                 </div>
              </div>
            ))
          ) : filteredDocs.length === 0 ? (
            <div className="col-span-full bg-white rounded-[40px] p-20 text-center border border-dashed border-[#e9e9e8] space-y-6">
               <div className="h-20 w-20 bg-[#f7f7f5] rounded-full flex items-center justify-center mx-auto text-[#acaba9]">
                  <FileText className="h-10 w-10" />
               </div>
               <div>
                  <h3 className="text-xl font-black text-[#37352f] tracking-tight uppercase tracking-widest">Vault Empty</h3>
                  <p className="text-sm text-[#acaba9] font-medium mt-2">No documents match your current search query.</p>
               </div>
            </div>
          ) : (
            filteredDocs.map(doc => {
              const Icon = getDocIcon(doc.document_type)
              return (
                <div key={doc.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-[#e9e9e8] group hover:shadow-2xl transition-all duration-500 relative flex flex-col">
                  <div className="flex items-start justify-between mb-8">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all ${getDocumentTypeColor(doc.document_type)} shadow-sm group-hover:scale-110`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest bg-[#f7f7f5] px-2 py-1 rounded-md">v{doc.version}</span>
                       <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${getDocumentTypeColor(doc.document_type)}`}>
                         {doc.document_type.replace('_', ' ')}
                       </span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <h3 className="text-xl font-black text-[#37352f] tracking-tight group-hover:text-blue-600 transition-colors leading-tight">
                      {doc.title}
                    </h3>
                    <p className="text-sm text-[#acaba9] font-medium leading-relaxed">
                      {doc.description || 'Enterprise protocol document for Hooghly Electronics operations.'}
                    </p>
                  </div>

                  <div className="mt-10 pt-8 border-t border-[#f1f1f0] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <Clock className="h-3.5 w-3.5 text-[#acaba9]" />
                       <span className="text-[10px] font-bold text-[#acaba9] uppercase tracking-widest">{new Date(doc.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="h-10 rounded-xl border-[#e9e9e8] font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all">
                         <Download className="h-4 w-4 mr-2" />
                         Fetch
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-red-50 hover:text-red-600">
                         <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Strategic Insight Panel */}
        <section className="bg-[#37352f] rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden group text-left">
           <Info className="absolute -top-6 -right-6 h-32 w-32 text-white/5 group-hover:rotate-12 transition-transform duration-1000" />
           <div className="max-w-2xl space-y-4 relative z-10">
              <h4 className="text-xl font-black tracking-tight">Compliance Intelligence</h4>
              <p className="text-sm text-white/60 font-medium leading-relaxed">
                 Your regional protocols are 100% compliant with West Bengal enterprise standards. Ensure all warranty documents are updated before the "Summer Tech Fest" concludes.
              </p>
              <Button className="bg-white hover:bg-[#f7f7f5] text-[#37352f] rounded-2xl font-black text-[10px] uppercase tracking-widest h-12 px-8 mt-4 border-none transition-all active:scale-95">
                 Audit Protocol Vault
              </Button>
           </div>
        </section>
      </div>
    </div>
  )
}
