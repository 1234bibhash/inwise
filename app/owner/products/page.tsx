'use client'

import { useEffect, useState } from 'react'
import { getProducts, addProduct, updateProduct, addProduct3DModel, deleteProduct, getCategories, uploadProductImage, addProductsBulk } from '@/lib/services/productService'
import { getLedgers, LedgerRecord } from '@/lib/services/accountService'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { parseCSV, type ParsedProduct } from '@/lib/utils/csvParser'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet'
import { 
  Plus, 
  Search, 
  Package, 
  Trash2, 
  Sparkles,
  Box,
  Image as ImageIcon,
  ChevronRight,
  MoreHorizontal,
  ChevronLeft,
  LayoutGrid,
  Filter,
  ArrowRight,
  Check,
  IndianRupee,
  FileText,
  FileDigit,
  Barcode,
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  Download,
  List,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { getTaxRate, CLASSIFICATIONS } from '@/lib/services/taxService'
import Link from 'next/link'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
export const PREDEFINED_BRANDS = ["LG", "Samsung", "Sony", "Panasonic", "Whirlpool", "Godrej", "Hitachi", "Voltas", "Daikin", "Blue Star", "Haier", "Mitsubishi Heavy", "Mitsubishi Electric", "O General", "Lloyd", "Carrier", "Toshiba", "AGARO", "IFB", "Bosch", "Siemens", "Havells", "Bajaj", "Usha", "V-Guard", "Crompton", "Orient", "Symphony", "Kenstar", "Prestige", "Pigeon", "Butterfly", "Sujata", "Maharaja Whiteline", "Morphy Richards", "Black+Decker", "Eureka Forbes", "Kent", "Aquaguard", "Livpure", "Hindware", "Faber", "Elica", "Glen", "Sunflame", "Micromax", "Realme", "Xiaomi", "OnePlus", "Vivo", "Oppo", "Motorola", "Nokia", "Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "Walton"]

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [newSerialInput, setNewSerialInput] = useState('')
  const [creditors, setCreditors] = useState<LedgerRecord[]>([])
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    sku: '',
    description: '',
    category: CLASSIFICATIONS[0].category,
    subcategory: CLASSIFICATIONS[0].subcategories[0].name,
    variant: CLASSIFICATIONS[0].subcategories[0].variants[0].label,
    hsn_code: '',
    price: '',
    warranty_months: '12',
    image_files: [] as File[],
    existing_image_urls: [] as string[],
    serial_numbers: [] as string[],
    model_3d_url: '',
    supplier_id: 'none'
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [taxFilter, setTaxFilter] = useState('all')
  const [sortBy, setSortBy] = useState('newest')
  const [filters, setFilters] = useState({
    category: 'All',
    subcategory: 'All',
    brand: 'All',
    variant: 'All'
  })
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    const saved = localStorage.getItem('inventoryViewMode')
    if (saved === 'list' || saved === 'grid') {
      setViewMode(saved)
    }
  }, [])

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    localStorage.setItem('inventoryViewMode', mode)
  }
  
  // Detail Modal inline editing
  const [detailEdits, setDetailEdits] = useState({ price: '', selling_price: '' })
  const [isSavingDetails, setIsSavingDetails] = useState(false)

  // Bulk Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [importResults, setImportResults] = useState<{
    data: ParsedProduct[]
    errors: { row: number; message: string }[]
    filename: string
    raw: any[]
  } | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Universal Import State
  const [isImportBillModalOpen, setIsImportBillModalOpen] = useState(false)
  const [isExtractingBill, setIsExtractingBill] = useState(false)
  const [extractController, setExtractController] = useState<AbortController | null>(null)

  const handleImportBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Route CSVs directly to local parser
    if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        try {
          const results = parseCSV(text)
          setImportResults({
            data: results.data,
            errors: results.errors,
            filename: file.name,
            raw: results.raw
          })
          if (results.data.length > 0) {
            toast.success(`Parsed ${results.data.length} products successfully!`)
          }
          if (results.errors.length > 0) {
            toast.warning(`Found ${results.errors.length} rows with errors.`)
          }
          setIsImportBillModalOpen(false)
          setIsImportModalOpen(true)
        } catch (err) {
          toast.error("Failed to parse CSV file format.")
        }
      }
      reader.readAsText(file)
      e.target.value = ''
      return
    }

    setIsExtractingBill(true)
    const controller = new AbortController()
    setExtractController(controller)
    try {
      // Convert file to base64 safely in browser
      const base64Str = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1] || '')
        }
        reader.onerror = (error) => reject(error)
      })
      // Upload the bill image to storage to get a permanent URL
      let billImageUrl = ''
      try {
        billImageUrl = await uploadProductImage(file)
      } catch (uploadErr) {
        console.warn("Failed to upload bill image to storage", uploadErr)
      }
      
      const response = await fetch('/api/extract-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileBase64: base64Str,
          fileType: file.type || 'application/octet-stream'
        }),
        signal: controller.signal
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to extract data')
      }

      const extractedData = await response.json()

      setIsImportBillModalOpen(false)
      
      // Build a rich description embedding all the bill metadata
      const billDate = extractedData.invoice_date || 'N/A'
      const uploadDate = new Date().toLocaleString('en-IN')
      const agentStr = extractedData.agent_name ? `\nAgent: ${extractedData.agent_name}` : ''
      const billTypeStr = extractedData.bill_type ? ` [${extractedData.bill_type}]` : ''
      const billLinkStr = billImageUrl ? `\nBill URL: ${billImageUrl}` : ''
      
      const richContext = `\n\n--- Source Bill Details ---\nSupplier: ${extractedData.supplier_name || 'N/A'}\nInvoice No: ${extractedData.invoice_number || 'N/A'}${billTypeStr}\nCreated Date: ${billDate}\nUploaded: ${uploadDate}${agentStr}${billLinkStr}`

      // Map AI extracted products to ParsedProduct format
      const mappedProducts: ParsedProduct[] = (extractedData.products || []).map((prod: any) => {
        const safeNum = (val: any, fallback: number) => {
          if (val === undefined || val === null) return fallback;
          if (typeof val === 'string') return Number(val.replace(/,/g, '')) || fallback;
          return Number(val) || fallback;
        };

        const priceVal = safeNum(prod.price, 0);
        const qtyVal = safeNum(prod.quantity, 1);
        const itemTaxPct = safeNum(prod.tax_percentage, 18);
        const itemTaxAmt = prod.tax_amount ? safeNum(prod.tax_amount, priceVal * (itemTaxPct / 100)) : (priceVal * (itemTaxPct / 100));
        
        const itemCgst = (itemTaxAmt / 2).toFixed(2)
        const itemSgst = (itemTaxAmt / 2).toFixed(2)
        const halfPct = itemTaxPct / 2
        
        const priceInclTax = (priceVal + itemTaxAmt).toFixed(2)
        const totalLineAmt = ((priceVal + itemTaxAmt) * qtyVal).toFixed(2)
        
        const itemSpecificDetails = `\nQuantity: ${qtyVal} PCS\nBase Price (per pc): ₹${priceVal.toFixed(2)}\nPrice Incl. Tax (per pc): ₹${priceInclTax}\nTax Per Pc: ₹${itemTaxAmt.toFixed(2)} (${itemTaxPct}%)\nCGST (${halfPct}%): ₹${itemCgst}\nSGST (${halfPct}%): ₹${itemSgst}\nTotal Line Amount: ₹${totalLineAmt}`

        return {
          name: prod.name || 'Extracted Product',
          sku: prod.sku || 'EXT-' + Math.floor(Math.random() * 10000),
          brand: PREDEFINED_BRANDS.find(b => b.toLowerCase() === (prod.brand || '').toLowerCase()) || prod.brand || '',
          description: (prod.description || prod.name) + richContext + itemSpecificDetails,
          category: prod.category || 'Electronics',
          subcategory: prod.subcategory || 'Miscellaneous',
          variant: prod.variant || '',
          price: priceVal,
          warranty_months: safeNum(prod.warranty_months, 12),
          hsn_code: prod.hsn_code || '',
          model_number: '',
          color: '',
          gst_percentage: itemTaxPct,
          cost_price: priceVal * 0.75,
          stock_count: qtyVal,
          serial_numbers: prod.sku ? [prod.sku] : [],
          supplier_name: extractedData.supplier_name || '',
          warehouse_location: '',
          low_stock_alert: 2,
          installation_required: false,
          service_category: '',
          status: 'Active',
          image_url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070'
        }
      })

      setImportResults({
        data: mappedProducts,
        errors: [],
        filename: `AI Bill - ${extractedData.supplier_name || 'Extracted'} (${mappedProducts.length} items)`
      })
      
      toast.success('Bill extracted successfully! Review the items before importing.')
      setIsImportModalOpen(true)
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info('Extraction cancelled.')
      } else {
        console.error(error)
        toast.error('Failed to extract bill. Please try manually.')
      }
    } finally {
      setIsExtractingBill(false)
      setExtractController(null)
      // Reset input so the same file can be selected again
      e.target.value = ''
    }
  }

  const executeBulkImport = async () => {
    if (!importResults || importResults.data.length === 0) return
    setIsImporting(true)
    try {
      await addProductsBulk(importResults.data)
      toast.success(`Successfully imported ${importResults.data.length} products!`)
      setIsImportModalOpen(false)
      setImportResults(null)
      loadInitialData()
    } catch (err) {
      toast.error("Failed to import products bulk")
    } finally {
      setIsImporting(false)
    }
  }

  const downloadCsvTemplate = () => {
    const headers = "Name,Brand,SKU,Model Number,Description,Category,Subcategory,Color,HSN Code,GST Percentage,Price,Cost Price,Warranty Months,Stock Count,Serial Number,Supplier Name,Warehouse Location,Low Stock Alert,Installation Required,Service Category,Status,Image URL\n";
    const sampleData = 'Samsung 55-Inch Neo QLED,Samsung,QA55QN85A,QA55QN85A,Premium 4K Smart TV,Electronics,Televisions,Black,85287211,28,125000,93750,24,10,SAM-TV-001,Samsung India,WH-A1,2,false,TV Mounting,Active,https://images.unsplash.com/photo-1593305841991-05c297ba4575\nLG 1.5 Ton Split AC,LG,LG-AC-1.5T,TS-Q19YNZE,Smart Inverter AC,Appliances,Air Conditioners,White,84151010,28,42000,31500,12,5,LG-AC-001,LG Corp,WH-B2,1,true,AC Installation,Active,\n';
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + sampleData);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "product_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const getAvailableStock = (product: any) => {
    const serialStock = product.serial_numbers?.length ?? 0
    return serialStock > 0 ? serialStock : product.stock_count ?? 0
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    setIsLoading(true)
    try {
      const productsData = await getProducts()
      const categoriesData = await getCategories()
      const ledgersData = await getLedgers()
      
      setProducts(productsData || [])
      setCategories(categoriesData || ['Televisions', 'Appliances', 'Audio', 'Laptops'])
      setCreditors(ledgersData.filter(l => l.under_group === 'Sundry Creditors'))
    } catch (error) {
      console.error('Data pipeline interruption:', error)
      setCategories(['Televisions', 'Appliances', 'Audio', 'Laptops'])
    } finally {
      setTimeout(() => setIsLoading(false), 500)
    }
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      // Simple CSV parser: split by newlines and commas, flatten, clean, remove empties
      const serials = text.split(/[\n,]/).map(s => s.trim().replace(/^["']|["']$/g, '')).filter(s => s)
      if (serials.length > 0) {
        setFormData(prev => ({
          ...prev,
          serial_numbers: [...new Set([...prev.serial_numbers, ...serials])] // unique
        }))
        toast.success(`Extracted ${serials.length} serial numbers from CSV`)
      } else {
        toast.error('No valid serial numbers found in CSV')
      }
    }
    reader.readAsText(file)
  }


  const handleAddProduct = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    if (!formData.name || !formData.price) {
      toast.error('Please enter both name and price')
      return
    }

    setIsSubmitting(true)
    try {
      const { gst_rate, hsn_code } = getTaxRate(formData.category, formData.subcategory, formData.variant)
      
      let primaryImageUrl = ''
      let extraImageUrls: string[] = []

      if (formData.image_files.length > 0) {
        // Upload new files to Supabase Storage to get permanent URLs
        const uploadedUrls = await Promise.all(
          formData.image_files.map(f => uploadProductImage(f))
        )
        primaryImageUrl = uploadedUrls[0]
        extraImageUrls = [
          ...formData.existing_image_urls,
          ...uploadedUrls.slice(1)
        ]
      } else if (formData.existing_image_urls.length > 0) {
        // No new files — keep existing permanent URLs
        primaryImageUrl = formData.existing_image_urls[0]
        extraImageUrls = formData.existing_image_urls.slice(1)
      }

      if (!primaryImageUrl && !isEditMode) {
        primaryImageUrl = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070'
      }

      const productPayload = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        category: formData.category, 
        subcategory: formData.subcategory, 
        brand: formData.brand,
        hsn_code: formData.hsn_code || hsn_code,
        price: parseFloat(formData.price),
        cost_price: parseFloat(formData.price) * 0.75,
        warranty_months: parseInt(formData.warranty_months),
        image_url: primaryImageUrl,
        additional_images: extraImageUrls,
        serial_numbers: formData.serial_numbers,
        stock_count: formData.serial_numbers?.length || 0,
        supplier_id: formData.supplier_id === 'none' ? null : formData.supplier_id,
        supplier_name: formData.supplier_id === 'none' ? null : creditors.find(c => c.id === formData.supplier_id)?.ledger_name
      }

      if (isEditMode && editingId) {
        await updateProduct(editingId, productPayload)
        toast.success('Product updated')
      } else {
        const product = await addProduct(productPayload)
        if (formData.model_3d_url) {
          await addProduct3DModel({
            product_id: product.id,
            model_url: formData.model_3d_url,
            model_type: 'glb'
          })
        }
        toast.success('Product added to inventory')
      }

      setIsAddSheetOpen(false)
      loadInitialData()

      // Reset Form State
      setFormData({
        name: '',
        brand: '',
        sku: '',
        description: '',
        category: CLASSIFICATIONS[0].category,
        subcategory: CLASSIFICATIONS[0].subcategories[0].name,
        variant: CLASSIFICATIONS[0].subcategories[0].variants[0].label,
        hsn_code: '',
        price: '',
        warranty_months: '12',
        image_files: [],
        existing_image_urls: [],
        serial_numbers: [],
        model_3d_url: '',
        supplier_id: 'none'
      })
      setIsEditMode(false)
      setEditingId(null)
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Failed to sync changes')
      // Even if server sync fails, the service now returns a local mock, so we can proceed
      setIsAddSheetOpen(false)
      loadInitialData()
      
      setFormData({
        name: '',
        brand: '',
        sku: '',
        description: '',
        category: CLASSIFICATIONS[0].category,
        subcategory: CLASSIFICATIONS[0].subcategories[0].name,
        variant: CLASSIFICATIONS[0].subcategories[0].variants[0].label,
        hsn_code: '',
        price: '',
        warranty_months: '12',
        image_files: [],
        existing_image_urls: [],
        serial_numbers: [],
        model_3d_url: '',
        supplier_id: 'none'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const { gst_rate: predictedTax, hsn_code: predictedHsn } = getTaxRate(formData.category, formData.subcategory, formData.variant)

  const inventoryCategories = ['All', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];
  const inventorySubcategories = ['All', ...Array.from(new Set(products.filter(p => filters.category === 'All' || p.category === filters.category).map(p => p.subcategory).filter(Boolean)))];
  const inventoryBrands = ['All', ...Array.from(new Set(products.map(p => p.brand).filter(Boolean))), 'Other'];
  const inventoryVariants = ['All', ...Array.from(new Set(products.filter(p => filters.subcategory === 'All' || p.subcategory === filters.subcategory).map(p => p.variant).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
                         
    const matchesCategory = filters.category === 'All' || p.category === filters.category
    const matchesSubcategory = filters.subcategory === 'All' || p.subcategory === filters.subcategory
    const matchesBrand = filters.brand === 'All' || (filters.brand === 'Other' ? !p.brand : p.brand === filters.brand)
    const matchesVariant = filters.variant === 'All' || p.variant === filters.variant
    
    // Tax filter logic - since tax isn't directly on product in DB yet, we check the rule
    const matchesTax = taxFilter === 'all'
    return matchesSearch && matchesCategory && matchesSubcategory && matchesBrand && matchesVariant && matchesTax
  }).sort((a, b) => {
     if (sortBy === 'price-high') return b.price - a.price
     if (sortBy === 'price-low') return a.price - b.price
     if (sortBy === 'most-brought') return (b.popularity || 0) - (a.popularity || 0)
     return new Date(b.created_at || new Date()).getTime() - new Date(a.created_at || new Date()).getTime()
  })

  // Cascading Logic for Form
  const selectedCategory = CLASSIFICATIONS.find(c => c.category === formData.category)
  const availableSubcategories = selectedCategory?.subcategories || []
  const selectedSubcategory = availableSubcategories.find(s => s.name === formData.subcategory)
  const availableVariants = selectedSubcategory?.variants || []

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-blue-50">
      {/* Surgical Minimalist Header */}
      <header className="h-14 flex items-center justify-between px-8 sticky top-0 z-30 bg-white/80 backdrop-blur-md shrink-0 border-b border-[#f1f1f0]">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">Product Inventory</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[13px] font-medium text-[#37352f]/40">
             <span className="flex items-center gap-2"><Box className="h-4 w-4" /> {products.length} Items</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Universal Import Modal */}
            <Dialog open={isImportBillModalOpen} onOpenChange={setIsImportBillModalOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="h-9 border-[#ededeb] hover:bg-[#f7f7f5] rounded-md text-[13px] font-semibold px-4 transition-all"
                >
                  <Sparkles className="h-4 w-4 mr-1.5 text-purple-600" />
                  Universal Import
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px] w-full p-6 border border-[#ededeb] shadow-xl bg-white rounded-xl flex flex-col">
                <DialogHeader>
                  <DialogTitle className="text-[20px] font-bold text-[#37352f] flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    Universal Import
                  </DialogTitle>
                  <p className="text-xs text-gray-500 mt-1">
                    Upload any file (PDF, Image, CSV). CSVs are parsed instantly, others are extracted via Mistral AI.
                  </p>
                </DialogHeader>

                <div className="space-y-6 my-4">
                  <div 
                    className={`border-2 border-dashed border-[#ededeb] rounded-xl p-8 text-center transition-all relative ${isExtractingBill ? 'bg-purple-50 border-purple-200' : 'bg-[#fdfdfc] hover:bg-[#f7f7f5] cursor-pointer'}`}
                    onClick={() => !isExtractingBill && document.getElementById('bill-upload-input')?.click()}
                  >
                    <input 
                      id="bill-upload-input" 
                      type="file" 
                      accept=".pdf,.png,.jpg,.jpeg,.csv,.docx" 
                      className="hidden" 
                      onChange={handleImportBillUpload}
                      disabled={isExtractingBill}
                    />
                    <div className="flex flex-col items-center gap-2">
                      {isExtractingBill ? (
                        <>
                          <div className="h-8 w-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
                          <span className="text-sm font-semibold text-purple-700 mt-2">
                            Extracting details via Mistral AI...
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              extractController?.abort();
                            }}
                            className="mt-3 px-4 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-full transition-colors z-50 relative pointer-events-auto"
                          >
                            Cancel Extraction
                          </button>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-8 w-8 text-gray-400" />
                          <span className="text-sm font-semibold text-[#37352f]">
                            Select Document or CSV
                          </span>
                          <span className="text-[11px] text-gray-400">
                            Drag & drop or click to browse
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Results Review Dialog (Triggered programmatically) */}
            <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
            <DialogContent className="sm:max-w-[700px] w-full p-6 border border-[#ededeb] shadow-xl bg-white rounded-xl flex flex-col max-h-[85vh]">
              <DialogHeader>
                <DialogTitle className="text-[20px] font-bold text-[#37352f] flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  Review Extracted Products
                </DialogTitle>
                <p className="text-xs text-gray-500 mt-1">
                  Review the data parsed from your file before saving it to your inventory.
                </p>
              </DialogHeader>

              <div className="space-y-6 my-4 overflow-y-auto pr-1 flex-1 max-h-[50vh]">

                {/* Import Preview */}
                {importResults && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#37352f] uppercase tracking-wider">
                        Parsed Preview ({importResults.data.length} Valid, {importResults.errors.length} Errors)
                      </h4>
                      {importResults.errors.length > 0 && (
                        <Badge variant="destructive" className="text-[10px] rounded-md px-2 py-0">
                          {importResults.errors.length} Rows Ignored
                        </Badge>
                      )}
                    </div>

                    <div className="border border-[#ededeb] rounded-xl overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#f7f7f5] text-gray-500 font-bold border-b border-[#ededeb]">
                            <th className="p-2 w-10 text-center">Row</th>
                            <th className="p-2">Product Name</th>
                            <th className="p-2">Category</th>
                            <th className="p-2 text-right">Price</th>
                            <th className="p-2 text-center w-20">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ededeb] bg-white">
                          {/* Valid Rows */}
                          {importResults.data.map((prod, idx) => (
                            <tr key={`valid-${idx}`} className="hover:bg-[#fcfcfb]">
                              <td className="p-2 text-center text-gray-400 font-medium">-</td>
                              <td className="p-2 font-semibold text-[#37352f]">{prod.name}</td>
                              <td className="p-2 text-gray-500">{prod.category}</td>
                              <td className="p-2 text-right font-semibold text-gray-800">₹{prod.price.toLocaleString()}</td>
                              <td className="p-2 text-center">
                                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none text-[9px] font-bold px-2 py-0.5 rounded">
                                  Ready
                                </Badge>
                              </td>
                            </tr>
                          ))}

                          {/* Invalid Rows */}
                          {importResults.errors.map((err, idx) => {
                            const rawRow = importResults.raw?.[err.row - 2]
                            return (
                              <tr key={`invalid-${idx}`} className="bg-red-50/20 hover:bg-red-50/30 text-red-900">
                                <td className="p-2 text-center font-bold text-red-500">{err.row}</td>
                                <td className="p-2 font-medium truncate max-w-[150px]">{rawRow?.name || "N/A"}</td>
                                <td className="p-2 opacity-70 truncate max-w-[100px]">{rawRow?.category || "N/A"}</td>
                                <td className="p-2 text-right font-medium">{rawRow?.price || "N/A"}</td>
                                <td className="p-2 text-center">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <button className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1 mx-auto" type="button">
                                        <AlertCircle className="h-3 w-3" /> Error
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-3 text-xs bg-red-950 text-white rounded-lg shadow-xl border-none max-w-[200px] z-50">
                                      {err.message}
                                    </PopoverContent>
                                  </Popover>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="border-t border-[#ededeb] pt-4 mt-2">
                <Button 
                  variant="ghost" 
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(false)
                    setImportResults(null)
                  }}
                  className="h-9 rounded-md text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button 
                  disabled={isImporting || !importResults || importResults.data.length === 0}
                  onClick={executeBulkImport}
                  className="h-9 bg-[#37352f] hover:bg-black text-white rounded-md text-xs font-semibold px-6 shadow-sm"
                >
                  {isImporting ? "Importing..." : `Import ${importResults?.data.length || 0} Products`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>

          <Sheet open={isAddSheetOpen} onOpenChange={(open) => {
            setIsAddSheetOpen(open)
            if (!open) {
               setIsEditMode(false)
               setEditingId(null)
               setFormData({
                  name: '',
                  sku: '',
                  description: '',
                  category: CLASSIFICATIONS[0].category,
                  subcategory: CLASSIFICATIONS[0].subcategories[0].name,
                  variant: CLASSIFICATIONS[0].subcategories[0].variants[0].label,
                  hsn_code: '',
                  price: '',
                  warranty_months: '12',
                  image_files: [],
                  existing_image_urls: [],
                  serial_numbers: [],
                  model_3d_url: '',
                  supplier_id: 'none'
               })
            }
          }}>
            <SheetTrigger asChild>
              <Button 
               onClick={() => {
                  setIsEditMode(false)
                  setEditingId(null)
               }}
               className="h-9 bg-[#2383e2] hover:bg-[#1d6dc3] text-white rounded-md text-[13px] font-semibold px-5 border-none transition-all shadow-sm"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add product
              </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-[1000px] w-full p-0 border-l border-[#ededeb] shadow-[0_0_20px_rgba(0,0,0,0.05)] flex flex-col animate-in slide-in-from-right duration-300">
              <SheetHeader className="px-8 pt-12 pb-6 bg-white shrink-0 border-b border-[#ededeb]">
                <SheetTitle className="text-[28px] font-bold text-[#37352f] tracking-tight">
                   {isEditMode ? 'Edit product' : 'New product'}
                </SheetTitle>
                <div className="flex items-center gap-2 mt-2">
                   <Badge variant="outline" className="rounded-md border-[#ededeb] text-[10px] font-medium text-gray-500 px-2 py-0">
                      {isEditMode ? 'Editing' : 'Draft'}
                   </Badge>
                   <span className="text-xs text-gray-400">Inventory Management</span>
                </div>
              </SheetHeader>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <form onSubmit={handleAddProduct} className="flex h-full">
                  {/* LEFT PANE: Media Gallery */}
                  <div className="w-[400px] border-r border-[#ededeb] bg-[#fdfdfc] p-8 space-y-6 flex-shrink-0">
                    <div className="space-y-4">
                      {/* Primary Image */}
                      <div className="group relative aspect-[4/3] rounded-2xl border-2 border-dashed border-[#ededeb] bg-white flex flex-col items-center justify-center cursor-pointer hover:bg-[#f7f7f5] hover:border-[#d1d1d0] transition-all overflow-hidden shadow-sm"
                           onClick={() => document.getElementById('asset-upload-drawer')?.click()}>
                        {formData.image_files.length > 0 ? (
                          <div className="h-full w-full relative group">
                            <img src={URL.createObjectURL(formData.image_files[0])} className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                              <ImageIcon className="h-6 w-6 text-white mb-2" />
                              <p className="text-white text-[11px] font-semibold">Update Primary Image</p>
                            </div>
                          </div>
                        ) : formData.existing_image_urls.length > 0 ? (
                          <div className="h-full w-full relative group">
                            <img src={formData.existing_image_urls[0]} className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center backdrop-blur-[2px]">
                              <ImageIcon className="h-6 w-6 text-white mb-2" />
                              <p className="text-white text-[11px] font-semibold">Update Primary Image</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-[#37352f]/40">
                            <div className="h-12 w-12 rounded-full bg-[#f1f1ef] flex items-center justify-center">
                               <Plus className="h-5 w-5 stroke-[2]" />
                            </div>
                            <div className="text-center">
                               <span className="text-[13px] font-semibold block text-[#37352f]">Upload media</span>
                               <span className="text-[11px] font-medium opacity-70 block mt-0.5">Drag and drop or click</span>
                            </div>
                          </div>
                        )}
                        <input 
                          id="asset-upload-drawer" 
                          type="file" 
                          multiple
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                             if (e.target.files) {
                               setFormData({...formData, image_files: [...formData.image_files, ...Array.from(e.target.files)]})
                             }
                          }}
                        />
                      </div>
                      
                      {/* Thumbnail Grid */}
                      <div className="grid grid-cols-3 gap-4">
                         {/* Existing Image Thumbnails */}
                         {formData.existing_image_urls.slice(formData.image_files.length === 0 ? 1 : 0).map((url, idx) => (
                            <div key={`existing-${idx}`} className="aspect-square rounded-xl border border-[#ededeb] bg-white overflow-hidden relative group">
                               <img src={url} className="w-full h-full object-cover" />
                               <button 
                                  type="button"
                                  onClick={(e) => {
                                     e.stopPropagation()
                                     const realIdx = formData.image_files.length === 0 ? idx + 1 : idx;
                                     const newUrls = [...formData.existing_image_urls]
                                     newUrls.splice(realIdx, 1)
                                     setFormData({...formData, existing_image_urls: newUrls})
                                  }}
                                  className="absolute top-1 right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                               >
                                  <Trash2 className="h-3 w-3" />
                               </button>
                            </div>
                         ))}
                         {/* New Image Thumbnails */}
                         {formData.image_files.slice(formData.existing_image_urls.length === 0 ? 1 : 0).map((file, idx) => (
                            <div key={`new-${idx}`} className="aspect-square rounded-xl border border-[#ededeb] bg-white overflow-hidden relative group">
                               <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                               <button 
                                  type="button"
                                  onClick={(e) => {
                                     e.stopPropagation()
                                     const realIdx = formData.existing_image_urls.length === 0 ? idx + 1 : idx;
                                     const newFiles = [...formData.image_files]
                                     newFiles.splice(realIdx, 1)
                                     setFormData({...formData, image_files: newFiles})
                                  }}
                                  className="absolute top-1 right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                               >
                                  <Trash2 className="h-3 w-3" />
                               </button>
                            </div>
                         ))}
                         
                         {/* Thumbnail Upload Button */}
                         <div 
                            onClick={() => document.getElementById('asset-upload-drawer')?.click()}
                            className="aspect-square rounded-xl border border-dashed border-[#ededeb] hover:border-[#d1d1d0] bg-white hover:bg-[#f7f7f5] flex items-center justify-center cursor-pointer transition-colors"
                         >
                            <Plus className="h-4 w-4 text-[#37352f]/40" />
                         </div>
                      </div>
                    </div>
                    
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                       <div className="flex items-start gap-3">
                          <Sparkles className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                          <div>
                             <h4 className="text-[12px] font-bold text-[#37352f]">Media Guidelines</h4>
                             <p className="text-[11px] text-[#37352f]/60 mt-1 leading-relaxed">
                                Use high-resolution images (at least 1080x1080px). The first image will be used as the primary cover across the ecosystem.
                             </p>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* RIGHT PANE: Form Details */}
                  <div className="flex-1 p-8 space-y-10 bg-white">
                  <div className="space-y-8">
                    {/* Basic Identity */}
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-8">
                         <div className="space-y-2">
                           <Label className="text-[11px] font-medium text-[#37352f]/40 ml-0.5 uppercase tracking-wider">Title</Label>
                           <Input 
                             placeholder="Untitled product"
                             value={formData.name} 
                             onChange={e => setFormData({...formData, name: e.target.value})} 
                             required 
                             className="h-9 rounded-md border-[#ededeb] bg-[#f7f7f5]/50 focus-visible:bg-white text-[14px] font-medium placeholder:text-[#37352f]/20 transition-all focus-visible:ring-1 focus-visible:ring-blue-500/20 shadow-none" 
                           />
                         </div>
                         <div className="space-y-2">
                           <Label className="text-[11px] font-medium text-[#37352f]/40 ml-0.5 uppercase tracking-wider">SKU</Label>
                           <Input 
                             placeholder="Auto-generated if empty"
                             value={formData.sku} 
                             onChange={e => setFormData({...formData, sku: e.target.value})} 
                             className="h-9 rounded-md border-[#ededeb] bg-[#f7f7f5]/50 focus-visible:bg-white text-[14px] font-medium placeholder:text-[#37352f]/20 transition-all focus-visible:ring-1 focus-visible:ring-blue-500/20 shadow-none uppercase" 
                           />
                         </div>
                      </div>

                      <div className="space-y-2 mb-6">
                        <Label className="text-[11px] font-medium text-[#37352f]/40 ml-0.5 uppercase tracking-wider">Brand / Manufacturer</Label>
                        <Select 
                          value={PREDEFINED_BRANDS.includes(formData.brand) ? formData.brand : (formData.brand || formData.brand === '' && document.activeElement?.id === 'custom-brand-input' ? 'Other' : formData.brand)} 
                          onValueChange={(val) => setFormData({...formData, brand: val === 'Other' ? 'Other' : val})}
                        >
                          <SelectTrigger className="h-9 rounded-md border-[#ededeb] bg-[#f7f7f5]/50 font-medium text-[13px] text-[#37352f] shadow-none">
                            <SelectValue placeholder="Select Brand" />
                          </SelectTrigger>
                          <SelectContent className="rounded-md border-[#ededeb] shadow-xl max-h-[300px]">
                            {PREDEFINED_BRANDS.map(brand => (
                              <SelectItem key={brand} value={brand} className="text-[13px]">{brand}</SelectItem>
                            ))}
                            <SelectItem value="Other" className="text-[13px] font-bold text-blue-600">Other (Custom)</SelectItem>
                          </SelectContent>
                        </Select>
                        {(!PREDEFINED_BRANDS.includes(formData.brand) && formData.brand !== '') || formData.brand === 'Other' ? (
                          <Input 
                            id="custom-brand-input"
                            placeholder="Enter custom brand"
                            value={formData.brand === 'Other' ? '' : formData.brand} 
                            onChange={e => setFormData({...formData, brand: e.target.value})} 
                            className="h-9 mt-2 rounded-md border-[#ededeb] bg-white focus-visible:bg-white text-[14px] font-medium placeholder:text-[#37352f]/20 transition-all focus-visible:ring-1 focus-visible:ring-blue-500/20 shadow-none animate-in fade-in" 
                          />
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-medium text-[#37352f]/40 ml-0.5 uppercase tracking-wider">Classification</Label>
                          <Select value={formData.category} onValueChange={(val) => {
                            const newCategory = CLASSIFICATIONS.find(c => c.category === val)
                            const newSubcat = newCategory?.subcategories[0]?.name || ''
                            const newVariant = newCategory?.subcategories[0]?.variants[0]?.label || ''
                            setFormData({...formData, category: val, subcategory: newSubcat, variant: newVariant})
                          }}>
                            <SelectTrigger className="h-9 rounded-md border-[#ededeb] bg-[#f7f7f5]/50 font-medium text-[13px] text-[#37352f] shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-md border-[#ededeb] shadow-xl">
                              {CLASSIFICATIONS.map(c => <SelectItem key={c.category} value={c.category} className="text-[13px]">{c.category}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-medium text-[#37352f]/40 ml-0.5 uppercase tracking-wider">Type</Label>
                          <Select value={formData.subcategory} onValueChange={(val) => {
                            const newSubcat = availableSubcategories.find(s => s.name === val)
                            const newVariant = newSubcat?.variants[0]?.label || ''
                            setFormData({...formData, subcategory: val, variant: newVariant})
                          }}>
                            <SelectTrigger className="h-9 rounded-md border-[#ededeb] bg-[#f7f7f5]/50 font-medium text-[13px] text-[#37352f] shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-md border-[#ededeb] shadow-xl">
                              {availableSubcategories.map(s => <SelectItem key={s.name} value={s.name} className="text-[13px]">{s.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-medium text-[#37352f]/40 ml-0.5 uppercase tracking-wider">Variant</Label>
                          <Select value={formData.variant} onValueChange={(val) => setFormData({...formData, variant: val})}>
                            <SelectTrigger className="h-9 rounded-md border-[#ededeb] bg-[#f7f7f5]/50 font-medium text-[13px] text-[#37352f] shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-md border-[#ededeb] shadow-xl">
                              {availableVariants.map(v => <SelectItem key={v.label} value={v.label} className="text-[13px]">{v.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-medium text-[#37352f]/40 ml-0.5 uppercase tracking-wider">Base Price</Label>
                          <div className="relative">
                            <Input 
                              type="number" 
                              value={formData.price} 
                              onChange={e => setFormData({...formData, price: e.target.value})} 
                              className="h-9 rounded-md border-[#ededeb] bg-[#f7f7f5]/50 font-bold text-[13px] pr-16 shadow-none" 
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">GST {predictedTax}%</div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-[11px] font-medium text-[#37352f]/40 ml-0.5 uppercase tracking-wider">Description</Label>
                        <Textarea 
                          placeholder="Start typing..." 
                          value={formData.description} 
                          onChange={e => setFormData({...formData, description: e.target.value})} 
                          className="rounded-md min-h-[100px] border-[#ededeb] bg-[#f7f7f5]/50 text-[13px] resize-none focus-visible:bg-white shadow-none" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-[11px] font-medium text-[#37352f]/40 ml-0.5 uppercase tracking-wider">Supplier Account (Sundry Creditor)</Label>
                        <Select value={formData.supplier_id} onValueChange={(val) => setFormData({...formData, supplier_id: val})}>
                          <SelectTrigger className="h-9 rounded-md border-[#ededeb] bg-[#f7f7f5]/50 font-medium text-[13px] text-[#37352f] shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-md border-[#ededeb] shadow-xl">
                            <SelectItem value="none" className="text-[13px] italic text-gray-500">No Supplier Assigned</SelectItem>
                            {creditors.map(c => <SelectItem key={c.id} value={c.id} className="text-[13px] font-semibold">{c.ledger_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {/* Inventory Intelligence - Serial Numbers */}
                      <div className="pt-6 mt-6 border-t border-[#ededeb] space-y-4">
                         <div className="flex items-center justify-between">
                            <div>
                               <Label className="text-[11px] font-medium text-[#37352f]/40 ml-0.5 uppercase tracking-wider">Inventory Tracking</Label>
                               <p className="text-[12px] text-[#37352f]/60 font-medium mt-0.5">Stock is determined by tracking precise serial numbers.</p>
                            </div>
                            <Badge className="bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-50 px-3">{formData.serial_numbers.length} in stock</Badge>
                         </div>
                         
                         <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                               <Input 
                                 placeholder="Add single serial number..." 
                                 value={newSerialInput}
                                 onChange={e => setNewSerialInput(e.target.value)}
                                 onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newSerialInput.trim()) {
                                       e.preventDefault()
                                       setFormData(prev => ({
                                          ...prev,
                                          serial_numbers: [...new Set([...prev.serial_numbers, newSerialInput.trim()])]
                                       }))
                                       setNewSerialInput('')
                                    }
                                 }}
                                 className="h-9 rounded-md border-[#ededeb] bg-white text-[13px] shadow-none pl-3 pr-10" 
                               />
                               <button 
                                  type="button"
                                  onClick={() => {
                                    if (newSerialInput.trim()) {
                                       setFormData(prev => ({
                                          ...prev,
                                          serial_numbers: [...new Set([...prev.serial_numbers, newSerialInput.trim()])]
                                       }))
                                       setNewSerialInput('')
                                    }
                                  }}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 bg-[#f7f7f5] hover:bg-[#ebebeb] rounded flex items-center justify-center transition-colors"
                               >
                                  <Plus className="h-3.5 w-3.5 text-[#37352f]" />
                               </button>
                            </div>
                            <div className="text-[11px] font-bold text-[#37352f]/30 uppercase tracking-widest">OR</div>
                            <div>
                               <Input 
                                  type="file" 
                                  accept=".csv,.txt"
                                  id="csv-upload"
                                  className="hidden"
                                  onChange={handleCsvUpload}
                               />
                               <Button 
                                  type="button"
                                  variant="outline" 
                                  onClick={() => document.getElementById('csv-upload')?.click()}
                                  className="h-9 rounded-md text-[12px] font-semibold"
                               >
                                  Import CSV
                               </Button>
                            </div>
                         </div>
                         
                         {/* Serial Numbers Badge Array */}
                         {formData.serial_numbers.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2 max-h-32 overflow-y-auto custom-scrollbar bg-[#fdfdfc] border border-[#ededeb] p-3 rounded-xl">
                               {formData.serial_numbers.map(sn => (
                                  <div key={sn} className="flex items-center gap-1.5 bg-white border border-[#ededeb] px-2 py-1 rounded text-[11px] font-semibold text-[#37352f] shadow-sm">
                                     {sn}
                                     <button 
                                        type="button"
                                        onClick={() => setFormData(prev => ({
                                           ...prev,
                                           serial_numbers: prev.serial_numbers.filter(s => s !== sn)
                                        }))}
                                        className="h-4 w-4 flex items-center justify-center rounded-full hover:bg-red-50 hover:text-red-500 text-[#37352f]/40 transition-colors"
                                     >
                                        <Trash2 className="h-2.5 w-2.5" />
                                     </button>
                                  </div>
                               ))}
                            </div>
                         )}
                      </div>
                    </div>
                  </div>
                  </div>
                </form>
              </div>

              <SheetFooter className="px-8 py-6 border-t border-[#ededeb] bg-white shrink-0">
                <Button 
                  onClick={() => handleAddProduct()}
                  disabled={isSubmitting}
                  className="w-full bg-[#37352f] hover:bg-[#37352f]/90 text-white rounded-md h-9 text-[13px] font-semibold transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? 'Saving...' : 'Finalize asset'}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Clean Control Bar */}
      {/* Clean Control Bar */}
      {selectedProductIds.length > 0 ? (
        <div className="h-12 px-6 flex items-center justify-between text-[13px] border-b border-[#ededeb] transition-colors bg-blue-50/50">
          <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-left-4 duration-300">
             <div className="flex items-center gap-4">
               <label className="flex items-center gap-2 px-3 py-1.5 cursor-pointer">
                 <input 
                   type="checkbox" 
                   checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                   onChange={(e) => {
                     if (e.target.checked) {
                       setSelectedProductIds(filteredProducts.map(p => p.id))
                     } else {
                       setSelectedProductIds([])
                     }
                   }}
                   className="rounded border-gray-300 w-4 h-4 accent-blue-600 cursor-pointer transition-all"
                 />
                 <span className="font-bold text-blue-800 text-[13px]">
                   {selectedProductIds.length} item{selectedProductIds.length > 1 ? 's' : ''} selected
                 </span>
               </label>
               <div className="h-4 w-[1px] bg-blue-200" />
               <Button 
                 variant="ghost"
                 className="h-8 rounded-md text-[12px] font-semibold px-3 text-red-600 hover:text-red-700 hover:bg-red-100 transition-colors"
                 onClick={async () => {
                   if (confirm(`Are you sure you want to delete ${selectedProductIds.length} products?`)) {
                     for (const id of selectedProductIds) {
                       await deleteProduct(id)
                     }
                     toast.success(`${selectedProductIds.length} products deleted`)
                     setSelectedProductIds([])
                     loadInitialData()
                   }
                 }}
               >
                 <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                 Delete Selected
               </Button>
             </div>
             <Button 
               variant="ghost"
               className="h-8 rounded-md text-[12px] font-semibold px-3 text-gray-500 hover:text-gray-700 hover:bg-white"
               onClick={() => setSelectedProductIds([])}
             >
               Cancel
             </Button>
          </div>
        </div>
      ) : ( 
        <div className="relative z-10 bg-white p-2 border border-[#ededeb] shadow-[0_2px_8px_rgb(0,0,0,0.04)] rounded-xl flex items-center animate-in fade-in duration-300 mb-6 mx-8 mt-6 w-max">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer group pl-2">
                     <input 
                       type="checkbox" 
                       checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                       onChange={(e) => {
                         if (e.target.checked) {
                           setSelectedProductIds(filteredProducts.map(p => p.id))
                         } else {
                           setSelectedProductIds([])
                         }
                       }}
                       className="rounded border-gray-300 w-[18px] h-[18px] accent-[#37352f] cursor-pointer transition-all"
                     />
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative">
                       <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#37352f]/40" />
                       <input 
                          type="text" 
                          placeholder="Search inventory..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-[#f7f7f5] border border-[#ededeb] rounded-lg pl-10 pr-4 py-2.5 text-[14px] font-medium focus:outline-none focus:ring-1 focus:ring-blue-500/20 w-[280px] placeholder:text-[#37352f]/40 transition-all shadow-sm"
                       />
                    </div>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-2 h-10 px-4 bg-white border border-[#ededeb] hover:bg-[#f7f7f5] rounded-lg text-[13px] font-semibold text-[#37352f] transition-colors shadow-sm">
                           <Filter className="h-4 w-4" />
                           Filters
                           {(filters.category !== 'All' || filters.subcategory !== 'All' || filters.brand !== 'All' || filters.variant !== 'All') && (
                             <span className="flex items-center justify-center bg-blue-500 text-white text-[10px] w-5 h-5 rounded-full ml-1 font-bold shadow-sm">
                               {[filters.category, filters.subcategory, filters.brand, filters.variant].filter(f => f !== 'All').length}
                             </span>
                           )}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-72 p-4 space-y-4 rounded-xl border-[#ededeb] shadow-xl bg-white">
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-[#37352f]/50 uppercase tracking-wider">Category</Label>
                          <Select value={filters.category} onValueChange={v => setFilters({...filters, category: v, subcategory: 'All', variant: 'All'})}>
                            <SelectTrigger className="h-9 text-[13px] font-medium"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {inventoryCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-[#37352f]/50 uppercase tracking-wider">Type / Subcategory</Label>
                          <Select value={filters.subcategory} onValueChange={v => setFilters({...filters, subcategory: v, variant: 'All'})}>
                            <SelectTrigger className="h-9 text-[13px] font-medium"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {inventorySubcategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-[#37352f]/50 uppercase tracking-wider">Brand</Label>
                          <Select value={filters.brand} onValueChange={v => setFilters({...filters, brand: v})}>
                            <SelectTrigger className="h-9 text-[13px] font-medium"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {inventoryBrands.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[11px] font-bold text-[#37352f]/50 uppercase tracking-wider">Variant</Label>
                          <Select value={filters.variant} onValueChange={v => setFilters({...filters, variant: v})}>
                            <SelectTrigger className="h-9 text-[13px] font-medium"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {inventoryVariants.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="pt-2 border-t border-[#ededeb] mt-4">
                           <Button 
                             variant="ghost" 
                             className="w-full h-9 text-[13px] font-semibold text-red-500 hover:text-red-600 hover:bg-red-50"
                             onClick={() => setFilters({category: 'All', subcategory: 'All', brand: 'All', variant: 'All'})}
                           >
                             Clear All Filters
                           </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <div className="h-4 w-[1px] bg-[#ededeb] mx-1" />
                    <div className="flex bg-[#f7f7f5] rounded-lg p-1 border border-[#ededeb]">
                      <button
                        onClick={() => handleViewModeChange('grid')}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#37352f]' : 'text-[#37352f]/40 hover:text-[#37352f]'}`}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleViewModeChange('list')}
                        className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-[#37352f]' : 'text-[#37352f]/40 hover:text-[#37352f]'}`}
                      >
                        <List className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
         )}

      {/* High-Fidelity Gallery Grid */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
         {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
               {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-4">
                     <Skeleton className="aspect-[4/5] w-full rounded-[20px] bg-[#f7f7f5]" />
                     <Skeleton className="h-4 w-3/4 bg-[#f7f7f5]" />
                     <Skeleton className="h-3 w-1/2 bg-[#f7f7f5]" />
                  </div>
               ))}
            </div>
         ) : filteredProducts.length > 0 ? (
            viewMode === 'list' ? (
             <div className="border border-[#ededeb] rounded-xl overflow-hidden bg-white shadow-sm">
               <table className="w-full text-left text-[13px]">
                 <thead className="bg-[#fdfdfc] border-b border-[#ededeb] text-[#37352f]/60 font-bold uppercase tracking-wider text-[11px]">
                   <tr>
                     <th className="py-3 px-4 w-12 text-center">
                       <input 
                         type="checkbox"
                         checked={selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0}
                         onChange={(e) => {
                           if (e.target.checked) setSelectedProductIds(filteredProducts.map(p => p.id))
                           else setSelectedProductIds([])
                         }}
                         className="rounded border-gray-300 w-[18px] h-[18px] accent-[#37352f] cursor-pointer"
                       />
                     </th>
                     <th className="py-3 px-4">Particulars</th>
                     <th className="py-3 px-4">Under Group</th>
                     <th className="py-3 px-4">Stock Status</th>
                     <th className="py-3 px-4 text-right">Unit Price</th>
                     <th className="py-3 px-4 w-16"></th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#ededeb]">
                   {filteredProducts.map(product => (
                     <tr 
                       key={product.id} 
                       className="hover:bg-[#f7f7f5]/50 transition-colors cursor-pointer group"
                       onClick={() => {
                         setSelectedProduct(product)
                         setDetailEdits({
                            price: product.price ? product.price.toString() : '',
                            selling_price: product.selling_price ? product.selling_price.toString() : ''
                         })
                         setIsDetailModalOpen(true)
                       }}
                     >
                       <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                         <input 
                           type="checkbox"
                           checked={selectedProductIds.includes(product.id)}
                           onChange={(e) => {
                             if (e.target.checked) setSelectedProductIds([...selectedProductIds, product.id])
                             else setSelectedProductIds(selectedProductIds.filter(id => id !== product.id))
                           }}
                           className="rounded border-gray-300 w-[18px] h-[18px] accent-[#37352f] cursor-pointer"
                         />
                       </td>
                       <td className="py-3 px-4">
                         <div className="font-semibold text-[#37352f] text-[14px]">{product.name}</div>
                         <div className="text-[#37352f]/50 text-[11px] uppercase tracking-wider mt-1">{product.brand || product.name.split(' ')[0]} • {product.variant}</div>
                       </td>
                       <td className="py-3 px-4">
                         <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none font-medium rounded-md text-[11px] px-2.5 py-0.5">
                           {product.subcategory}
                         </Badge>
                       </td>
                       <td className="py-3 px-4">
                         <div className={`text-[12px] font-bold ${getAvailableStock(product) > 0 ? 'text-[#37352f]' : 'text-red-600'}`}>
                           {getAvailableStock(product) > 0 ? `${getAvailableStock(product)} Units` : 'Out of stock'}
                         </div>
                       </td>
                       <td className="py-3 px-4 text-right font-bold text-[#37352f] text-[14px]">
                         ₹{product.price.toLocaleString()}
                       </td>
                       <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                         <button 
                            onClick={async () => {
                               if(confirm(`Delete ${product.name} from inventory?`)) {
                                  await deleteProduct(product.id);
                                  toast.success('Product deleted');
                                  loadInitialData();
                               }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                         >
                            <Trash2 className="h-4 w-4" />
                         </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12">
               {filteredProducts.map(product => {
                  return (
                     <div 
                        key={product.id} 
                        onClick={() => {
                          setSelectedProduct(product)
                          setDetailEdits({
                             price: product.price ? product.price.toString() : '',
                             selling_price: product.selling_price ? product.selling_price.toString() : ''
                          })
                          setIsDetailModalOpen(true)
                        }}
                        className="group cursor-pointer flex flex-col"
                     >
                        {/* Media Container - Full Bleed */}
                        <div className="aspect-[4/5] bg-[#f7f7f5] rounded-[20px] relative overflow-hidden transition-all duration-500 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] group-hover:-translate-y-1">
                           <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                              <Badge className="bg-white/90 backdrop-blur-md text-[#37352f]/60 border-none text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit">
                                 {product.category}
                              </Badge>
                              <Badge className={`${getAvailableStock(product) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'} border-none text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit`}>
                                 {getAvailableStock(product) > 0 ? `${getAvailableStock(product)} in stock` : 'Out of stock'}
                              </Badge>
                              {product.last_sold_date && (new Date().getTime() - new Date(product.last_sold_date).getTime() < 24 * 60 * 60 * 1000) && (
                                <Badge className="bg-blue-500/90 backdrop-blur-md text-white border-none text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider w-fit animate-pulse shadow-lg shadow-blue-500/20 flex items-center gap-1.5">
                                   <Sparkles className="h-3 w-3" />
                                   Recently Bought
                                </Badge>
                              )}
                           </div>

                           {/* Selection & Action */}
                           <div className={`absolute top-4 right-4 z-20 flex flex-col gap-2 transition-opacity duration-300 ${selectedProductIds.includes(product.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                              <button 
                                 onClick={async (e) => {
                                    e.stopPropagation();
                                    if(confirm(`Delete ${product.name} from inventory?`)) {
                                       await deleteProduct(product.id);
                                       toast.success('Product deleted');
                                       loadInitialData();
                                    }
                                 }}
                                 className="h-8 w-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                              >
                                 <Trash2 className="h-4 w-4" />
                              </button>
                              <div 
                                className="h-8 w-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input 
                                  type="checkbox"
                                  checked={selectedProductIds.includes(product.id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedProductIds([...selectedProductIds, product.id])
                                    } else {
                                      setSelectedProductIds(selectedProductIds.filter(id => id !== product.id))
                                    }
                                  }}
                                  className="w-4 h-4 rounded border-gray-300 accent-[#37352f] cursor-pointer"
                                />
                              </div>
                           </div>
                           
                           {/* Selection Ring */}
                           {selectedProductIds.includes(product.id) && (
                             <div className="absolute inset-0 border-4 border-[#37352f] rounded-[20px] pointer-events-none z-30" />
                           )}

                           <img 
                              src={product.image_url} 
                              onError={(e) => {
                                 (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=1000&auto=format&fit=crop'
                              }}
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" 
                           />
                           <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        </div>

                        {/* Content Hierarchy */}
                        <div className="mt-6 space-y-1.5">
                           <h4 className="text-[17px] font-semibold text-[#37352f] tracking-tight group-hover:text-[#2383e2] transition-colors leading-tight">
                              {product.name}
                           </h4>
                           <p className="text-[13px] text-[#37352f]/40 font-medium line-clamp-1 leading-normal">
                              {product.description || 'Professional inventory asset'}
                           </p>
                           <p className="text-[15px] font-bold text-[#37352f] pt-1">
                              ₹{product.price.toLocaleString()} <span className="text-[10px] text-[#37352f]/30 ml-1 uppercase tracking-widest">INR</span>
                           </p>
                        </div>
                     </div>
                  )
               })}
            </div>
           )
         ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
               <div className="h-20 w-20 bg-[#f7f7f5] rounded-[32px] flex items-center justify-center">
                  <Package className="h-10 w-10 text-[#acaba9]" />
               </div>
               <div>
                  <h3 className="text-lg font-semibold text-gray-900">No products found</h3>
                  <p className="text-sm text-gray-500">Try adjusting your filters or search query.</p>
               </div>
               <Button 
                  onClick={() => {
                     setSearchQuery('')
                     setTaxFilter('all')
                     setFilters({category: 'All', subcategory: 'All', brand: 'All', variant: 'All'})
                  }}
                  variant="outline" 
                  className="rounded-lg text-xs font-medium"
               >
                  Clear filters
               </Button>
            </div>
         )}
      </div>

      {/* Notion-Page Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="!max-w-none w-[960px] h-[640px] p-0 overflow-hidden border-none shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-white rounded-[20px] outline-none flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="flex h-full w-full outline-none">
               {/* Left Pane: Media Gallery */}
               <div className="w-[320px] bg-[#fdfdfc] border-r border-[#ededeb] flex flex-col">
                  {/* Primary Image */}
                  <div className="h-[320px] w-full bg-white relative flex items-center justify-center border-b border-[#ededeb] shrink-0 p-6">
                     <img 
                       src={selectedProduct.image_url} 
                       onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?q=80&w=1000&auto=format&fit=crop'
                       }}
                       className="w-full h-full object-contain" 
                     />
                     <Badge className="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-[#37352f]/60 border-none text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                        {selectedProduct.category}
                     </Badge>
                  </div>
                  
                  {/* Thumbnail Gallery */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                     <h3 className="text-[11px] font-bold text-[#37352f]/40 uppercase tracking-widest mb-4">Media Assets</h3>
                     <div className="grid grid-cols-3 gap-3">
                        <div className="aspect-square bg-white border-2 border-[#2383e2] rounded-lg overflow-hidden relative cursor-pointer opacity-100">
                           <img src={selectedProduct.image_url} className="w-full h-full object-cover" />
                        </div>
                        {selectedProduct.additional_images?.map((imgUrl: string, idx: number) => (
                           <div key={idx} className="aspect-square bg-white border border-[#ededeb] rounded-lg overflow-hidden relative cursor-pointer hover:border-[#d1d1d0] transition-colors opacity-70 hover:opacity-100">
                              <img src={imgUrl} className="w-full h-full object-cover" />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Right Pane: Details & Configuration */}
               <div className="flex-1 flex flex-col bg-white">
                  {/* Header */}
                  <div className="px-8 pt-8 pb-4 shrink-0 border-b border-[#ededeb] flex items-start justify-between">
                     <div>
                        <div className="flex items-center gap-2 mb-2">
                           <Badge variant="outline" className="rounded-md border-[#ededeb] bg-[#f7f7f5] text-[9px] font-semibold text-[#37352f] px-2 py-0 uppercase">Verified Asset</Badge>
                           <span className="text-[10px] text-[#37352f]/30 tracking-widest uppercase font-semibold">SKU: {selectedProduct.sku}</span>
                        </div>
                        <h2 className="text-[28px] font-bold text-[#37352f] tracking-tight leading-none mb-3">{selectedProduct.name}</h2>
                        <div className="flex items-center gap-6 text-[12px] text-[#37352f]/60 font-medium">
                           <span className="flex items-center gap-2"><LayoutGrid className="h-3.5 w-3.5 opacity-40" /> {selectedProduct.category}</span>
                           <span className="flex items-center gap-2"><Box className="h-3.5 w-3.5 opacity-40" /> {selectedProduct.subcategory}</span>
                        </div>
                     </div>
                     <Link href="/owner/billing">
                        <Button
                          disabled={getAvailableStock(selectedProduct) === 0}
                          className="bg-[#2383e2] hover:bg-[#1d6dc3] disabled:bg-[#d1d5db] disabled:text-[#6b7280] text-white rounded-md h-8 px-5 text-[12px] font-semibold shadow-sm"
                        >
                           {getAvailableStock(selectedProduct) > 0 ? 'Generate Invoice' : 'Out of Stock'}
                        </Button>
                     </Link>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar px-8 py-6 space-y-10">
                     {/* Financial Controls */}
                     <div className="space-y-4">
                        <h3 className="text-[11px] font-bold text-[#37352f]/40 uppercase tracking-widest flex items-center gap-2">
                           <IndianRupee className="h-3.5 w-3.5" /> Financial Configuration
                        </h3>
                        <div className="grid grid-cols-3 gap-5 p-4 rounded-xl border border-[#ededeb] bg-[#fdfdfc]">
                           <div className="space-y-2">
                              <Label className="text-[11px] font-medium text-[#37352f]/60 uppercase tracking-wider">Price Incl. Tax</Label>
                              <Input 
                                 type="number" 
                                 value={
                                    detailEdits.price 
                                    ? Math.round(parseFloat(detailEdits.price) * (1 + getTaxRate(selectedProduct.category, selectedProduct.subcategory, selectedProduct.variant).gst_rate / 100))
                                    : ''
                                 }
                                 onChange={e => {
                                    const val = parseFloat(e.target.value);
                                    if(!isNaN(val)) {
                                       const taxRate = getTaxRate(selectedProduct.category, selectedProduct.subcategory, selectedProduct.variant).gst_rate;
                                       setDetailEdits({...detailEdits, price: (val / (1 + taxRate/100)).toFixed(2)})
                                    } else {
                                       setDetailEdits({...detailEdits, price: ''})
                                    }
                                 }}
                                 className="h-10 rounded-md border-[#ededeb] bg-blue-50/30 text-blue-900 font-bold text-[14px] shadow-none" 
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[11px] font-medium text-[#37352f]/60 uppercase tracking-wider">Base Price (INR)</Label>
                              <Input 
                                 type="number" 
                                 value={detailEdits.price} 
                                 onChange={e => setDetailEdits({...detailEdits, price: e.target.value})}
                                 className="h-10 rounded-md border-[#ededeb] bg-white font-bold text-[14px] shadow-none" 
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[11px] font-medium text-[#37352f]/60 uppercase tracking-wider flex items-center justify-between">
                                 <span>Selling Price</span>
                                 {detailEdits.selling_price && detailEdits.price && (
                                    <span className="text-green-600 font-bold text-[10px]">
                                       Margin: ₹{(parseFloat(detailEdits.selling_price) - (parseFloat(detailEdits.price) * (1 + getTaxRate(selectedProduct.category, selectedProduct.subcategory, selectedProduct.variant).gst_rate / 100))).toFixed(2)}
                                    </span>
                                 )}
                              </Label>
                              <Input 
                                 type="number" 
                                 placeholder="Enter Selling Price"
                                 value={detailEdits.selling_price} 
                                 onChange={e => setDetailEdits({...detailEdits, selling_price: e.target.value})}
                                 className="h-10 rounded-md border-[#ededeb] bg-white font-bold text-[14px] shadow-none" 
                              />
                           </div>
                           <div className="col-span-3 pt-2 border-t border-[#ededeb] flex justify-end">
                              <Button 
                                 disabled={isSavingDetails}
                                 onClick={async () => {
                                    setIsSavingDetails(true)
                                    try {
                                       await updateProduct(selectedProduct.id, {
                                          price: parseFloat(detailEdits.price) || 0,
                                          selling_price: parseFloat(detailEdits.selling_price) || 0
                                       })
                                       toast.success('Financial specs updated')
                                       loadInitialData()
                                    } catch (err) {
                                       toast.error('Failed to commit updates')
                                    } finally {
                                       setIsSavingDetails(false)
                                    }
                                 }}
                                 className="h-8 bg-black hover:bg-black/80 text-white rounded text-[12px] font-medium px-4"
                              >
                                 {isSavingDetails ? 'Saving...' : 'Save Configuration'}
                              </Button>
                           </div>
                        </div>
                     </div>

                     {/* Specification Buffer */}
                     <div className="space-y-3">
                        <h3 className="text-[11px] font-bold text-[#37352f]/40 uppercase tracking-widest flex items-center gap-2">
                           <FileText className="h-3.5 w-3.5" /> Specification Buffer
                        </h3>
                        {(() => {
                          const desc = selectedProduct?.description || '';
                          const parts = desc.split('--- Source Bill Details ---');
                          const mainDesc = parts[0].trim();
                          const billDetails = parts.length > 1 ? parts[1].trim() : null;

                          return (
                            <div className="bg-[#f7f7f5] rounded-xl overflow-hidden border border-[#ededeb]">
                               <div className="p-5 text-[13px] text-[#37352f] leading-relaxed opacity-90 whitespace-pre-wrap">
                                  {mainDesc || 'No technical specifications provided for this master asset.'}
                               </div>
                               {billDetails && (
                                 <div className="bg-[#f2f2ef] p-5 border-t border-[#ededeb]/60">
                                   <div className="text-[10px] font-black uppercase text-[#37352f]/60 mb-3 tracking-widest">
                                     Extracted Source Details
                                   </div>
                                   <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                     {billDetails.split('\n').map((line, idx) => {
                                       const lineParts = line.split(': ');
                                       if (lineParts.length < 2 || !line.trim()) return null;
                                       
                                       const label = lineParts[0].trim();
                                       const value = lineParts.slice(1).join(': ').trim();
                                       
                                       if (label.toUpperCase() === 'BILL URL') {
                                         return (
                                           <div key={idx} className="col-span-2 mt-2">
                                             <a href={value} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 hover:bg-blue-100 w-fit px-4 py-2 rounded-lg transition-colors shadow-sm">
                                               <ExternalLink className="h-3.5 w-3.5" /> View Original Source Bill
                                             </a>
                                           </div>
                                         )
                                       }
                                       
                                       return (
                                         <div key={idx} className="flex flex-col">
                                           <span className="text-[9px] uppercase tracking-wider text-[#37352f]/50 font-bold">{label}</span>
                                           <span className="text-[12px] font-medium text-[#37352f] truncate">{value}</span>
                                         </div>
                                       );
                                     })}
                                   </div>
                                 </div>
                               )}
                            </div>
                          )
                        })()}
                     </div>

                     <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                           <h3 className="text-[11px] font-bold text-[#37352f]/40 uppercase tracking-widest flex items-center gap-2 mb-3">
                              <FileDigit className="h-3.5 w-3.5" /> Compliance
                           </h3>
                           <div className="flex justify-between items-center py-2 border-b border-[#ededeb]">
                              <span className="text-[13px] font-medium text-[#37352f]/60">HSN Code</span>
                              <span className="text-[13px] font-bold text-[#37352f]">{selectedProduct.hsn_code || '8528'}</span>
                           </div>
                           <div className="flex justify-between items-center py-2 border-b border-[#ededeb]">
                              <span className="text-[13px] font-medium text-[#37352f]/60">Warranty</span>
                              <span className="text-[13px] font-bold text-[#37352f]">{selectedProduct.warranty_months} Months</span>
                           </div>
                        </div>
                        
                        <div className="space-y-3">
                           <div className="flex items-center justify-between mb-3">
                              <h3 className="text-[11px] font-bold text-[#37352f]/40 uppercase tracking-widest flex items-center gap-2">
                                 <Barcode className="h-3.5 w-3.5" /> Serial Numbers
                              </h3>
                               <Badge className={`${getAvailableStock(selectedProduct) > 0 ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-red-50 text-red-600 border-red-100'} border hover:bg-transparent`}>
                                 {getAvailableStock(selectedProduct) > 0 ? `${getAvailableStock(selectedProduct)} in stock` : 'Out of stock'}
                               </Badge>
                           </div>
                           <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                              {selectedProduct.serial_numbers && selectedProduct.serial_numbers.length > 0 ? (
                                 selectedProduct.serial_numbers.map((sn: string, idx: number) => (
                                    <div key={idx} className="bg-[#f7f7f5] border border-[#ededeb] px-2 py-1 rounded text-[11px] font-semibold text-[#37352f]">
                                       {sn}
                                    </div>
                                 ))
                              ) : (
                                 <div className="w-full text-center p-4 border border-dashed border-[#ededeb] rounded-xl text-[12px] text-[#37352f]/40 font-medium">
                                    No serial numbers remaining in stock.
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>

                  </div>
                  
                  {/* Footer Actions */}
                  <div className="px-8 py-4 bg-[#fdfdfc] border-t border-[#ededeb] flex justify-end gap-4 shrink-0">
                     <button 
                        onClick={() => {
                           setIsEditMode(true)
                           setEditingId(selectedProduct.id)
                           setFormData({
                              name: selectedProduct.name,
                              brand: PREDEFINED_BRANDS.find(b => b.toLowerCase() === selectedProduct.brand?.toLowerCase()) || selectedProduct.brand || '',
                              sku: selectedProduct.sku,
                              description: selectedProduct.description || '',
                              category: selectedProduct.category,
                              subcategory: selectedProduct.subcategory || CLASSIFICATIONS[0].subcategories[0].name,
                              variant: selectedProduct.variant || CLASSIFICATIONS[0].subcategories[0].variants[0].label,
                              hsn_code: selectedProduct.hsn_code || '',
                              price: selectedProduct.price.toString(),
                              warranty_months: selectedProduct.warranty_months.toString(),
                              image_files: [],
                              existing_image_urls: [selectedProduct.image_url, ...(selectedProduct.additional_images || [])],
                              serial_numbers: selectedProduct.serial_numbers?.length > 0 ? selectedProduct.serial_numbers : (selectedProduct.sku ? [selectedProduct.sku] : []),
                              model_3d_url: ''
                           })
                           setIsDetailModalOpen(false)
                           setIsAddSheetOpen(true)
                        }}
                        className="text-[13px] font-semibold text-[#37352f]/60 hover:text-[#37352f] transition-colors"
                     >
                        Open Full Editor
                     </button>
                     <button 
                        onClick={async () => {
                           if(confirm('Purge this asset from ledger?')) {
                              await deleteProduct(selectedProduct.id);
                              setIsDetailModalOpen(false);
                              loadInitialData();
                              toast.success('Asset purged');
                           }
                        }}
                        className="text-[13px] font-semibold text-red-500/60 hover:text-red-500 transition-colors ml-4"
                     >
                        Delete asset
                     </button>
                  </div>
               </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e9e9e8;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d1d0;
        }
      `}</style>
    </div>
  )
}
