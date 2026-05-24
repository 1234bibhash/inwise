'use client'

import { useEffect, useState } from 'react'
import { getProducts } from '@/lib/services/productService'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Star, 
  ChevronRight, 
  ChevronLeft,
  Smartphone,
  Laptop,
  Camera,
  Watch,
  Headphones,
  Gamepad,
  Home,
  Tv,
  Cpu,
  Zap,
  Plus,
  Heart
} from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/lib/contexts/LanguageContext'

interface Product {
  id: string
  name: string
  description: string
  category: string
  price: number
  warranty_months: number
  image_url: string
  rating?: number
  reviews?: number
}

const CATEGORY_ICONS = [
  { icon: Smartphone, label: 'Smartphones & Tablets' },
  { icon: Laptop, label: 'Laptops & Computers' },
  { icon: Tv, label: 'Televisions & Home Audio' },
  { icon: Home, label: 'Appliances' },
  { icon: Headphones, label: 'Headphones & Speakers' },
  { icon: Watch, label: 'Wearable Technology' },
  { icon: Camera, label: 'Cameras & Photo' },
  { icon: Gamepad, label: 'Gaming Consoles' },
]

export default function CustomerHome() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const productsData = await getProducts()
      const augmented = productsData.map(p => ({
        ...p,
        rating: 4.5 + Math.random() * 0.5,
        reviews: Math.floor(Math.random() * 1200) + 50
      }))
      setProducts(augmented)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setTimeout(() => setIsLoading(false), 800) // Aesthetic delay for skeleton preview
    }
  }

  return (
    <div className="pb-20 bg-[#f7f7f5]">
      {/* Premium Banner */}
      <div className="px-8 pt-8">
        <div className="relative h-[400px] w-full rounded-[32px] overflow-hidden bg-[#37352f] flex items-center px-16 shadow-2xl border border-[#e9e9e8]">
           <div className="max-w-xl z-10 space-y-6 text-left">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-600/10 border border-blue-400/20 rounded-full w-fit">
                <Sparkles className="h-3 w-3 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">{t('summer_tech_fest')}</span>
              </div>
              <h1 className="text-6xl font-black text-white leading-[1.1] tracking-tight">
                {t('premium_tech')} <br />
                <span className="text-blue-500 italic">{t('hooghly_pride')}</span>
              </h1>
              <p className="text-lg text-white/60 font-medium leading-relaxed">
                {t('banner_desc')}
              </p>
              <div className="flex gap-4 pt-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-2xl px-10 py-7 font-black text-base shadow-xl shadow-blue-100 border-none transition-all active:scale-95">
                  {t('shop_now')}
                </Button>
                <Button variant="outline" className="bg-transparent text-white border-white/20 hover:bg-white/5 rounded-2xl px-10 py-7 font-black text-base transition-all">
                  {t('view_offers')}
                </Button>
              </div>
           </div>
        </div>
      </div>

      <div className="px-8 mt-16 space-y-20">
        {/* Featured Categories */}
        <section>
          <div className="flex items-center justify-between mb-8 text-left">
             <div>
                <h2 className="text-2xl font-black text-[#37352f] tracking-tight">{t('tech_categories')}</h2>
                <p className="text-sm text-[#acaba9] font-medium mt-1">{t('browse_categories')}</p>
             </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6">
            {CATEGORY_ICONS.map((cat, i) => (
              <div key={i} className="bg-white p-8 rounded-[24px] flex flex-col items-center gap-5 cursor-pointer hover:shadow-xl transition-all border border-[#e9e9e8] hover:border-blue-200 group">
                <div className="h-16 w-16 rounded-2xl bg-[#f7f7f5] flex items-center justify-center text-[#acaba9] group-hover:bg-blue-50 group-hover:text-blue-600 transition-all group-hover:rotate-12">
                   <cat.icon className="h-8 w-8" />
                </div>
                <span className="text-xs font-black text-[#37352f] tracking-tight">{t(cat.label)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Hot Tech Deals */}
        <section>
          <div className="flex items-center justify-between mb-8 text-left">
             <div>
                <h2 className="text-2xl font-black text-[#37352f] tracking-tight flex items-center gap-3">
                  {t('trending_now')} <TrendingUp className="h-6 w-6 text-blue-600" />
                </h2>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-[32px] overflow-hidden border border-[#e9e9e8] h-[500px] flex flex-col p-8 space-y-6">
                   <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                   <div className="space-y-4">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-6 w-full" />
                      <div className="flex justify-between items-center pt-4">
                         <Skeleton className="h-8 w-1/3" />
                         <Skeleton className="h-12 w-12 rounded-2xl" />
                      </div>
                   </div>
                </div>
              ))
            ) : products.map(product => (
              <Link key={product.id} href={`/customer/product/${product.id}`}>
                <div className="bg-white rounded-[32px] overflow-hidden border border-[#e9e9e8] hover:shadow-2xl transition-all h-full flex flex-col group relative text-left">
                  <div className="aspect-[4/5] bg-[#fdfdfd] relative p-10 flex items-center justify-center overflow-hidden">
                    <img 
                      src={product.image_url} 
                      alt={product.name} 
                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700" 
                    />
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                       <div className="bg-white/80 p-2.5 rounded-2xl backdrop-blur-md shadow-lg border border-[#e9e9e8] hover:bg-white text-red-500">
                          <Heart className="h-5 w-5" />
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-8 flex flex-col flex-1 bg-white">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full">{t(product.category)}</span>
                        <div className="flex items-center gap-1">
                           <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                           <span className="text-[10px] font-black text-[#37352f]">{product.rating?.toFixed(1)}</span>
                        </div>
                      </div>
                      <h4 className="text-lg font-bold text-[#37352f] line-clamp-1 group-hover:text-blue-600 transition-colors leading-snug">{product.name}</h4>
                    </div>
                    
                    <div className="mt-8 flex items-center justify-between">
                       <div>
                          <p className="text-2xl font-black text-[#37352f] tracking-tight">₹{product.price.toLocaleString()}</p>
                          <p className="text-[11px] font-bold text-[#acaba9] line-through mt-0.5">₹{(product.price * 1.15).toLocaleString()}</p>
                       </div>
                       <Button size="icon" className="h-12 w-12 rounded-2xl bg-[#37352f] hover:bg-blue-600 text-white shadow-xl transition-all active:scale-90 border-none">
                          <Plus className="h-6 w-6" />
                       </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function TrendingUp(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
