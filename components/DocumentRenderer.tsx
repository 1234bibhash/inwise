"use client"

import React from 'react'

interface DocumentRendererProps {
  document: any;
  type: 'invoice' | 'receipt';
  businessSettings?: any;
}

// Simple Indian number to words converter
function numberToWords(num: number): string {
  num = Math.floor(num);
  if (num === 0) return 'ZERO RUPEES ONLY';
  const a = ['', 'ONE ', 'TWO ', 'THREE ', 'FOUR ', 'FIVE ', 'SIX ', 'SEVEN ', 'EIGHT ', 'NINE ', 'TEN ', 'ELEVEN ', 'TWELVE ', 'THIRTEEN ', 'FOURTEEN ', 'FIFTEEN ', 'SIXTEEN ', 'SEVENTEEN ', 'EIGHTEEN ', 'NINETEEN '];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const inWords = (n: number) => {
      let str = '';
      if (n > 99) {
          str += a[Math.floor(n / 100)] + 'HUNDRED ';
          n = n % 100;
      }
      if (n > 19) {
          str += b[Math.floor(n / 10)] + ' ';
          n = n % 10;
      }
      if (n > 0) {
          str += a[n];
      }
      return str;
  };

  let word = '';
  let crore = Math.floor(num / 10000000);
  let r = num % 10000000;
  let lakh = Math.floor(r / 100000);
  r = r % 100000;
  let thousand = Math.floor(r / 1000);
  r = r % 1000;
  let remaining = r;

  if (crore > 0) word += inWords(crore) + 'CRORE ';
  if (lakh > 0) word += inWords(lakh) + 'LAKH ';
  if (thousand > 0) word += inWords(thousand) + 'THOUSAND ';
  if (remaining > 0) word += inWords(remaining);

  return word.trim() + ' RUPEES ONLY';
}

export function DocumentRenderer({ document, type, businessSettings }: DocumentRendererProps) {
  if (!document) return null;

  const isReceipt = type === 'receipt' || document.is_receipt_invoice;
  const addressStr = businessSettings?.address_work || businessSettings?.address_regd || '';
  
  // Totals calculations
  const subtotal = ((document.total_amount || 0) - (document.tax_split?.cgst || 0) - (document.tax_split?.sgst || 0) - (document.tax_split?.igst || 0));
  const cgst = document.tax_split?.cgst || 0;
  const sgst = document.tax_split?.sgst || 0;
  const totalTax = cgst + sgst;
  const grandTotal = document.total_amount || 0;
  
  const qrData = encodeURIComponent(`Invoice: ${document.invoice_number} | Amount: Rs. ${Math.round(grandTotal)} | Date: ${new Date(document.created_at).toLocaleDateString('en-IN')}`);

  return (
    <div className="w-full overflow-x-auto custom-scrollbar pb-4">
      <div className="bg-white p-4 mx-auto min-w-[800px] max-w-[800px] text-[#2d2926] rounded-xl print:border-none print:shadow-none" id="document-print-area" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* 1. Header Section */}
      <div className="flex justify-between items-start mb-6">
        
        {/* Left: Logo & Company Info */}
        <div className="flex gap-3 max-w-[400px]">
          {businessSettings?.logo_url ? (
            <img src={businessSettings.logo_url} alt="Logo" className="w-16 h-16 object-contain" />
          ) : (
            <div className="w-16 h-16 bg-[#1a1c18] rounded flex flex-col items-center justify-center flex-shrink-0">
              <div className="flex gap-[2px]">
                <div className="w-1 h-8 bg-white skew-x-12 opacity-80" />
                <div className="w-1 h-10 bg-white skew-x-12" />
                <div className="w-1 h-10 bg-white skew-x-12" />
                <div className="w-1 h-8 bg-white skew-x-12 opacity-80" />
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-black uppercase tracking-wide leading-none">{businessSettings?.name || 'INWISE'}</h1>
            <p className="text-[9px] font-bold uppercase leading-tight mt-1 whitespace-pre-wrap">
              {addressStr}
            </p>
            <p className="text-[9px] font-bold uppercase leading-tight mt-1">
              STATE NAME: WEST BENGAL, CODE: 19
            </p>
            <div className="mt-2 space-y-0.5">
              <p className="text-[9px] font-bold uppercase">PHONE: {businessSettings?.phone_primary}</p>
              <p className="text-[9px] font-bold uppercase">E-MAIL: {businessSettings?.email}</p>
            </div>
            {businessSettings?.gst_number && (
              <p className="text-[9px] font-bold uppercase mt-2">GSTIN: {businessSettings.gst_number}</p>
            )}
          </div>
        </div>

        {/* Right: Grid */}
        <div className="w-[350px] border border-black flex flex-col text-[10px]">
          <div className="flex border-b border-black">
            <div className="flex-1 p-1.5 border-r border-black">
              <p className="text-[#6b7280] text-[8px] mb-0.5">Invoice No.</p>
              <p className="font-bold text-[#6b7280]">{document.invoice_number}</p>
            </div>
            <div className="flex-1 p-1.5">
              <p className="text-[#6b7280] text-[8px] mb-0.5">Dated</p>
              <p className="font-bold text-[#6b7280]">{new Date(document.created_at).toLocaleDateString('en-GB').replace(/\//g, '-')}</p>
            </div>
          </div>
          
          <div className="flex border-b border-black">
            <div className="flex-1 p-1.5 border-r border-black">
              <p className="text-[#6b7280] text-[8px] mb-0.5">Payment Mode</p>
              <p className="font-bold uppercase">{document.payment_info?.mode || document.payment_mode || 'CASH'}</p>
            </div>
            <div className="flex-1 p-1.5">
              <p className="text-[#6b7280] text-[8px] mb-0.5">Finance Provider</p>
              <p className="font-bold uppercase">{(document.payment_info?.mode || document.payment_mode)?.toLowerCase() === 'finance' ? (document.payment_info?.bank_name || 'N/A') : 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex">
            <div className="p-1.5 border-r border-black flex flex-col justify-between w-1/4">
              <p className="text-[#6b7280] text-[8px] mb-0.5">DP Amount</p>
              <p className="font-bold text-[#6b7280]">{(document.payment_info?.mode || document.payment_mode)?.toLowerCase() === 'finance' ? `₹ ${document.payment_info?.down_payment || 0}` : 'N/A'}</p>
            </div>
            <div className="p-1.5 border-r border-black flex flex-col justify-between w-1/4">
              <p className="text-[#6b7280] text-[8px] mb-0.5">EMI Amount</p>
              <p className="font-bold text-[#6b7280]">{(document.payment_info?.mode || document.payment_mode)?.toLowerCase() === 'finance' ? `₹ ${document.payment_info?.emi_amount || 0}` : 'N/A'}</p>
            </div>
            <div className="p-1.5 border-r border-black flex flex-col justify-between w-[15%]">
              <p className="text-[#6b7280] text-[8px] mb-0.5">Months</p>
              <p className="font-bold text-[#6b7280]">{(document.payment_info?.mode || document.payment_mode)?.toLowerCase() === 'finance' ? (document.payment_info?.emi_months || 0) : 'N/A'}</p>
            </div>
            <div className="p-1.5 flex flex-col justify-between w-[35%]">
              <div>
                <p className="text-[#6b7280] text-[8px] mb-0.5">Installation Required?</p>
                <div className="flex items-center gap-1 font-bold">
                  <div className="w-3 h-3 bg-gray-200 flex items-center justify-center text-[8px]">✓</div>
                  YES
                </div>
              </div>
              <p className="text-blue-600 font-bold text-[8px] mt-1 whitespace-nowrap">[COMPANY INSTALLATION]</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Buyer (Bill To) Section */}
      <div className="mb-4">
        <p className="text-[10px] font-black uppercase underline decoration-2 underline-offset-2 mb-2">BUYER (BILL TO)</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 max-w-[400px]">
          <div>
            <p className="text-[#9ca3af] text-[8px] font-bold uppercase mb-0.5">CLIENT NAME*</p>
            <p className="text-[10px] font-bold uppercase">{document.customer_name}</p>
          </div>
          <div>
            <p className="text-[#9ca3af] text-[8px] font-bold uppercase mb-0.5">CLIENT PHONE*</p>
            <p className="text-[10px] font-bold uppercase">{document.customer_phone}</p>
          </div>
          <div>
            <p className="text-[#9ca3af] text-[8px] font-bold uppercase mb-0.5">ALTERNATE PHONE</p>
            <p className="text-[10px] font-bold uppercase">ALT PHONE</p>
          </div>
          <div>
            <p className="text-[#9ca3af] text-[8px] font-bold uppercase mb-0.5">CLIENT EMAIL</p>
            <p className="text-[10px] font-bold uppercase">{document.customer_email || 'CLIENT EMAIL'}</p>
          </div>
          <div className="col-span-2 mt-1">
            <p className="text-[#9ca3af] text-[8px] font-bold uppercase mb-0.5">BILLING ADDRESS</p>
            <p className="text-[10px] font-bold uppercase">BILLING ADDRESS</p>
          </div>
          <div className="col-span-2 mt-1">
            <p className="text-[#9ca3af] text-[8px] font-bold uppercase mb-0.5">DELIVERY ADDRESS (IF DIFFERENT)</p>
            <p className="text-[10px] font-bold uppercase">DELIVERY ADDRESS (IF DIFFERENT)</p>
          </div>
          <div className="mt-1">
            <p className="text-[#9ca3af] text-[8px] font-bold uppercase mb-0.5">PIN CODE</p>
            <p className="text-[10px] font-bold uppercase">PIN CODE</p>
          </div>
          <div className="mt-1">
            <p className="text-[#9ca3af] text-[8px] font-bold uppercase mb-0.5">STATE / CODE</p>
            <p className="text-[10px] font-bold uppercase">WEST BENGAL</p>
          </div>
          <div className="col-span-2 mt-1">
            <p className="text-[#9ca3af] text-[8px] font-bold uppercase mb-0.5">GSTIN (CORPORATE BILLING)</p>
            <p className="text-[10px] font-bold uppercase">XXXX</p>
          </div>
        </div>
      </div>

      {/* 3. Table */}
      <div className="border border-black mb-4">
        <table className="w-full text-left">
          <thead className="bg-[#383330] text-white">
            <tr className="text-[9px] font-black uppercase">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-2">DESCRIPTION & TECHNICAL SPEC</th>
              <th className="py-2 px-2 text-center w-12">HSN</th>
              <th className="py-2 px-2 text-center w-12">GST</th>
              <th className="py-2 px-2 text-center w-10">QTY</th>
              <th className="py-2 px-2 text-center w-20">BASE PRICE</th>
              <th className="py-2 px-2 text-right w-24 leading-tight">RATE INCL.<br/>TAX</th>
              <th className="py-2 px-2 text-center w-16">DISCOUNT</th>
              <th className="py-2 px-2 text-right w-20">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black bg-white">
            {(document.items || []).map((item: any, idx: number) => {
              const basePrice = item.base_price || item.rate || 0;
              const taxRate = item.gst_rate || 0;
              const rateInclTax = basePrice * (1 + (taxRate/100));
              const amount = item.amount || item.final_amount || (rateInclTax * item.quantity);

              return (
                <tr key={idx} className="text-[10px] font-bold">
                  <td className="py-3 px-2 text-center align-top">{idx + 1}</td>
                  <td className="py-3 px-2 align-top">
                    <p className="uppercase mb-1">{item.name}</p>
                    <p className="text-[8px] text-[#6b7280] font-normal tracking-tight">
                      SKU: <span className="text-[#374151]">EXT-{1000+idx}</span> | BRAND: <span className="text-[#374151]">Lloyd</span> | MODEL: <span className="text-[#374151]">N/A</span>
                    </p>
                    <p className="text-[8px] text-[#6b7280] font-normal tracking-tight">
                      VAR: <span className="text-[#374151]">OTG / OVEN</span> | COLOR: <span className="text-[#374151]">N/A</span> | UNIT: <span className="text-[#374151]">pcs</span>
                    </p>
                  </td>
                  <td className="py-3 px-2 text-center align-top font-medium">{item.hsn_code || ''}</td>
                  <td className="py-3 px-2 text-center align-top">{taxRate}%</td>
                  <td className="py-3 px-2 text-center align-top">{item.quantity}</td>
                  <td className="py-3 px-2 text-center align-top">{basePrice.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-2 text-right align-top text-blue-600">{rateInclTax.toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                  <td className="py-3 px-2 text-center align-top font-medium">00%</td>
                  <td className="py-3 px-2 text-right align-top">₹{amount.toLocaleString('en-IN', {maximumFractionDigits: 0})}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 4. Bottom Grid */}
      <div className="flex justify-between items-end mb-4 text-[10px] font-bold mt-8">
        
        {/* Bottom Left */}
        <div className="w-[50%]">
          <div className="flex gap-4 mb-4">
            <div className="w-20 h-20 bg-gray-200 border border-gray-300 flex items-center justify-center flex-shrink-0 p-1">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`} alt="QR Code" className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <div className="flex flex-col justify-center gap-1">
              <p className="text-[8px] text-[#9ca3af] uppercase mb-0.5">BANK DETAILS</p>
              <p className="uppercase">{businessSettings?.bank_name || 'pnajab nation bank'}</p>
              <p className="uppercase">A/c: {businessSettings?.account_number || '1217129012-21'}</p>
              <p className="uppercase">IFSC: {businessSettings?.ifsc_code || '126127'}</p>
              <p className="uppercase">PAN: {businessSettings?.pan_number || 'ASDSAFSAF'}</p>
            </div>
          </div>
          
          <div className="border border-black">
            <div className="flex border-b border-black">
              <div className="w-[120px] p-2 text-[#9ca3af] text-[9px] uppercase border-r border-black flex items-center">
                AMOUNT IN WORDS:
              </div>
              <div className="p-2 text-[9px] uppercase font-black">
                {numberToWords(grandTotal)}
              </div>
            </div>
            <div className="flex">
              <div className="w-[120px] p-2 text-[#9ca3af] text-[9px] uppercase border-r border-black flex items-center">
                TAX IN WORDS:
              </div>
              <div className="p-2 text-[9px] uppercase font-black">
                {numberToWords(totalTax)}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Right */}
        <div className="w-[40%] flex flex-col gap-2">
          <div className="flex justify-between text-[#9ca3af] text-[9px] uppercase font-bold">
            <span>TAXABLE VALUE</span>
            <span className="text-black text-[10px]">₹{subtotal.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
          </div>
          <div className="flex justify-between text-[#9ca3af] text-[9px] uppercase font-bold">
            <span>CGST</span>
            <span className="text-black text-[10px]">₹{cgst.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
          </div>
          <div className="flex justify-between text-[#9ca3af] text-[9px] uppercase font-bold">
            <span>SGST</span>
            <span className="text-black text-[10px]">₹{sgst.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
          </div>
          <div className="flex justify-between text-[#9ca3af] text-[9px] uppercase font-bold">
            <span>ADDL. CHARGES (₹)</span>
            <span className="text-black text-[10px]"></span>
          </div>
          <div className="flex justify-between text-[#9ca3af] text-[9px] uppercase font-bold mb-1">
            <span>FINAL DISCOUNT (₹)</span>
            <span className="text-black text-[10px]"></span>
          </div>
          <div className="border-t-2 border-black pt-2 flex justify-between items-center">
            <span className="uppercase font-black text-[10px]">GRAND TOTAL</span>
            <span className="font-black text-xl">₹{grandTotal.toLocaleString('en-IN', {maximumFractionDigits: 0})}</span>
          </div>
        </div>
      </div>

      {/* 5. Footer */}
      <div className="border border-black flex">
        <div className="w-[55%] border-r border-black flex flex-col justify-between">
          <div className="p-2">
            <p className="text-[10px] font-black underline mb-1">Declaration</p>
            <p className="text-[9px]">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
          </div>
          <div className="border-t border-black p-2">
            <p className="text-[10px] font-black">Customer's Seal and Signature</p>
          </div>
        </div>
        <div className="w-[45%] p-2 flex flex-col items-end justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#37352f]">FOR INWISE</p>
          {businessSettings?.signature_url ? (
            <img src={businessSettings.signature_url} className="h-12 object-contain" />
          ) : (
            <div className="h-12 w-32 flex flex-col justify-end items-center mb-1">
              <span className="font-[cursive] text-3xl text-gray-800 -rotate-3 pr-8">Bibhash</span>
            </div>
          )}
          <p className="text-[8px] font-bold uppercase">AUTHORISED SIGNATORY</p>
        </div>
      </div>

      </div>
    </div>
  )
}

