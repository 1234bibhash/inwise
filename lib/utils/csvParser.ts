import { getTaxRate } from '@/lib/services/taxService'

export interface ParsedProduct {
  name: string
  sku: string
  description: string
  category: string
  subcategory: string
  variant?: string
  price: number
  cost_price: number
  warranty_months: number
  stock_count: number
  image_url: string
  brand?: string
  model_number?: string
  color?: string
  hsn_code?: string
  gst_percentage?: number
  serial_number?: string
  supplier_name?: string
  warehouse_location?: string
  low_stock_alert?: number
  installation_required?: boolean
  service_category?: string
  status?: string
}

export interface ParseResult {
  data: ParsedProduct[]
  errors: { row: number; message: string }[]
  raw: any[]
}

// Fuzzy map headers to product attributes
const HEADER_MAPPINGS: Record<string, keyof ParsedProduct> = {
  name: 'name',
  'product name': 'name',
  title: 'name',
  brand: 'brand',
  sku: 'sku',
  'model number': 'model_number',
  model: 'model_number',
  description: 'description',
  details: 'description',
  category: 'category',
  group: 'category',
  subcategory: 'subcategory',
  type: 'subcategory',
  color: 'color',
  'hsn code': 'hsn_code',
  hsn: 'hsn_code',
  'gst percentage': 'gst_percentage',
  gst: 'gst_percentage',
  'tax rate': 'gst_percentage',
  price: 'price',
  'sale price': 'price',
  mrp: 'price',
  cost: 'cost_price',
  'cost price': 'cost_price',
  'purchase price': 'cost_price',
  warranty: 'warranty_months',
  'warranty months': 'warranty_months',
  'warranty_months': 'warranty_months',
  stock: 'stock_count',
  'stock count': 'stock_count',
  quantity: 'stock_count',
  qty: 'stock_count',
  'serial number': 'serial_number',
  serial: 'serial_number',
  'supplier name': 'supplier_name',
  supplier: 'supplier_name',
  'warehouse location': 'warehouse_location',
  warehouse: 'warehouse_location',
  'low stock alert': 'low_stock_alert',
  'low stock': 'low_stock_alert',
  'installation required': 'installation_required',
  installation: 'installation_required',
  'service category': 'service_category',
  status: 'status',
  image: 'image_url',
  'image url': 'image_url',
  'image_url': 'image_url',
}

export function parseCSV(text: string): ParseResult {
  const cleanRows: string[][] = []
  const lines = text.split(/\r?\n/)

  for (const line of lines) {
    if (!line.trim()) continue

    const row: string[] = []
    let i = 0
    while (i < line.length) {
      if (line[i] === '"') {
        let field = ''
        i++ // skip opening quote
        while (i < line.length) {
          if (line[i] === '"') {
            if (line[i + 1] === '"') {
              field += '"'
              i += 2
            } else {
              i++ // skip closing quote
              break
            }
          } else {
            field += line[i]
            i++
          }
        }
        row.push(field)
        if (line[i] === ',') i++ // skip comma after quote
      } else {
        const nextComma = line.indexOf(',', i)
        if (nextComma === -1) {
          row.push(line.substring(i))
          break
        } else {
          row.push(line.substring(i, nextComma))
          i = nextComma + 1
        }
      }
    }
    cleanRows.push(row.map(c => c.trim()))
  }

  if (cleanRows.length === 0) {
    return { data: [], errors: [{ row: 0, message: 'CSV file is empty' }], raw: [] }
  }

  const headers = cleanRows[0].map(h => h.toLowerCase())
  const dataRows = cleanRows.slice(1)
  
  const parsedData: ParsedProduct[] = []
  const errors: { row: number; message: string }[] = []
  const rawList: any[] = []
  const seenSkus = new Set<string>()
  const seenSerials = new Set<string>()

  dataRows.forEach((row, idx) => {
    const rowNum = idx + 2 // 1-based, accounts for header
    const rawObj: Record<string, string> = {}
    
    headers.forEach((header, colIdx) => {
      rawObj[header] = row[colIdx] || ''
    })
    
    rawList.push(rawObj)

    // Map fields
    const product: Partial<ParsedProduct> = {
      name: '',
      sku: '',
      description: '',
      category: '',
      subcategory: '',
      price: 0,
      cost_price: 0,
      warranty_months: 12,
      stock_count: 0,
      image_url: '',
    }

    headers.forEach((header, colIdx) => {
      const mappedField = HEADER_MAPPINGS[header]
      if (mappedField) {
        const val = row[colIdx] || ''
        if (mappedField === 'price' || mappedField === 'cost_price' || mappedField === 'warranty_months' || mappedField === 'stock_count' || mappedField === 'gst_percentage' || mappedField === 'low_stock_alert') {
          const num = parseFloat(val.replace(/[^\d.-]/g, ''))
          product[mappedField] = isNaN(num) ? undefined : num
        } else if (mappedField === 'installation_required') {
          product[mappedField] = val.toLowerCase() === 'true' || val.toLowerCase() === 'yes' || val === '1'
        } else {
          product[mappedField] = val as any
        }
      }
    })

    // Default price fallbacks
    if (product.price === undefined) product.price = 0
    if (product.stock_count === undefined) product.stock_count = 0
    if (product.warranty_months === undefined) product.warranty_months = 12

    // Default category/subcategory if missing
    if (!product.category) {
      product.category = 'Appliances'
    }

    // Auto-map GST and HSN if missing
    if (!product.gst_percentage || !product.hsn_code) {
      const { gst_rate, hsn_code } = getTaxRate(product.category, product.subcategory || '', '')
      if (!product.gst_percentage) product.gst_percentage = gst_rate
      if (!product.hsn_code) product.hsn_code = hsn_code
    }

    // Auto-generate SKU if missing
    if (!product.sku && product.name) {
      const initials = product.name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 3)
      product.sku = `${initials}-${Math.floor(1000 + Math.random() * 9000)}`
    }

    // Default cost price if missing
    if (!product.cost_price && product.price) {
      product.cost_price = product.price * 0.75
    }

    // Validation
    const rowErrors: string[] = []
    if (!product.name) {
      rowErrors.push('Missing Name')
    }
    if (!product.price || product.price <= 0) {
      rowErrors.push('Invalid or Zero Price')
    }
    if (product.cost_price && product.cost_price < 0) {
      rowErrors.push('Cost Price cannot be negative')
    }
    if (product.stock_count !== undefined && product.stock_count < 0) {
      rowErrors.push('Stock count cannot be negative')
    }
    if (!product.hsn_code) {
      rowErrors.push('Missing HSN Code')
    }

    // Duplicate Checks
    if (product.sku) {
      if (seenSkus.has(product.sku)) {
        rowErrors.push(`Duplicate SKU in CSV: ${product.sku}`)
      } else {
        seenSkus.add(product.sku)
      }
    }
    
    if (product.serial_number) {
      if (seenSerials.has(product.serial_number)) {
        rowErrors.push(`Duplicate Serial Number in CSV: ${product.serial_number}`)
      } else {
        seenSerials.add(product.serial_number)
      }
    }

    if (rowErrors.length > 0) {
      errors.push({ row: rowNum, message: rowErrors.join(', ') })
    } else {
      parsedData.push(product as ParsedProduct)
    }
  })

  return { data: parsedData, errors, raw: rawList }
}
