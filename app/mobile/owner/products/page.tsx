'use client'

import { useEffect, useState } from 'react'
import { getProducts } from '@/lib/services/productService'
import { Search, Box, Package, Filter, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function MobileProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [filters, setFilters] = useState({ category: 'All', subcategory: 'All' })
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    setIsLoading(true)
    try {
      const productsData = await getProducts()
      setProducts(productsData || [])
    } catch (error) {
      console.error('Data pipeline interruption:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAvailableStock = (product: any) => {
    const serialStock = product.serial_numbers?.length ?? 0
    return serialStock > 0 ? serialStock : product.stock_count ?? 0
  }

  const filteredProducts = products.filter(p => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = p.name.toLowerCase().includes(query) || 
                          (p.description && p.description.toLowerCase().includes(query)) ||
                          (p.brand && p.brand.toLowerCase().includes(query))
    
    const matchesCategory = filters.category === 'All' || p.category === filters.category
    const matchesSubcategory = filters.subcategory === 'All' || p.subcategory === filters.subcategory

    return matchesSearch && matchesCategory && matchesSubcategory
  }).sort((a, b) => new Date(b.created_at || new Date()).getTime() - new Date(a.created_at || new Date()).getTime())

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]
  const subcategories = ['All', ...Array.from(new Set(products.filter(p => filters.category === 'All' || p.category === filters.category).map(p => p.subcategory).filter(Boolean)))]

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans pb-24">
      {/* Search Header */}
      <div className="bg-white px-4 py-3 shadow-sm border-b border-[#e9e9e8] sticky top-0 z-20 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search inventory..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f7f7f5] border border-[#ededeb] rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#4CB963] focus:ring-1 focus:ring-[#4CB963] placeholder:text-gray-400 transition-all"
            />
          </div>
          
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <button className="h-10 px-3 bg-[#f7f7f5] border border-[#ededeb] rounded-xl flex items-center justify-center relative active:scale-95 transition-transform">
                <SlidersHorizontal className="h-4 w-4 text-gray-600" />
                {(filters.category !== 'All' || filters.subcategory !== 'All') && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4CB963] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4CB963] border-2 border-white"></span>
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-5">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-lg font-bold text-gray-900 text-left">Filters</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 mb-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category</label>
                  <Select value={filters.category} onValueChange={v => setFilters({...filters, category: v, subcategory: 'All'})}>
                    <SelectTrigger className="w-full h-10 bg-[#f7f7f5] border-[#ededeb] rounded-xl text-sm font-semibold focus:ring-[#4CB963]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#ededeb]">
                      {categories.map((c: any) => <SelectItem key={c} value={c} className="text-sm font-medium">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subcategory</label>
                  <Select value={filters.subcategory} onValueChange={v => setFilters({...filters, subcategory: v})}>
                    <SelectTrigger className="w-full h-10 bg-[#f7f7f5] border-[#ededeb] rounded-xl text-sm font-semibold focus:ring-[#4CB963]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-[#ededeb]">
                      {subcategories.map((c: any) => <SelectItem key={c} value={c} className="text-sm font-medium">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setFilters({category: 'All', subcategory: 'All'})}
                  className="flex-1 h-10 border border-gray-200 text-gray-600 rounded-xl font-bold text-sm bg-white hover:bg-gray-50"
                >
                  Clear All
                </button>
                <button 
                  onClick={() => setIsFilterOpen(false)}
                  className="flex-1 h-10 bg-[#37352f] text-white rounded-xl font-bold text-sm shadow-sm"
                >
                  Apply Filters
                </button>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex bg-[#f7f7f5] rounded-xl p-1 border border-[#ededeb]">
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{filteredProducts.length} Items</span>
          {(filters.category !== 'All' || filters.subcategory !== 'All') && (
            <span className="text-[9px] font-bold text-[#4CB963] uppercase tracking-widest bg-[#4CB963]/10 px-2 py-0.5 rounded-full">
              Filtered
            </span>
          )}
        </div>
      </div>

      {/* Product List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-3" : "space-y-3"}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`bg-white p-3 rounded-2xl flex ${viewMode === 'grid' ? 'flex-col' : 'items-center'} gap-3 shadow-sm`}>
                <Skeleton className={`${viewMode === 'grid' ? 'w-full aspect-square rounded-xl' : 'w-14 h-14 rounded-xl'} bg-gray-100 shrink-0`} />
                <div className={`space-y-2 ${viewMode === 'grid' ? 'w-full mt-2' : 'flex-1'}`}>
                  <Skeleton className="h-3 w-3/4 bg-gray-100" />
                  <Skeleton className="h-2 w-1/2 bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className={viewMode === 'grid' ? "grid grid-cols-2 gap-3" : "space-y-3"}>
            {filteredProducts.map(product => (
              <div 
                key={product.id} 
                onClick={() => setSelectedProduct(product)}
                className={`bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex ${viewMode === 'grid' ? 'flex-col' : 'items-start'} gap-3 active:scale-[0.98] transition-transform cursor-pointer`}
              >
                {/* Product Thumbnail */}
                <div className={`${viewMode === 'grid' ? 'w-full aspect-square' : 'w-14 h-14'} bg-gray-50 rounded-xl overflow-hidden shrink-0 border border-gray-100 relative`}>
                  <img 
                    src={product.image_url} 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=1000&auto=format&fit=crop'
                    }}
                    className="w-full h-full object-cover"
                  />
                  {viewMode === 'grid' && (
                    <div className="absolute top-2 left-2">
                      <Badge className={`${getAvailableStock(product) > 0 ? 'bg-white/90 text-blue-700' : 'bg-red-50/90 text-red-600'} border-none text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest shadow-sm backdrop-blur-sm`}>
                        {getAvailableStock(product) > 0 ? `${getAvailableStock(product)} Stock` : 'Out'}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Product Info (Wrapped & Normal Form) */}
                <div className="flex-1 min-w-0 flex flex-col justify-between w-full">
                  <div>
                    <h3 className="text-[11px] font-black text-gray-900 leading-tight break-words line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">
                      {product.brand || product.name.split(' ')[0]} • {product.subcategory || product.category}
                    </p>
                  </div>

                  <div className={`flex items-end justify-between ${viewMode === 'grid' ? 'mt-3 pt-3' : 'mt-2 pt-2'} border-t border-gray-50 w-full`}>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Unit Price</span>
                      <span className="text-[13px] font-black text-[#4CB963]">
                        ₹{product.price.toLocaleString()}
                      </span>
                    </div>
                    {viewMode === 'list' && (
                      <div>
                        <Badge className={`${getAvailableStock(product) > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'} border-none text-[8px] font-bold px-2 py-0 rounded-md uppercase tracking-widest`}>
                          {getAvailableStock(product) > 0 ? `${getAvailableStock(product)} Stock` : 'Out'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
              <Package className="h-8 w-8 text-gray-300" />
            </div>
            <h3 className="text-sm font-bold text-gray-700">No inventory found</h3>
            <p className="text-[10px] text-gray-400 mt-1 max-w-[200px]">We couldn't find any items matching your search.</p>
          </div>
        )}
      </div>

      {/* Product Details Modal/Sheet */}
      <Sheet open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-0 max-h-[85vh] flex flex-col">
          {selectedProduct && (
            <>
              {/* Product Image Header */}
              <div className="relative w-full h-56 bg-gray-50 shrink-0">
                <img 
                  src={selectedProduct.image_url} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=1000&auto=format&fit=crop'
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="p-5 overflow-y-auto flex-1 space-y-6">
                {/* Title & Brand */}
                <div>
                  <h2 className="text-[17px] font-black text-gray-900 leading-snug">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5">
                    {selectedProduct.brand || selectedProduct.name.split(' ')[0]} • {selectedProduct.subcategory || selectedProduct.category}
                  </p>
                </div>

                {/* Price & Stock (Compact row) */}
                <div className="flex items-center gap-4 bg-[#f7f7f5] p-4 rounded-2xl border border-[#ededeb]">
                  <div className="flex-1">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Unit Price</span>
                    <span className="text-[17px] font-black text-[#4CB963]">
                      ₹{selectedProduct.price?.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-[#ededeb]"></div>
                  <div className="flex-1 pl-2">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Stock Availability</span>
                    <Badge className={`${getAvailableStock(selectedProduct) > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'} border-none text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest`}>
                      {getAvailableStock(selectedProduct)} Items
                    </Badge>
                  </div>
                </div>

                {/* Grid for SKU and details */}
                <div className="grid grid-cols-2 gap-4">
                   {selectedProduct.sku && (
                     <div>
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">SKU</span>
                       <span className="text-[13px] font-semibold text-gray-900">{selectedProduct.sku}</span>
                     </div>
                   )}
                   {selectedProduct.hsn_code && (
                     <div>
                       <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">HSN Code</span>
                       <span className="text-[13px] font-semibold text-gray-900">{selectedProduct.hsn_code}</span>
                     </div>
                   )}
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description</h3>
                    <p className="text-[13px] text-gray-600 leading-relaxed font-medium">
                      {selectedProduct.description}
                    </p>
                  </div>
                )}
                
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
