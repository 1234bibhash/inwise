'use client'

import { useEffect, useState } from 'react'
import { getInvoices, createInvoice, deleteInvoice, updateInvoice, type Invoice, type InvoiceItem } from '@/lib/services/invoiceService'
import { getProducts, type Product, decrementProductStock } from '@/lib/services/productService'
import { createWarranty } from '@/lib/services/warrantyService'
import { logSale } from '@/lib/services/orderService'
import { createServiceCall } from '@/lib/services/serviceCallService'
import { addLedger, getLedgers, updateLedger, type UnderGroup } from '@/lib/services/accountService'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Search, 
  FileText, 
  Download, 
  Printer, 
  Check,
  Sparkles,
  ArrowLeft,
  CreditCard,
  History,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Trash2,
  Box,
  LayoutDashboard,
  Target,
  DollarSign,
  PlusCircle,
  FileDown,
  ShieldCheck,
  Settings,
  Minus,
  ChevronDown,
  Upload,
  Loader2,
  CheckCircle2,
  Edit3
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group"
import { toast } from 'sonner'
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { getTaxRate } from '@/lib/services/taxService'
import { getBusinessSettings, type BusinessSettings } from '@/lib/services/settingsService'
import { useSettings } from '@/lib/context/SettingsContext'
import { upsertCustomerFromInvoice } from '@/lib/services/customerService'
import Link from 'next/link'
import { BarChart as TremorBarChart } from '@/components/ui/bar-chart'
import { ProfitLossChart } from '@/components/ui/profit-loss-chart'

const getFormattedInvoiceNumber = (mode: string, provider: string, currentInvNum: string, date: string, companyName: string) => {
  let serial = '';
  if (currentInvNum.includes('/')) {
    const parts = currentInvNum.split('/');
    serial = parts.length >= 3 ? parts[parts.length - 2] : '';
  } else if (currentInvNum.includes('-')) {
    serial = currentInvNum.split('-').pop() || '';
  }
  if (!serial || isNaN(Number(serial))) serial = Math.floor(1000 + Math.random() * 9000).toString();

  const d = date ? new Date(date) : new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const fy = month >= 3 ? `${year}-${(year + 1).toString().slice(-2)}` : `${year - 1}-${year.toString().slice(-2)}`;

  const words = (companyName || 'HOOGHLY ELECTRONICS').split(' ');
  const companyShort = words.length > 1 
    ? words.map(w => w[0]).join('').toUpperCase().substring(0,3)
    : words[0].substring(0,3).toUpperCase();

  if (mode === 'finance' && provider && provider !== 'CUSTOM') {
    const providerMap: Record<string, string> = {
      'BAJAJ FINSERV': 'BAJAJ',
      'IDFC FIRST BANK': 'IDFC',
      'HDB FINANCE': 'HDB',
      'TVS CREDIT': 'TVS',
      'KOTAK MAHINDRA BANK': 'KOTAK',
      'PINE LABS': 'PINE'
    };
    const providerShort = providerMap[provider.toUpperCase()] || provider.split(' ')[0].toUpperCase();
    return `${providerShort}/${companyShort}/${serial}/${fy}`;
  } else {
    return `${companyShort}/${serial}/${fy}`;
  }
}

const REVENUE_DATA: { name: string; revenue: number }[] = []

const SPARKLINE_DATA: { v: number }[] = []

const PROFIT_PIE_DATA: { name: string; value: number; color: string }[] = []

const MARGIN_PIE_DATA: { name: string; value: number; color: string }[] = []

function createEmptyInvoice(businessSettings: BusinessSettings | null) {
  return {
    invoice_number: '',
    buyer_ref: '',
    dispatch_through: '',
    invoice_date: new Date().toISOString().split('T')[0],
    payment_terms: '',
    destination: '',
    from_details: {
      name: businessSettings?.name || '',
      address1: businessSettings?.address_regd || '',
      address2: businessSettings?.address_work || '',
      city: '',
      state: '',
      postal: '',
      phone: businessSettings?.phone_primary ? `${businessSettings.phone_primary}${businessSettings.phone_secondary ? ' / ' + businessSettings.phone_secondary : ''}` : '',
      email: businessSettings?.email || '',
      gstin: businessSettings?.gst_number || ''
    },
    to_details: {
      name: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      postal: '',
      phone: '',
      email: '',
      alternate_phone: '',
      address_delivery: '',
      pin_code: '',
      gstin: '',
    },
    items: [],
    tax_type: 'intra-state',
    terms: 'Payment due on receipt.',
    total_amount: 0,
    discount_on_total: 0,
    additional_charges: 0,
    total_price_override: 0,
    logo_file: null as File | null,
  }
}

function numberToWords(num: number): string {
  if (num === 0) return 'Zero'
  
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ]
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const g = ['', 'Thousand', 'Lakh', 'Crore']
  
  function convertGroup(n: number): string {
    let str = ''
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred '
      n %= 100
    }
    if (n >= 20) {
      str += b[Math.floor(n / 10)] + ' '
      n %= 10
    }
    if (n > 0) {
      str += a[n] + ' '
    }
    return str.trim()
  }

  let words = ''
  let integerPart = Math.floor(num)
  let decimalPart = Math.round((num - integerPart) * 100)

  const groups: number[] = []
  groups.push(integerPart % 1000)
  integerPart = Math.floor(integerPart / 1000)

  while (integerPart > 0) {
    groups.push(integerPart % 100)
    integerPart = Math.floor(integerPart / 100)
  }

  for (let i = groups.length - 1; i >= 0; i--) {
    const val = groups[i]
    if (val > 0) {
      const suffix = g[i] ? ' ' + g[i] : ''
      words += convertGroup(val) + suffix + ' '
    }
  }

  words = words.trim() + ' Rupees'
  if (decimalPart > 0) {
    words += ' and ' + convertGroup(decimalPart) + ' Paise'
  }

  return words + ' Only'
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<'list' | 'editor'>('list')
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([])
  
  const [isAiModalOpen, setIsAiModalOpen] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)
  const { openSettings } = useSettings()
  
  const [currentInvoice, setCurrentInvoice] = useState<any>(createEmptyInvoice(null))
  const [customQRAmount, setCustomQRAmount] = useState<string>('')

  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isSavingInvoice, setIsSavingInvoice] = useState(false)
  const [isViewOnly, setIsViewOnly] = useState(false)
  const [profitData, setProfitData] = useState<any[]>([])
  const [marginData, setMarginData] = useState<any[]>([])
  const [showAdvancedBilling, setShowAdvancedBilling] = useState(false)
  const [isDoModalOpen, setIsDoModalOpen] = useState(false)
  const [isScanningDo, setIsScanningDo] = useState(false)

  useEffect(() => {
    if (!currentInvoice || isViewOnly) return;
    const mode = currentInvoice.payment_info?.mode || 'cash';
    const total = currentInvoice.total_amount || 0;
    
    let targetPaid = currentInvoice.payment_info?.paid_amount || 0;
    
    if (mode === 'finance') {
      targetPaid = currentInvoice.payment_info?.dp_amount || 0;
    } else if (mode === 'cheque') {
      targetPaid = 0;
    } else {
      targetPaid = total;
    }

    const targetPending = Math.max(0, total - targetPaid);

    if (
      currentInvoice.payment_info?.paid_amount !== targetPaid || 
      currentInvoice.payment_info?.pending_amount !== targetPending
    ) {
      setCurrentInvoice((prev: any) => ({
        ...prev,
        payment_info: {
          ...prev.payment_info,
          paid_amount: targetPaid,
          pending_amount: targetPending,
          partial_payment: targetPaid < total
        }
      }));
    }
  }, [
    currentInvoice?.payment_info?.mode,
    currentInvoice?.payment_info?.dp_amount,
    currentInvoice?.total_amount,
    isViewOnly
  ]);
  const [scannedDoDetails, setScannedDoDetails] = useState<any>(null)
  const [pdfPages, setPdfPages] = useState<string[]>([])

  useEffect(() => {
    loadData()
    
    const handleSettingsUpdate = () => {
      loadData()
    }
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate)
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate)
  }, [])

  async function loadData() {
    setIsLoading(true)
    try {
      const [invData, prodData, settingsData] = await Promise.all([
        getInvoices(),
        getProducts(),
        getBusinessSettings()
      ])
      const parentInvoices = invData.filter((inv: any) => !inv.is_receipt_invoice && !inv.invoice_number.startsWith('RCPT-'))
      setInvoices(parentInvoices)
      setProducts(prodData)
      setBusinessSettings(settingsData)

      // Calculate analytics from real data
      const last5Invoices = parentInvoices.slice(0, 5).reverse()
      
      const profitMetrics = last5Invoices.map(inv => {
        const revenue = inv.total_amount
        const cost = inv.items.reduce((acc: number, item: any) => acc + (item.cost_price * item.quantity), 0)
        return {
          name: inv.invoice_number.split('-').pop(),
          profit: revenue - cost,
          revenue: revenue
        }
      })

      const marginMetrics = last5Invoices.map(inv => {
        const revenue = inv.total_amount
        const cost = inv.items.reduce((acc: number, item: any) => acc + (item.cost_price * item.quantity), 0)
        const profit = revenue - cost
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0
        return {
          name: inv.invoice_number.split('-').pop(),
          margin: Math.round(margin),
          value: profit
        }
      })

      setProfitData(profitMetrics)
      setMarginData(marginMetrics)
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Failed to load financial data')
    } finally {
      setTimeout(() => setIsLoading(false), 800)
    }
  }

  const renderPdfToImages = async (file: File): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer)
        try {
          if (!(window as any).pdfjsLib) {
            const script = document.createElement('script')
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js'
            script.onload = () => {
              (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'
              renderPages(typedarray).then(resolve).catch(reject)
            }
            script.onerror = () => reject(new Error('Failed to load PDF.js'))
            document.body.appendChild(script)
          } else {
            renderPages(typedarray).then(resolve).catch(reject)
          }
        } catch (err) {
          reject(err)
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const renderPages = async (typedarray: Uint8Array): Promise<string[]> => {
    const pdfjsLib = (window as any).pdfjsLib
    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise
    const images: string[] = []
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const viewport = page.getViewport({ scale: 1.5 })
      
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      if (!context) continue
      
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      await page.render(renderContext).promise
      images.push(canvas.toDataURL('image/png'))
    }
    return images
  }

  const parsePdfFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const typedarray = new Uint8Array(e.target?.result as ArrayBuffer)
        try {
          if (!(window as any).pdfjsLib) {
            const script = document.createElement('script')
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js'
            script.onload = () => {
              (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js'
              extractText(typedarray).then(resolve).catch(reject)
            }
            script.onerror = () => {
              reject(new Error('Failed to load PDF.js library'))
            }
            document.body.appendChild(script)
          } else {
            extractText(typedarray).then(resolve).catch(reject)
          }
        } catch (err) {
          reject(err)
        }
      }
      reader.readAsArrayBuffer(file)
    })
  }

  const extractText = async (typedarray: Uint8Array): Promise<string> => {
    const pdfjsLib = (window as any).pdfjsLib
    const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise
    let text = ''
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const strings = content.items.map((item: any) => item.str)
      text += strings.join(' ') + '\n'
    }
    return text
  }

  const parseDoText = (text: string) => {
    const textUpper = text.toUpperCase()
    
    // 1. Finance Provider
    let provider = ''
    if (textUpper.includes('BAJAJ')) provider = 'BAJAJ FINSERV'
    else if (textUpper.includes('IDFC')) provider = 'IDFC FIRST BANK'
    else if (textUpper.includes('HDB') || textUpper.includes('HDFC')) provider = 'HDB FINANCE'
    else if (textUpper.includes('TVS')) provider = 'TVS CREDIT'
    else if (textUpper.includes('KOTAK')) provider = 'KOTAK MAHINDRA BANK'
    else if (textUpper.includes('PINE LABS') || textUpper.includes('PINELABS')) provider = 'PINE LABS'
    
    // 2. Customer Name
    let name = ''
    const nameRegexes = [
      /CUSTOMER NAME\s*[:|-]\s*([A-Z\s]+?)(?=\s{2,}|\n|$)/i,
      /APPLICANT NAME\s*[:|-]\s*([A-Z\s]+?)(?=\s{2,}|\n|$)/i,
      /NAME OF CUSTOMER\s*[:|-]\s*([A-Z\s]+?)(?=\s{2,}|\n|$)/i,
      /CUSTOMER\s+NAME\s*:\s*([A-Z\s]+?)(?=\s{2,}|\n|$)/i,
      /APPLICANT\s+NAME\s*:\s*([A-Z\s]+?)(?=\s{2,}|\n|$)/i,
    ]
    for (const regex of nameRegexes) {
      const match = text.match(regex)
      if (match && match[1]) {
        name = match[1].trim()
        break
      }
    }

    // 3. Customer Phone
    let phone = ''
    const phoneRegexes = [
      /(?:MOBILE|PHONE|CONTACT|TEL)(?:\s+NO|\s+NUMBER)?\s*[:|-]?\s*([6-9]\d{9})/i,
      /(?:MOBILE|PHONE)\s*:\s*([6-9]\d{9})/i,
    ]
    for (const regex of phoneRegexes) {
      const match = text.match(regex)
      if (match && match[1]) {
        phone = match[1].trim()
        break
      }
    }

    // 4. DO/Transaction Number
    let referenceId = ''
    const refRegexes = [
      /DELIVERY ORDER\s*(?:NO|NUMBER)?\s*[:|-]?\s*([A-Z0-9\-\/]+)/i,
      /DO\s*(?:NO|NUMBER)?\s*[:|-]?\s*([A-Z0-9\-\/]+)/i,
      /LOAN\s*A\/C\s*(?:NO|NUMBER)?\s*[:|-]?\s*([A-Z0-9\-\/]+)/i,
      /LOAN\s*ACCOUNT\s*(?:NO|NUMBER)?\s*[:|-]?\s*([A-Z0-9\-\/]+)/i,
      /LAN\s*[:|-]?\s*([A-Z0-9\-\/]+)/i,
    ]
    for (const regex of refRegexes) {
      const match = text.match(regex)
      if (match && match[1]) {
        referenceId = match[1].trim()
        break
      }
    }

    // 5. Down Payment
    let paidAmount = 0
    const paidRegexes = [
      /DOWN\s*PAYMENT\s*(?:AMOUNT)?\s*[:|-]?\s*Rs\.?\s*([\d,]+)/i,
      /DOWNPAYMENT\s*(?:AMOUNT)?\s*[:|-]?\s*Rs\.?\s*([\d,]+)/i,
      /MARGIN\s*MONEY\s*[:|-]?\s*Rs\.?\s*([\d,]+)/i,
      /DOWN\s*PAYMENT\s*(?:AMOUNT)?\s*[:|-]?\s*([\d,]+)/i,
      /DOWNPAYMENT\s*(?:AMOUNT)?\s*[:|-]?\s*([\d,]+)/i,
    ]
    for (const regex of paidRegexes) {
      const match = text.match(regex)
      if (match && match[1]) {
        paidAmount = parseFloat(match[1].replace(/,/g, ''))
        break
      }
    }

    // 6. Product Model / Asset
    let modelNumber = ''
    const modelRegexes = [
      /MODEL\s*(?:NO|NUMBER)?\s*[:|-]?\s*([A-Z0-9\-\/]+)/i,
      /ASSET\s*DESCRIPTION\s*[:|-]?\s*([A-Z0-9\s\-\/]+?)(?=\s{2,}|\n|$)/i,
      /PRODUCT\s*NAME\s*[:|-]?\s*([A-Z0-9\s\-\/]+?)(?=\s{2,}|\n|$)/i,
    ]
    for (const regex of modelRegexes) {
      const match = text.match(regex)
      if (match && match[1]) {
        modelNumber = match[1].trim()
        break
      }
    }

    return { provider, name, phone, referenceId, paidAmount, modelNumber }
  }

  const handleDoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsScanningDo(true)
    setIsDoModalOpen(true)
    
    try {
      let fileText = ''
      if (file.name.endsWith('.pdf')) {
        fileText = await parsePdfFile(file)
        try {
          const images = await renderPdfToImages(file)
          setPdfPages(images)
        } catch (imgErr) {
          console.warn('Failed to render PDF pages visually:', imgErr)
        }
      } else {
        fileText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = (err) => reject(err)
          reader.readAsText(file)
        })
      }
      
      const parsed = parseDoText(fileText)
      setScannedDoDetails(parsed)
      toast.success('DO scanned successfully!')
    } catch (error) {
      console.error(error)
      toast.error('Failed to parse the DO file. You can enter details manually.')
      setIsDoModalOpen(false)
    } finally {
      setIsScanningDo(false)
      event.target.value = ''
    }
  }

  const applyDoDetails = () => {
    if (!scannedDoDetails) return

    let updatedItems = [...currentInvoice.items]
    if (scannedDoDetails.modelNumber && products.length > 0) {
      const matched = products.find(p => 
        p.model_number?.toUpperCase().includes(scannedDoDetails.modelNumber.toUpperCase()) ||
        p.name?.toUpperCase().includes(scannedDoDetails.modelNumber.toUpperCase())
      )
      
      if (matched) {
        const { gst_rate: default_gst, hsn_code: taxHsn } = getTaxRate(matched.category || '', matched.subcategory || '')
        const gst_rate = matched.custom_tax_rate != null ? matched.custom_tax_rate : default_gst
        
        if (updatedItems.length === 0) {
          updatedItems.push({
            product_id: matched.id,
            name: matched.name,
            sku: matched.sku || '',
            brand: matched.brand || '',
            model_number: matched.model_number || '',
            variant: matched.variant || '',
            color: matched.color || '',
            serial_number: (matched.serial_numbers && matched.serial_numbers.length > 0) ? matched.serial_numbers[0] : '',
            quantity: 1,
            unit: 'pcs',
            base_price: matched.price,
            rate: matched.price,
            cost_price: matched.cost_price || 0,
            discount_type: 'percent',
            discount_value: 0,
            gst_rate: gst_rate,
            tax_rate: gst_rate,
            hsn_code: matched.hsn_code || taxHsn || '0000',
          })
        } else {
          updatedItems[0] = {
            ...updatedItems[0],
            product_id: matched.id,
            name: matched.name,
            sku: matched.sku || '',
            brand: matched.brand || '',
            model_number: matched.model_number || '',
            variant: matched.variant || '',
            color: matched.color || '',
            serial_number: (matched.serial_numbers && matched.serial_numbers.length > 0) ? matched.serial_numbers[0] : '',
            base_price: matched.price,
            rate: matched.price,
            cost_price: matched.cost_price || 0,
            gst_rate: gst_rate,
            tax_rate: gst_rate,
            hsn_code: matched.hsn_code || taxHsn || '0000',
          }
        }
      }
    }

    const newPaymentInfo = {
      ...currentInvoice.payment_info,
      mode: 'finance',
      finance_provider: scannedDoDetails.provider || currentInvoice.payment_info?.finance_provider || '',
      ref_id: scannedDoDetails.referenceId || currentInvoice.payment_info?.ref_id || '',
      paid_amount: scannedDoDetails.paidAmount || currentInvoice.payment_info?.paid_amount || 0,
    }

    const { finalTotal } = calculateTotals(updatedItems, currentInvoice.discount_on_total, currentInvoice.additional_charges)
    newPaymentInfo.pending_amount = Math.max(0, finalTotal - (newPaymentInfo.paid_amount || 0))
    newPaymentInfo.partial_payment = (newPaymentInfo.paid_amount || 0) < finalTotal

    setCurrentInvoice({
      ...currentInvoice,
      to_details: {
        ...currentInvoice.to_details,
        name: scannedDoDetails.name || currentInvoice.to_details.name || '',
        phone: scannedDoDetails.phone || currentInvoice.to_details.phone || '',
      },
      items: updatedItems,
      payment_info: newPaymentInfo,
      total_amount: finalTotal
    })

    setIsDoModalOpen(false)
    setScannedDoDetails(null)
    toast.success('DO details applied to invoice!')
  }

  const availableProducts = products.filter((product) => {
    const serialStock = product.serial_numbers?.length ?? 0
    const stock = serialStock > 0 ? serialStock : product.stock_count ?? 0
    return stock > 0
  })

  const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)
  
  // Calculate total profit across ALL invoices
  const totalProfit = invoices.reduce((sum, invoice) => {
    const revenue = invoice.total_amount || 0
    const cost = (invoice.items || []).reduce((acc: number, item: any) => acc + ((item.cost_price || 0) * (item.quantity || 0)), 0)
    return sum + (revenue - cost)
  }, 0)

  const paidRevenue = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)
  const pendingRevenue = invoices
    .filter((invoice) => invoice.status !== 'paid')
    .reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0)

  // Calculate average margin across ALL invoices
  const allMargins = invoices.map(inv => {
    const revenue = inv.total_amount || 0
    const cost = (inv.items || []).reduce((acc: number, item: any) => acc + ((item.cost_price || 0) * (item.quantity || 0)), 0)
    const profit = revenue - cost
    return revenue > 0 ? (profit / revenue) * 100 : 0
  })
  const averageMargin = allMargins.length
    ? Math.round(allMargins.reduce((sum, m) => sum + m, 0) / allMargins.length)
    : 0

  const revenueSegments = [
    { name: 'Paid', value: paidRevenue, color: '#8b5cf6' },
    { name: 'Pending', value: pendingRevenue, color: '#10b981' },
    { name: 'Profit', value: Math.max(totalProfit, 0), color: '#f97316' },
  ].filter((segment) => segment.value > 0)

  const handleCreateManual = () => {
    setCurrentInvoice({
      ...createEmptyInvoice(businessSettings),
      invoice_number: getFormattedInvoiceNumber('cash', '', '', '', businessSettings?.name || 'HOOGHLY ELECTRONICS'),
      items: [{ 
        product_id: '',
        name: '', 
        sku: '',
        brand: '',
        model_number: '',
        variant: '',
        color: '',
        serial_number: '',
        quantity: 1, 
        unit: 'pcs',
        base_price: 0, 
        discount_type: 'percent',
        discount_value: 0,
        gst_rate: 18, 
        tax_amount: 0, 
        amount: 0 
      }],
      status: 'paid',
      total_amount: 0,
      tax_type: 'intra-state',
      payment_info: {
        mode: 'cash',
        finance_provider: '',
        partial_payment: false,
        paid_amount: 0,
        pending_amount: 0,
        ref_id: ''
      },
      delivery_info: {
        status: 'pending',
        delivery_date: '',
        dispatch_through: '',
        vehicle_number: '',
        delivery_person: ''
      },
      installation_info: {
        required: false,
        status: 'pending',
        date: '',
        service_category: 'Standard Setup'
      }
    })
    setView('editor')
  }

  const finalizeAiInvoice = () => {
    const items = selectedProducts.map(p => {
      const { gst_rate: default_gst, hsn_code } = getTaxRate(p.category || '', p.subcategory || '')
      const gst_rate = p.custom_tax_rate != null ? p.custom_tax_rate : default_gst
      const basePrice = p.price
      const qty = 1
      const tax_amt = basePrice * qty * (gst_rate / 100)
      
      return {
        product_id: p.id,
        name: p.name,
        sku: p.sku || '',
        brand: p.brand || '',
        model_number: p.model_number || '',
        variant: p.variant || '',
        color: p.color || '',
        serial_number: (p.serial_numbers && p.serial_numbers.length > 0) ? p.serial_numbers[0] : '',
        quantity: qty,
        unit: 'pcs',
        base_price: basePrice,
        discount_type: 'percent',
        discount_value: 0,
        gst_rate: gst_rate,
        tax_amount: tax_amt,
        amount: basePrice + tax_amt
      }
    })
    
    const total = items.reduce((acc, item) => acc + item.amount, 0)
    
    setCurrentInvoice({
      ...createEmptyInvoice(businessSettings),
      invoice_number: getFormattedInvoiceNumber('cash', '', '', '', businessSettings?.name || 'HOOGHLY ELECTRONICS'),
      items,
      to_details: {
        ...createEmptyInvoice(businessSettings).to_details,
        ...currentInvoice.to_details,
      },
      status: 'paid',
      total_amount: total,
      tax_type: 'intra-state',
      payment_info: {
        mode: currentInvoice.payment_info?.mode || 'cash',
        finance_provider: '',
        partial_payment: false,
        paid_amount: total,
        pending_amount: 0,
        ref_id: ''
      },
      delivery_info: currentInvoice.delivery_info || {
        status: 'pending'
      },
      installation_info: currentInvoice.installation_info || {
        required: false,
        status: 'pending'
      }
    })
    
    setIsAiModalOpen(false)
    setView('editor')
  }

  const calculateTotals = (items: any[], discountOnTotal: number = 0, additionalCharges: number = 0) => {
    let taxableValue = 0
    let taxAmount = 0
    let cgstTotal = 0
    let sgstTotal = 0
    let igstTotal = 0

    const updatedItems = items.map(item => {
      const qty = Number(item.quantity || 1)
      const basePrice = Number(item.base_price || item.rate || 0)
      let discountAmt = 0

      if (item.discount_type === 'fixed') {
        discountAmt = Number(item.discount_value || 0)
      } else {
        discountAmt = (basePrice * qty) * (Number(item.discount_value || 0) / 100)
      }

      const itemTaxable = Math.max(0, (basePrice * qty) - discountAmt)
      const gstRate = Number(item.gst_rate || 18)
      const itemTax = itemTaxable * (gstRate / 100)

      return {
        ...item,
        amount: Math.round((itemTaxable + itemTax) * 100) / 100,
        tax_amount: Math.round(itemTax * 100) / 100
      }
    })

    updatedItems.forEach(item => {
      taxableValue += (Number(item.base_price || item.rate || 0) * Number(item.quantity || 1)) - (item.discount_type === 'fixed' ? Number(item.discount_value || 0) : ((Number(item.base_price || item.rate || 0) * Number(item.quantity || 1)) * (Number(item.discount_value || 0) / 100)))
      taxAmount += item.tax_amount

      if (currentInvoice?.tax_type === 'inter-state') {
        igstTotal += item.tax_amount
      } else {
        cgstTotal += item.tax_amount / 2
        sgstTotal += item.tax_amount / 2
      }
    })

    const subtotal = taxableValue + taxAmount
    const finalTotal = (subtotal * (1 - (discountOnTotal || 0) / 100)) + Number(additionalCharges || 0)

    return { 
      updatedItems, 
      taxableValue: Math.round(taxableValue * 100) / 100, 
      taxAmount: Math.round(taxAmount * 100) / 100, 
      cgstTotal: Math.round(cgstTotal * 100) / 100, 
      sgstTotal: Math.round(sgstTotal * 100) / 100, 
      igstTotal: Math.round(igstTotal * 100) / 100, 
      finalTotal: Math.round(finalTotal) 
    }
  }

  const handleDesiredTotalChange = (desiredTotal: number) => {
    if (!currentInvoice.items || currentInvoice.items.length === 0) return

    const D = currentInvoice.discount_on_total || 0
    const C = currentInvoice.additional_charges || 0
    
    const discountFactor = 1 - D / 100
    const T = discountFactor === 0 ? 0 : Math.max(0, desiredTotal - C) / discountFactor

    let sum_Pk = 0
    let sum_c = 0

    const itemCoefficients = currentInvoice.items.map((item: any) => {
      const Q_i = Number(item.quantity || 1)
      const R_i = Number(item.gst_rate || item.tax_rate || 18)
      const P_i = Number(item.base_price || item.rate || 0)
      const discVal = Number(item.discount_value || item.discount || 0)
      const discType = item.discount_type || 'percent'

      let k_i = 0
      let c_i = 0

      if (discType === 'fixed') {
        k_i = Q_i * (1 + R_i / 100)
        c_i = discVal * (1 + R_i / 100)
      } else {
        k_i = Q_i * (1 - discVal / 100) * (1 + R_i / 100)
        c_i = 0
      }

      sum_Pk += P_i * k_i
      sum_c += c_i

      return { k_i, c_i, P_i, Q_i, R_i, discType, discVal }
    })

    let updatedItems = []

    if (sum_Pk > 0) {
      const S = (T + sum_c) / sum_Pk
      
      updatedItems = currentInvoice.items.map((item: any, idx: number) => {
        const coeff = itemCoefficients[idx]
        const newBasePrice = Math.round((coeff.P_i * S) * 100) / 100

        return {
          ...item,
          base_price: newBasePrice,
          rate: newBasePrice,
        }
      })
    } else {
      const N = currentInvoice.items.length
      const targetItemAmount = T / N

      updatedItems = currentInvoice.items.map((item: any) => {
        const Q_i = Number(item.quantity || 1)
        const R_i = Number(item.gst_rate || item.tax_rate || 18)
        const discVal = Number(item.discount_value || item.discount || 0)
        const discType = item.discount_type || 'percent'

        let newBasePrice = 0
        if (discType === 'fixed') {
          newBasePrice = (targetItemAmount / (1 + R_i / 100) + discVal) / Q_i
        } else {
          const denom = Q_i * (1 - discVal / 100) * (1 + R_i / 100)
          newBasePrice = denom === 0 ? 0 : targetItemAmount / denom
        }

        newBasePrice = Math.round(newBasePrice * 100) / 100

        return {
          ...item,
          base_price: newBasePrice,
          rate: newBasePrice,
        }
      })
    }

    const { updatedItems: finalizedItems, finalTotal: rawFinalTotal } = calculateTotals(updatedItems, D, C)
    
    // Force the exact total the user requested to avoid float drift
    const displayTotal = Math.abs(rawFinalTotal - desiredTotal) <= 2 ? desiredTotal : rawFinalTotal;

    // Also update paid_amount in payment_info if status is paid
    const updatedPaymentInfo = currentInvoice.payment_info ? {
      ...currentInvoice.payment_info,
      paid_amount: displayTotal,
      pending_amount: 0,
      partial_payment: false
    } : null

    setCurrentInvoice({
      ...currentInvoice,
      items: finalizedItems,
      total_amount: displayTotal,
      payment_info: updatedPaymentInfo || currentInvoice.payment_info
    })
  }
  
  const handleProductSelect = (idx: number, productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    const newItems = [...currentInvoice.items]
    const { gst_rate: default_gst, hsn_code: taxHsn } = getTaxRate(product.category || '', product.subcategory || '')
    const gst_rate = product.custom_tax_rate != null ? product.custom_tax_rate : default_gst
    const qty = 1

    newItems[idx] = {
      ...newItems[idx],
      product_id: product.id,
      name: product.name,
      sku: product.sku || '',
      brand: product.brand || '',
      model_number: product.model_number || '',
      variant: product.variant || '',
      color: product.color || '',
      serial_number: (product.serial_numbers && product.serial_numbers.length > 0) ? product.serial_numbers[0] : '',
      quantity: qty,
      unit: 'pcs',
      base_price: (product.selling_price && product.selling_price > 0) ? (product.selling_price / (1 + gst_rate/100)) : product.price,
      rate: (product.selling_price && product.selling_price > 0) ? (product.selling_price / (1 + gst_rate/100)) : product.price,
      cost_price: product.cost_price || 0,
      discount_type: 'percent',
      discount_value: 0,
      gst_rate: gst_rate,
      tax_rate: gst_rate,
      hsn_code: product.hsn_code || taxHsn || '0000',
    }

    const { updatedItems, finalTotal } = calculateTotals(newItems, currentInvoice.discount_on_total, currentInvoice.additional_charges)
    setCurrentInvoice({...currentInvoice, items: updatedItems, total_amount: finalTotal})
  }

  const handleViewInvoice = (invoice: Invoice) => {
    const editorData = {
      ...invoice,
      invoice_date: invoice.created_at.split('T')[0],
      buyer_ref: '',
      payment_terms: invoice.payment_info?.mode || 'PAID',
      destination: '',
      from_details: invoice.items?.[0] ? {
        name: businessSettings?.name || '',
        address1: businessSettings?.address_regd || '',
        address2: businessSettings?.address_work || '',
        phone: businessSettings?.phone_primary || '',
        email: businessSettings?.email || '',
        gstin: businessSettings?.gst_number || ''
      } : { name: '', address1: '', address2: '', phone: '', email: '', gstin: '' },
      to_details: {
        name: invoice.customer_name,
        address1: invoice.delivery_info?.dispatch_through || '',
        address2: '',
        city: '',
        state: '',
        postal: '',
        phone: invoice.customer_phone || '',
        email: invoice.customer_email || '',
      },
      items: invoice.items.map(item => ({
        ...item,
        rate: item.base_price || item.price || 0,
        discount: item.discount_value || 0,
        tax_rate: item.gst_rate || item.tax_rate || 18
      })),
      discount_on_total: 0,
      additional_charges: 0,
      tax_type: (invoice.tax_split?.igst && invoice.tax_split.igst > 0) ? 'inter-state' : 'intra-state'
    }
    
    setCurrentInvoice(editorData as any)
    setIsViewOnly(true)
    setView('editor')
  }

  const handleSaveInvoice = async () => {
    setIsSavingInvoice(true)
    
    try {
      const customerRecord = await upsertCustomerFromInvoice({
        fullName: currentInvoice.to_details.name,
        phone: currentInvoice.to_details.phone,
        email: currentInvoice.to_details.email,
        alternate_phone: currentInvoice.to_details.alternate_phone,
        address_billing: currentInvoice.to_details.address1,
        address_delivery: currentInvoice.to_details.address_delivery,
        pin_code: currentInvoice.to_details.pin_code,
        state: currentInvoice.to_details.state,
        gstin: currentInvoice.to_details.gstin,
      })

      const itemsToSave = currentInvoice.items.map((item: any) => ({
        product_id: item.product_id || null,
        name: item.name,
        sku: item.sku || '',
        brand: item.brand || '',
        model_number: item.model_number || '',
        variant: item.variant || '',
        color: item.color || '',
        serial_number: item.serial_number || '',
        quantity: Number(item.quantity || 1),
        unit: item.unit || 'pcs',
        base_price: Number(item.base_price || item.rate || 0),
        cost_price: Number(item.cost_price || 0),
        discount_type: item.discount_type || 'percent',
        discount_value: Number(item.discount_value || item.discount || 0),
        gst_rate: Number(item.gst_rate || item.tax_rate || 18),
        final_amount: Number(item.amount || 0),
        // Fallbacks
        price: Number(item.base_price || item.rate || 0),
        total: Number(item.amount || 0),
        tax_rate: Number(item.gst_rate || item.tax_rate || 18),
        tax_amount: Number(item.tax_amount || 0)
      }))

      const { cgstTotal, sgstTotal, igstTotal, finalTotal } = calculateTotals(
        currentInvoice.items,
        currentInvoice.discount_on_total || 0,
        currentInvoice.additional_charges || 0
      )

      const invoicePayload = {
        invoice_number: currentInvoice.invoice_number,
        customer_name: currentInvoice.to_details.name,
        customer_phone: currentInvoice.to_details.phone || '',
        customer_email: currentInvoice.to_details.email || '',
        status: currentInvoice.status || 'paid',
        total_amount: finalTotal,
        items: itemsToSave,
        tax_split: { cgst: cgstTotal, sgst: sgstTotal, igst: igstTotal },
        payment_info: currentInvoice.payment_info || {
          mode: 'cash',
          finance_provider: '',
          partial_payment: false,
          paid_amount: finalTotal,
          pending_amount: 0,
          ref_id: ''
        },
        delivery_info: currentInvoice.delivery_info || {
          status: 'pending'
        },
        installation_info: currentInvoice.installation_info || {
          required: false,
          status: 'pending'
        }
      } as any;

      let result;
      if (currentInvoice.id) {
        result = await updateInvoice(currentInvoice.id, invoicePayload);
      } else {
        result = await createInvoice(invoicePayload);
      }
      
      toast.success('Invoice settled and ledger synchronized')

      // --- Ledger Synchronization ---
      try {
        // Customers are always Sundry Debtors
        const mappedGroup: UnderGroup = 'Sundry Debtors'

        // Check if ledger already exists
        const ledgers = await getLedgers()
        const existingLedger = ledgers.find(l => 
          l.ledger_name.toLowerCase() === currentInvoice.to_details.name.toLowerCase() && 
          (l.customer_phone === currentInvoice.to_details.phone || (!l.customer_phone && !currentInvoice.to_details.phone))
        )

        if (existingLedger) {
          // Update existing ledger balance
          const newBalance = existingLedger.opening_balance + finalTotal
          await updateLedger(existingLedger.id, { 
            opening_balance: newBalance,
            ...(mappedGroup === 'Cheque Receipt' && currentInvoice.payment_info?.cheque_end_date ? { cheque_end_date: currentInvoice.payment_info.cheque_end_date } : {})
          })
        } else {
          // Create new ledger
          await addLedger({
            ledger_name: currentInvoice.to_details.name,
            customer_phone: currentInvoice.to_details.phone || '',
            under_group: mappedGroup,
            maintain_balances_bill_by_bill: true,
            credit_period_days: 0,
            credit_limit_amount: 0,
            address: currentInvoice.to_details.address1 || '',
            state: currentInvoice.to_details.state || '',
            pincode: currentInvoice.to_details.pin_code || '',
            pan_no: '',
            registration_type: 'Regular',
            gstin: currentInvoice.to_details.gstin || '',
            opening_balance: finalTotal,
            balance_type: 'Dr', // Always Dr for Debtors
            bank_accounts: [],
            upi_ids: [],
            cheque_end_date: currentInvoice.payment_info?.cheque_end_date || undefined
          })
        }
      } catch (err) {
        console.error('Failed to sync with ledger', err)
      }

      // --- Cross-Platform Synchronization Pipeline ---
      try {
        // 1. Log Operational Sale
        await logSale({
          invoice_id: (result as any)?.id || 'manual-sync',
          invoice_number: currentInvoice.invoice_number,
          customer_id: customerRecord?.id || null,
          total_amount: finalTotal,
          items_count: itemsToSave.length,
          customer_name: currentInvoice.to_details.name,
          customer_phone: currentInvoice.to_details.phone || '',
          customer_email: currentInvoice.to_details.email || '',
          delivery_address: [
            currentInvoice.to_details.address_delivery || currentInvoice.to_details.address1,
            currentInvoice.to_details.city,
            currentInvoice.to_details.state,
            currentInvoice.to_details.postal || currentInvoice.to_details.pin_code,
          ].filter(Boolean).join(', '),
          payment_method: currentInvoice.payment_info?.mode || 'cash',
          order_date: new Date().toISOString()
        })

        // 2. Trigger Side-Effects for each item
        for (const item of itemsToSave) {
          // A. Automated Inventory Depletion
          if (item.product_id) {
            await decrementProductStock(item.product_id, item.quantity)
          }

          // B. Service Hub Warranty Activation
          await createWarranty({
            invoice_number: currentInvoice.invoice_number,
            product_id: item.product_id || 'manual',
            product_name: item.name,
            customer_name: currentInvoice.to_details.name,
            purchase_date: new Date().toISOString(),
            expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
          })

          // C. Service Operations Hub Ticketing
          await createServiceCall(
            customerRecord?.id || currentInvoice.to_details.name,
            'warranty',
            item.product_id || 'manual',
            new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // Scheduled for tomorrow
            `Automated Provisioning: 1-Year Warranty activated for ${item.name}. Included setup and installation services pending.`,
            {
              contact_email: currentInvoice.to_details.email || '',
              contact_phone: currentInvoice.to_details.phone || '',
              profile: { full_name: currentInvoice.to_details.name }
            }
          )
        }
        console.log('Ecosystem synchronization complete.')
      } catch (syncErr) {
        console.warn('Ecosystem sync partial failure:', syncErr)
      }
      
      setTimeout(() => {
        setView('list')
        setIsConfirmed(false)
        setIsSavingInvoice(false)
        loadData()
      }, 800)
    } catch (error: any) {
      toast.error(`Sync interruption: ${error.message}`)
      setIsSavingInvoice(false)
    }
  }

  if (view === 'editor') {
    const ITEMS_PER_PAGE = 2;
    const itemsList = currentInvoice.items || [];
    const productChunks = [];
    for (let i = 0; i < Math.max(1, itemsList.length); i += ITEMS_PER_PAGE) {
      productChunks.push(itemsList.slice(i, i + ITEMS_PER_PAGE));
    }

    return (
      <div className="min-h-screen bg-[#fcfcfb] pb-20 print:pb-0 print:bg-white font-sans selection:bg-blue-100">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: auto;
              margin: 0 !important;
            }
            html, body {
              overflow: visible !important;
              height: auto !important;
              background-color: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              padding: 0 !important;
              margin: 0 !important;
              box-sizing: border-box;
              zoom: 0.96 !important;
            }
            select {
              -webkit-appearance: none !important;
              -moz-appearance: none !important;
              appearance: none !important;
              background-image: none !important;
            }
            .page-break-before {
              page-break-before: always !important;
              break-before: page !important;
            }
            .print\:mt-8 {
              margin-top: 2rem !important;
            }
            /* Hide scrollbars completely on print */
            ::-webkit-scrollbar {
              display: none !important;
              width: 0 !important;
              height: 0 !important;
            }
            * {
              overflow: visible !important;
              scrollbar-width: none !important;
              -ms-overflow-style: none !important;
            }
            header, footer, nav, button, .print\\:hidden, #do-file-input {
              display: none !important;
            }
            /* Avoid page breaks inside table rows and designated elements */
            tr, .print-no-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}} />
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-[#f1f1f0] flex items-center justify-between px-8 sticky top-0 z-30 shrink-0 print:hidden">
          <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => { setView('list'); setIsViewOnly(false); setIsConfirmed(false); }} className="h-8 w-8 rounded-xl text-[#acaba9] hover:bg-[#f7f7f5] hover:text-[#37352f]">
                <ArrowLeft className="h-4 w-4" />
             </Button>
             <div className="flex items-center gap-2">
                <h2 className="text-[10px] font-black text-[#acaba9] uppercase tracking-[0.2em]">{isViewOnly ? 'Reviewing Protocol' : 'Drafting Invoice'}</h2>
                <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${isViewOnly ? 'bg-orange-500' : 'bg-green-500'}`} />
             </div>
          </div>
          <div className="flex items-center gap-3">
             {isViewOnly && (
               <div className="flex items-center gap-2">
                 <Badge className="bg-orange-50 text-orange-600 border-none px-3 py-1 text-[8px] font-black uppercase tracking-widest">Read Only Ledger</Badge>
                 <Button variant="outline" size="sm" onClick={() => setIsViewOnly(false)} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#37352f] hover:bg-[#f7f7f5] border-[#f1f1f0]">
                    <Edit3 className="h-3 w-3 mr-1.5" />
                    Edit Invoice
                 </Button>
               </div>
             )}
             <Button variant="ghost" size="sm" onClick={() => setIsPreviewMode(!isPreviewMode)} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#37352f] hover:bg-[#f7f7f5]">
                {isPreviewMode ? 'Exit Preview' : 'Preview Mode'}
             </Button>
             <Button size="sm" onClick={() => window.print()} className="h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest bg-[#37352f] hover:bg-black text-white shadow-lg shadow-gray-100 flex items-center gap-2">
                <Printer className="h-3.5 w-3.5" />
                Direct Print
             </Button>
          </div>
        </header>

        {productChunks.map((chunk, pageIndex) => (
        <div key={pageIndex} className={`max-w-[850px] mx-auto bg-white p-16 mt-12 mb-12 shadow-[0_40px_100px_rgba(0,0,0,0.04)] border border-[#f1f1f0] rounded-[48px] transition-all duration-500 relative print:shadow-none print:border-none print:rounded-none print:px-12 print:py-12 print:max-w-[850px] print:w-full print:my-0 print:mx-auto print:flex print:flex-col print:min-h-[99vh] ${isPreviewMode ? 'scale-[1.02]' : ''} ${pageIndex > 0 ? 'page-break-before' : ''}`}>
          {/* Custom Header Layout */}
          <div className="flex justify-between items-start mb-8 print:mb-4 gap-4">
             {/* Left Section: Company & Buyer Details */}
             <div className="w-[40%] flex flex-col gap-6">
                <div className="flex gap-4">
                   {/* Logo */}
                   <div className="shrink-0 pt-0.5">
                      {businessSettings?.logo_url ? (
                        <img src={businessSettings.logo_url} alt="Company Logo" className="h-[64px] w-[64px] object-contain rounded-xl" />
                      ) : (
                        <div className="h-[64px] w-[64px] bg-[#31332c] rounded-xl flex items-center justify-center text-white font-black text-3xl shadow-sm">
                          {businessSettings?.name ? businessSettings.name.charAt(0) : 'H'}
                        </div>
                      )}
                   </div>
                   
                   <div className="flex flex-col gap-1 w-full">
                       <div className="flex justify-between w-full pr-4">
                         <h1 className="text-sm font-black text-[#37352f] tracking-widest uppercase">
                            {businessSettings?.name || 'HOOGHLY ELECTRONICS'}
                         </h1>
                         {productChunks.length > 1 && (
                           <span className="text-[9px] font-bold text-gray-400 uppercase print:block hidden pt-0.5">Page {pageIndex + 1} of {productChunks.length}</span>
                         )}
                       </div>
                      <p className="text-[9px] font-bold text-[#37352f] uppercase leading-tight max-w-[80%]">
                        {businessSettings?.address_regd || 'HOOGHLY, WEST BENGAL, INDIA'}
                      </p>
                      <p className="text-[9px] font-bold text-[#37352f] uppercase">
                        State Name: West Bengal, Code: 19
                      </p>
                      <p className="text-[9px] font-bold text-[#37352f] uppercase mt-2">
                        Phone: {businessSettings?.phone_primary || ''}
                      </p>
                      <p className="text-[9px] font-bold text-[#37352f] uppercase">
                        E-Mail: {businessSettings?.email || ''}
                      </p>
                      {businessSettings?.gst_number && (
                        <p className="text-[9px] font-bold text-[#37352f] uppercase mt-2">
                          GSTIN: {businessSettings.gst_number}
                        </p>
                      )}
                   </div>
                </div>

                <div className="space-y-2">
                      <p className="text-[9px] font-black text-[#37352f] uppercase border-b border-[#37352f] inline-block mb-1">Buyer (Bill to)</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] text-gray-700">
                        <div>
                          <Label className="text-[8px] font-bold text-gray-400 block uppercase">Client Name*</Label>
                          {isViewOnly ? (
                            <div className="text-[10px] font-bold text-[#37352f] uppercase w-full whitespace-pre-wrap break-words leading-tight pt-0.5">
                              {currentInvoice.to_details.name || 'CLIENT NAME*'}
                            </div>
                          ) : (
                            <>
                              <textarea 
                                placeholder="Client Name*"
                                value={currentInvoice.to_details.name} 
                                onChange={e => setCurrentInvoice({...currentInvoice, to_details: {...currentInvoice.to_details, name: e.target.value}})}
                                ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }}
                                rows={1}
                                style={{ overflow: 'hidden' }}
                                className="bg-transparent border-none rounded-none px-0 text-[10px] font-bold text-[#37352f] uppercase focus:ring-0 outline-none w-full resize-none leading-tight print:hidden"
                              />
                              <div className="hidden print:block text-[10px] font-bold text-[#37352f] uppercase w-full whitespace-pre-wrap break-words leading-tight pt-0.5">
                                {currentInvoice.to_details.name || 'CLIENT NAME*'}
                              </div>
                            </>
                          )}
                        </div>
                        <div>
                          <Label className="text-[8px] font-bold text-gray-400 block uppercase">Client Phone*</Label>
                          {isViewOnly ? (
                            <div className="text-[10px] font-bold text-[#37352f] uppercase w-full whitespace-pre-wrap break-words pt-0.5">
                              {currentInvoice.to_details.phone || 'CLIENT PHONE*'}
                            </div>
                          ) : (
                            <Input 
                              placeholder="Client Phone*" 
                              value={currentInvoice.to_details.phone || ''} 
                              onChange={e => setCurrentInvoice({...currentInvoice, to_details: {...currentInvoice.to_details, phone: e.target.value}})}
                              className="bg-transparent border-none rounded-none px-0 h-4 !text-[10px] font-bold text-[#37352f] uppercase focus-visible:ring-0" 
                            />
                          )}
                        </div>
                        <div>
                          <Label className="text-[8px] font-bold text-gray-400 block uppercase">Alternate Phone</Label>
                          {isViewOnly ? (
                            <div className="text-[10px] font-bold text-[#37352f] uppercase w-full whitespace-pre-wrap break-words pt-0.5">
                              {currentInvoice.to_details.alternate_phone || 'ALT PHONE'}
                            </div>
                          ) : (
                            <Input 
                              placeholder="Alt Phone" 
                              value={currentInvoice.to_details.alternate_phone || ''} 
                              onChange={e => setCurrentInvoice({...currentInvoice, to_details: {...currentInvoice.to_details, alternate_phone: e.target.value}})}
                              className="bg-transparent border-none rounded-none px-0 h-4 !text-[10px] font-bold text-[#37352f] uppercase focus-visible:ring-0" 
                            />
                          )}
                        </div>
                        <div>
                          <Label className="text-[8px] font-bold text-gray-400 block uppercase">Client Email</Label>
                          {isViewOnly ? (
                            <div className="text-[10px] font-bold text-[#37352f] uppercase w-full whitespace-pre-wrap break-words leading-tight pt-0.5">
                              {currentInvoice.to_details.email || 'CLIENT EMAIL'}
                            </div>
                          ) : (
                            <>
                              <textarea 
                                placeholder="Client Email"
                                value={currentInvoice.to_details.email || ''} 
                                onChange={e => setCurrentInvoice({...currentInvoice, to_details: {...currentInvoice.to_details, email: e.target.value}})}
                                ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }}
                                rows={1}
                                style={{ overflow: 'hidden' }}
                                className="bg-transparent border-none rounded-none px-0 text-[10px] font-bold text-[#37352f] uppercase focus:ring-0 outline-none w-full resize-none leading-tight print:hidden"
                              />
                              <div className="hidden print:block text-[10px] font-bold text-[#37352f] uppercase w-full whitespace-pre-wrap break-words leading-tight pt-0.5">
                                {currentInvoice.to_details.email || 'CLIENT EMAIL'}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Label className="text-[8px] font-bold text-gray-400 block uppercase">Billing Address</Label>
                          {isViewOnly ? (
                            <div className="text-[10px] font-bold text-[#37352f] uppercase w-full whitespace-pre-wrap break-words leading-tight pt-0.5">
                              {currentInvoice.to_details.address1 || 'BILLING ADDRESS'}
                            </div>
                          ) : (
                            <>
                              <textarea 
                                placeholder="Billing Address"
                                value={currentInvoice.to_details.address1 || ''}
                                onChange={e => setCurrentInvoice({...currentInvoice, to_details: {...currentInvoice.to_details, address1: e.target.value}})}
                                ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }}
                                rows={1}
                                style={{ overflow: 'hidden' }}
                                className="bg-transparent border-none rounded-none px-0 text-[10px] font-bold text-[#37352f] uppercase focus:ring-0 outline-none w-full resize-none leading-tight print:hidden"
                              />
                              <div className="hidden print:block text-[10px] font-bold text-[#37352f] uppercase w-full whitespace-pre-wrap break-words leading-tight pt-0.5">
                                {currentInvoice.to_details.address1 || 'BILLING ADDRESS'}
                              </div>
                            </>
                          )}
                        </div>
                        <div className="col-span-2">
                          <Label className="text-[8px] font-bold text-gray-400 block uppercase">Delivery Address</Label>
                          {isViewOnly ? (
                            <div className="text-[10px] font-bold text-[#37352f] uppercase w-full whitespace-pre-wrap break-words leading-tight pt-0.5">
                              {currentInvoice.to_details.address_delivery || 'DELIVERY ADDRESS (IF DIFFERENT)'}
                            </div>
                          ) : (
                            <>
                              <textarea 
                                placeholder="Delivery Address (if different)"
                                value={currentInvoice.to_details.address_delivery || ''}
                                onChange={e => setCurrentInvoice({...currentInvoice, to_details: {...currentInvoice.to_details, address_delivery: e.target.value}})}
                                ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                                onInput={e => { e.currentTarget.style.height = 'auto'; e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px'; }}
                                rows={1}
                                style={{ overflow: 'hidden' }}
                                className="bg-transparent border-none rounded-none px-0 text-[10px] font-bold text-[#37352f] uppercase focus:ring-0 outline-none w-full resize-none leading-tight print:hidden"
                              />
                              <div className="hidden print:block text-[10px] font-bold text-[#37352f] uppercase w-full whitespace-pre-wrap break-words leading-tight pt-0.5">
                                {currentInvoice.to_details.address_delivery || 'DELIVERY ADDRESS (IF DIFFERENT)'}
                              </div>
                            </>
                          )}
                        </div>
                        <div>
                          <Label className="text-[8px] font-bold text-gray-400 block uppercase">PIN Code</Label>
                          {isViewOnly ? (
                            <div className="text-[10px] font-bold text-[#37352f] uppercase w-full whitespace-pre-wrap break-words pt-0.5">
                              {currentInvoice.to_details.pin_code || 'PIN CODE'}
                            </div>
                          ) : (
                            <Input 
                              placeholder="PIN Code" 
                              value={currentInvoice.to_details.pin_code || ''}
                              onChange={e => setCurrentInvoice({...currentInvoice, to_details: {...currentInvoice.to_details, pin_code: e.target.value}})}
                              className="bg-transparent border-none rounded-none px-0 h-4 !text-[10px] font-bold text-[#37352f] uppercase focus-visible:ring-0" 
                            />
                          )}
                        </div>
                        <div>
                          <Label className="text-[8px] font-bold text-gray-400 block uppercase">State / Code</Label>
                          {isViewOnly ? (
                            <div className="text-[10px] font-bold text-[#37352f] uppercase w-full whitespace-pre-wrap break-words pt-0.5">
                              {currentInvoice.to_details.state || 'WEST BENGAL'}
                            </div>
                          ) : (
                            <Input 
                              placeholder="West Bengal" 
                              value={currentInvoice.to_details.state || ''}
                              onChange={e => setCurrentInvoice({...currentInvoice, to_details: {...currentInvoice.to_details, state: e.target.value}})}
                              className="bg-transparent border-none rounded-none px-0 h-4 !text-[10px] font-bold text-[#37352f] uppercase focus-visible:ring-0" 
                            />
                          )}
                        </div>
                        <div className="col-span-2">
                          <Label className="text-[8px] font-bold text-gray-400 block uppercase">GSTIN (Corporate Billing)</Label>
                          {isViewOnly ? (
                            <div className="text-[9px] font-black text-[#37352f] uppercase w-full whitespace-pre-wrap break-words pt-0.5">
                              {currentInvoice.to_details.gstin || 'XXXX'}
                            </div>
                          ) : (
                            <Input 
                              placeholder="XXXX" 
                              value={currentInvoice.to_details.gstin || ''}
                              onChange={e => setCurrentInvoice({...currentInvoice, to_details: {...currentInvoice.to_details, gstin: e.target.value}})}
                              className="bg-transparent border-none rounded-none px-0 h-4 text-[9px] font-black text-[#37352f] uppercase focus-visible:ring-0" 
                            />
                          )}
                        </div>
                      </div>
                   </div>
                </div>

             {/* Right Section: Simplified Tally-style Grid */}
             <div className="w-[55%] flex flex-col gap-2">
                <div className="border border-[#37352f] flex flex-col text-[#37352f]">
                   <div className="flex border-b border-[#37352f]">
                      <div className="w-1/2 p-1.5 border-r border-[#37352f]">
                         <p className="text-[8px] font-medium leading-none mb-0.5">Invoice No.</p>
                         <Input disabled={isViewOnly} value={currentInvoice.invoice_number} onChange={e => setCurrentInvoice({...currentInvoice, invoice_number: e.target.value})} className="h-4 w-full px-0 py-0 text-[9px] tracking-tight font-black border-none rounded-none focus-visible:ring-0 bg-transparent uppercase" />
                      </div>
                      <div className="w-1/2 p-1.5">
                         <p className="text-[8px] font-medium leading-none mb-0.5">Dated</p>
                         <Input disabled={isViewOnly} type="date" value={currentInvoice.invoice_date} onChange={e => setCurrentInvoice({...currentInvoice, invoice_date: e.target.value})} className="h-4 px-0 py-0 text-[10px] font-bold border-none rounded-none focus-visible:ring-0 bg-transparent uppercase" />
                      </div>
                   </div>
                   <div className="flex border-b border-[#37352f]">
                      <div className="w-1/2 p-1.5 border-r border-[#37352f]">
                          <p className="text-[8px] font-medium leading-none mb-0.5">Payment Mode</p>
                          {isViewOnly ? (
                            <div className="text-[10px] font-black text-[#37352f] uppercase break-words whitespace-pre-wrap leading-tight pt-0.5">
                              {currentInvoice.payment_info?.mode || 'cash'}
                            </div>
                          ) : (
                            <select
                              disabled={isViewOnly}
                              value={currentInvoice.payment_info?.mode || 'cash'}
                              onChange={e => {
                                const val = e.target.value
                                const newFinanceProvider = val === 'finance' ? currentInvoice.payment_info?.finance_provider : ''
                                const newInvNum = getFormattedInvoiceNumber(val, newFinanceProvider || '', currentInvoice.invoice_number, currentInvoice.date, businessSettings?.name || 'HOOGHLY ELECTRONICS')
                                setCurrentInvoice({
                                  ...currentInvoice,
                                  invoice_number: newInvNum,
                                  payment_info: { ...currentInvoice.payment_info, mode: val, finance_provider: newFinanceProvider }
                                })
                              }}
                              className="w-full bg-transparent border-none text-[10px] font-black text-[#37352f] focus:ring-0 outline-none p-0 h-4 disabled:appearance-none disabled:opacity-100 uppercase"
                            >
                              <option value="cash">Cash</option>
                              <option value="upi">UPI</option>
                              <option value="card">Card</option>
                              <option value="finance">Finance</option>
                              <option value="neft">NEFT</option>
                              <option value="cheque">Cheque</option>
                            </select>
                          )}
                       </div>
                        <div className="w-1/2 p-1.5">
                           <p className="text-[8px] font-medium leading-none mb-0.5">Finance Provider</p>
                           {isViewOnly ? (
                             <div className="text-[10px] font-black text-[#37352f] uppercase break-words whitespace-pre-wrap leading-tight pt-0.5">
                               {currentInvoice.payment_info?.finance_provider || '-'}
                             </div>
                           ) : (
                             (!currentInvoice.payment_info?.finance_provider || 
                             ['BAJAJ FINSERV', 'IDFC FIRST BANK', 'HDB FINANCE', 'TVS CREDIT', 'KOTAK MAHINDRA BANK', 'PINE LABS'].includes(currentInvoice.payment_info.finance_provider.toUpperCase()) ||
                             currentInvoice.payment_info.finance_provider === '') ? (
                               <select
                                 disabled={isViewOnly || currentInvoice.payment_info?.mode !== 'finance'}
                                 value={currentInvoice.payment_info?.finance_provider?.toUpperCase() || ''}
                                 onChange={e => {
                                   const val = e.target.value
                                   const newInvNum = getFormattedInvoiceNumber(currentInvoice.payment_info?.mode || '', val, currentInvoice.invoice_number, currentInvoice.date, businessSettings?.name || 'HOOGHLY ELECTRONICS')
                                   setCurrentInvoice({
                                     ...currentInvoice,
                                     invoice_number: newInvNum,
                                     payment_info: { ...currentInvoice.payment_info, finance_provider: val }
                                   })
                                 }}
                                 className="w-full bg-transparent border-none text-[10px] font-black text-[#37352f] focus:ring-0 outline-none p-0 h-4 disabled:appearance-none disabled:opacity-100 uppercase"
                               >
                                 <option value="">SELECT PROVIDER</option>
                                 <option value="BAJAJ FINSERV">BAJAJ FINSERV</option>
                                 <option value="IDFC FIRST BANK">IDFC FIRST BANK</option>
                                 <option value="HDB FINANCE">HDB FINANCE</option>
                                 <option value="TVS CREDIT">TVS CREDIT</option>
                                 <option value="KOTAK MAHINDRA BANK">KOTAK MAHINDRA BANK</option>
                                 <option value="PINE LABS">PINE LABS</option>
                                 <option value="CUSTOM">OTHER (CUSTOM)</option>
                               </select>
                             ) : (
                               <div className="flex gap-1 items-center">
                                 <Input 
                                   disabled={isViewOnly || currentInvoice.payment_info?.mode !== 'finance'} 
                                   placeholder="Enter custom provider"
                                   value={currentInvoice.payment_info?.finance_provider === 'CUSTOM' ? '' : currentInvoice.payment_info?.finance_provider || ''} 
                                   onChange={e => setCurrentInvoice({
                                     ...currentInvoice,
                                     payment_info: { ...currentInvoice.payment_info, finance_provider: e.target.value }
                                   })} 
                                   className="h-4 px-0 py-0 text-[10px] font-bold border-none rounded-none focus-visible:ring-0 bg-transparent uppercase w-full animate-in fade-in duration-200" 
                                 />
                                 <button
                                   type="button"
                                   onClick={() => setCurrentInvoice({
                                     ...currentInvoice,
                                     payment_info: { ...currentInvoice.payment_info, finance_provider: '' }
                                   })}
                                   className="text-[8px] text-red-500 font-bold hover:underline shrink-0"
                                 >
                                   Reset
                                 </button>
                               </div>
                             )
                           )}
                        </div>
                   </div>
                   <div className="flex">
                      <div className="w-1/2 p-1.5 border-r border-[#37352f]">
                         {currentInvoice.payment_info?.mode === 'finance' ? (
                           <div className="flex gap-2 w-full">
                             <div className="w-1/3">
                               <p className="text-[8px] font-medium leading-none mb-0.5">DP Amount</p>
                               <div className="relative">
                                 <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-500">₹</span>
                                 <Input 
                                   disabled={isViewOnly} 
                                   type="number"
                                   value={currentInvoice.payment_info?.dp_amount || ''} 
                                   onChange={e => setCurrentInvoice({
                                     ...currentInvoice,
                                     payment_info: { ...currentInvoice.payment_info, dp_amount: Number(e.target.value) }
                                   })} 
                                   className="h-4 pl-3.5 pr-0 py-0 text-[10px] font-bold border-none shadow-none rounded-none focus-visible:ring-0 bg-transparent w-full" 
                                 />
                               </div>
                             </div>
                             <div className="w-1/3">
                               <p className="text-[8px] font-medium leading-none mb-0.5">EMI Amount</p>
                               <div className="relative">
                                 <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-gray-500">₹</span>
                                 <Input 
                                   disabled={isViewOnly} 
                                   type="number"
                                   value={currentInvoice.payment_info?.emi_amount || ''} 
                                   onChange={e => setCurrentInvoice({
                                     ...currentInvoice,
                                     payment_info: { ...currentInvoice.payment_info, emi_amount: Number(e.target.value) }
                                   })} 
                                   className="h-4 pl-3.5 pr-0 py-0 text-[10px] font-bold border-none shadow-none rounded-none focus-visible:ring-0 bg-transparent w-full" 
                                 />
                               </div>
                             </div>
                             <div className="w-1/3">
                               <p className="text-[8px] font-medium leading-none mb-0.5">Months</p>
                               <div className="relative">
                                 <Input 
                                   disabled={isViewOnly} 
                                   type="number"
                                   value={currentInvoice.payment_info?.emi_months || ''} 
                                   onChange={e => setCurrentInvoice({
                                     ...currentInvoice,
                                     payment_info: { ...currentInvoice.payment_info, emi_months: Number(e.target.value) }
                                   })} 
                                   className="h-4 pl-1 pr-0 py-0 text-[10px] font-bold border-none shadow-none rounded-none focus-visible:ring-0 bg-transparent w-full" 
                                 />
                               </div>
                             </div>
                           </div>
                         ) : currentInvoice.payment_info?.mode === 'cheque' ? (
                           <div className="flex gap-2 w-full">
                             <div className="w-1/2">
                               <p className="text-[8px] font-medium leading-none mb-0.5">Start Date</p>
                               <div className="relative">
                                 <Input 
                                   disabled={isViewOnly} 
                                   type="date"
                                   value={currentInvoice.payment_info?.cheque_start_date || ''} 
                                   onChange={e => setCurrentInvoice({
                                     ...currentInvoice,
                                     payment_info: { ...currentInvoice.payment_info, cheque_start_date: e.target.value }
                                   })} 
                                   className="h-4 px-0 py-0 text-[10px] font-bold border-none rounded-none focus-visible:ring-0 bg-transparent w-full" 
                                 />
                               </div>
                             </div>
                             <div className="w-1/2">
                               <p className="text-[8px] font-medium leading-none mb-0.5">End Date</p>
                               <div className="relative">
                                 <Input 
                                   disabled={isViewOnly} 
                                   type="date"
                                   value={currentInvoice.payment_info?.cheque_end_date || ''} 
                                   onChange={e => setCurrentInvoice({
                                     ...currentInvoice,
                                     payment_info: { ...currentInvoice.payment_info, cheque_end_date: e.target.value }
                                   })} 
                                   className="h-4 px-0 py-0 text-[10px] font-bold border-none rounded-none focus-visible:ring-0 bg-transparent w-full" 
                                 />
                               </div>
                             </div>
                           </div>
                         ) : (
                           <>
                             <p className="text-[8px] font-medium leading-none mb-0.5">Tax Protocol</p>
                             <select
                               disabled={isViewOnly}
                               value={currentInvoice.tax_type || 'intra-state'}
                               onChange={e => {
                                 const newTaxType = e.target.value
                                 const { finalTotal } = calculateTotals(currentInvoice.items, currentInvoice.discount_on_total, currentInvoice.additional_charges)
                                 setCurrentInvoice({ ...currentInvoice, tax_type: newTaxType, total_amount: finalTotal })
                               }}
                               className="w-full bg-transparent border-none text-[10px] font-black text-[#37352f] focus:ring-0 outline-none p-0 h-4 disabled:appearance-none disabled:opacity-100 uppercase"
                             >
                               <option value="intra-state">Intra-State (CGST+SGST)</option>
                               <option value="inter-state">Inter-State (IGST)</option>
                             </select>
                           </>
                         )}
                      </div>
                      <div className="w-1/2 p-1.5 flex flex-col justify-start">
                         <p className="text-[8px] font-medium leading-none mb-0.5">Installation Required?</p>
                         <div className="flex flex-col gap-1 mt-0.5">
                           <label className="flex items-center gap-1.5 cursor-pointer">
                             <input
                               type="checkbox"
                               disabled={isViewOnly}
                               checked={currentInvoice.installation_info?.required || false}
                               onChange={e => setCurrentInvoice({
                                 ...currentInvoice,
                                 installation_info: { ...currentInvoice.installation_info, required: e.target.checked }
                               })}
                               className="rounded border-[#37352f] text-blue-600 focus:ring-blue-500 h-3 w-3"
                             />
                             <span className="text-[9px] font-bold text-[#37352f] uppercase">Yes</span>
                           </label>
                           
                           {currentInvoice.installation_info?.required && (
                             isViewOnly || (typeof window !== 'undefined' && window.matchMedia('print').matches) ? (
                               <div className="text-[9px] font-bold text-blue-600 uppercase leading-tight pt-0.5">
                                 [{currentInvoice.installation_info?.provider || 'Company Installation'}]
                               </div>
                             ) : (
                               <select
                                 value={currentInvoice.installation_info?.provider || 'Company Installation'}
                                 onChange={e => setCurrentInvoice({
                                   ...currentInvoice,
                                   installation_info: { ...currentInvoice.installation_info, provider: e.target.value }
                                 })}
                                 className="w-full bg-transparent border-none text-[9px] font-bold text-blue-600 focus:ring-0 outline-none p-0 h-4 uppercase"
                               >
                                 <option value="Company Installation">Company Installation</option>
                                 <option value="Local Installation">Local Installation</option>
                               </select>
                             )
                           )}
                         </div>
                      </div>
                   </div>

                   {/* Collapsible Advanced Info */}
                   {showAdvancedBilling && (
                      <div className="flex flex-col border-t border-[#37352f] bg-[#fdfdfc] animate-in slide-in-from-top duration-200">
                         <div className="flex border-b border-[#37352f]">
                            <div className="w-1/2 p-1.5 border-r border-[#37352f]">
                               <p className="text-[8px] font-medium leading-none mb-0.5">Delivery Status</p>
                               {isViewOnly ? (
                                 <div className="text-[10px] font-black text-[#37352f] uppercase break-words whitespace-pre-wrap leading-tight pt-0.5">
                                   {currentInvoice.delivery_info?.status || 'pending'}
                                 </div>
                               ) : (
                                 <select
                                   disabled={isViewOnly}
                                   value={currentInvoice.delivery_info?.status || 'pending'}
                                   onChange={e => setCurrentInvoice({
                                     ...currentInvoice,
                                     delivery_info: { ...currentInvoice.delivery_info, status: e.target.value }
                                   })}
                                   className="w-full bg-transparent border-none text-[10px] font-black text-[#37352f] focus:ring-0 outline-none p-0 h-4 disabled:appearance-none disabled:opacity-100 uppercase"
                                 >
                                   <option value="pending">Pending</option>
                                   <option value="dispatched">Dispatched</option>
                                   <option value="delivered">Delivered</option>
                                 </select>
                               )}
                            </div>
                            <div className="w-1/2 p-1.5">
                               <p className="text-[8px] font-medium leading-none mb-0.5">Delivery Date</p>
                               {isViewOnly ? (
                                 <div className="text-[10px] font-medium text-[#37352f] uppercase break-words whitespace-pre-wrap leading-tight pt-0.5">
                                   {currentInvoice.delivery_info?.delivery_date || '-'}
                                 </div>
                               ) : (
                                 <Input 
                                   type="date"
                                   disabled={isViewOnly}
                                   value={currentInvoice.delivery_info?.delivery_date || ''}
                                   onChange={e => setCurrentInvoice({
                                     ...currentInvoice,
                                     delivery_info: { ...currentInvoice.delivery_info, delivery_date: e.target.value }
                                   })}
                                   className="h-4 px-0 py-0 text-[10px] font-medium border-none rounded-none focus-visible:ring-0 bg-transparent uppercase" 
                                 />
                               )}
                            </div>
                         </div>
                         <div className="flex border-b border-[#37352f]">
                            <div className="w-1/2 p-1.5 border-r border-[#37352f]">
                               <p className="text-[8px] font-medium leading-none mb-0.5">Dispatch Through</p>
                               {isViewOnly ? (
                                 <div className="text-[10px] font-medium text-[#37352f] uppercase break-words whitespace-pre-wrap leading-tight pt-0.5">
                                   {currentInvoice.delivery_info?.dispatch_through || '-'}
                                 </div>
                               ) : (
                                 <textarea 
                                   disabled={isViewOnly} 
                                   placeholder="e.g. Local Auto"
                                   value={currentInvoice.delivery_info?.dispatch_through || ''}
                                   onChange={e => setCurrentInvoice({
                                     ...currentInvoice,
                                     delivery_info: { ...currentInvoice.delivery_info, dispatch_through: e.target.value }
                                   })}
                                   rows={2}
                                   className="w-full bg-transparent border-none rounded-none px-0 py-0 text-[10px] font-medium focus:ring-0 outline-none resize-none bg-transparent uppercase leading-tight disabled:opacity-100" 
                                 />
                               )}
                            </div>
                            <div className="w-1/2 p-1.5">
                               <p className="text-[8px] font-medium leading-none mb-0.5">Vehicle Number</p>
                               {isViewOnly ? (
                                 <div className="text-[10px] font-medium text-[#37352f] uppercase break-words whitespace-pre-wrap leading-tight pt-0.5">
                                   {currentInvoice.delivery_info?.vehicle_number || '-'}
                                 </div>
                               ) : (
                                 <textarea 
                                   disabled={isViewOnly} 
                                   placeholder="WB-19..."
                                   value={currentInvoice.delivery_info?.vehicle_number || ''}
                                   onChange={e => setCurrentInvoice({
                                     ...currentInvoice,
                                     delivery_info: { ...currentInvoice.delivery_info, vehicle_number: e.target.value }
                                   })}
                                   rows={2}
                                   className="w-full bg-transparent border-none rounded-none px-0 py-0 text-[10px] font-medium focus:ring-0 outline-none resize-none bg-transparent uppercase leading-tight disabled:opacity-100" 
                                 />
                               )}
                            </div>
                         </div>
                         <div className="flex border-b border-[#37352f]">
                            <div className="w-1/2 p-1.5 border-r border-[#37352f]">
                               <p className="text-[8px] font-medium leading-none mb-0.5">Delivery Person</p>
                               {isViewOnly ? (
                                 <div className="text-[10px] font-medium text-[#37352f] uppercase break-words whitespace-pre-wrap leading-tight pt-0.5">
                                   {currentInvoice.delivery_info?.delivery_person || '-'}
                                 </div>
                               ) : (
                                 <textarea 
                                   disabled={isViewOnly} 
                                   placeholder="Driver Name"
                                   value={currentInvoice.delivery_info?.delivery_person || ''}
                                   onChange={e => setCurrentInvoice({
                                     ...currentInvoice,
                                     delivery_info: { ...currentInvoice.delivery_info, delivery_person: e.target.value }
                                   })}
                                   rows={2}
                                   className="w-full bg-transparent border-none rounded-none px-0 py-0 text-[10px] font-medium focus:ring-0 outline-none resize-none bg-transparent uppercase leading-tight disabled:opacity-100" 
                                 />
                               )}
                            </div>
                            <div className="w-1/2 p-1.5">
                               <p className="text-[8px] font-medium leading-none mb-0.5">Payment Ref / Txn ID</p>
                               {isViewOnly ? (
                                 <div className="text-[10px] font-medium text-[#37352f] uppercase break-words whitespace-pre-wrap leading-tight pt-0.5">
                                   {currentInvoice.payment_info?.ref_id || '-'}
                                 </div>
                               ) : (
                                 <textarea 
                                   disabled={isViewOnly} 
                                   placeholder="Reference ID"
                                   value={currentInvoice.payment_info?.ref_id || ''}
                                   onChange={e => setCurrentInvoice({
                                     ...currentInvoice,
                                     payment_info: { ...currentInvoice.payment_info, ref_id: e.target.value }
                                   })}
                                   rows={2}
                                   className="w-full bg-transparent border-none rounded-none px-0 py-0 text-[10px] font-medium focus:ring-0 outline-none resize-none bg-transparent uppercase leading-tight disabled:opacity-100" 
                                 />
                               )}
                            </div>
                         </div>
                         <div className="flex">
                            <div className="w-1/2 p-1.5 border-r border-[#37352f]">
                               <p className="text-[8px] font-medium leading-none mb-0.5">Paid Amount (₹)</p>
                               {isViewOnly ? (
                                 <div className="text-[10px] font-black text-[#37352f] uppercase break-words whitespace-pre-wrap leading-tight pt-0.5">
                                   ₹{(currentInvoice.payment_info?.paid_amount || 0).toLocaleString()}
                                 </div>
                               ) : (
                                 <Input 
                                   type="number"
                                   disabled={isViewOnly} 
                                   placeholder="0"
                                   value={currentInvoice.payment_info?.paid_amount === 0 ? '' : (currentInvoice.payment_info?.paid_amount || '')}
                                   onChange={e => {
                                     const val = Number(e.target.value)
                                     setCurrentInvoice({
                                       ...currentInvoice,
                                       payment_info: { 
                                         ...currentInvoice.payment_info, 
                                         paid_amount: val,
                                         pending_amount: Math.max(0, currentInvoice.total_amount - val),
                                         partial_payment: val < currentInvoice.total_amount
                                       }
                                     })
                                   }}
                                   className="h-4 px-0 py-0 text-[10px] font-medium border-none rounded-none focus-visible:ring-0 bg-transparent uppercase" 
                                 />
                               )}
                            </div>
                            <div className="w-1/2 p-1.5">
                               <p className="text-[8px] font-medium leading-none mb-0.5">Pending Amount (₹)</p>
                               <div className="text-[10px] font-black text-red-600 mt-0.5">
                                 ₹{(currentInvoice.payment_info?.pending_amount || 0).toLocaleString()}
                                </div>
                            </div>
                         </div>
                      </div>
                   )}
                </div>

                {/* Advanced Fields Toggle Button & DO Import */}
                <div className="flex gap-4 items-center mt-1 print:hidden">
                  <button 
                    type="button" 
                    onClick={() => setShowAdvancedBilling(!showAdvancedBilling)}
                    className="text-[9px] font-black uppercase tracking-wider text-left text-gray-400 hover:text-[#37352f] transition-colors flex items-center gap-1 w-fit cursor-pointer"
                  >
                    {showAdvancedBilling ? '[-] Hide Dispatch & Shipping Info' : '[+] Show Dispatch & Shipping Info'}
                  </button>
                  
                  {currentInvoice.payment_info?.mode === 'finance' && !isViewOnly && (
                    <>
                      <span className="text-gray-300 text-[10px]">|</span>
                      <button
                        type="button"
                        onClick={() => document.getElementById('do-file-input')?.click()}
                        className="text-[9px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1 w-fit cursor-pointer animate-in fade-in duration-200"
                      >
                        <Upload className="h-2.5 w-2.5" />
                        Import Delivery Order (DO)
                      </button>
                      <input
                        type="file"
                        id="do-file-input"
                        accept=".pdf,.txt,.json,.csv"
                        className="hidden"
                        onChange={handleDoUpload}
                      />
                    </>
                  )}
                </div>
             </div>
          </div>

          <div className="border rounded-t-lg overflow-hidden mb-6" style={{ borderColor: businessSettings?.brand_color || '#0070a4' }}>
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="text-white" style={{ backgroundColor: businessSettings?.brand_color || '#0070a4' }}>
                  <th className="p-2 text-[9px] font-black uppercase tracking-wider text-center w-10">#</th>
                  <th className="p-2 text-[9px] font-black uppercase tracking-wider w-auto">Description & Technical Spec</th>
                  <th className="p-2 text-[9px] font-black uppercase tracking-wider w-14 text-center">HSN</th>
                  <th className="p-2 text-[9px] font-black uppercase tracking-wider w-10 text-center">GST</th>
                  <th className="p-2 text-[9px] font-black uppercase tracking-wider w-10 text-center">Qty</th>
                  <th className="p-2 text-[9px] font-black uppercase tracking-wider w-[12%] text-right">Base Price</th>
                  <th className="p-2 text-[9px] font-black uppercase tracking-wider w-[12%] text-right">Rate Incl. Tax</th>
                  <th className="p-2 text-[9px] font-black uppercase tracking-wider w-[12%] text-right">Discount</th>
                  <th className="p-2 text-[9px] font-black uppercase tracking-wider text-right w-[15%]">Amount</th>
                  {!isViewOnly && <th className="p-2 text-center w-10 print:hidden"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f1f0]">
                {chunk.map((item: any, chunkIdx: number) => {
                  const idx = pageIndex * ITEMS_PER_PAGE + chunkIdx;
                  return (
                  <tr key={idx} className="group/row valign-top align-top">
                    <td className="p-2 text-center text-[10px] font-bold text-[#37352f] pt-3">{idx + 1}</td>
                    <td className="p-2">
                       <div className="relative w-full">
                         <div className="w-full text-[10px] font-black text-[#37352f] leading-tight break-words min-h-[16px] whitespace-normal">
                           {item.name || 'Select item...'}
                           <span className="hidden print:block font-bold text-[8px] text-[#37352f]/70 mt-1">
                             {item.sku ? `SKU: ${item.sku}` : ''} {item.sku && item.serial_number ? '|' : ''} {item.serial_number ? `S/N: ${item.serial_number}` : ''}
                           </span>
                         </div>
                         {!isViewOnly && (
                           <select 
                             className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                             value={item.product_id || ''}
                             onChange={(e) => handleProductSelect(idx, e.target.value)}
                           >
                              <option value="">{item.name || 'Select item...'}</option>
                              {availableProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                           </select>
                         )}
                       </div>
                       
                       {/* Advanced Post-Sale Item Meta (SKU, Brand, Serial, Unit) */}
                       <div className="mt-2 space-y-1 text-[8px] text-gray-500 font-medium print:hidden">
                         <div className="flex gap-2 items-center">
                           <span className="font-bold text-gray-400">SKU:</span>
                           <input 
                             disabled={isViewOnly}
                             value={item.sku || ''} 
                             onChange={e => {
                               const newItems = [...currentInvoice.items]
                               newItems[idx].sku = e.target.value
                               setCurrentInvoice({...currentInvoice, items: newItems})
                             }}
                             placeholder="SKU" 
                             className="bg-transparent border-none p-0 h-3 text-[8px] w-20 focus:ring-0 outline-none font-bold uppercase"
                           />
                           <span className="font-bold text-gray-400">Brand:</span>
                           <input 
                             disabled={isViewOnly}
                             value={item.brand || ''} 
                             onChange={e => {
                               const newItems = [...currentInvoice.items]
                               newItems[idx].brand = e.target.value
                               setCurrentInvoice({...currentInvoice, items: newItems})
                             }}
                             placeholder="Brand" 
                             className="bg-transparent border-none p-0 h-3 text-[8px] w-20 focus:ring-0 outline-none"
                           />
                         </div>
                         <div className="flex gap-2 items-center">
                           <span className="font-bold text-gray-400">Model:</span>
                           <input 
                             disabled={isViewOnly}
                             value={item.model_number || ''} 
                             onChange={e => {
                               const newItems = [...currentInvoice.items]
                               newItems[idx].model_number = e.target.value
                               setCurrentInvoice({...currentInvoice, items: newItems})
                             }}
                             placeholder="Model No." 
                             className="bg-transparent border-none p-0 h-3 text-[8px] w-20 focus:ring-0 outline-none"
                           />
                           <span className="font-bold text-gray-400 text-blue-500">Serial:</span>
                           {(() => {
                             const selectedProd = products.find(p => p.id === item.product_id)
                             const availableSerials = selectedProd?.serial_numbers || []
                             if (availableSerials.length > 0) {
                               return (
                                 <select
                                   disabled={isViewOnly}
                                   value={item.serial_number || ''}
                                   onChange={e => {
                                     const newItems = [...currentInvoice.items]
                                     newItems[idx].serial_number = e.target.value
                                     setCurrentInvoice({...currentInvoice, items: newItems})
                                   }}
                                   className="bg-transparent border-none p-0 h-4 text-[8px] w-28 focus:ring-0 outline-none font-bold text-blue-600 cursor-pointer"
                                 >
                                   <option value="" className="text-gray-900">Select Serial...</option>
                                   {availableSerials.map(sn => (
                                     <option key={sn} value={sn} className="text-gray-900">{sn}</option>
                                   ))}
                                   {item.serial_number && !availableSerials.includes(item.serial_number) && (
                                     <option value={item.serial_number} className="text-gray-900">{item.serial_number}</option>
                                   )}
                                 </select>
                               )
                             }
                             return (
                               <input 
                                 disabled={isViewOnly}
                                 value={item.serial_number || ''} 
                                 onChange={e => {
                                   const newItems = [...currentInvoice.items]
                                   newItems[idx].serial_number = e.target.value
                                   setCurrentInvoice({...currentInvoice, items: newItems})
                                 }}
                                 placeholder="Serial No." 
                                 className="bg-transparent border-none p-0 h-3 text-[8px] w-28 focus:ring-0 outline-none font-bold text-blue-600"
                               />
                             )
                           })()}
                         </div>
                         <div className="flex gap-2 items-center">
                           <span className="font-bold text-gray-400">Variant:</span>
                           <input 
                             disabled={isViewOnly}
                             value={item.variant || ''} 
                             onChange={e => {
                               const newItems = [...currentInvoice.items]
                               newItems[idx].variant = e.target.value
                               setCurrentInvoice({...currentInvoice, items: newItems})
                             }}
                             placeholder="Variant" 
                             className="bg-transparent border-none p-0 h-3 text-[8px] w-20 focus:ring-0 outline-none"
                           />
                           <span className="font-bold text-gray-400">Color:</span>
                           <input 
                             disabled={isViewOnly}
                             value={item.color || ''} 
                             onChange={e => {
                               const newItems = [...currentInvoice.items]
                               newItems[idx].color = e.target.value
                               setCurrentInvoice({...currentInvoice, items: newItems})
                             }}
                             placeholder="Color" 
                             className="bg-transparent border-none p-0 h-3 text-[8px] w-16 focus:ring-0 outline-none"
                           />
                           <span className="font-bold text-gray-400">Unit:</span>
                           <input 
                             disabled={isViewOnly}
                             value={item.unit || 'pcs'} 
                             onChange={e => {
                               const newItems = [...currentInvoice.items]
                               newItems[idx].unit = e.target.value
                               setCurrentInvoice({...currentInvoice, items: newItems})
                             }}
                             placeholder="pcs" 
                             className="bg-transparent border-none p-0 h-3 text-[8px] w-10 focus:ring-0 outline-none text-center"
                           />
                         </div>
                       </div>
                       {/* Render text on print */}
                       <div className="hidden print:block text-[7px] text-gray-500 font-bold space-y-0.5 mt-0.5">
                         {(item.sku || item.brand || item.model_number) && (
                           <div>SKU: {item.sku || 'N/A'} | BRAND: {item.brand || 'N/A'} | MODEL: {item.model_number || 'N/A'}</div>
                         )}
                         {item.serial_number && <div className="text-blue-600 font-black">SERIAL NO: {item.serial_number}</div>}
                         {(item.variant || item.color) && <div>VAR: {item.variant || 'N/A'} | COLOR: {item.color || 'N/A'} | UNIT: {item.unit || 'pcs'}</div>}
                       </div>
                    </td>
                    <td className="p-2 text-center text-[10px] font-bold pt-3">{item.hsn_code}</td>
                    <td className="p-2 text-center text-[10px] font-bold pt-3">{item.gst_rate || 0}%</td>
                    <td className="p-2 pt-3">
                       <Input 
                         disabled={isViewOnly}
                         type="number" 
                         value={item.quantity === 0 ? '' : item.quantity} 
                         onChange={e => {
                           const newItems = [...currentInvoice.items]
                           const qty = Number(e.target.value)
                           newItems[idx].quantity = qty
                           const { updatedItems, finalTotal } = calculateTotals(newItems, currentInvoice.discount_on_total, currentInvoice.additional_charges)
                           setCurrentInvoice({...currentInvoice, items: updatedItems, total_amount: finalTotal})
                         }}
                         className="border-0 p-0 h-4 text-[10px] focus-visible:ring-0 text-center font-bold disabled:opacity-100 bg-transparent rounded-none shadow-none" 
                       />
                    </td>
                    <td className="p-2 pt-3">
                       <Input 
                         disabled={isViewOnly}
                         type="number"
                         step="0.01" 
                         value={(item.base_price || item.rate) === 0 ? '' : Math.round((item.base_price || item.rate) * 100) / 100} 
                         onChange={e => {
                           const newItems = [...currentInvoice.items]
                           const price = e.target.value === '' ? 0 : Number(e.target.value)
                           newItems[idx].base_price = price
                           newItems[idx].rate = price // legacy fallback
                           const { updatedItems, finalTotal } = calculateTotals(newItems, currentInvoice.discount_on_total, currentInvoice.additional_charges)
                           setCurrentInvoice({...currentInvoice, items: updatedItems, total_amount: finalTotal})
                         }}
                         className="border-0 p-0 h-4 text-[10px] focus-visible:ring-0 text-right font-black disabled:opacity-100 bg-transparent w-full rounded-none shadow-none" 
                       />
                    </td>
                    <td className="p-2 pt-3">
                       <Input 
                         disabled={isViewOnly}
                         type="number"
                         step="0.01" 
                         value={
                            (item.base_price || item.rate) === 0 ? '' : Math.round((item.base_price || item.rate) * (1 + (item.gst_rate || 0)/100))
                         } 
                         onChange={e => {
                           const newItems = [...currentInvoice.items]
                           const inclPrice = e.target.value === '' ? 0 : Number(e.target.value)
                           const basePrice = inclPrice / (1 + (item.gst_rate || 0)/100)
                           newItems[idx].base_price = basePrice
                           newItems[idx].rate = basePrice
                           const { updatedItems, finalTotal } = calculateTotals(newItems, currentInvoice.discount_on_total, currentInvoice.additional_charges)
                           setCurrentInvoice({...currentInvoice, items: updatedItems, total_amount: finalTotal})
                         }}
                         className="border-0 p-0 h-4 text-[10px] focus-visible:ring-0 text-right font-black disabled:opacity-100 bg-transparent w-full text-blue-600 rounded-none shadow-none" 
                       />
                    </td>
                    <td className="p-2 pt-3">
                        <div className="flex items-center gap-1 justify-end print:hidden">
                          <input 
                            disabled={isViewOnly}
                            type="number" 
                            value={(item.discount_value || item.discount) === 0 || !(item.discount_value || item.discount) ? '' : (item.discount_value || item.discount)} 
                            onChange={e => {
                              const newItems = [...currentInvoice.items]
                              const disc = Number(e.target.value)
                              newItems[idx].discount_value = disc
                              newItems[idx].discount = disc // fallback
                              const { updatedItems, finalTotal } = calculateTotals(newItems, currentInvoice.discount_on_total, currentInvoice.additional_charges)
                              setCurrentInvoice({...currentInvoice, items: updatedItems, total_amount: finalTotal})
                            }}
                            className="border-0 p-0 h-4 text-[10px] focus-visible:ring-0 text-right font-bold w-12 disabled:opacity-100 bg-transparent" 
                          />
                          <select
                            disabled={isViewOnly}
                            value={item.discount_type || 'percent'}
                            onChange={e => {
                              const newItems = [...currentInvoice.items]
                              newItems[idx].discount_type = e.target.value
                              const { updatedItems, finalTotal } = calculateTotals(newItems, currentInvoice.discount_on_total, currentInvoice.additional_charges)
                              setCurrentInvoice({...currentInvoice, items: updatedItems, total_amount: finalTotal})
                            }}
                            className="text-[8px] font-bold bg-transparent border-none focus:ring-0 p-0 outline-none cursor-pointer"
                          >
                            <option value="percent">%</option>
                            <option value="fixed">₹</option>
                          </select>
                        </div>
                        <div className="hidden print:block text-[10px] font-bold text-right pt-0.5">
                          {(item.discount_value || item.discount) ? `${(item.discount_value || item.discount)}${item.discount_type === 'fixed' ? '₹' : '%'}` : '00%'}
                        </div>
                     </td>
                    <td className="p-2 text-right text-[10px] font-black text-[#37352f] pt-3">
                       ₹{(item.amount || 0).toLocaleString()}
                    </td>
                    {!isViewOnly && (
                      <td className="p-2 text-center print:hidden pt-3">
                         <button onClick={() => {
                           const newItems = currentInvoice.items.filter((_: any, i: number) => i !== idx)
                           const { updatedItems, finalTotal } = calculateTotals(newItems, currentInvoice.discount_on_total, currentInvoice.additional_charges)
                           setCurrentInvoice({...currentInvoice, items: updatedItems, total_amount: finalTotal})
                         }} className="text-[#acaba9] hover:text-red-600 transition-colors opacity-0 group-hover/row:opacity-100">
                            <Trash2 className="h-3 w-3" />
                         </button>
                      </td>
                    )}
                  </tr>
                  )
                })}
              </tbody>
            </table>
            {!isViewOnly && pageIndex === productChunks.length - 1 && (
              <div className="p-2 bg-[#fcfcfb] border-t border-[#f1f1f0] print:hidden">
                <button 
                  onClick={() => {
                    const newItem = { product_id: '', name: '', hsn_code: '', quantity: 1, rate: 0, cost_price: 0, discount: 0, tax_rate: 18, tax_amount: 0, amount: 0 }
                    setCurrentInvoice({...currentInvoice, items: [...currentInvoice.items, newItem]})
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#f1f1f0] transition-all"
                >
                   <PlusCircle className="h-3 w-3 text-blue-600" />
                   <span className="text-[9px] font-black text-[#37352f] uppercase tracking-wider">Add Protocol Item</span>
                </button>
              </div>
            )}
          </div>

          {/* Footer Subtotals */}
          <div className="flex justify-between items-start mb-4 print:mb-2 pt-4 print:pt-2 pb-4 print:pb-2">
             {/* Left Bottom Details */}
             <div className="w-[50%] flex flex-col gap-4">
                 {(businessSettings?.bank_name || businessSettings?.account_number || businessSettings?.ifsc_code) && (
                  <div className="flex gap-4 items-start">
                     {businessSettings?.upi_id && (
                       <Popover>
                         <PopoverTrigger asChild>
                           <div className="p-1 border border-[#ededeb] rounded bg-white shadow-sm shrink-0 relative cursor-pointer print:!block hover:border-blue-400 transition-colors">
                              <img 
                                src={`https://quickchart.io/qr?text=${encodeURIComponent(`upi://pay?pa=${businessSettings.upi_id}&pn=${encodeURIComponent(businessSettings.name || '')}&am=${customQRAmount ? customQRAmount : (currentInvoice.payment_info?.mode === 'finance' && currentInvoice.payment_info?.dp_amount ? currentInvoice.payment_info.dp_amount : currentInvoice.total_amount)}&cu=INR&tn=${currentInvoice.invoice_number}`)}&size=150&margin=1`} 
                                className="h-[60px] w-[60px] block"
                                alt="UPI QR"
                              />
                           </div>
                         </PopoverTrigger>
                         {!isViewOnly && (
                           <PopoverContent className="w-48 p-3 print:hidden" align="start" side="bottom" sideOffset={8}>
                             <div className="space-y-2">
                               <h4 className="font-medium text-xs leading-none">Custom QR Amount</h4>
                               <p className="text-[10px] text-gray-500 leading-tight">Override the amount requested by the QR code.</p>
                               <Input 
                                  value={customQRAmount}
                                  onChange={e => setCustomQRAmount(e.target.value)}
                                  placeholder={`Default: ₹${currentInvoice.payment_info?.mode === 'finance' && currentInvoice.payment_info?.dp_amount ? currentInvoice.payment_info.dp_amount : currentInvoice.total_amount}`}
                                  className="h-8 text-xs font-bold"
                                  type="number"
                               />
                             </div>
                           </PopoverContent>
                         )}
                       </Popover>
                     )}
                     <div className="space-y-0.5 mt-2">
                        <p className="text-[7px] font-medium text-[#acaba9] uppercase tracking-widest">Bank Details</p>
                        {businessSettings.bank_name && <p className="text-[9px] font-bold text-[#37352f]">{businessSettings.bank_name}</p>}
                        {businessSettings.account_number && <p className="text-[9px] font-bold text-[#37352f]">A/c: {businessSettings.account_number}</p>}
                        {businessSettings.ifsc_code && <p className="text-[9px] font-bold text-[#37352f]">IFSC: {businessSettings.ifsc_code}</p>}
                        {businessSettings.pan_number && <p className="text-[9px] font-bold text-[#37352f]">PAN: {businessSettings.pan_number}</p>}
                     </div>
                  </div>
                 )}
                 <div className="border border-[#37352f] p-2.5 text-[#37352f] text-[8px] font-bold uppercase tracking-wider space-y-1.5 rounded-lg print:rounded-none">
                    <div className="flex gap-2">
                       <span className="w-24 shrink-0 text-gray-400">Amount in Words:</span>
                       <span className="font-black text-[#37352f] break-words leading-tight">{numberToWords(currentInvoice.total_amount || 0)}</span>
                    </div>
                    <div className="flex gap-2">
                       <span className="w-24 shrink-0 text-gray-400">Tax in Words:</span>
                       <span className="font-black text-[#37352f] break-words leading-tight">
                         {numberToWords(currentInvoice.items.reduce((acc: number, item: any) => acc + (item.tax_amount || 0), 0) || 0)}
                       </span>
                    </div>
                 </div>
             </div>

             {/* Right Subtotals */}
             <div className="w-[45%] space-y-2 mt-2">
                <div className="flex justify-between items-center text-[9px] font-bold text-[#acaba9] uppercase tracking-wider">
                   <span>Taxable Value</span>
                   <span className="text-[#37352f] font-black">
                     ₹{(currentInvoice.items.reduce((acc: number, item: any) => {
                       const price = item.base_price || item.rate || 0
                       const discVal = item.discount_value || item.discount || 0
                       const discType = item.discount_type || 'percent'
                       const lineDiscount = discType === 'percent' ? (price * item.quantity * (discVal / 100)) : discVal
                       return acc + ((price * item.quantity) - lineDiscount)
                     }, 0) || 0).toLocaleString()}
                   </span>
                </div>
                
                {/* GST Split Display based on Tax Protocol */}
                {currentInvoice.tax_type === 'inter-state' ? (
                  <div className="flex justify-between items-center text-[9px] font-bold text-[#acaba9] uppercase tracking-wider">
                     <span>IGST</span>
                     <span className="text-[#37352f] font-black">
                       ₹{(currentInvoice.items.reduce((acc: number, item: any) => acc + (item.tax_amount || 0), 0) || 0).toLocaleString()}
                     </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center text-[9px] font-bold text-[#acaba9] uppercase tracking-wider">
                       <span>CGST</span>
                       <span className="text-[#37352f] font-black">
                         ₹{((currentInvoice.items.reduce((acc: number, item: any) => acc + (item.tax_amount || 0), 0) / 2) || 0).toLocaleString()}
                       </span>
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold text-[#acaba9] uppercase tracking-wider">
                       <span>SGST</span>
                       <span className="text-[#37352f] font-black">
                         ₹{((currentInvoice.items.reduce((acc: number, item: any) => acc + (item.tax_amount || 0), 0) / 2) || 0).toLocaleString()}
                       </span>
                    </div>
                  </>
                )}

                {/* Additional Charges / Expenses */}
                <div className="flex justify-between items-center text-[9px] font-bold text-[#acaba9] uppercase tracking-wider">
                   <span>Addl. Charges (₹)</span>
                   <input 
                     disabled={isViewOnly}
                     type="number"
                     value={currentInvoice.additional_charges === 0 ? '' : currentInvoice.additional_charges}
                     onChange={e => {
                       const charges = Number(e.target.value)
                       const { finalTotal } = calculateTotals(currentInvoice.items, currentInvoice.discount_on_total, charges)
                       setCurrentInvoice({...currentInvoice, additional_charges: charges, total_amount: finalTotal})
                     }}
                     className="w-16 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#37352f] border-dashed focus:border-solid p-0 text-[9px] font-black text-right text-[#37352f] focus:ring-0 outline-none transition-all"
                   />
                </div>

                {/* Final Discount */}
                <div className="flex justify-between items-center text-[9px] font-bold text-[#acaba9] uppercase tracking-wider">
                   <span>Final Discount (₹)</span>
                   <input 
                     disabled={isViewOnly}
                     type="number"
                     value={currentInvoice.discount_on_total === 0 ? '' : currentInvoice.discount_on_total}
                     onChange={e => {
                       const disc = Number(e.target.value)
                       const { finalTotal } = calculateTotals(currentInvoice.items, disc, currentInvoice.additional_charges)
                       setCurrentInvoice({...currentInvoice, discount_on_total: disc, total_amount: finalTotal})
                     }}
                     className="w-16 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#37352f] border-dashed focus:border-solid p-0 text-[9px] font-black text-right text-[#37352f] focus:ring-0 outline-none transition-all"
                   />
                </div>

                <div className="pt-2 border-t border-[#37352f] flex justify-between items-center">
                   <span className="text-[10px] font-bold text-[#37352f] uppercase tracking-tight">Grand Total</span>
                   {isViewOnly ? (
                     <span className="text-xl font-black text-[#37352f]">₹{(currentInvoice.total_amount || 0).toLocaleString()}</span>
                   ) : (
                     <div className="flex items-center">
                       <span className="text-xl font-black text-[#37352f] mr-1">₹</span>
                       <input
                         type="number"
                         value={currentInvoice.total_amount === 0 ? '' : currentInvoice.total_amount}
                         onChange={e => handleDesiredTotalChange(Number(e.target.value))}
                         className="w-32 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#37352f] border-dashed focus:border-solid p-0 text-right text-xl font-black text-[#37352f] focus:ring-0 outline-none transition-all"
                       />
                     </div>
                   )}
                </div>
             </div>
          </div>

          <div className="print:mt-auto">

          {/* Legal Tally Footer Blocks */}
          <div className="border border-[#37352f] flex text-[#37352f] mb-6 print:mb-2 h-[120px] print:h-[100px] divide-x divide-[#37352f]">
             {/* Left Bottom */}
             <div className="w-1/2 flex flex-col divide-y divide-[#37352f] h-full">
                <div className="p-2 flex-grow border-b border-[#37352f]">
                   <p className="text-[10px] font-bold underline mb-1">Declaration</p>
                   <p className="text-[9px] font-medium leading-tight mb-4">We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</p>
                </div>
                <div className="p-2 flex-grow flex items-end">
                   <p className="text-[10px] font-bold">Customer's Seal and Signature</p>
                </div>
             </div>
             
             {/* Right Bottom */}
             <div className="w-1/2 flex flex-col divide-y divide-[#37352f] h-full">
                <div className="p-2 flex-grow flex flex-col justify-end items-end relative min-h-[70px]">
                   <div className="absolute top-2 right-2">
                      <p className="text-[10px] font-bold uppercase">For {businessSettings?.name || 'HOOGHLY ELECTRONICS'}</p>
                   </div>
                   <div className="h-14 w-40 flex items-center justify-end overflow-hidden relative mt-4">
                      {businessSettings?.signature_url ? (
                        <img 
                          src={businessSettings.signature_url} 
                          className="max-h-full max-w-full object-contain mix-blend-multiply" 
                          alt="Authorized Signatory" 
                        />
                      ) : (
                        <div className="h-px w-full bg-[#37352f]/20 absolute bottom-0" />
                      )}
                   </div>
                   <p className="text-[9px] font-medium uppercase w-full text-right">Authorised Signatory</p>
                </div>
             </div>
          </div>
          </div>
          {pageIndex === productChunks.length - 1 && (
            <>
              {isViewOnly ? (
                <div className="flex gap-4 print:hidden mt-4">
                  <Button onClick={() => window.print()} className="flex-1 h-14 rounded-2xl font-black bg-blue-600 text-white shadow-xl shadow-blue-100 flex items-center justify-center gap-3">
                     <Printer className="h-5 w-5" /> Print Protocol
                  </Button>
                  <Button variant="outline" onClick={() => { setView('list'); setIsViewOnly(false); }} className="flex-1 h-14 rounded-2xl font-black">Close</Button>
                </div>
              ) : (
                <div className="flex gap-4 print:hidden mt-4">
                   <Button onClick={() => setIsConfirmed(!isConfirmed)} className={`flex-1 h-14 rounded-2xl font-black transition-all ${isConfirmed ? 'bg-green-600' : 'bg-blue-600'} text-white`}>
                      {isConfirmed ? 'Details Verified' : 'Confirm Invoice Details'}
                   </Button>
                   <Button onClick={handleSaveInvoice} disabled={!isConfirmed || isSavingInvoice} className="flex-1 h-14 rounded-2xl font-black bg-[#37352f] text-white">
                      {isSavingInvoice ? 'Syncing...' : 'Settle & Sync Ledger'}
                   </Button>
                </div>
              )}
            </>
          )}
        </div>
        ))}

        {/* Attached DO visual rendering section */}
        {pdfPages.length > 0 && (
          <div className="max-w-[850px] mx-auto mt-8 mb-12 bg-white p-8 border border-[#f1f1f0] rounded-[48px] shadow-[0_40px_100px_rgba(0,0,0,0.02)] print:shadow-none print:border-none print:p-0 print:max-w-full print:w-full print:m-0 page-break-before">
            <div className="flex justify-between items-center mb-4 print:hidden">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <FileText className="h-3 w-3 text-blue-500" />
                Attached Delivery Order (DO)
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPdfPages([])
                }}
                className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline cursor-pointer"
              >
                Remove DO
              </button>
            </div>
            <div className="flex flex-col gap-6 print:gap-0">
              {pdfPages.map((imgData, idx) => (
                <div key={idx} className="border border-[#f1f1f0] rounded-2xl overflow-hidden print:border-none print:rounded-none print:break-inside-avoid print:w-full print:h-[100vh] print:flex print:items-center print:justify-center">
                  <img src={imgData} alt={`DO Page ${idx + 1}`} className="w-full h-auto object-contain print:max-w-full print:max-h-full" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col pb-24 relative font-sans selection:bg-purple-100 selection:text-purple-900">
      <div className="p-10 max-w-[1400px] mx-auto w-full space-y-12 mt-8">
        {/* Premium Realistic Analytical Core */}
        {/* Senior Developer Minimal Analytical Core */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Card 1: Net Profit */}
           <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                  <TrendingUp className="h-5 w-5 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Net Profit</span>
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-2">₹{totalProfit.toLocaleString()}</h2>
                <div className="flex items-center gap-2">
                   <div className="px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1 bg-green-50 text-green-700">
                      <ArrowUpRight className="h-3 w-3" />
                      12%
                   </div>
                   <span className="text-xs text-gray-500">from last period</span>
                </div>
              </div>
           </div>

           {/* Card 2: Total Revenue */}
           <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                  <DollarSign className="h-5 w-5 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Total Revenue</span>
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-2">₹{totalRevenue.toLocaleString()}</h2>
                <div className="flex items-center gap-2">
                   <div className="px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1 bg-green-50 text-green-700">
                      <ArrowUpRight className="h-3 w-3" />
                      24%
                   </div>
                   <span className="text-xs text-gray-500">from last period</span>
                </div>
              </div>
           </div>

           {/* Card 3: Avg. Margin */}
           <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100">
                  <Target className="h-5 w-5 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">Average Margin</span>
              </div>
              <div>
                <h2 className="text-3xl font-semibold text-gray-900 mb-2">{averageMargin}%</h2>
                <div className="flex items-center gap-2">
                   <div className="px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1 bg-rose-50 text-rose-700">
                      <ArrowDownRight className="h-3 w-3" />
                      2%
                   </div>
                   <span className="text-xs text-gray-500">from last period</span>
                </div>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
           <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                    <History className="h-4 w-4 text-gray-600" />
                 </div>
                 <div>
                    <h3 className="text-sm font-semibold text-gray-900">Invoice History</h3>
                    <p className="text-xs text-gray-500">Recent transactions and settlements</p>
                 </div>
              </div>
              {selectedInvoiceIds.length > 0 && (
                 <Button 
                   variant="destructive"
                   className="h-8 rounded-md text-[12px] font-semibold px-3 shadow-sm"
                   onClick={async () => {
                     if (confirm(`Are you sure you want to delete ${selectedInvoiceIds.length} invoices?`)) {
                       for (const id of selectedInvoiceIds) {
                         await deleteInvoice(id)
                       }
                       toast.success(`${selectedInvoiceIds.length} invoices deleted`)
                       setSelectedInvoiceIds([])
                       loadData()
                     }
                   }}
                 >
                   <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                   Delete Selected ({selectedInvoiceIds.length})
                 </Button>
               )}
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-100">
                       <th className="px-6 py-3 w-10">
                          <input 
                            type="checkbox" 
                            checked={selectedInvoiceIds.length === invoices.length && invoices.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInvoiceIds(invoices.map(inv => inv.id))
                              } else {
                                setSelectedInvoiceIds([])
                              }
                            }}
                            className="rounded border-gray-300 w-3.5 h-3.5 accent-[#37352f] cursor-pointer"
                          />
                       </th>
                       <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                       <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                       <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                       <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                       <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {invoices.length === 0 ? (
                       <tr>
                         <td colSpan={6} className="px-6 py-12 text-center">
                           <div className="flex flex-col items-center justify-center">
                             <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                               <FileText className="h-6 w-6 text-gray-400" />
                             </div>
                             <p className="text-sm font-medium text-gray-900">No invoices yet</p>
                             <p className="text-xs text-gray-500 mt-1">Create your first invoice to see it here.</p>
                           </div>
                         </td>
                       </tr>
                    ) : (
                      invoices.map(inv => (
                         <tr 
                            key={inv.id} 
                            onClick={() => handleViewInvoice(inv)}
                            className={`cursor-pointer group transition-colors ${selectedInvoiceIds.includes(inv.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                          >
                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                               <input 
                                 type="checkbox" 
                                 checked={selectedInvoiceIds.includes(inv.id)}
                                 onChange={(e) => {
                                   if (e.target.checked) {
                                     setSelectedInvoiceIds([...selectedInvoiceIds, inv.id])
                                   } else {
                                     setSelectedInvoiceIds(selectedInvoiceIds.filter(id => id !== inv.id))
                                   }
                                 }}
                                 className="rounded border-gray-300 w-3.5 h-3.5 accent-[#37352f] cursor-pointer"
                               />
                            </td>
                            <td className="px-6 py-4">
                               <span className="font-medium text-gray-900 text-sm">{inv.invoice_number}</span>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                     {(inv.customer_name || 'W').charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-sm text-gray-900">{inv.customer_name || 'Walk-in Client'}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-sm font-medium text-gray-900">₹{(inv.total_amount || 0).toLocaleString()}</span>
                            </td>
                            <td className="px-6 py-4">
                               <Badge variant="outline" className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize border-0 ${
                                  inv.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
                               }`}>
                                  {inv.status}
                               </Badge>
                            </td>
                            <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                               <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(inv)} className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                                     <Download className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleViewInvoice(inv)} className="h-8 w-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100">
                                     <Printer className="h-4 w-4" />
                                  </Button>
                               </div>
                            </td>
                         </tr>
                      ))
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* RECTANGULAR Floating Action Bar - Notion Style */}
      <div className="fixed bottom-8 right-8 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <button className="h-11 px-5 bg-[#37352f] hover:bg-black text-white rounded-xl flex items-center gap-2.5 shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.15)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 border border-white/5 group">
              <Plus className="h-3.5 w-3.5 group-hover:rotate-90 transition-transform duration-300" />
              <span className="text-[11px] font-bold tracking-tight uppercase tracking-widest">Create Invoice</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 rounded-2xl border-[#e9e9e8] shadow-[0_24px_48px_rgba(0,0,0,0.1)] mb-3 mr-1" align="end" side="top">
             <div className="space-y-0.5">
                <button 
                  onClick={handleCreateManual}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-[#f7f7f5] rounded-xl transition-all group text-left"
                >
                  <div className="h-8 w-8 bg-white rounded-lg border border-[#e9e9e8] flex items-center justify-center group-hover:border-[#37352f] transition-all">
                    <FileText className="h-3.5 w-3.5 text-[#acaba9] group-hover:text-[#37352f]" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-[#37352f]">Manual Billing</span>
                    <span className="block text-[8px] text-[#acaba9] font-medium mt-0.5 uppercase tracking-wider">Custom Layout</span>
                  </div>
                </button>
                <button 
                  onClick={() => setIsAiModalOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-3 hover:bg-blue-50 rounded-xl transition-all group text-left"
                >
                  <div className="h-8 w-8 bg-white rounded-lg border border-[#e9e9e8] flex items-center justify-center group-hover:border-blue-600 transition-all">
                    <Sparkles className="h-3.5 w-3.5 text-blue-400 group-hover:text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-bold text-[#37352f] group-hover:text-blue-600">AI Billing</span>
                    <span className="block text-[8px] text-blue-400/70 font-medium mt-0.5 uppercase tracking-wider">Asset Automation</span>
                  </div>
                </button>
             </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Scanned DO details Modal */}
      <Dialog open={isDoModalOpen} onOpenChange={setIsDoModalOpen}>
        <DialogContent className="max-w-md rounded-[32px] border-[#e9e9e8] p-6 shadow-2xl bg-white">
          <DialogHeader>
            <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
              {isScanningDo ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <FileText className="h-6 w-6" />
              )}
            </div>
            <DialogTitle className="text-xl font-bold text-[#37352f]">
              {isScanningDo ? 'Processing Delivery Order' : 'Scanned Delivery Order Details'}
            </DialogTitle>
            <p className="text-xs font-bold text-[#acaba9] uppercase tracking-widest mt-1">
              {isScanningDo ? 'Reading document pages...' : 'Verify details before applying'}
            </p>
          </DialogHeader>

          {isScanningDo ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <p className="text-xs font-medium text-gray-500">Scanning content and extracting text...</p>
            </div>
          ) : scannedDoDetails ? (
            <div className="py-4 space-y-4 text-left">
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
                  <div>
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-wider">Finance Provider</span>
                    <span className="font-bold text-[#37352f]">{scannedDoDetails.provider || 'Not Found'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-wider">DO / LAN Reference ID</span>
                    <span className="font-bold text-[#37352f]">{scannedDoDetails.referenceId || 'Not Found'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-wider">Customer Name</span>
                    <span className="font-bold text-[#37352f]">{scannedDoDetails.name || 'Not Found'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-wider">Customer Phone</span>
                    <span className="font-bold text-[#37352f]">{scannedDoDetails.phone || 'Not Found'}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-wider">Down Payment</span>
                    <span className="font-bold text-[#37352f]">₹{(scannedDoDetails.paidAmount || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-gray-400 uppercase tracking-wider">Asset / Model</span>
                    <span className="font-bold text-[#37352f]">{scannedDoDetails.modelNumber || 'Not Found'}</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                * Note: If any details are incorrect, you can edit them directly in the invoice editor fields after applying.
              </p>
            </div>
          ) : (
            <div className="py-6 text-center">
              <p className="text-sm text-red-500">No scanned details available.</p>
            </div>
          )}

          <DialogFooter className="gap-3 mt-4">
            <Button variant="ghost" onClick={() => setIsDoModalOpen(false)} className="h-12 px-6 rounded-xl font-bold">Cancel</Button>
            <Button 
              onClick={applyDoDetails}
              disabled={isScanningDo || !scannedDoDetails}
              className="h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xl shadow-blue-100 flex-1 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Apply to Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Modal (Same) */}
      <Dialog open={isAiModalOpen} onOpenChange={setIsAiModalOpen}>
        <DialogContent className="max-w-2xl rounded-[32px] border-[#e9e9e8] p-8 shadow-2xl">
           <DialogHeader>
              <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                <Sparkles className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl font-bold text-[#37352f]">AI Smart Invoicing</DialogTitle>
              <p className="text-xs font-bold text-[#acaba9] uppercase tracking-widest mt-1">Select assets to include in the protocol</p>
           </DialogHeader>

           <div className="py-6 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Client Identity</Label>
                    <Input 
                      placeholder="e.g., Ryan Korsgaard" 
                      value={currentInvoice.to_details.name}
                      onChange={e => setCurrentInvoice({...currentInvoice, to_details: {...currentInvoice.to_details, name: e.target.value}})}
                      className="rounded-xl h-12 bg-[#fcfcfb] border-[#e9e9e8]" 
                    />
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Contact Phone</Label>
                    <Input
                      placeholder="+91..."
                      value={currentInvoice.to_details.phone}
                      onChange={e => setCurrentInvoice({...currentInvoice, to_details: {...currentInvoice.to_details, phone: e.target.value}})}
                      className="rounded-xl h-12 bg-[#fcfcfb] border-[#e9e9e8]"
                    />
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black text-[#acaba9] uppercase tracking-widest ml-1">Inventory Selector</Label>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{selectedProducts.length} Items</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {availableProducts.map(product => {
                       const isSelected = selectedProducts.find(p => p.id === product.id);
                       return (
                          <button
                             key={product.id}
                             onClick={() => {
                                const isSel = selectedProducts.find(p => p.id === product.id);
                                if (isSel) setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
                                else setSelectedProducts([...selectedProducts, product]);
                             }}
                             className={`flex items-start gap-3 p-4 rounded-2xl border transition-all text-left ${
                                isSelected ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-[#e9e9e8] hover:bg-[#f7f7f5]'
                             }`}
                          >
                             <div className="h-10 w-10 bg-white rounded-xl border border-[#f1f1f0] flex-shrink-0 flex items-center justify-center overflow-hidden">
                                <img src={product.image_url} className="w-8 h-8 object-contain mix-blend-multiply" />
                             </div>
                             <div className="min-w-0">
                                <p className="text-[11px] font-bold text-[#37352f] truncate">{product.name}</p>
                                <p className="text-[10px] font-bold text-blue-600 mt-1">₹{(product.price || 0).toLocaleString()}</p>
                             </div>
                             {isSelected && <Check className="h-4 w-4 text-blue-600 ml-auto shrink-0" />}
                          </button>
                       );
                    })}
                 </div>
              </div>
           </div>

           <DialogFooter className="gap-3">
              <Button variant="ghost" onClick={() => setIsAiModalOpen(false)} className="h-12 px-6 rounded-xl font-bold">Cancel</Button>
              <Button 
                onClick={finalizeAiInvoice}
                disabled={selectedProducts.length === 0 || !currentInvoice.to_details.name}
                className="h-12 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xl shadow-blue-100 flex-1"
              >
                Generate Protocol
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
