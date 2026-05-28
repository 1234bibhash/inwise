'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Building2, Hash, CreditCard, MapPin, Save, Plus, Trash2, ArrowLeft, Loader2,
  PenTool, Upload, Sparkles, Camera
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getBusinessSettings, updateBusinessSettings, BusinessSettings } from '@/lib/services/settingsService'

export default function MobileSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  // Signature States
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null)
  const [cropBox, setCropBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    const data = await getBusinessSettings()
    
    // Migrate legacy data
    if (!data.bank_accounts) data.bank_accounts = []
    if (data.bank_accounts.length === 0 && data.bank_name) {
      data.bank_accounts.push({ bank_name: data.bank_name, account_number: data.account_number, ifsc_code: data.ifsc_code })
    }
    
    if (!data.upi_ids) data.upi_ids = []
    if (data.upi_ids.length === 0 && data.upi_id) {
      data.upi_ids.push(data.upi_id)
    }

    setSettings(data)
  }

  const handleUpdate = (field: keyof BusinessSettings, value: string) => {
    if (!settings) return
    setSettings(prev => prev ? { ...prev, [field]: value } : prev)
  }

  const processSignature = (img: HTMLImageElement, customCrop?: { x: number, y: number, w: number, h: number }) => {
    setIsProcessing(true)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const crop = customCrop || { x: 0, y: 0, w: img.width, h: img.height }
    const maxDim = 1200
    const scale = Math.min(maxDim / crop.w, maxDim / crop.h, 1)
    canvas.width = crop.w * scale
    canvas.height = crop.h * scale
    
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height)
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const width = canvas.width
    const height = canvas.height
    
    const processedData = new Uint8ClampedArray(data.length)
    
    const windowSize = 5
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        let sum = 0, count = 0
        for (let dy = -Math.floor(windowSize/2); dy <= Math.floor(windowSize/2); dy++) {
          for (let dx = -Math.floor(windowSize/2); dx <= Math.floor(windowSize/2); dx++) {
            const ny = y + dy, nx = x + dx
            if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
              const ni = (ny * width + nx) * 4
              sum += (data[ni] * 0.299 + data[ni+1] * 0.587 + data[ni+2] * 0.114)
              count++
            }
          }
        }
        const localAvg = sum / count
        const current = (data[i] * 0.299 + data[i+1] * 0.587 + data[i+2] * 0.114)
        if (current < localAvg - 15 && current < 195) {
          processedData[i] = 0; processedData[i+1] = 0; processedData[i+2] = 0; processedData[i+3] = 255
        } else {
          processedData[i+3] = 0
        }
      }
    }
    
    let minX = width, minY = height, maxX = 0, maxY = 0
    let hasInk = false
    const finalData = new Uint8ClampedArray(processedData.length)
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4
        if (processedData[i+3] > 0) {
          let neighbors = 0
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue
              if (processedData[((y + dy) * width + (x + dx)) * 4 + 3] > 0) neighbors++
            }
          }
          if (neighbors >= 2) {
            finalData[i] = 0; finalData[i+1] = 0; finalData[i+2] = 0; finalData[i+3] = 255
            minX = Math.min(minX, x); minY = Math.min(minY, y)
            maxX = Math.max(maxX, x); maxY = Math.max(maxY, y)
            hasInk = true
          }
        }
      }
    }

    if (hasInk) {
      const pad = 15
      const cropW = (maxX - minX) + (pad * 2)
      const cropH = (maxY - minY) + (pad * 2)
      const startX = Math.max(0, minX - pad)
      const startY = Math.max(0, minY - pad)
      const cropCanvas = document.createElement('canvas')
      cropCanvas.width = cropW; cropCanvas.height = cropH
      const cropCtx = cropCanvas.getContext('2d')
      if (cropCtx) {
        const finalImageData = new ImageData(finalData, width, height)
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = width; tempCanvas.height = height
        tempCanvas.getContext('2d')?.putImageData(finalImageData, 0, 0)
        cropCtx.drawImage(tempCanvas, startX, startY, cropW, cropH, 0, 0, cropW, cropH)
        setSettings(prev => prev ? { ...prev, signature_url: cropCanvas.toDataURL('image/png') } : prev)
      }
    }
    setIsProcessing(false)
  }

  async function handleSave() {
    if (!settings) return
    
    setIsSaving(true)
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('business_settings', JSON.stringify(settings))
        window.dispatchEvent(new CustomEvent('settingsUpdated'))
      }
      await updateBusinessSettings(settings)
      toast.success('Settings Saved Successfully')
      router.back()
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5]">
        <Loader2 className="w-6 h-6 animate-spin text-[#4CB963]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] pb-24 text-[#37352f]">
      {/* Unified Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#e9e9e8] px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-full shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <div className="w-10 h-10 bg-[#4CB963]/10 text-[#4CB963] rounded-xl flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 relative group">
            {settings.logo_url ? (
              <img src={settings.logo_url} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              settings.name ? settings.name.charAt(0).toUpperCase() : 'B'
            )}
          </div>
          <div className="min-w-0 pr-2">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest truncate">Business Account</p>
            <h1 className="text-sm font-bold text-[#37352f] leading-tight truncate">{settings.name || 'Entity Name'}</h1>
          </div>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-[#4CB963] hover:bg-[#3da352] text-white h-8 text-xs px-4 rounded-full shadow-md shrink-0"
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
          Save
        </Button>
      </header>

      <div className="p-4 space-y-6">
        {/* 1. Business Identity */}
        <section className="bg-white p-4 rounded-2xl border border-[#e9e9e8] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Business Identity</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 border border-gray-100 p-3 rounded-xl bg-gray-50">
              <div className="w-16 h-16 bg-white border border-gray-200 rounded-xl flex items-center justify-center font-bold text-2xl text-[#4CB963] overflow-hidden shrink-0 relative group">
                {settings.logo_url ? (
                  <img src={settings.logo_url} className="w-full h-full object-contain" />
                ) : (
                  settings.name ? settings.name.charAt(0).toUpperCase() : 'B'
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera className="w-5 h-5 text-white" />
                </div>
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = () => handleUpdate('logo_url', reader.result as string)
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Business Logo</Label>
                <p className="text-[9px] text-gray-400">Tap to upload your brand logo.</p>
                {settings.logo_url && (
                  <button onClick={() => handleUpdate('logo_url', '')} className="text-[9px] font-bold text-red-500 mt-1 uppercase tracking-widest">Remove Logo</button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Entity Name</Label>
              <input 
                value={settings.name || ''} 
                onChange={e => handleUpdate('name', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#4CB963]/50" 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Official Email</Label>
              <input 
                value={settings.email || ''} 
                onChange={e => handleUpdate('email', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#4CB963]/50 break-all" 
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Primary Phone</Label>
                <input 
                  value={settings.phone_primary || ''} 
                  onChange={e => handleUpdate('phone_primary', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#4CB963]/50" 
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Alt Phone</Label>
                <input 
                  value={settings.phone_secondary || ''} 
                  onChange={e => handleUpdate('phone_secondary', e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#4CB963]/50" 
                />
              </div>
            </div>
            
            <div className="w-full h-px bg-gray-100 my-4" />

            {/* Authorized Signatory Section */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2">
                <PenTool className="h-4 w-4 text-blue-600" />
                <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Authorized Signatory</Label>
              </div>

              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Source Photo</Label>
                    {originalImg && <span className="text-[8px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Drag to Crop</span>}
                  </div>
                  <div 
                    className="h-48 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center relative group overflow-hidden select-none touch-none"
                    onTouchStart={(e) => {
                      if (!originalImg) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      setSelectionStart({ x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top })
                      setIsSelecting(true)
                      setCropBox(null)
                    }}
                    onTouchMove={(e) => {
                      if (!isSelecting || !selectionStart) return
                      e.preventDefault() // prevent scroll
                      const rect = e.currentTarget.getBoundingClientRect()
                      const currentX = e.touches[0].clientX - rect.left
                      const currentY = e.touches[0].clientY - rect.top
                      setCropBox({
                        x: Math.min(selectionStart.x, currentX),
                        y: Math.min(selectionStart.y, currentY),
                        w: Math.abs(currentX - selectionStart.x),
                        h: Math.abs(currentY - selectionStart.y)
                      })
                    }}
                    onTouchEnd={(e) => {
                      setIsSelecting(false)
                      if (cropBox && originalImg) {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const scaleX = originalImg.width / rect.width
                        const scaleY = originalImg.height / rect.height
                        
                        const imgCrop = {
                          x: cropBox.x * scaleX,
                          y: cropBox.y * scaleY,
                          w: cropBox.w * scaleX,
                          h: cropBox.h * scaleY
                        }
                        processSignature(originalImg, imgCrop)
                      }
                    }}
                    onMouseDown={(e) => {
                      if (!originalImg) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      setSelectionStart({ x: e.clientX - rect.left, y: e.clientY - rect.top })
                      setIsSelecting(true)
                      setCropBox(null)
                    }}
                    onMouseMove={(e) => {
                      if (!isSelecting || !selectionStart) return
                      const rect = e.currentTarget.getBoundingClientRect()
                      const currentX = e.clientX - rect.left
                      const currentY = e.clientY - rect.top
                      setCropBox({
                        x: Math.min(selectionStart.x, currentX),
                        y: Math.min(selectionStart.y, currentY),
                        w: Math.abs(currentX - selectionStart.x),
                        h: Math.abs(currentY - selectionStart.y)
                      })
                    }}
                    onMouseUp={(e) => {
                      setIsSelecting(false)
                      if (cropBox && originalImg) {
                        const rect = e.currentTarget.getBoundingClientRect()
                        const scaleX = originalImg.width / rect.width
                        const scaleY = originalImg.height / rect.height
                        
                        const imgCrop = {
                          x: cropBox.x * scaleX,
                          y: cropBox.y * scaleY,
                          w: cropBox.w * scaleX,
                          h: cropBox.h * scaleY
                        }
                        processSignature(originalImg, imgCrop)
                      }
                    }}
                  >
                    {originalImg ? (
                      <>
                        <img 
                          src={originalImg.src} 
                          className="w-full h-full object-cover pointer-events-none opacity-50" 
                        />
                        {cropBox && (
                          <div 
                            className="absolute border-2 border-blue-600 bg-blue-600/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.3)] pointer-events-none"
                            style={{
                              left: cropBox.x,
                              top: cropBox.y,
                              width: cropBox.w,
                              height: cropBox.h
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="h-5 w-5 text-gray-400" />
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center">
                          Upload photo
                        </p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      className={`absolute inset-0 opacity-0 ${originalImg ? 'hidden' : 'cursor-pointer'}`} 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            const img = new Image()
                            img.onload = () => {
                              setOriginalImg(img)
                              processSignature(img)
                            }
                            img.src = event.target?.result as string
                          }
                          reader.readAsDataURL(file)
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Extracted Asset</Label>
                  <div className="h-40 rounded-xl border border-gray-200 bg-white flex items-center justify-center relative overflow-hidden">
                    {isProcessing ? (
                      <div className="flex flex-col items-center gap-2 animate-pulse">
                        <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Isolating...</span>
                      </div>
                    ) : settings?.signature_url ? (
                      <div className="flex flex-col items-center gap-3">
                        <img src={settings.signature_url} className="max-h-[100px] object-contain mix-blend-multiply" />
                        <span className="text-[8px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full">Solid Asset Isolated</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center px-4">
                        <Sparkles className="h-4 w-4 text-gray-300" />
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                          Drag over signature in photo<br/>to extract ink
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {originalImg && (
                  <div className="flex items-center justify-end gap-3 mt-1">
                    <button 
                      onClick={() => {
                        handleUpdate('signature_url', '')
                        setCropBox(null)
                      }}
                      className="text-[9px] font-bold text-gray-500 uppercase tracking-widest hover:text-red-600"
                    >
                      Clear Extract
                    </button>
                    <button 
                      onClick={() => {
                        setOriginalImg(null)
                        setCropBox(null)
                        handleUpdate('signature_url', '')
                      }}
                      className="text-[9px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
                    >
                      Upload New
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2. Fiscal & GST */}
        <section className="bg-white p-4 rounded-2xl border border-[#e9e9e8] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <Hash className="w-4 h-4 text-orange-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Fiscal & GST</h2>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">GSTIN Number</Label>
              <input 
                value={settings.gst_number || ''} 
                onChange={e => handleUpdate('gst_number', e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono font-bold text-gray-900 outline-none focus:ring-2 focus:ring-[#4CB963]/50 break-all" 
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">PAN Number</Label>
              <input 
                value={settings.pan_number || ''} 
                onChange={e => handleUpdate('pan_number', e.target.value.toUpperCase())}
                className="w-full h-10 px-3 rounded-lg bg-gray-50 border border-gray-200 text-xs font-mono font-bold text-gray-900 uppercase outline-none focus:ring-2 focus:ring-[#4CB963]/50 break-all" 
              />
            </div>
          </div>
        </section>

        {/* 3. Bank & Payments */}
        <section className="bg-white p-4 rounded-2xl border border-[#e9e9e8] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#4CB963]" />
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Bank & Payments</h2>
            </div>
            <button 
              onClick={() => setSettings({
                ...settings, 
                bank_accounts: [...(settings.bank_accounts || []), { bank_name: '', account_number: '', ifsc_code: '' }]
              })}
              className="text-[10px] font-bold text-[#4CB963] flex items-center bg-[#4CB963]/10 px-2 py-1 rounded-md"
            >
              <Plus className="w-3 h-3 mr-1" /> Add Bank
            </button>
          </div>
          
          <div className="space-y-4">
            {settings.bank_accounts && settings.bank_accounts.length > 0 ? (
              settings.bank_accounts.map((bank, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-xl border border-gray-200 relative flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      const newBanks = [...settings.bank_accounts!]
                      newBanks.splice(index, 1)
                      setSettings({...settings, bank_accounts: newBanks})
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-200 text-red-500 rounded-full flex items-center justify-center shadow-sm"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  
                  <div className="w-full space-y-1">
                    <Label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Bank Name</Label>
                    <input 
                      value={bank.bank_name} 
                      onChange={e => {
                        const newBanks = [...settings.bank_accounts!]
                        newBanks[index].bank_name = e.target.value
                        setSettings({...settings, bank_accounts: newBanks})
                      }}
                      className="w-full h-9 px-2 rounded-md bg-white border border-gray-200 text-xs font-bold outline-none focus:ring-2 focus:ring-[#4CB963]/50" 
                    />
                  </div>
                  <div className="w-[calc(50%-0.25rem)] space-y-1">
                    <Label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">A/C No.</Label>
                    <input 
                      value={bank.account_number} 
                      onChange={e => {
                        const newBanks = [...settings.bank_accounts!]
                        newBanks[index].account_number = e.target.value
                        setSettings({...settings, bank_accounts: newBanks})
                      }}
                      className="w-full h-9 px-2 rounded-md bg-white border border-gray-200 text-xs font-mono font-bold outline-none focus:ring-2 focus:ring-[#4CB963]/50 break-all" 
                    />
                  </div>
                  <div className="w-[calc(50%-0.25rem)] space-y-1">
                    <Label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">IFSC</Label>
                    <input 
                      value={bank.ifsc_code} 
                      onChange={e => {
                        const newBanks = [...settings.bank_accounts!]
                        newBanks[index].ifsc_code = e.target.value.toUpperCase()
                        setSettings({...settings, bank_accounts: newBanks})
                      }}
                      className="w-full h-9 px-2 rounded-md bg-white border border-gray-200 text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-[#4CB963]/50 break-all" 
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[10px] text-gray-400 text-center font-medium italic">No bank accounts configured.</p>
            )}
          </div>

          <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-2">
            <div className="w-full flex items-center justify-between">
              <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">UPI IDs (QR)</Label>
              <button 
                onClick={() => setSettings({
                  ...settings, 
                  upi_ids: [...(settings.upi_ids || []), '']
                })}
                className="text-[9px] font-bold text-purple-600 flex items-center bg-purple-50 px-2 py-1 rounded-md"
              >
                <Plus className="w-3 h-3 mr-1" /> Add UPI
              </button>
            </div>
            
            {settings.upi_ids && settings.upi_ids.length > 0 ? (
              <div className="flex flex-wrap gap-2 w-full">
                {settings.upi_ids.map((upi, index) => (
                  <div key={index} className="flex items-center gap-1 bg-purple-50 border border-purple-100 rounded-lg px-2 py-1 w-full flex-wrap">
                    <input
                      type="text"
                      placeholder="username@bank"
                      value={upi}
                      onChange={e => {
                        const newUpis = [...settings.upi_ids!]
                        newUpis[index] = e.target.value
                        setSettings({...settings, upi_ids: newUpis})
                      }}
                      className="bg-transparent border-none outline-none text-xs font-bold text-gray-900 flex-1 min-w-[150px] break-all"
                    />
                    <button
                      onClick={() => {
                        const newUpis = [...settings.upi_ids!]
                        newUpis.splice(index, 1)
                        setSettings({...settings, upi_ids: newUpis})
                      }}
                      className="p-1 text-purple-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400 text-center font-medium italic w-full">No UPI IDs configured.</p>
            )}
          </div>
        </section>

        {/* 4. Locations */}
        <section className="bg-white p-4 rounded-2xl border border-[#e9e9e8] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
            <MapPin className="w-4 h-4 text-red-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-800">Locations</h2>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Regd. Address</Label>
              <textarea 
                value={settings.address_regd || ''} 
                onChange={e => {
                  handleUpdate('address_regd', e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${e.target.scrollHeight}px`
                }}
                ref={el => {
                  if (el) {
                    el.style.height = 'auto'
                    el.style.height = `${el.scrollHeight}px`
                  }
                }}
                className="w-full min-h-[60px] p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#4CB963]/50 break-words resize-none overflow-hidden" 
                placeholder="Enter complete registered address..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Operating Address (If Different)</Label>
              <textarea 
                value={settings.address_operating || ''} 
                onChange={e => {
                  handleUpdate('address_operating', e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = `${e.target.scrollHeight}px`
                }}
                ref={el => {
                  if (el) {
                    el.style.height = 'auto'
                    el.style.height = `${el.scrollHeight}px`
                  }
                }}
                className="w-full min-h-[60px] p-3 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#4CB963]/50 break-words resize-none overflow-hidden" 
                placeholder="Enter operational branch address..."
              />
            </div>
          </div>
        </section>

      </div>
    </div>
  )
}
