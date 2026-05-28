'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Bell,
  Box,
  Home,
  Scan,
  History,
  User,
  X,
  UploadCloud,
  Camera,
  AlertCircle,
  Settings,
  ArrowLeft,
  LayoutDashboard,
  Users2,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createInvoice } from '@/lib/services/invoiceService'

interface MobileShellProps {
  children: React.ReactNode
}

export default function MobileOwnerShell({ children }: MobileShellProps) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { isLoaded } = useUser()
  const pathname = usePathname()

  // Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Business Profile State
  const [businessName, setBusinessName] = useState('My Shop Name')
  const [businessLogo, setBusinessLogo] = useState<string | null>(null)

  useEffect(() => {
    const loadSettings = async () => {
      const { getBusinessSettings } = await import('@/lib/services/settingsService')
      const settings = await getBusinessSettings()
      if (settings.name) setBusinessName(settings.name)
      if (settings.logo_url) setBusinessLogo(settings.logo_url)
    }
    loadSettings()
    
    const handleUpdate = () => loadSettings()
    window.addEventListener('settingsUpdated', handleUpdate)
    return () => window.removeEventListener('settingsUpdated', handleUpdate)
  }, [])

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/auth/login')
    }
  }, [isLoaded, isSignedIn, router])

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a24] text-white">
        <p className="text-sm font-semibold tracking-wide">Loading Secure App...</p>
      </div>
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsExtracting(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1]

        const response = await fetch('/api/extract-bill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64String,
            fileType: file.type
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to extract bill')
        }

        const result = await response.json()
        
        // Push the result to the database as an invoice/purchase
        await createInvoice({
           customer_name: result.supplier_name || 'Unknown Supplier',
           date: result.invoice_date || new Date().toISOString(),
           items: result.products.map((p: any) => ({
             description: p.name,
             quantity: p.quantity || 1,
             rate: p.price || 0,
             tax_percent: p.tax_percentage || 0,
             amount: (p.price || 0) * (p.quantity || 1)
           })),
           total_amount: result.grand_total || 0,
           cgst_amount: result.cgst_amount || 0,
           sgst_amount: result.sgst_amount || 0,
           is_receipt_invoice: true // It's a purchase/receipt
        })

        toast.success('Bill Scanned & Imported Successfully!')
        setIsScannerOpen(false)
        
        // Navigate to accounts/billing to see it
        router.push('/mobile/owner/accounts')
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error scanning bill. Try again.')
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] font-sans text-gray-900 overflow-hidden relative">
      
      {/* Mobile Top Header */}
      {pathname !== '/mobile/owner/settings' && (
        <header className="bg-white border-b border-[#e9e9e8] p-4 flex items-center justify-between shadow-sm z-10 shrink-0 mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4CB963]/10 text-[#4CB963] rounded-xl flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
              {businessLogo ? (
                <img src={businessLogo} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                businessName ? businessName.charAt(0).toUpperCase() : 'B'
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest truncate">Business Account</p>
              <h1 className="text-sm font-bold text-[#37352f] leading-tight truncate">{businessName}</h1>
            </div>
          </div>
          <div className="flex gap-4 items-center shrink-0">
             <Bell className="w-5 h-5 text-gray-400" />
             <Link href="/mobile/owner/settings" className="p-1.5 bg-gray-50 hover:bg-gray-100 rounded-full">
               <Settings className="w-5 h-5 text-gray-600" />
             </Link>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      {/* Minimal Lime Green Mobile Bottom Navigation */}
      {pathname !== '/mobile/owner/settings' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 flex justify-between items-center px-4 py-2 pb-safe z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
          <Link href="/owner/dashboard" className={`flex flex-col items-center gap-1 w-16 ${pathname === '/owner/dashboard' || pathname === '/mobile/owner/dashboard' ? 'text-[#4CB963]' : 'text-gray-400'}`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          
          <Link href="/mobile/owner/accounts" className={`flex flex-col items-center gap-1 w-16 ${pathname === '/mobile/owner/accounts' ? 'text-[#4CB963]' : 'text-gray-400'}`}>
            <Users2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Accounts</span>
          </Link>

          {/* Prominent Scanner Button (Lime Green) */}
          <div className="relative -top-6 flex justify-center w-16">
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="w-14 h-14 bg-[#4CB963] text-white rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(76,185,99,0.4)] border-4 border-white transition-transform active:scale-95"
            >
              <Scan className="w-6 h-6" />
            </button>
            <span className="absolute -bottom-5 text-[10px] font-semibold text-gray-500 whitespace-nowrap">Scan</span>
          </div>

          <Link href="/mobile/owner/billing" className={`flex flex-col items-center gap-1 w-16 ${pathname === '/mobile/owner/billing' ? 'text-[#4CB963]' : 'text-gray-400'}`}>
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Billing</span>
          </Link>
          
          <Link href="/mobile/owner/products" className={`flex flex-col items-center gap-1 w-16 ${pathname === '/mobile/owner/products' ? 'text-[#4CB963]' : 'text-gray-400'}`}>
            <Box className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Stock</span>
          </Link>
        </nav>
      )}

      {/* Universal Scanner Modal */}
      <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
        <DialogContent className="sm:max-w-sm bg-white text-gray-900 rounded-3xl w-[90vw] border-none shadow-2xl [&>button]:hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-gray-900">Smart Bill Scanner</DialogTitle>
            <DialogDescription className="text-gray-500 text-center text-xs px-2">
              Scan a purchase bill or supplier invoice. Our AI will extract all items, taxes, and totals automatically.
            </DialogDescription>
          </DialogHeader>

          {isExtracting ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
               <div className="w-12 h-12 border-4 border-[#4CB963] border-t-transparent rounded-full animate-spin"></div>
               <p className="font-semibold text-lg text-gray-800">AI is reading the bill...</p>
               <p className="text-sm text-gray-500 text-center px-4">Extracting line items, HS codes, and taxes. This usually takes 10-20 seconds.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 py-6">
              {/* Hidden Inputs */}
              <input 
                type="file" 
                accept="image/*;capture=camera" 
                className="hidden" 
                ref={cameraInputRef}
                onChange={handleFileUpload} 
              />
              <input 
                type="file" 
                accept="image/*,application/pdf" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload} 
              />

              <button 
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-50 p-4 rounded-[24px] border-2 border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all active:scale-95"
              >
                <div className="w-12 h-12 bg-[#4CB963]/10 rounded-full flex items-center justify-center mb-1">
                  <Camera className="w-5 h-5 text-[#4CB963]" />
                </div>
                <span className="font-bold text-gray-800 text-xs">Take Photo</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 bg-white hover:bg-gray-50 p-4 rounded-[24px] border-2 border-gray-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all active:scale-95"
              >
                <div className="w-12 h-12 bg-[#4CB963]/10 rounded-full flex items-center justify-center mb-1">
                  <UploadCloud className="w-5 h-5 text-[#4CB963]" />
                </div>
                <span className="font-bold text-gray-800 text-xs">Upload File</span>
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsScannerOpen(false)}
            className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold mt-2 hover:bg-gray-50"
          >
            Cancel
          </button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
