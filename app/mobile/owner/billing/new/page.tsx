'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Plus, Minus, X, CreditCard, Banknote, Landmark, CheckCircle2 } from 'lucide-react'
import { getProducts, type Product } from '@/lib/services/productService'
import { createInvoice } from '@/lib/services/invoiceService'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export default function MobileCreateBillPage() {
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  
  // Products State
  const [products, setProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<{product: Product, quantity: number, price: number}[]>([])
  
  // UI States
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Payment State
  const [paymentMode, setPaymentMode] = useState('Cash')
  const [financeProvider, setFinanceProvider] = useState('Bajaj Finserv')
  const [paidAmount, setPaidAmount] = useState('')

  useEffect(() => {
    // Load customer from session storage
    const draftStr = sessionStorage.getItem('inwise_draft_customer')
    if (draftStr) {
      setCustomer(JSON.parse(draftStr))
    } else {
      router.replace('/mobile/owner/billing')
    }

    loadProducts()
  }, [])

  async function loadProducts() {
    try {
      const data = await getProducts()
      setProducts(data || [])
    } catch (e) {
      console.error(e)
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const addToCart = (product: Product) => {
    const existing = cart.find(c => c.product.id === product.id)
    if (existing) {
      setCart(cart.map(c => c.product.id === product.id ? {...c, quantity: c.quantity + 1} : c))
    } else {
      setCart([...cart, { product, quantity: 1, price: product.price || 0 }])
    }
    setIsProductSheetOpen(false)
    setSearchQuery('')
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(c => {
      if (c.product.id === productId) {
        const newQ = Math.max(1, c.quantity + delta)
        return { ...c, quantity: newQ }
      }
      return c
    }))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(c => c.product.id !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const tax = subtotal * 0.18 // Dummy 18% tax for simplicity on mobile, can be adjusted
  const total = subtotal + tax
  const paid = parseFloat(paidAmount) || 0
  const pending = Math.max(0, total - paid)

  const handleSubmit = async () => {
    if (!customer || cart.length === 0) return
    setIsSubmitting(true)

    try {
      const payload = {
        invoice_number: `INW/${Math.floor(1000 + Math.random() * 9000)}/26-27`,
        customer_name: customer.name,
        customer_phone: customer.phone,
        customer_email: customer.email,
        total_amount: total,
        status: pending <= 0 ? 'paid' : 'pending',
        is_receipt_invoice: false,
        payment_info: {
          mode: paymentMode,
          finance_provider: paymentMode === 'Finance' ? financeProvider : null,
          paid_amount: paid,
          pending_amount: pending,
          down_payment: paymentMode === 'Finance' ? paid : 0
        },
        items: cart.map(c => ({
          product_id: c.product.id,
          name: c.product.name,
          quantity: c.quantity,
          base_price: c.price,
          amount: c.price * c.quantity
        }))
      }

      await createInvoice(payload)
      sessionStorage.removeItem('inwise_draft_customer')
      router.push('/mobile/owner/billing')
    } catch (e) {
      console.error(e)
      alert("Failed to create invoice")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!customer) return null

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col font-sans">
      {/* Header */}
      <div className="bg-white px-4 py-4 shadow-sm border-b border-[#e9e9e8] sticky top-0 z-20 flex items-center gap-3">
        <button onClick={() => router.back()} className="active:scale-90 transition-transform">
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-[16px] font-black text-gray-900 leading-tight">Create Invoice</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{customer.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-28">
        
        {/* Step 2: Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Added Products</h3>
            <button 
              onClick={() => setIsProductSheetOpen(true)}
              className="text-[11px] font-bold text-[#4CB963] uppercase tracking-widest flex items-center gap-1 active:opacity-70"
            >
              <Plus className="w-3 h-3" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {cart.map(item => (
              <div key={item.product.id} className="bg-white p-3 rounded-2xl border border-[#ededeb] shadow-sm flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-[13px] font-bold text-gray-900 leading-snug truncate">{item.product.name}</h4>
                  <p className="text-[13px] font-black text-[#37352f] mt-1">₹{item.price.toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button onClick={() => removeFromCart(item.product.id)}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                  <div className="flex items-center gap-3 bg-[#f7f7f5] rounded-lg p-1 border border-[#ededeb]">
                    <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-700 active:scale-90 transition-transform">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-[12px] font-black w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-700 active:scale-90 transition-transform">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div 
                onClick={() => setIsProductSheetOpen(true)}
                className="h-20 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 active:bg-gray-50 transition-colors"
              >
                <Plus className="w-5 h-5 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Tap to add products</span>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Payment */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Payment Mode</h3>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'Cash', icon: Banknote },
              { id: 'UPI', icon: CreditCard },
              { id: 'Finance', icon: Landmark }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setPaymentMode(mode.id)}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${paymentMode === mode.id ? 'bg-[#37352f] border-[#37352f] text-white' : 'bg-white border-[#ededeb] text-gray-500'}`}
              >
                <mode.icon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{mode.id}</span>
              </button>
            ))}
          </div>
          
          {paymentMode === 'Finance' && (
            <div className="bg-white rounded-2xl border border-[#ededeb] p-3 shadow-sm mt-2">
              <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Finance Provider</label>
              <select 
                value={financeProvider}
                onChange={e => setFinanceProvider(e.target.value)}
                className="w-full text-[13px] font-bold text-gray-900 bg-[#f7f7f5] border border-[#ededeb] rounded-xl p-2.5 outline-none"
              >
                <option>Bajaj Finserv</option>
                <option>IDFC First</option>
                <option>HDFC Bank</option>
                <option>TVS Credit</option>
              </select>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#ededeb] p-3 shadow-sm mt-2">
            <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
              {paymentMode === 'Finance' ? 'Down Payment (₹)' : 'Paid Amount (₹)'}
            </label>
            <input 
              type="number"
              placeholder="0"
              value={paidAmount}
              onChange={e => setPaidAmount(e.target.value)}
              className="w-full text-[20px] font-black text-emerald-600 bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 outline-none placeholder:text-emerald-200"
            />
          </div>
        </div>

        {/* Totals Box */}
        <div className="bg-[#f7f7f5] rounded-2xl border border-[#ededeb] p-4 space-y-2">
           <div className="flex justify-between items-center text-[12px] font-semibold text-gray-500">
             <span>Subtotal</span>
             <span>₹{subtotal.toLocaleString()}</span>
           </div>
           <div className="flex justify-between items-center text-[12px] font-semibold text-gray-500 pb-2 border-b border-[#ededeb]">
             <span>Tax (18% est.)</span>
             <span>₹{tax.toLocaleString()}</span>
           </div>
           <div className="flex justify-between items-center pt-1">
             <span className="text-[14px] font-black text-gray-900">Total</span>
             <span className="text-[18px] font-black text-gray-900">₹{total.toLocaleString()}</span>
           </div>
           {pending > 0 && (
             <div className="flex justify-between items-center pt-1">
               <span className="text-[11px] font-bold text-orange-600 uppercase tracking-widest">Pending Due</span>
               <span className="text-[13px] font-black text-orange-600">₹{pending.toLocaleString()}</span>
             </div>
           )}
        </div>
      </div>

      {/* Sticky Bottom Actions */}
      <div className="bg-white p-4 border-t border-[#ededeb] fixed bottom-[68px] left-0 right-0 z-40 pb-safe">
        <button 
          onClick={handleSubmit}
          disabled={cart.length === 0 || isSubmitting}
          className={`w-full h-14 rounded-2xl font-black text-white flex items-center justify-center gap-2 transition-transform ${cart.length === 0 || isSubmitting ? 'bg-gray-300' : 'bg-[#37352f] shadow-lg active:scale-[0.98]'}`}
        >
          {isSubmitting ? (
            <span className="animate-pulse">Generating Invoice...</span>
          ) : (
            <>Generate Invoice <CheckCircle2 className="w-5 h-5" /></>
          )}
        </button>
      </div>

      {/* Product Selection Sheet */}
      <Sheet open={isProductSheetOpen} onOpenChange={setIsProductSheetOpen}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl border-none shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-0 flex flex-col bg-[#f7f7f5]">
          <div className="bg-white p-4 border-b border-[#ededeb] shrink-0 rounded-t-3xl space-y-4">
            <h2 className="text-[18px] font-black text-gray-900 leading-snug">Select Products</h2>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search inventory..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f7f7f5] border border-[#ededeb] rounded-xl pl-9 pr-4 py-2.5 text-[13px] font-semibold focus:outline-none focus:border-[#4CB963] focus:ring-1 focus:ring-[#4CB963] placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
            {filteredProducts.map(p => (
              <div 
                key={p.id}
                onClick={() => addToCart(p)}
                className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
              >
                <div>
                  <h4 className="text-[13px] font-bold text-gray-900 leading-snug">{p.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Stk: {p.stock_count}</p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] font-black text-[#4CB963]">₹{p.price?.toLocaleString() || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

    </div>
  )
}
