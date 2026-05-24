'use client'

import { useEffect, useState } from 'react'
import { 
  PhoneIncoming, 
  PhoneOutgoing, 
  Globe,
  User,
  Phone,
  Zap,
  BookOpen,
  Send,
  Plus,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cx } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { getCallLogs, CallLog, triggerManualAICall } from '@/lib/services/voiceService'
import { getActiveScript, saveScript, CallScript } from '@/lib/services/scriptService'
import { toast } from 'sonner'

export default function AICallingPage() {
  const [logs, setLogs] = useState<CallLog[]>([])
  const [manualPhone, setManualPhone] = useState('')
  const [manualName, setManualName] = useState('')
  const [countryCode, setCountryCode] = useState('+91')
  const [selectedLanguage, setSelectedLanguage] = useState('en-IN')
  const [isCalling, setIsCalling] = useState(false)
  const [view, setView] = useState<'terminal' | 'script'>('terminal')
  
  // Script State
  const [activeScript, setActiveScript] = useState<CallScript>(getActiveScript())

  useEffect(() => {
    setLogs(getCallLogs())
    const interval = setInterval(() => setLogs(getCallLogs()), 5000)
    return () => clearInterval(interval)
  }, [])

  const handleManualCall = async () => {
    if (!manualPhone) {
      toast.error("Required: Phone Number")
      return
    }
    setIsCalling(true)
    try {
      const formattedPhone = `${countryCode}${manualPhone.replace(/^0+/, '')}`
      const call = await triggerManualAICall(formattedPhone, manualName || 'Customer', undefined, selectedLanguage)
      if (call) {
        toast.success(`Connected: ${formattedPhone}`)
        setManualPhone('')
        setManualName('')
        setLogs(getCallLogs())
      }
    } catch (error: any) {
      toast.error(error.message || "Connection Failed")
    } finally {
      setIsCalling(false)
    }
  }

  const updateScript = (newScript: CallScript) => {
    setActiveScript(newScript)
    saveScript(newScript)
    toast.success("AI Training Playbook Updated")
  }

  const handleRedial = (log: CallLog) => {
    // 1. Parse number and country code
    let pureNumber = log.phoneNumber
    if (pureNumber.startsWith('+91')) {
      setCountryCode('+91')
      pureNumber = pureNumber.replace('+91', '')
    } else if (pureNumber.startsWith('+1')) {
      setCountryCode('+1')
      pureNumber = pureNumber.replace('+1', '')
    }
    
    setManualPhone(pureNumber)
    setManualName(log.customerName)
    
    // 2. Auto-switch to terminal view for speed
    setView('terminal')
    toast.info(`Pre-filled: ${log.customerName}`)
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] p-6 lg:p-16">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl w-fit mb-12">
           <Button 
            variant="ghost" 
            onClick={() => setView('terminal')}
            className={cx("rounded-xl px-6 h-10 font-bold text-xs transition-all", view === 'terminal' ? "bg-white text-black shadow-sm" : "text-gray-500")}
           >
              <Phone className="h-3.5 w-3.5 mr-2" />
              Terminal
           </Button>
           <Button 
            variant="ghost" 
            onClick={() => setView('script')}
            className={cx("rounded-xl px-6 h-10 font-bold text-xs transition-all", view === 'script' ? "bg-white text-black shadow-sm" : "text-gray-500")}
           >
              <BookOpen className="h-3.5 w-3.5 mr-2" />
              Script Training
           </Button>
        </div>

        {view === 'terminal' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="h-14 bg-white border-none shadow-sm rounded-2xl font-semibold px-6">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="border-none shadow-xl rounded-2xl">
                    <SelectItem value="en-IN">English</SelectItem>
                    <SelectItem value="hi-IN">Hindi</SelectItem>
                    <SelectItem value="bn-IN">Bengali</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input 
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Recipient Name" 
                    className="h-14 pl-12 bg-white border-none shadow-sm rounded-2xl font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className="w-32 h-14 bg-white border-none shadow-sm rounded-2xl font-bold px-6">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-none shadow-xl rounded-2xl">
                    <SelectItem value="+91">+91</SelectItem>
                    <SelectItem value="+1">+1</SelectItem>
                    <SelectItem value="+44">+44</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="Phone Number" 
                  className="h-14 flex-1 bg-white border-none shadow-sm rounded-2xl font-bold text-lg tracking-tight px-6"
                />
              </div>

              <Button 
                onClick={handleManualCall}
                disabled={isCalling || !manualPhone}
                className="w-full h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] font-bold text-lg shadow-lg shadow-blue-100 transition-all active:scale-[0.98] disabled:opacity-20"
              >
                {isCalling ? "Connecting..." : (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 fill-current" />
                    <span>Start AI Conversation</span>
                  </div>
                )}
              </Button>
            </div>

            <div className="lg:col-span-5 h-full">
               <Card className="bg-white rounded-[32px] shadow-sm p-8 h-full min-h-[400px] flex flex-col border-none">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8">Activity Stream</h3>
                  <div className="flex-1 space-y-6">
                    {logs.slice(0, 5).map((log) => (
                      <div 
                        key={log.id} 
                        onClick={() => handleRedial(log)}
                        className="flex items-center gap-4 cursor-pointer group hover:bg-gray-50 p-2 -m-2 rounded-2xl transition-all"
                      >
                        <div className={cx(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                          log.type === 'inbound' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {log.type === 'inbound' ? <PhoneIncoming className="h-4 w-4" /> : <PhoneOutgoing className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-bold text-gray-900 truncate">{log.customerName}</h4>
                            <span className="text-[10px] text-gray-400 font-medium">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">{log.summary || 'Session Logged'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
               </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
               <div>
                  <h2 className="text-2xl font-black text-black">Script Training Playbook</h2>
                  <p className="text-gray-500 text-sm font-medium">Define exactly how the AI should introduce itself and answer questions.</p>
               </div>
               <Button onClick={() => updateScript(activeScript)} className="bg-black text-white rounded-xl font-bold px-8">Save Changes</Button>
            </div>

            <Card className="p-8 bg-white border-none shadow-sm rounded-[32px] space-y-8">
               <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Mandatory Opening Greeting</label>
                  <Input 
                    value={activeScript.opening}
                    onChange={(e) => setActiveScript({...activeScript, opening: e.target.value})}
                    className="h-14 bg-gray-50 border-none rounded-2xl font-bold"
                  />
               </div>

               <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Business FAQ (Training Knowledge)</label>
                  <div className="space-y-4">
                     {activeScript.faq.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-gray-50 rounded-2xl relative group">
                           <div className="space-y-2">
                              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Question</span>
                              <Input 
                                value={item.question}
                                onChange={(e) => {
                                   const newFaq = [...activeScript.faq]
                                   newFaq[idx].question = e.target.value
                                   setActiveScript({...activeScript, faq: newFaq})
                                }}
                                className="bg-white border-none rounded-xl font-bold h-12"
                              />
                           </div>
                           <div className="space-y-2">
                              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Scripted Answer</span>
                              <Input 
                                value={item.answer}
                                onChange={(e) => {
                                   const newFaq = [...activeScript.faq]
                                   newFaq[idx].answer = e.target.value
                                   setActiveScript({...activeScript, faq: newFaq})
                                }}
                                className="bg-white border-none rounded-xl font-bold h-12"
                              />
                           </div>
                           <Button 
                              variant="ghost" 
                              onClick={() => {
                                 const newFaq = activeScript.faq.filter((_, i) => i !== idx)
                                 setActiveScript({...activeScript, faq: newFaq})
                              }}
                              className="absolute -right-2 -top-2 h-8 w-8 bg-white shadow-md rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                           >
                              <Trash2 className="h-4 w-4" />
                           </Button>
                        </div>
                     ))}
                     <Button 
                        onClick={() => setActiveScript({...activeScript, faq: [...activeScript.faq, {question: '', answer: ''}]})}
                        variant="outline" 
                        className="w-full h-14 border-dashed border-2 border-gray-200 rounded-2xl text-gray-400 font-bold hover:bg-gray-50 transition-all"
                     >
                        <Plus className="h-4 w-4 mr-2" /> Add FAQ Entry
                     </Button>
                  </div>
               </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
