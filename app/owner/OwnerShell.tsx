'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  Box,
  ChevronRight,
  Cpu,
  CreditCard,
  FileText,
  Globe,
  LayoutDashboard,
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
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { SignInButton, SignOutButton, useAuth, useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { useSettings } from '@/lib/context/SettingsContext'

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

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.replace('/auth/login')
    }
  }, [isLoaded, isSignedIn, router])

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
    <div className="flex h-screen bg-[#f7f7f5] font-sans text-[#37352f]">
      <aside
        className={`${
          sidebarOpen ? 'w-60' : 'w-0'
        } bg-[#ffffff] border-r border-[#e9e9e8] transition-all duration-300 flex flex-col z-20 overflow-hidden relative shadow-sm print:hidden`}
      >
        <div className="px-6 flex items-center justify-start border-b border-[#f1f1f0] h-14 flex-shrink-0">
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

      <div className="flex-1 flex flex-col min-w-0">
        {!sidebarOpen && (
          <header className="h-14 bg-white border-b border-[#e9e9e8] flex items-center px-6 flex-shrink-0 print:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 text-[#787774] hover:bg-[#efefed] hover:text-[#37352f] rounded-md transition-all"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
          </header>
        )}

        <main className="flex-1 overflow-auto bg-[#f7f7f5] relative">{children}</main>
      </div>
    </div>
  )
}
