'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  ShieldCheck, 
  Truck, 
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

export default function CheckoutPage() {
  const [step, setStep] = useState<'details' | 'success'>('details')

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white rounded-[40px] p-12 border border-[#e9e9e8] shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-500">
           <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
           </div>
           <div className="space-y-3">
              <h1 className="text-3xl font-black text-[#37352f] tracking-tight">Order Confirmed!</h1>
              <p className="text-sm text-[#acaba9] font-medium leading-relaxed">
                Thank you for choosing Hooghly Electronics. Your order <span className="font-bold text-[#37352f]">#HE-ORD-9921</span> has been placed successfully.
              </p>
           </div>
           <div className="p-6 bg-[#f7f7f5] rounded-3xl border border-[#e9e9e8] text-left">
              <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest mb-2">Delivery Estimated</p>
              <p className="text-sm font-bold text-[#37352f]">Tomorrow, by 6:00 PM</p>
           </div>
           <div className="flex flex-col gap-3 pt-4">
              <Link href="/customer/orders">
                 <Button className="w-full h-14 bg-[#37352f] hover:bg-black text-white rounded-2xl font-black transition-all">
                    Track your order
                 </Button>
              </Link>
              <Link href="/customer/home">
                 <Button variant="ghost" className="w-full text-blue-600 font-bold hover:bg-blue-50">
                    Return to home
                 </Button>
              </Link>
           </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] pb-20">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 border-b border-[#e9e9e8]">
        <div className="max-w-[1200px] mx-auto px-8 py-4 flex items-center justify-between">
          <Link href="/customer/home">
            <div className="flex items-center gap-3 group cursor-pointer">
               <ArrowLeft className="h-5 w-5 text-[#37352f] group-hover:-translate-x-1 transition-transform" />
               <span className="text-sm font-black text-[#37352f]">Hooghly Electronics</span>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-[10px] font-black text-[#acaba9] uppercase tracking-widest">
            Secure Checkout <ShieldCheck className="h-4 w-4 text-green-600" />
          </div>
        </div>
      </header>

      <div className="max-w-[1200px] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Checkout Form */}
          <div className="lg:col-span-8 space-y-8">
            <section className="bg-white rounded-[32px] p-8 border border-[#e9e9e8] shadow-sm space-y-8">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                     <MapPin className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-black text-[#37352f]">Delivery Address</h2>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 bg-[#f7f7f5] rounded-2xl border-2 border-blue-600 relative">
                     <div className="absolute top-4 right-4 h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                     </div>
                     <p className="text-xs font-black text-blue-600 uppercase mb-3">Primary Home</p>
                     <p className="text-sm font-bold text-[#37352f]">Salung Prastyo</p>
                     <p className="text-xs text-[#acaba9] mt-1 leading-relaxed">
                        123 River Road, Near Imambara<br />
                        Hooghly, West Bengal 712101
                     </p>
                  </div>
                  <button className="p-6 border-2 border-dashed border-[#e9e9e8] rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-[#f7f7f5] transition-all group">
                     <div className="h-8 w-8 rounded-full bg-[#efefed] flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-xl font-bold text-[#acaba9]">+</span>
                     </div>
                     <span className="text-xs font-black text-[#acaba9]">Add New Address</span>
                  </button>
               </div>
            </section>

            <section className="bg-white rounded-[32px] p-8 border border-[#e9e9e8] shadow-sm space-y-8">
               <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center">
                     <CreditCard className="h-5 w-5 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-black text-[#37352f]">Payment Method</h2>
               </div>

               <div className="space-y-3">
                  {[
                    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when your tech arrives' },
                    { id: 'upi', label: 'UPI / NetBanking', desc: 'Google Pay, PhonePe, or Cards' },
                  ].map((method, idx) => (
                    <div 
                      key={method.id}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${
                        idx === 0 ? 'border-blue-600 bg-blue-50/20' : 'border-[#e9e9e8] hover:bg-[#f7f7f5]'
                      }`}
                    >
                       <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                         idx === 0 ? 'border-blue-600' : 'border-[#acaba9]'
                       }`}>
                          {idx === 0 && <div className="h-2.5 w-2.5 bg-blue-600 rounded-full" />}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-[#37352f]">{method.label}</p>
                          <p className="text-[10px] text-[#acaba9] font-medium">{method.desc}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-[#37352f] rounded-[40px] p-10 text-white shadow-2xl sticky top-24 space-y-10">
               <h3 className="text-2xl font-black tracking-tight">Order Summary</h3>
               
               <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                     <span className="text-white/60 font-medium">Subtotal</span>
                     <span className="font-bold">₹1,05,990</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-white/60 font-medium">Shipping</span>
                     <span className="text-green-400 font-bold uppercase text-[10px] tracking-widest mt-1">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                     <span className="text-white/60 font-medium">Hooghly Local Tax</span>
                     <span className="font-bold">₹0</span>
                  </div>
                  <div className="pt-4 border-t border-white/10 flex justify-between items-baseline">
                     <span className="text-lg font-black">Total</span>
                     <span className="text-4xl font-black tracking-tighter">₹1,05,990</span>
                  </div>
               </div>

               <div className="space-y-4 pt-6">
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                     <Truck className="h-5 w-5 text-blue-400" />
                     <p className="text-[10px] font-bold text-white/80">
                        Fast delivery available for <span className="text-white font-black">Hooghly, 712101</span>
                     </p>
                  </div>
                  <Button 
                    onClick={() => setStep('success')}
                    className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] font-black text-lg transition-all shadow-xl shadow-blue-900/40 border-none"
                  >
                    Place Your Order
                  </Button>
               </div>

               <div className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/40">
                  <Info className="h-3 w-3" /> 100% Secure Transaction
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
