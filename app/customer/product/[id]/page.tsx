'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getProductById } from '@/lib/services/productService'
import ProductViewer3D from '@/components/ProductViewer3D'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  ShoppingCart, 
  Zap, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  Star,
  ChevronRight,
  Info,
  Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from '@/lib/contexts/LanguageContext'

interface ProductWithDetails {
  id: string
  name: string
  description: string
  category: string
  price: number
  warranty_months: number
  image_url: string
  created_at: string
  product_images: Array<{
    id: string
    image_url: string
    image_type: string
    alt_text?: string
  }>
  product_3d_models: Array<{
    id: string
    model_url: string
    model_type: string
  }>
}

export default function ProductDetail() {
  const params = useParams()
  const productId = params.id as string
  const { t } = useTranslation()
  
  const [product, setProduct] = useState<ProductWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | '3d' | '360' | 'ar'>('overview')
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    loadProduct()
  }, [productId])

  async function loadProduct() {
    try {
      const data = await getProductById(productId)
      setProduct(data)
    } catch (error) {
      console.error('Error loading product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm font-black text-[#acaba9] uppercase tracking-widest">Identifying Device...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5]">
        <div className="text-center bg-white p-12 rounded-[40px] border border-[#e9e9e8] shadow-sm">
          <p className="text-xl font-black text-[#37352f] mb-6">Product Discontinued</p>
          <Link href="/customer/home">
            <Button className="bg-[#37352f] hover:bg-black text-white rounded-2xl px-8 py-6 font-black">
               Browse Catalog
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const has3DModel = product.product_3d_models.length > 0
  const has360Images = product.product_images.filter(
    img => img.image_type === '360_image'
  ).length > 0

  return (
    <div className="min-h-screen bg-[#f7f7f5] pb-20">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#e9e9e8]">
        <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/customer/home">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[#f7f7f5] transition-all border border-transparent hover:border-[#e9e9e8]">
                <ArrowLeft className="h-5 w-5 text-[#37352f]" />
              </div>
            </Link>
            <div className="flex items-center gap-2 text-xs font-bold text-[#acaba9] uppercase tracking-widest">
               {t('all_categories')} <ChevronRight className="h-3 w-3" /> {t(product.category)}
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[#f7f7f5] cursor-pointer transition-all border border-transparent hover:border-[#e9e9e8]">
                <Share2 className="h-5 w-5 text-[#37352f]" />
             </div>
             <div className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-[#f7f7f5] cursor-pointer transition-all border border-transparent hover:border-[#e9e9e8]">
                <Heart className="h-5 w-5 text-[#37352f]" />
             </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Visuals */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-[40px] p-8 border border-[#e9e9e8] shadow-sm overflow-hidden relative">
              <div className="absolute top-8 left-8 z-10 flex flex-col gap-2">
                {[
                  { id: 'overview', label: 'Gallery', icon: Info },
                  { id: '3d', label: t('Spatial_Reality'), icon: Zap, show: has3DModel },
                  { id: '360', label: '360° View', icon: RotateCcw, show: has360Images },
                  { id: 'ar', label: 'AR Preview', icon: Sparkles }
                ].filter(t => t.show !== false).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      activeTab === tab.id
                        ? 'bg-[#37352f] text-white shadow-lg'
                        : 'bg-[#f7f7f5] text-[#acaba9] hover:bg-[#efefed] hover:text-[#37352f]'
                    }`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="aspect-square flex items-center justify-center">
                {activeTab === 'overview' && (
                  <div className="w-full h-full flex flex-col">
                    <div className="flex-1 flex items-center justify-center p-12">
                      <img
                        src={product.product_images[selectedImage]?.image_url || product.image_url}
                        alt={product.name}
                        className="max-w-full max-h-full object-contain mix-blend-multiply"
                      />
                    </div>
                    {product.product_images.length > 1 && (
                      <div className="flex gap-2 p-4 justify-center">
                        {product.product_images.map((img, i) => (
                          <button
                            key={img.id}
                            onClick={() => setSelectedImage(i)}
                            className={`h-16 w-16 rounded-xl border-2 transition-all overflow-hidden ${selectedImage === i ? 'border-blue-600 scale-105' : 'border-[#e9e9e8] opacity-50'}`}
                          >
                            <img src={img.image_url} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {activeTab === '3d' && has3DModel && (
                  <div className="w-full h-full">
                    <ProductViewer3D 
                      modelUrl={product.product_3d_models[0].model_url} 
                      productName={product.name} 
                    />
                  </div>
                )}
                {activeTab === 'ar' && (
                  <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center bg-[#f7f7f5] rounded-[40px]">
                    <div className="h-24 w-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                      <Sparkles className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-[#37352f] mb-4">Augmented Reality Ready</h3>
                    <p className="text-sm text-[#acaba9] font-medium mb-8 max-w-xs">
                      Scan the QR code or click the button below to visualize this product in your own room using your mobile device.
                    </p>
                    <Button className="bg-[#37352f] text-white rounded-2xl h-14 px-10 font-bold shadow-xl">
                      Launch AR Experience
                    </Button>
                    <div className="mt-8 pt-8 border-t border-[#e9e9e8] w-full flex items-center justify-center gap-4">
                       <div className="p-3 bg-white rounded-2xl border border-[#e9e9e8]">
                          <div className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center">
                             <span className="text-[10px] text-[#acaba9] font-bold uppercase tracking-widest text-center">QR Code<br/>Placeholder</span>
                          </div>
                       </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Details & Purchase */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-[40px] p-10 border border-[#e9e9e8] shadow-sm space-y-10 text-left">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full">{t(product.category)}</span>
                </div>
                <h1 className="text-4xl font-black text-[#37352f] tracking-tight leading-[1.1]">{product.name}</h1>
                <p className="text-[#acaba9] text-sm font-medium leading-relaxed">{product.description}</p>
              </div>

              <div className="space-y-2 pt-6 border-t border-[#f1f1f0]">
                <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-black text-[#37352f] tracking-tighter">₹{product.price.toLocaleString()}</span>
                  <span className="text-lg text-[#acaba9] line-through font-bold">₹{(product.price * 1.15).toLocaleString()}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="p-4 bg-[#f7f7f5] rounded-2xl border border-[#e9e9e8]">
                    <div className="flex items-center gap-2 mb-1">
                       <ShieldCheck className="h-4 w-4 text-[#37352f]" />
                       <span className="text-[10px] font-black uppercase tracking-wider text-[#37352f]">{t('warranty')}</span>
                    </div>
                    <p className="text-sm font-bold text-[#37352f]">{product.warranty_months} {t('months_local')}</p>
                 </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-base shadow-xl shadow-blue-100 border-none transition-all active:scale-95">
                    <ShoppingCart className="h-5 w-5 mr-3" />
                    {t('add_to_cart')}
                  </Button>
                </div>
                <Button variant="outline" className="w-full h-14 bg-[#37352f] hover:bg-black text-white rounded-2xl font-black text-base transition-all border-none shadow-xl shadow-gray-200">
                   {t('buy_now')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
