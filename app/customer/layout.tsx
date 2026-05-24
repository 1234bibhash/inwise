'use client'

import { useState } from 'react'
import { 
  Search, 
  ShoppingCart, 
  Menu, 
  User, 
  Bell, 
  Heart,
  MapPin,
  ChevronDown,
  LogOut,
  HelpCircle,
  Percent,
  Sparkles,
  Zap,
  Cpu,
  Monitor,
  Smartphone,
  Speaker,
  Watch,
  Camera,
  Tv,
  Globe,
  Settings,
  ClipboardList,
  Home,
  Truck,
  PackageSearch
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/contexts/LanguageContext'

const CATEGORIES = [
  { name: 'Smartphones & Tablets', icon: Smartphone },
  { name: 'Laptops & Computers', icon: Monitor },
  { name: 'Televisions & Home Audio', icon: Tv },
  { name: 'Cameras & Photo', icon: Camera },
  { name: 'Headphones & Speakers', icon: Speaker },
  { name: 'Smart Home & IoT', icon: Zap },
  { name: 'Wearable Technology', icon: Watch },
  { name: 'Computer Components', icon: Cpu },
  { name: 'Gaming Consoles', icon: Sparkles },
  { name: 'Accessories', icon: Menu },
]

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [accountOpen, setAccountOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const { language, setLanguage, t } = useTranslation()
  
  const pathname = usePathname()

  const navLinks = [
    { name: 'home', icon: Home, path: '/customer/home' },
    { name: 'orders', icon: ClipboardList, path: '/customer/orders' },
    { name: 'track_shipment', icon: Truck, path: '/customer/orders' }, // For now, track shipment takes to orders or a specific page if I build it
  ]

  return (
    <div className="flex h-screen bg-[#f7f7f5] font-sans text-[#37352f]">
      {/* Hooghly Electronics Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } bg-[#ffffff] border-r border-[#e9e9e8] transition-all duration-300 flex flex-col z-20 overflow-hidden relative shadow-sm`}
      >
        <div className="p-6 flex items-center gap-3 border-b border-[#f1f1f0] h-20 flex-shrink-0">
          <div className="bg-[#37352f] p-2 rounded-lg shadow-md">
            <Cpu className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-lg font-black tracking-tight leading-none text-[#37352f]">{t('Hooghly' as any) || 'Hooghly'}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">{t('Electronics' as any) || 'Electronics'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-20">
           {/* Primary Navigation */}
           <div className="px-3 space-y-1 mb-8">
              {navLinks.map(link => (
                <Link key={link.name} href={link.path}>
                  <button className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold rounded-xl transition-all group ${
                    pathname === link.path ? 'bg-blue-50 text-blue-600' : 'text-[#37352f] hover:bg-[#efefed]'
                  }`}>
                    <link.icon className={`h-4 w-4 ${pathname === link.path ? 'text-blue-600' : 'text-[#acaba9] group-hover:text-blue-600'}`} />
                    <span>{t(link.name)}</span>
                  </button>
                </Link>
              ))}
           </div>

           <div className="px-6 mb-4 text-left">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#acaba9] uppercase tracking-wider">
                {t('browse_categories')}
                <Sparkles className="h-3 w-3 text-blue-500" />
              </div>
           </div>

           <nav className="px-3 space-y-1">
             {CATEGORIES.map(cat => (
               <Link key={cat.name} href={`/customer/home?category=${cat.name}`}>
                 <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-[#37352f] hover:bg-[#efefed] rounded-lg transition-all group text-left">
                   <cat.icon className="h-4 w-4 text-[#acaba9] group-hover:text-blue-600 transition-colors" />
                   <span className="truncate">{t(cat.name)}</span>
                 </button>
               </Link>
             ))}
           </nav>
        </div>

        <div className="p-6 border-t border-[#f1f1f0] absolute bottom-0 w-full bg-[#ffffff]">
           <button className="flex items-center gap-3 text-sm font-bold text-[#acaba9] hover:text-[#37352f] transition-colors">
             <LogOut className="h-4 w-4" />
             {t('account_settings')}
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-[#e9e9e8] flex items-center justify-between px-8 gap-8 flex-shrink-0">
          <div className="flex items-center gap-8 flex-1">
             <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-[#acaba9] hover:bg-[#efefed] hover:text-[#37352f] rounded-lg transition-all">
               <Menu className="h-6 w-6" />
             </button>

             <div className="flex-1 max-w-2xl relative flex h-11 group">
                <div className="h-full bg-[#f7f7f5] px-5 rounded-l-xl border border-r-0 border-[#e9e9e8] flex items-center gap-2 text-xs font-bold text-[#37352f] cursor-pointer hover:bg-[#efefed] transition-all">
                  {t('all_categories')} <ChevronDown className="h-3 w-3 text-[#acaba9]" />
                </div>
                <input type="text" placeholder={t('search_placeholder')} className="flex-1 px-4 text-sm bg-[#f7f7f5] border border-[#e9e9e8] focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all" />
                <button className="h-full bg-[#37352f] hover:bg-black px-6 rounded-r-xl transition-all shadow-sm">
                  <Search className="h-5 w-5 text-white" />
                </button>
             </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex flex-col text-left text-[#37352f] cursor-pointer hover:bg-[#f7f7f5] p-2 rounded-lg transition-all border border-transparent hover:border-[#e9e9e8]">
                <span className="text-[10px] font-bold text-[#acaba9] uppercase tracking-wider leading-none mb-1">{t('deliver_to')}</span>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-600" />
                  <span className="text-xs font-black">Hooghly, WB</span>
                </div>
             </div>

             {/* Language Selector */}
             <div className="relative">
                <button 
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[#f7f7f5] transition-all border border-transparent hover:border-[#e9e9e8]"
                >
                   <Globe className="h-4 w-4 text-[#acaba9]" />
                   <span className="text-xs font-black text-[#37352f]">{language}</span>
                   <ChevronDown className={`h-3 w-3 text-[#acaba9] transition-transform ${langOpen ? 'rotate-180' : ''}`} />
                </button>
                {langOpen && (
                  <div className="absolute top-12 right-0 w-32 bg-white border border-[#e9e9e8] rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                     {['English', 'Bengali', 'Hindi'].map((lang: any) => (
                       <button 
                         key={lang}
                         onClick={() => { setLanguage(lang); setLangOpen(false); }}
                         className="w-full text-left px-4 py-2 text-xs font-bold text-[#37352f] hover:bg-[#f7f7f5] transition-all flex items-center justify-between"
                       >
                         {lang}
                         {language === lang && <div className="h-1.5 w-1.5 bg-blue-600 rounded-full" />}
                       </button>
                     ))}
                  </div>
                )}
             </div>

             <div className="flex items-center gap-3">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[#f7f7f5] cursor-pointer transition-all border border-transparent hover:border-[#e9e9e8] text-[#37352f] relative group">
                  <Heart className="h-5 w-5" />
                </div>
                
                {/* Account Avatar with Dropdown */}
                <div className="relative">
                   <div 
                     onClick={() => setAccountOpen(!accountOpen)}
                     className="h-10 w-10 rounded-xl border-2 border-[#e9e9e8] overflow-hidden cursor-pointer hover:border-blue-500 transition-all shadow-sm"
                   >
                      <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=2070&auto=format&fit=crop" className="w-full h-full object-cover" />
                   </div>
                   
                   {accountOpen && (
                     <div className="absolute top-12 right-0 w-56 bg-white border border-[#e9e9e8] rounded-[24px] shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="p-5 bg-[#f7f7f5] border-b border-[#e9e9e8]">
                           <p className="text-xs font-black text-[#acaba9] uppercase tracking-widest mb-1">Signed in as</p>
                           <p className="text-sm font-black text-[#37352f]">Salung Prastyo</p>
                        </div>
                        <div className="p-2 text-left">
                           <Link href="/customer/orders" onClick={() => setAccountOpen(false)}>
                             <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-[#37352f] hover:bg-[#f7f7f5] rounded-xl transition-all">
                                <ClipboardList className="h-4 w-4 text-[#acaba9]" />
                                {t('orders')}
                             </button>
                           </Link>
                           <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-[#37352f] hover:bg-[#f7f7f5] rounded-xl transition-all">
                              <Heart className="h-4 w-4 text-[#acaba9]" />
                              {t('wishlist')}
                           </button>
                           <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-[#37352f] hover:bg-[#f7f7f5] rounded-xl transition-all">
                              <ShoppingCart className="h-4 w-4 text-[#acaba9]" />
                              {t('cart')}
                           </button>
                           <div className="h-[1px] bg-[#f1f1f0] my-2 mx-4" />
                           <button className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all">
                              <LogOut className="h-4 w-4" />
                              {t('log_out')}
                           </button>
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-[#f7f7f5]">
          {children}
        </main>
      </div>
    </div>
  )
}
