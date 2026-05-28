'use client'

import { useEffect, useState, useRef } from 'react'
import {
  Bell,
  Box,
  ChevronRight,
  Cpu,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
  Keyboard,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  PhoneCall,
  Settings,
  Target,
  TrendingUp,
  User,
  Users2,
  Wrench,
  Scan,
  Camera,
  UploadCloud
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { SignInButton, SignOutButton, useAuth, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/lib/context/SettingsContext'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createInvoice } from '@/lib/services/invoiceService'

interface SidebarItemProps {
  href: string
  icon: any
  label: string
  active: boolean
}

function SidebarItem({ href, icon: Icon, label, active }: SidebarItemProps) {
  return (
    <Link href={href}>
      <button
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
          active
            ? 'bg-[#efefed] text-gray-900'
            : 'text-gray-500 hover:bg-[#efefed] hover:text-gray-900'
        }`}
      >
        <Icon className={`h-4 w-4 transition-colors ${active ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-900'}`} />
        <span className="text-sm font-medium">{label}</span>
      </button>
    </Link>
  )
}

export default function OwnerShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [accountPopoverOpen, setAccountPopoverOpen] = useState(false)
  const { openSettings } = useSettings()
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const { user, isLoaded } = useUser()
  const pathname = usePathname()
  
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: any) => {
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
        
        await createInvoice({
           customer_name: result.supplier_name || 'Unknown Supplier',
           date: result.invoice_date || new Date().toISOString(),
           items: result.products?.map((p: any) => ({
             description: p.name,
             quantity: p.quantity || 1,
             rate: p.price || 0,
             tax_percent: p.tax_percentage || 0,
             amount: (p.price || 0) * (p.quantity || 1)
           })) || [],
           total_amount: result.grand_total || 0,
           cgst_amount: result.cgst_amount || 0,
           sgst_amount: result.sgst_amount || 0,
           is_receipt_invoice: true // Purchase
        })

        toast.success('Bill Scanned & Imported Successfully!')
        setIsScannerOpen(false)
        router.push('/owner/accounts')
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Error scanning bill. Try again.')
    } finally {
      setIsExtracting(false)
    }
  }

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/auth/login')
    }
  }, [isLoaded, isSignedIn, router])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }
      
      if (e.ctrlKey) {
        switch (e.key.toLowerCase()) {
          case 'd':
            e.preventDefault(); router.push('/owner/dashboard'); break;
          case 'i':
            e.preventDefault(); router.push('/owner/products'); break;
          case 'a':
            e.preventDefault(); router.push('/owner/accounts'); break;
          case 'b':
            e.preventDefault(); router.push('/owner/billing'); break;
          case 'o':
            e.preventDefault(); router.push('/owner/orders'); break;
          case '/':
            e.preventDefault(); setShowShortcuts(true); break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f5] text-[#787774]">
        <p className="text-sm font-semibold tracking-wide">Loading secure workspace...</p>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  return (
    <div className="flex h-screen bg-[#f7f7f5] font-sans text-[#37352f] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-60' : 'w-0'
        } hidden md:flex bg-[#ffffff] border-r border-[#e9e9e8] transition-all duration-300 flex-col z-20 overflow-hidden relative shadow-sm print:hidden`}
      >
        <div className="px-6 flex items-center justify-start border-b border-[#f1f1f0] h-14 flex-shrink-0">
          <button
            onClick={() => setShowShortcuts(true)}
            className="hidden md:flex p-1.5 text-gray-500 hover:bg-white hover:shadow-sm rounded-md transition-all"
            title="Keyboard Shortcuts (Ctrl + /)"
          >
            <Keyboard className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 text-[#787774] hover:bg-[#efefed] hover:text-[#37352f] rounded-md transition-all"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-20">
          <div className="px-6 mb-4 text-left">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Analytics</p>
          </div>
          <nav className="px-3 space-y-1 mb-8">
            <SidebarItem
              href="/owner/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              active={pathname === '/owner/dashboard'}
            />
            <SidebarItem
              href="/owner/accounts"
              icon={Users2}
              label="Accounts"
              active={pathname === '/owner/accounts'}
            />
            <SidebarItem
              href="/owner/ai-calling"
              icon={PhoneCall}
              label="AI Calling"
              active={pathname?.startsWith('/owner/ai-calling')}
            />
          </nav>

          <div className="px-6 mb-4 text-left">
            <p className="text-[11px] font-semibold text-[#787774] uppercase tracking-wider">Operations</p>
          </div>
          <nav className="px-3 space-y-1 mb-8">
            <SidebarItem
              href="/owner/products"
              icon={Box}
              label="Product Inventory"
              active={pathname === '/owner/products'}
            />
            <SidebarItem
              href="/owner/orders"
              icon={CreditCard}
              label="Sales & Orders"
              active={pathname === '/owner/orders'}
            />
            <SidebarItem
              href="/owner/service-calls"
              icon={Wrench}
              label="Service Hub"
              active={pathname?.startsWith('/owner/service-calls')}
            />
            <SidebarItem
              href="/owner/billing"
              icon={CreditCard}
              label="Billing & Invoices"
              active={pathname === '/owner/billing'}
            />
          </nav>

          <div className="px-6 mb-4 text-left border-t border-gray-100 pt-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</p>
          </div>
          <nav className="px-3 space-y-1 mb-8">
            <SidebarItem
              href="/owner/roadmap"
              icon={Target}
              label="Roadmap"
              active={pathname === '/owner/roadmap'}
            />
            <SidebarItem
              href="/owner/audit-log"
              icon={FileText}
              label="Audit Log"
              active={pathname === '/owner/audit-log'}
            />
            <SidebarItem
              href="/owner/documents"
              icon={FileText}
              label="Documentation"
              active={pathname === '/owner/documents'}
            />
          </nav>
        </div>

        <div className="p-4 border-t border-[#f1f1f0] bg-[#ffffff] absolute bottom-0 w-full relative">
          {isSignedIn ? (
            <div className="relative group/user">
              <div
                onClick={() => setAccountPopoverOpen(!accountPopoverOpen)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#efefed] transition-all cursor-pointer group"
              >
                <div className="h-9 w-9 rounded-lg border border-[#e9e9e8] overflow-hidden bg-[#f7f7f5] flex items-center justify-center">
                  {user?.imageUrl ? (
                    <img src={user.imageUrl} className="w-full h-full object-cover" alt={user.fullName || 'User avatar'} />
                  ) : (
                    <User className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                 <div className="flex-1 text-left overflow-hidden">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || 'Business Owner'}</p>
                  <p className="text-xs text-gray-500 truncate">Administrator</p>
                </div>
                <ChevronRight
                  className={`h-4 w-4 text-[#acaba9] transition-transform ${accountPopoverOpen ? 'rotate-90' : 'group-hover:translate-x-1'}`}
                />
              </div>

              {accountPopoverOpen && (
                <div className="absolute bottom-16 left-4 w-64 bg-white border border-[#e9e9e8] rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] py-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                  <div className="px-4 py-2 mb-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account Settings</p>
                  </div>
                  <div className="space-y-0.5 px-2">
                    <button
                      onClick={() => {
                        openSettings()
                        setAccountPopoverOpen(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#37352f] hover:bg-[#efefed] rounded-lg transition-all"
                    >
                      <Settings className="h-4 w-4 text-[#787774]" />
                      Settings
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#37352f] hover:bg-[#efefed] rounded-lg transition-all">
                      <Users2 className="h-4 w-4 text-[#787774]" />
                      Profile
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#37352f] hover:bg-[#efefed] rounded-lg transition-all">
                      <Globe className="h-4 w-4 text-[#787774]" />
                      Language
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-[#37352f] hover:bg-[#efefed] rounded-lg transition-all">
                      <Bell className="h-4 w-4 text-[#787774]" />
                      Notifications
                    </button>
                  </div>
                  <div className="h-[1px] bg-[#f1f1f0] my-3 mx-4" />
                  <div className="px-2">
                    <SignOutButton>
                      <button className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-all">
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </button>
                    </SignOutButton>
                  </div>
                </div>
              )}
            </div>
          ) : (
             <SignInButton mode="modal">
              <Button className="w-full bg-gray-900 hover:bg-black text-white rounded-lg font-medium py-6">
                Sign In to Portal
              </Button>
            </SignInButton>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {!sidebarOpen && (
          <header className="h-14 bg-white border-b border-[#e9e9e8] hidden md:flex items-center px-6 flex-shrink-0 print:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-[#787774] hover:bg-[#efefed] hover:text-[#37352f] rounded-md transition-all"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
          </header>
        )}
        
        {/* Mobile Header */}
        <header className="h-14 bg-white border-b border-[#e9e9e8] md:hidden flex items-center justify-between px-4 flex-shrink-0 print:hidden sticky top-0 z-10">
          <div className="font-black text-lg">INWISE</div>
          <div className="flex gap-2">
            <button onClick={() => router.push('/mobile/owner/settings')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#f7f7f5] pb-16 md:pb-0 relative">{children}</main>
        
        {/* Minimal Lime Green Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-100 flex justify-between items-center px-4 py-2 pb-safe z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
          <Link href="/owner/dashboard" className={`flex flex-col items-center gap-1 w-16 text-gray-400 outline-none`}>
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Home</span>
          </Link>
          
          <Link href="/mobile/owner/accounts" className={`flex flex-col items-center gap-1 w-16 text-gray-400 outline-none`}>
            <Users2 className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Accounts</span>
          </Link>

          {/* Prominent Scanner Button (Lime Green) */}
          <div className="relative -top-6 flex justify-center w-16">
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="w-14 h-14 bg-[#4CB963] text-white rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(76,185,99,0.4)] border-4 border-white transition-transform active:scale-95 outline-none"
            >
              <Scan className="w-6 h-6" />
            </button>
            <span className="absolute -bottom-5 text-[10px] font-semibold text-gray-500 whitespace-nowrap">Scan</span>
          </div>

          <Link href="/mobile/owner/billing" className={`flex flex-col items-center gap-1 w-16 text-gray-400 outline-none`}>
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Billing</span>
          </Link>
          
          <Link href="/mobile/owner/products" className={`flex flex-col items-center gap-1 w-16 text-gray-400 outline-none`}>
            <Box className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Stock</span>
          </Link>
        </nav>
      </div>

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
                className="flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-[#e8f7ec] p-6 rounded-2xl border border-gray-100 transition-colors shadow-sm"
              >
                <div className="w-14 h-14 bg-[#4CB963]/10 rounded-full flex items-center justify-center">
                  <Camera className="w-7 h-7 text-[#4CB963]" />
                </div>
                <span className="font-semibold text-gray-700">Take Photo</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-[#e8f7ec] p-6 rounded-2xl border border-gray-100 transition-colors shadow-sm"
              >
                <div className="w-14 h-14 bg-[#4CB963]/10 rounded-full flex items-center justify-center">
                  <UploadCloud className="w-7 h-7 text-[#4CB963]" />
                </div>
                <span className="font-semibold text-gray-700">Upload File</span>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Keyboard Shortcuts Modal */}
      <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-gray-500" />
              Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-600">Dashboard</span>
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-500 shadow-sm">Ctrl + D</kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-600">Inventory</span>
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-500 shadow-sm">Ctrl + I</kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-600">Accounts</span>
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-500 shadow-sm">Ctrl + A</kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-600">Billing</span>
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-500 shadow-sm">Ctrl + B</kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-600">Orders</span>
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-500 shadow-sm">Ctrl + O</kbd>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-600">Shortcuts Help</span>
                <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-500 shadow-sm">Ctrl + /</kbd>
              </div>
            </div>
            <p className="text-xs text-center text-gray-400 mt-4 pt-4 border-t">More shortcuts will be added as we build out the Voucher System.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
