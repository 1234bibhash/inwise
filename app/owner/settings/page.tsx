'use client'

import React, { useState, useEffect } from 'react'
import { 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  CreditCard, 
  Fingerprint, 
  Save, 
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Hash,
  Plus,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import Link from 'next/link'
import { getBusinessSettings, updateBusinessSettings, BusinessSettings } from '@/lib/services/settingsService'

export default function SettingsPage() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

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
    setSettings({ ...settings, [field]: value })
    setHasChanges(true)
  }

  async function handleSave() {
    if (!settings) return
    setIsSaving(true)
    try {
      await updateBusinessSettings(settings)
      toast.success('Business settings synchronized successfully')
      setHasChanges(false)
    } catch (error) {
      toast.error('Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-[#fcfcfb] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfcfb] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="h-14 bg-white/80 backdrop-blur-md border-b border-[#f1f1f0] flex items-center justify-between px-8 sticky top-0 z-30 shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/owner/billing">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-[#f7f7f5]">
              <ArrowLeft className="h-4 w-4 text-[#37352f]" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-[#37352f] rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-sm font-bold text-[#37352f] tracking-tight">Enterprise Console</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mr-2 animate-pulse">Unsaved Changes</span>
          )}
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges || isSaving}
            className={`h-9 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
              hasChanges 
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100' 
                : 'bg-[#37352f] text-white opacity-50 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Synchronizing...' : (
              <><Save className="h-3.5 w-3.5 mr-2" /> Save Configuration</>
            )}
          </Button>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto py-12 px-8 space-y-12">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-[#37352f] tracking-tight">Business Configuration</h2>
          <p className="text-sm font-medium text-[#acaba9]">Manage your official identity and settlement protocols.</p>
        </div>

        <div className="grid grid-cols-3 gap-12">
          {/* Navigation Sidebar */}
          <div className="col-span-1 space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-[#acaba9] uppercase tracking-[0.2em] mb-4">Core Identity</p>
              <nav className="space-y-1">
                {[
                  { label: 'General Info', icon: Building2, active: true },
                  { label: 'Fiscal Details', icon: Hash, active: false },
                  { label: 'Payment Settlement', icon: CreditCard, active: false },
                  { label: 'Communications', icon: Mail, active: false },
                ].map((item, i) => (
                  <button key={i} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left ${item.active ? 'bg-[#f7f7f5] text-[#37352f]' : 'text-[#acaba9] hover:bg-[#f7f7f5] hover:text-[#37352f]'}`}>
                    <item.icon className={`h-4 w-4 ${item.active ? 'text-blue-600' : ''}`} />
                    <span className="text-[11px] font-bold">{item.label}</span>
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
               <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" />
                  System Sync
               </p>
               <p className="text-[10px] text-blue-900/60 font-medium leading-relaxed">
                  Changes made here will propagate across the entire system, including invoices, receipts, and official communications.
               </p>
            </div>
          </div>

          {/* Form Content */}
          <div className="col-span-2 space-y-12">
            {/* Identity Block */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-[#f1f1f0]">
                <div className="h-8 w-8 bg-white rounded-lg border border-[#f1f1f0] flex items-center justify-center text-[#37352f] shadow-sm">
                  <Building2 className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-[#37352f] uppercase tracking-widest">Business Identity</h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Legal Entity Name</Label>
                  <Input 
                    value={settings.name} 
                    onChange={e => handleUpdate('name', e.target.value)}
                    className="rounded-xl h-11 bg-white border-[#f1f1f0] focus:ring-blue-100 font-bold text-[#37352f]" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">GST Identification Number (GSTIN)</Label>
                    <Input 
                      value={settings.gst_number} 
                      onChange={e => handleUpdate('gst_number', e.target.value)}
                      placeholder="Optional"
                      className="rounded-xl h-11 bg-white border-[#f1f1f0] font-mono text-blue-600" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Company PAN Number</Label>
                    <Input 
                      value={settings.pan_number || ''} 
                      onChange={e => handleUpdate('pan_number', e.target.value)}
                      placeholder="Optional"
                      className="rounded-xl h-11 bg-white border-[#f1f1f0] font-mono text-blue-600 uppercase" 
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Communication Block */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-[#f1f1f0]">
                <div className="h-8 w-8 bg-white rounded-lg border border-[#f1f1f0] flex items-center justify-center text-[#37352f] shadow-sm">
                  <Phone className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-[#37352f] uppercase tracking-widest">Communications</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Primary Phone</Label>
                  <Input 
                    value={settings.phone_primary} 
                    onChange={e => handleUpdate('phone_primary', e.target.value)}
                    className="rounded-xl h-11 bg-white border-[#f1f1f0] font-bold" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Secondary Phone</Label>
                  <Input 
                    value={settings.phone_secondary} 
                    onChange={e => handleUpdate('phone_secondary', e.target.value)}
                    className="rounded-xl h-11 bg-white border-[#f1f1f0]" 
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Official Email</Label>
                  <Input 
                    value={settings.email} 
                    onChange={e => handleUpdate('email', e.target.value)}
                    className="rounded-xl h-11 bg-white border-[#f1f1f0] font-bold" 
                  />
                </div>
              </div>
            </section>

            {/* Location Block */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-[#f1f1f0]">
                <div className="h-8 w-8 bg-white rounded-lg border border-[#f1f1f0] flex items-center justify-center text-[#37352f] shadow-sm">
                  <MapPin className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-[#37352f] uppercase tracking-widest">Office Locations</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Registered Office Address</Label>
                  <textarea 
                    value={settings.address_regd} 
                    onChange={e => handleUpdate('address_regd', e.target.value)}
                    className="w-full rounded-xl p-4 bg-white border border-[#f1f1f0] focus:ring-2 focus:ring-blue-100 outline-none text-[11px] font-medium min-h-[80px]" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Work Office Address</Label>
                  <textarea 
                    value={settings.address_work} 
                    onChange={e => handleUpdate('address_work', e.target.value)}
                    className="w-full rounded-xl p-4 bg-white border border-[#f1f1f0] focus:ring-2 focus:ring-blue-100 outline-none text-[11px] font-medium min-h-[80px]" 
                  />
                </div>
              </div>
            </section>

            {/* Financial Block */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-[#f1f1f0]">
                <div className="h-8 w-8 bg-white rounded-lg border border-[#f1f1f0] flex items-center justify-center text-[#37352f] shadow-sm">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-black text-[#37352f] uppercase tracking-widest">Settlement Protocols</h3>
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
                  
                  {settings.bank_accounts && settings.bank_accounts.length > 0 ? (
                    <div className="space-y-4">
                      {settings.bank_accounts.map((bank, index) => (
                        <div key={index} className="grid grid-cols-2 gap-4 p-4 bg-gray-50/50 rounded-xl border border-[#f1f1f0] relative group">
                          <button
                            type="button"
                            onClick={() => {
                              const newBanks = [...settings.bank_accounts!]
                              newBanks.splice(index, 1)
                              setSettings({...settings, bank_accounts: newBanks})
                            }}
                            className="absolute -top-2 -right-2 h-6 w-6 bg-white border border-[#f1f1f0] rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                          
                          <div className="col-span-2 space-y-2">
                            <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Bank Name & Branch</Label>
                            <Input 
                              value={bank.bank_name} 
                              onChange={e => {
                                const newBanks = [...settings.bank_accounts!]
                                newBanks[index].bank_name = e.target.value
                                setSettings({...settings, bank_accounts: newBanks})
                              }}
                              placeholder="e.g. State Bank of India, Main Branch"
                              className="rounded-xl h-11 bg-white border-[#f1f1f0] font-bold" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Account Number</Label>
                            <Input 
                              value={bank.account_number} 
                              onChange={e => {
                                const newBanks = [...settings.bank_accounts!]
                                newBanks[index].account_number = e.target.value
                                setSettings({...settings, bank_accounts: newBanks})
                              }}
                              className="rounded-xl h-11 bg-white border-[#f1f1f0] font-mono font-bold" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">IFSC Code</Label>
                            <Input 
                              value={bank.ifsc_code} 
                              onChange={e => {
                                const newBanks = [...settings.bank_accounts!]
                                newBanks[index].ifsc_code = e.target.value.toUpperCase()
                                setSettings({...settings, bank_accounts: newBanks})
                              }}
                              className="rounded-xl h-11 bg-white border-[#f1f1f0] font-mono font-bold uppercase" 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-gray-50/50 rounded-xl border border-dashed border-[#f1f1f0]">
                      <p className="text-[11px] text-gray-400 font-medium">No bank accounts configured.</p>
                    </div>
                  )}
                </div>

                <div className="w-full h-px bg-[#f1f1f0]" />

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
                  
                  {settings.upi_ids && settings.upi_ids.length > 0 ? (
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
                            }}
                            className="bg-transparent border-none outline-none text-[13px] font-bold text-blue-600 w-[200px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newUpis = [...settings.upi_ids!]
                              newUpis.splice(index, 1)
                              setSettings({...settings, upi_ids: newUpis})
                            }}
                            className="text-purple-400 hover:text-purple-600 p-1.5 rounded-lg hover:bg-purple-100 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-gray-50/50 rounded-xl border border-dashed border-[#f1f1f0]">
                      <p className="text-[11px] text-gray-400 font-medium">No UPI IDs configured.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Floating Success Indicator */}
      {!hasChanges && !isSaving && (
        <div className="fixed bottom-8 right-8 flex items-center gap-3 bg-white px-6 py-3 rounded-full border border-[#f1f1f0] shadow-xl shadow-gray-100/50 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span className="text-[10px] font-black text-[#37352f] uppercase tracking-widest">Configuration Synchronized</span>
        </div>
      )}
    </div>
  )
}
