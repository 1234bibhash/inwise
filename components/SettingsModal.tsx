'use client'

import React, { useState, useEffect } from 'react'
import { 
  X, 
  Building2, 
  Hash, 
  CreditCard, 
  Mail, 
  MapPin, 
  Phone, 
  Save, 
  ShieldCheck,
  Globe,
  Bell,
  Settings as SettingsIcon,
  User,
  Layout,
  Sparkles,
  Upload,
  Palette,
  Camera,
  PenTool,
  RotateCcw,
  CheckCircle2,
  Plus,
  Trash2
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { getBusinessSettings, updateBusinessSettings, BusinessSettings } from '@/lib/services/settingsService'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [activeTab, setActiveTab] = useState('Business')
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalImg, setOriginalImg] = useState<HTMLImageElement | null>(null)
  const [cropBox, setCropBox] = useState<{ x: number, y: number, w: number, h: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [selectionStart, setSelectionStart] = useState<{ x: number, y: number } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

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

  const processSignature = (img: HTMLImageElement, customCrop?: { x: number, y: number, w: number, h: number }) => {
    setIsProcessing(true)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const crop = customCrop || { x: 0, y: 0, w: img.width, h: img.height }
    const maxDim = 1200 // Higher fidelity for final asset
    const scale = Math.min(maxDim / crop.w, maxDim / crop.h, 1)
    canvas.width = crop.w * scale
    canvas.height = crop.h * scale
    
    ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height)
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const width = canvas.width
    const height = canvas.height
    
    const processedData = new Uint8ClampedArray(data.length)
    
    // Pass 1: Local Adaptive Thresholding for Solid Fill
    const windowSize = 5
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4
        let sum = 0, count = 0
        
        // Sample local neighborhood
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
        
        // Adaptive logic: If pixel is significantly darker than its neighborhood AND below a dark threshold
        // This ensures we get the "core" of the stroke, not just edges.
        if (current < localAvg - 15 && current < 195) {
          processedData[i] = 0; processedData[i+1] = 0; processedData[i+2] = 0; processedData[i+3] = 255
        } else {
          processedData[i+3] = 0
        }
      }
    }
    
    // Pass 2: Denoising & Bounding Box
    let minX = width, minY = height, maxX = 0, maxY = 0
    let hasInk = false
    const finalData = new Uint8ClampedArray(processedData.length)
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const i = (y * width + x) * 4
        if (processedData[i+3] > 0) {
          // Noise filter: must have at least 2 neighbors to survive
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
        handleUpdate('signature_url', cropCanvas.toDataURL('image/png'))
      }
    }
    setIsProcessing(false)
  }

  const handleUpdate = (field: keyof BusinessSettings, value: string) => {
    if (!settings) return
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }

  async function handleSave() {
    if (!settings) {
      console.error('SettingsTerminal: Attempted to save null settings')
      return
    }
    
    setIsSaving(true)
    console.log('SettingsTerminal: Initiating Settle & Sync Ledger protocol...')

    try {
      // Step 1: Immediate Local Sync & Event Broadcast
      // We do this first to ensure the UI is responsive even if cloud is slow
      if (typeof window !== 'undefined') {
        localStorage.setItem('business_settings', JSON.stringify(settings))
        window.dispatchEvent(new CustomEvent('settingsUpdated'))
      }

      // Step 2: Background Cloud Sync
      // We still await it but we've already prepared the UI to close
      await updateBusinessSettings(settings)
      
      toast.success('Ledger Synchronized')
      setHasChanges(false)
      
      // Step 3: Conclusive Auto-Resolution
      console.log('SettingsTerminal: Synchronization confirmed.')
    } catch (error) {
      console.error('SettingsTerminal: Synchronization failure:', error)
      toast.error('Sync failed - stored locally')
    } finally {
      setIsSaving(false)
      setIsProcessing(false)
    }
  }

  const SidebarItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
        activeTab === id ? 'bg-[#f0f0ef] text-[#37352f]' : 'text-[#787774] hover:bg-[#f0f0ef] hover:text-[#37352f]'
      }`}
    >
      <Icon className={`h-4 w-4 ${activeTab === id ? 'text-blue-600' : ''}`} />
      <span className="text-[13px] font-medium">{label}</span>
    </button>
  )

  if (!settings && isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        showCloseButton={false} 
        onInteractOutside={(e) => e.preventDefault()}
        className="!max-w-none w-[960px] h-[640px] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-white rounded-[20px] outline-none flex flex-col"
      >
        {/* Accessibility Requirements */}
        <div className="sr-only">
          <DialogHeader>
            <DialogTitle>Business Configuration Terminal</DialogTitle>
            <DialogDescription>Adjust your organization's administrative protocols and branding assets.</DialogDescription>
          </DialogHeader>
        </div>
        
        <div className="flex h-full w-full overflow-hidden">
          {/* Modal Sidebar */}
          <aside className="w-[260px] bg-[#fbfbfa] border-r border-[#efefed] p-6 flex flex-col">
            <div className="px-3 mb-8">
               <h2 className="text-[14px] font-black text-[#37352f]">Settings</h2>
            </div>
            
            <nav className="flex-1 space-y-0.5">
              <SidebarItem id="Business" icon={Building2} label="Business Entity" />
              <SidebarItem id="Fiscal" icon={Hash} label="Fiscal & GST" />
              <SidebarItem id="Settlement" icon={CreditCard} label="Bank & Payments" />
              <SidebarItem id="Locations" icon={MapPin} label="Office Locations" />
              
              <div className="pt-8 pb-3 px-3">
                 <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Preferences</p>
              </div>
              <SidebarItem id="Account" icon={User} label="Account Profile" />
              <SidebarItem id="Appearance" icon={Layout} label="Appearance" />
              <SidebarItem id="Notifications" icon={Bell} label="Notifications" />
            </nav>

            <div className="p-3">
               <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                  <div className="flex items-center gap-2 mb-1">
                     <ShieldCheck className="h-3 w-3 text-blue-600" />
                     <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Enterprise Sync</span>
                  </div>
                  <p className="text-[10px] text-blue-900/60 font-medium">Data is end-to-end encrypted and synced across all nodes.</p>
               </div>
            </div>
          </aside>

          {/* Modal Content */}
          <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
            <header className="h-[70px] flex items-center justify-between px-10 border-b border-[#f1f1f0] flex-shrink-0">
               <h3 className="text-[13px] font-black text-[#37352f] uppercase tracking-widest">{activeTab} Configuration</h3>
               <button onClick={onClose} className="p-2 hover:bg-[#f7f7f5] rounded-xl transition-all">
                  <X className="h-5 w-5 text-[#acaba9]" />
               </button>
            </header>

            <div className="flex-1 overflow-y-auto p-16 custom-scrollbar">
              <div className="max-w-[560px] space-y-12">
                {activeTab === 'Business' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                         <h4 className="text-2xl font-black text-[#37352f] tracking-tight">Business Profile</h4>
                         <p className="text-xs text-[#acaba9] font-medium">Configure your primary business identity and branding.</p>
                      </div>
                      
                      {/* Logo Upload Section */}
                      <div className="relative group">
                        <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-[#efefed] bg-[#fcfcfb] flex flex-col items-center justify-center overflow-hidden transition-all group-hover:border-blue-200 group-hover:bg-blue-50/30 relative">
                          {settings?.logo_url ? (
                            <img src={settings.logo_url} className="w-full h-full object-contain" />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <Camera className="h-5 w-5 text-[#acaba9]" />
                              <span className="text-[9px] font-bold text-[#acaba9] uppercase tracking-widest">Logo</span>
                            </div>
                          )}
                          <label className="absolute inset-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/5 transition-opacity">
                            <input 
                              type="file" 
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onloadend = () => {
                                    handleUpdate('logo_url', reader.result as string)
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }} 
                            />
                            <div className="bg-white p-1.5 rounded-lg shadow-xl scale-90 group-hover:scale-100 transition-transform">
                              <Upload className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                       {/* Authorized Signatory Section */}
                       <div className="p-6 bg-[#fcfcfb] rounded-[24px] border border-[#efefed] space-y-6">
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                                <PenTool className="h-4 w-4 text-blue-600" />
                                <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Authorized Signature</Label>
                             </div>
                          </div>
                          
                          <div className="space-y-6">
                             <div className="flex gap-6 items-start">
                                <div className="flex-1 space-y-3">
                                   <div className="flex items-center justify-between">
                                      <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Source Photo</Label>
                                      {originalImg && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Drag to Select Sign</span>}
                                   </div>
                                   <div 
                                     className="h-64 rounded-2xl border-2 border-dashed border-[#efefed] bg-white flex items-center justify-center relative group overflow-hidden select-none cursor-crosshair"
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
                                           <Upload className="h-5 w-5 text-[#acaba9]" />
                                           <p className="text-[10px] font-bold text-[#acaba9] uppercase tracking-widest text-center">
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
                                <div className="flex-1 space-y-3">
                                   <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Processed Signature (Preview)</Label>
                                   <div className="h-64 rounded-2xl border border-[#efefed] bg-[#fbfbfa] flex items-center justify-center relative overflow-hidden">
                                      {isProcessing ? (
                                         <div className="flex flex-col items-center gap-3 animate-pulse">
                                            <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Processing Ink...</span>
                                         </div>
                                      ) : settings?.signature_url ? (
                                         <div className="flex flex-col items-center gap-4">
                                            <img src={settings.signature_url} className="max-h-[180px] object-contain mix-blend-multiply transition-all duration-500" />
                                            <span className="text-[8px] font-bold text-green-600 uppercase tracking-widest bg-green-50 px-3 py-1 rounded-full">Solid Asset Isolated</span>
                                         </div>
                                      ) : (
                                         <div className="flex flex-col items-center gap-2 text-center px-8">
                                            <Sparkles className="h-5 w-5 text-[#efefed]" />
                                            <span className="text-[9px] font-bold text-[#acaba9] uppercase tracking-widest leading-relaxed">
                                               Drag over signature on the left<br/>to isolate the executive seal
                                            </span>
                                         </div>
                                      )}
                                   </div>
                                </div>
                             </div>

                             {originalImg && (
                               <div className="p-4 bg-blue-50/30 rounded-2xl border border-blue-100 flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                     <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <PenTool className="h-4 w-4 text-white" />
                                     </div>
                                     <div>
                                        <p className="text-[11px] font-black text-[#37352f] uppercase tracking-tight">Precision Selector Active</p>
                                        <p className="text-[9px] text-blue-900/60 font-medium">Click and drag over your signature in the source photo.</p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                     <button 
                                       onClick={() => {
                                         handleUpdate('signature_url', '')
                                         setCropBox(null)
                                       }}
                                       className="text-[9px] font-bold text-[#acaba9] uppercase tracking-widest hover:text-red-600"
                                     >
                                        Clear
                                     </button>
                                     <button 
                                       onClick={() => {
                                         setOriginalImg(null)
                                         setCropBox(null)
                                         handleUpdate('signature_url', '')
                                       }}
                                       className="text-[9px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
                                     >
                                        Replace
                                     </button>
                                  </div>
                               </div>
                             )}
                          </div>
                       </div>

                       {/* Identity Details */}
                       <div className="space-y-6">
                         <div className="space-y-2">
                           <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Entity Name</Label>
                           <input 
                             value={settings?.name || ''} 
                             onChange={e => handleUpdate('name', e.target.value)}
                             className="w-full h-11 px-4 rounded-xl bg-[#fcfcfb] border border-[#efefed] font-bold text-[#37352f] outline-none focus:ring-2 focus:ring-blue-100" 
                           />
                         </div>
                         <div className="space-y-2">
                           <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Official Email</Label>
                           <input 
                             value={settings?.email || ''} 
                             onChange={e => handleUpdate('email', e.target.value)}
                             className="w-full h-11 px-4 rounded-xl bg-[#fcfcfb] border border-[#efefed] font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                           />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Primary Phone</Label>
                             <input 
                               value={settings?.phone_primary || ''} 
                               onChange={e => handleUpdate('phone_primary', e.target.value)}
                               className="w-full h-11 px-4 rounded-xl bg-[#fcfcfb] border border-[#efefed] font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                             />
                           </div>
                           <div className="space-y-2">
                             <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Secondary Phone</Label>
                             <input 
                               value={settings?.phone_secondary || ''} 
                               onChange={e => handleUpdate('phone_secondary', e.target.value)}
                               className="w-full h-11 px-4 rounded-xl bg-[#fcfcfb] border border-[#efefed] outline-none focus:ring-2 focus:ring-blue-100" 
                             />
                           </div>
                         </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Appearance' && (
                  <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-1">
                       <h4 className="text-2xl font-black text-[#37352f] tracking-tight">Appearance & Brand</h4>
                       <p className="text-xs text-[#acaba9] font-medium">Define your corporate palette and visual signature.</p>
                    </div>

                    <div className="space-y-8">
                       <div className="space-y-4">
                          <div className="flex items-center gap-2">
                             <Palette className="h-4 w-4 text-blue-600" />
                             <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Primary Brand Color</Label>
                          </div>
                          <div className="grid grid-cols-6 gap-3">
                             {[
                               '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#37352f'
                             ].map((color) => (
                               <button
                                 key={color}
                                 onClick={() => handleUpdate('brand_color', color)}
                                 className={`h-10 rounded-xl transition-all hover:scale-110 active:scale-95 border-2 ${
                                   settings?.brand_color === color ? 'border-blue-100 shadow-md ring-2 ring-offset-2 ring-blue-600/20' : 'border-transparent'
                                 }`}
                                 style={{ backgroundColor: color }}
                               />
                             ))}
                          </div>
                          <div className="flex items-center gap-4 mt-2 p-4 bg-[#fcfcfb] rounded-2xl border border-[#efefed]">
                             <input 
                               type="color" 
                               value={settings?.brand_color || '#3b82f6'} 
                               onChange={(e) => handleUpdate('brand_color', e.target.value)}
                               className="h-8 w-8 rounded-lg cursor-pointer border-none bg-transparent"
                             />
                             <div className="space-y-0.5">
                                <p className="text-[10px] font-black text-[#37352f] uppercase tracking-widest">Custom HEX</p>
                                <p className="text-xs font-mono font-bold text-blue-600 uppercase tracking-tighter">{settings?.brand_color}</p>
                             </div>
                          </div>
                       </div>

                       <div className="p-6 bg-[#fcfcfb] rounded-[24px] border border-[#efefed] relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-3 opacity-10">
                             <Sparkles className="h-12 w-12 text-blue-600" />
                          </div>
                          <div className="space-y-4">
                             <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Live Document Preview</p>
                             <div className="h-20 bg-white rounded-xl border border-[#efefed] shadow-sm p-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                   <div className="h-10 w-10 rounded-lg" style={{ backgroundColor: settings?.brand_color }} />
                                   <div className="space-y-1">
                                      <div className="h-2 w-24 bg-[#efefed] rounded" />
                                      <div className="h-1.5 w-16 bg-[#f7f7f5] rounded" />
                                   </div>
                                </div>
                                <div className="h-8 w-20 rounded-lg opacity-50" style={{ backgroundColor: settings?.brand_color }} />
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Fiscal' && (
                   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-1">
                       <h4 className="text-2xl font-black text-[#37352f] tracking-tight">Fiscal Identity</h4>
                       <p className="text-xs text-[#acaba9] font-medium">Manage your tax registrations and fiscal identifiers.</p>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">GSTIN Number</Label>
                        <input 
                          value={settings?.gst_number || ''} 
                          onChange={e => handleUpdate('gst_number', e.target.value)}
                          className="w-full h-11 px-4 rounded-xl bg-[#fcfcfb] border border-[#efefed] font-mono font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-100" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Company PAN Number</Label>
                        <input 
                          value={settings?.pan_number || ''} 
                          onChange={e => handleUpdate('pan_number', e.target.value.toUpperCase())}
                          className="w-full h-11 px-4 rounded-xl bg-[#fcfcfb] border border-[#efefed] font-mono font-black text-blue-600 uppercase outline-none focus:ring-2 focus:ring-blue-100" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Settlement' && (
                   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-1">
                       <h4 className="text-2xl font-black text-[#37352f] tracking-tight">Payment Protocols</h4>
                       <p className="text-xs text-[#acaba9] font-medium">Bank details for instant clearing and settlement.</p>
                    </div>
                    <div className="space-y-8">
                      {/* Bank Accounts Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Bank Accounts</Label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2"
                            onClick={() => setSettings({
                              ...settings, 
                              bank_accounts: [...(settings.bank_accounts || []), { bank_name: '', account_number: '', ifsc_code: '' }]
                            })}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add Bank Account
                          </Button>
                        </div>
                        
                        {settings?.bank_accounts && settings.bank_accounts.length > 0 ? (
                          <div className="space-y-4">
                            {settings.bank_accounts.map((bank, index) => (
                              <div key={index} className="grid grid-cols-2 gap-4 p-4 bg-[#fcfcfb] rounded-xl border border-[#efefed] relative group">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newBanks = [...settings.bank_accounts!]
                                    newBanks.splice(index, 1)
                                    setSettings({...settings, bank_accounts: newBanks})
                                    setHasChanges(true)
                                  }}
                                  className="absolute -top-2 -right-2 h-6 w-6 bg-white border border-[#efefed] rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                                
                                <div className="col-span-2 space-y-2">
                                  <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Bank Name & Branch</Label>
                                  <input 
                                    value={bank.bank_name} 
                                    onChange={e => {
                                      const newBanks = [...settings.bank_accounts!]
                                      newBanks[index].bank_name = e.target.value
                                      setSettings({...settings, bank_accounts: newBanks})
                                      setHasChanges(true)
                                    }}
                                    className="w-full h-11 px-4 rounded-xl bg-white border border-[#efefed] font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Account Number</Label>
                                  <input 
                                    value={bank.account_number} 
                                    onChange={e => {
                                      const newBanks = [...settings.bank_accounts!]
                                      newBanks[index].account_number = e.target.value
                                      setSettings({...settings, bank_accounts: newBanks})
                                      setHasChanges(true)
                                    }}
                                    className="w-full h-11 px-4 rounded-xl bg-white border border-[#efefed] font-mono font-bold outline-none focus:ring-2 focus:ring-blue-100" 
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">IFSC Code</Label>
                                  <input 
                                    value={bank.ifsc_code} 
                                    onChange={e => {
                                      const newBanks = [...settings.bank_accounts!]
                                      newBanks[index].ifsc_code = e.target.value.toUpperCase()
                                      setSettings({...settings, bank_accounts: newBanks})
                                      setHasChanges(true)
                                    }}
                                    className="w-full h-11 px-4 rounded-xl bg-white border border-[#efefed] font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-blue-100" 
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-6 bg-[#fcfcfb] rounded-xl border border-dashed border-[#efefed]">
                            <p className="text-[11px] text-gray-400 font-medium">No bank accounts configured.</p>
                          </div>
                        )}
                      </div>

                      <div className="w-full h-px bg-[#efefed]" />

                      {/* UPI IDs Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">UPI IDs (for QR)</Label>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-[10px] font-bold text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2"
                            onClick={() => setSettings({
                              ...settings, 
                              upi_ids: [...(settings.upi_ids || []), '']
                            })}
                          >
                            <Plus className="h-3 w-3 mr-1" /> Add UPI ID
                          </Button>
                        </div>
                        
                        {settings?.upi_ids && settings.upi_ids.length > 0 ? (
                          <div className="flex flex-wrap gap-3">
                            {settings.upi_ids.map((upi, index) => (
                              <div key={index} className="flex items-center gap-2 bg-purple-50/50 border border-purple-100 rounded-xl pl-3 pr-2 py-2">
                                <input
                                  type="text"
                                  placeholder="username@bank"
                                  value={upi}
                                  onChange={e => {
                                    const newUpis = [...settings.upi_ids!]
                                    newUpis[index] = e.target.value
                                    setSettings({...settings, upi_ids: newUpis})
                                    setHasChanges(true)
                                  }}
                                  className="bg-transparent border-none outline-none text-[13px] font-bold text-blue-600 w-[200px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newUpis = [...settings.upi_ids!]
                                    newUpis.splice(index, 1)
                                    setSettings({...settings, upi_ids: newUpis})
                                    setHasChanges(true)
                                  }}
                                  className="text-purple-400 hover:text-purple-600 p-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center p-6 bg-[#fcfcfb] rounded-xl border border-dashed border-[#efefed]">
                            <p className="text-[11px] text-gray-400 font-medium">No UPI IDs configured.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'Locations' && (
                   <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="space-y-1">
                       <h4 className="text-2xl font-black text-[#37352f] tracking-tight">Global Locations</h4>
                       <p className="text-xs text-[#acaba9] font-medium">Manage your registered and operational addresses.</p>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Registered Office Address</Label>
                        <textarea 
                          value={settings?.address_regd || ''} 
                          onChange={e => handleUpdate('address_regd', e.target.value)}
                          className="w-full rounded-xl p-4 bg-[#fcfcfb] border border-[#efefed] focus:ring-2 focus:ring-blue-100 outline-none text-[12px] font-medium min-h-[100px]" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest">Work Office Address</Label>
                        <textarea 
                          value={settings?.address_work || ''} 
                          onChange={e => handleUpdate('address_work', e.target.value)}
                          className="w-full rounded-xl p-4 bg-[#fcfcfb] border border-[#efefed] focus:ring-2 focus:ring-blue-100 outline-none text-[12px] font-medium min-h-[100px]" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(activeTab === 'Account' || activeTab === 'Appearance' || activeTab === 'Notifications') && (
                  <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-300">
                     <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                        <Sparkles className="h-8 w-8 text-blue-600" />
                     </div>
                     <div className="space-y-1">
                        <h4 className="text-xl font-black text-[#37352f]">Coming Soon</h4>
                        <p className="text-xs text-[#acaba9] font-medium max-w-[240px]">We're currently architecting this module for the next deployment phase.</p>
                     </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="h-20 border-t border-[#f1f1f0] px-8 flex items-center justify-between bg-white/80 backdrop-blur-md flex-shrink-0">
               <div className="flex items-center gap-2">
                  {hasChanges && (
                    <div className="flex items-center gap-2 animate-pulse">
                       <div className="h-1.5 w-1.5 bg-orange-500 rounded-full" />
                       <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Unsaved Protocols</span>
                    </div>
                  )}
               </div>
             <div className="h-20 border-t border-[#f1f1f0] px-8 flex items-center justify-between bg-white/80 backdrop-blur-md flex-shrink-0">
                <div className="flex items-center gap-2">
                   {hasChanges && (
                     <div className="flex items-center gap-2 animate-pulse">
                        <div className="h-1.5 w-1.5 bg-orange-500 rounded-full" />
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Unsaved Changes</span>
                     </div>
                   )}
                </div>
                <div className="flex items-center gap-3">
                   <Button variant="ghost" onClick={onClose} className="h-11 px-6 rounded-xl font-bold text-[#acaba9] hover:bg-[#f7f7f5] hover:text-[#37352f]">Cancel</Button>
                   <Button 
                     onClick={handleSave} 
                     disabled={!hasChanges || isSaving}
                     className={`h-11 px-8 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-2 min-w-[160px] ${
                       hasChanges ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100' : 'bg-[#37352f] text-white opacity-50 cursor-not-allowed'
                     }`}
                   >
                     {isSaving ? (
                        <>
                          <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Syncing...
                        </>
                     ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Save Changes
                        </>
                     )}
                   </Button>
                </div>
             </div>
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  )
}
