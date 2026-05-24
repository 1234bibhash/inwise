import { createClient } from '@/lib/supabase/client'

export interface Product {
  id: string
  name: string
  sku: string
  description: string
  category: string
  subcategory?: string
  hsn_code?: string
  price: number
  cost_price: number
  warranty_months: number
  stock_count: number
  image_url: string
  additional_images?: string[]
  serial_numbers?: string[]
  last_sold_date?: string
  custom_tax_rate?: number
  created_at: string
  brand?: string
  model_number?: string
  variant?: string
  color?: string
  gst_percentage?: number
  selling_price?: number
  serial_number?: string
  supplier_name?: string
  warehouse_location?: string
  supplier_id?: string | null
  low_stock_alert?: number
  installation_required?: boolean
  service_category?: string
  status?: string
}

export interface ProductWithDetails extends Product {
  product_images: Array<{
    id: string
    image_url: string
    image_type: string
    alt_text?: string
  }>
  product_3d_models: Array<{
    id: string
    model_url: string
    model_type: string
  }>
}

const globalForProducts = globalThis as unknown as {
  MOCK_PRODUCTS: Product[]
}

let MOCK_PRODUCTS: Product[] = globalForProducts.MOCK_PRODUCTS || []

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('inwise_mock_products')
  if (saved) {
    try {
      MOCK_PRODUCTS = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to restore products from localStorage', e)
    }
  }

  if (MOCK_PRODUCTS.length === 0) {
    MOCK_PRODUCTS = []
    localStorage.setItem('inwise_mock_products', JSON.stringify(MOCK_PRODUCTS))
  }
}

globalForProducts.MOCK_PRODUCTS = MOCK_PRODUCTS

function saveProductsToLocal() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('inwise_mock_products', JSON.stringify(MOCK_PRODUCTS))
  }
}

function mergeProducts(primary: Product[], fallback: Product[]) {
  const merged = new Map<string, Product>()

  for (const product of [...primary, ...fallback]) {
    const normalized = normalizeProduct(product)
    if (!merged.has(normalized.id)) {
      merged.set(normalized.id, normalized)
    }
  }

  return Array.from(merged.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

function normalizeProduct(product: any): Product {
  const serialNumbers = Array.isArray(product?.serial_numbers) ? product.serial_numbers : []
  const hasTrackedSerials = serialNumbers.length > 0
  const stockCount =
    typeof product?.stock_count === 'number'
      ? product.stock_count
      : hasTrackedSerials
        ? serialNumbers.length
        : 0

  return {
    ...product,
    stock_count: stockCount,
    serial_numbers: serialNumbers,
    brand: product?.brand || '',
    model_number: product?.model_number || '',
    variant: product?.variant || '',
    color: product?.color || '',
    sku: product?.sku || '',
  }
}

export async function getProducts(
  searchQuery?: string,
  category?: string,
  sortBy?: 'price-asc' | 'price-desc' | 'newest'
) {
  const supabase = createClient()

  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`)
  }

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  // Fallback to mock data if no products found in DB (which is now empty)
  let products = mergeProducts((data || []).map(normalizeProduct), MOCK_PRODUCTS)
  
  // Filter out any lingering fake data that might have been saved in localStorage
  products = products.filter(p => p.id !== 'sam-55-tv' && p.id !== 'lg-ac-15')

  // Apply filters locally for mock data
  if (searchQuery) {
    products = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
  }
  if (category) {
    products = products.filter(p => p.category === category)
  }

  // Apply sorting
  if (sortBy === 'price-asc') {
    products.sort((a, b) => a.price - b.price)
  } else if (sortBy === 'price-desc') {
    products.sort((a, b) => b.price - a.price)
  }

  return products.map(normalizeProduct)
}

export async function getProductById(id: string): Promise<ProductWithDetails | null> {
  const supabase = createClient()

  try {
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()

    if (productError || !product) {
      // Fallback to mock data
      const mockProduct = mergeProducts([], MOCK_PRODUCTS).find(p => p.id === id) || MOCK_PRODUCTS[0]
      return {
        ...normalizeProduct(mockProduct),
        product_images: [{ id: 'm1', image_url: mockProduct.image_url, image_type: 'main' }],
        product_3d_models: [],
      }
    }

    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', id)
      .order('sort_order')

    const { data: models } = await supabase
      .from('product_3d_models')
      .select('*')
      .eq('product_id', id)

    return {
      ...normalizeProduct(product),
      product_images: images || [],
      product_3d_models: models || [],
    }
  } catch (err) {
    const mockProduct = mergeProducts([], MOCK_PRODUCTS).find(p => p.id === id) || MOCK_PRODUCTS[0]
    return {
      ...normalizeProduct(mockProduct),
      product_images: [{ id: 'm1', image_url: mockProduct.image_url, image_type: 'main' }],
      product_3d_models: [],
    }
  }
}

export async function getCategories() {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .neq('category', null)

    if (error) throw error

    const categories = [
      ...new Set([...(data?.map(p => p.category) || []), ...MOCK_PRODUCTS.map(p => p.category)]),
    ]
    return categories.sort()
  } catch (error) {
    console.warn('DB Category fetch bypassed - implementing local classification discovery')
    return [...new Set(MOCK_PRODUCTS.map(p => p.category))].sort()
  }
}

export async function getPriceRange() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
    .select('price')

  if (error) throw error

  const prices = data?.map(p => p.price) || [0]
  return {
    min: Math.min(...prices),
    max: Math.max(...prices),
  }
}

export async function uploadProductImage(file: File): Promise<string> {
  const supabase = createClient()
  const ext = file.name.split('.').pop() || 'jpg'
  const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`
  const filePath = `products/${fileName}`

  console.log('Attempting to upload image to Supabase Storage:', filePath)

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, { cacheControl: '3600', upsert: false })

  if (error) {
    console.error('Supabase Storage Upload Error:', error.message, error)
    console.warn('Falling back to temporary blob URL. THIS IMAGE WILL DISAPPEAR ON REFRESH.')
    return URL.createObjectURL(file)
  }

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath)

  console.log('Upload successful. Public URL:', urlData.publicUrl)
  return urlData.publicUrl
}

export async function addProduct(productData: Omit<Product, 'id' | 'created_at'>) {
  const supabase = createClient()
  const serialNumbers = Array.isArray((productData as any).serial_numbers) ? (productData as any).serial_numbers : []
  const normalizedPayload = {
    ...productData,
    serial_numbers: serialNumbers,
    stock_count:
      typeof (productData as any).stock_count === 'number'
        ? (productData as any).stock_count
        : serialNumbers.length,
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([normalizedPayload])
      .select()
      .single()

    if (error) {
      console.warn('Supabase insertion blocked, implementing local fallback protocol:', error)
      const mockProduct = normalizeProduct({
        ...normalizedPayload,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      })
      MOCK_PRODUCTS.unshift(mockProduct)
      saveProductsToLocal()
      return mockProduct
    }
    return normalizeProduct(data)
  } catch (err) {
    console.warn('Data pipeline failed, executing local asset commitment:', err)
    const mockProduct = normalizeProduct({
      ...normalizedPayload,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    })
    MOCK_PRODUCTS.unshift(mockProduct)
    saveProductsToLocal()
    return mockProduct
  }
}

export async function addProductsBulk(productsData: Omit<Product, 'id' | 'created_at'>[]) {
  const supabase = createClient()
  const payloads = productsData.map(p => {
    const serialNumbers = Array.isArray((p as any).serial_numbers) ? (p as any).serial_numbers : []
    return {
      ...p,
      serial_numbers: serialNumbers,
      stock_count: typeof (p as any).stock_count === 'number'
        ? (p as any).stock_count
        : serialNumbers.length,
    }
  })

  try {
    const { data, error } = await supabase
      .from('products')
      .insert(payloads)
      .select()

    if (error) {
      console.warn('Supabase bulk insertion blocked, implementing local fallbacks:', error)
      const mockInserted = payloads.map(p => {
        const mockProduct = normalizeProduct({
          ...p,
          id: Math.random().toString(36).substr(2, 9),
          created_at: new Date().toISOString()
        })
        MOCK_PRODUCTS.unshift(mockProduct)
        return mockProduct
      })
      saveProductsToLocal()
      return mockInserted
    }
    
    // Add to mock ledger for local UI parity
    const normalizedData = (data || []).map(normalizeProduct)
    normalizedData.forEach(p => MOCK_PRODUCTS.unshift(p))
    saveProductsToLocal()
    return normalizedData
  } catch (err) {
    console.warn('Data pipeline failed, executing local asset bulk commitment:', err)
    const mockInserted = payloads.map(p => {
      const mockProduct = normalizeProduct({
        ...p,
        id: Math.random().toString(36).substr(2, 9),
        created_at: new Date().toISOString()
      })
      MOCK_PRODUCTS.unshift(mockProduct)
      return mockProduct
    })
    saveProductsToLocal()
    return mockInserted
  }
}

export async function updateProduct(id: string, productData: Partial<Product>) {
  const supabase = createClient()
  const nextSerials = Array.isArray(productData.serial_numbers) ? productData.serial_numbers : undefined
  const normalizedUpdates = {
    ...productData,
    ...(nextSerials ? { stock_count: nextSerials.length } : {}),
  }
  
  try {
    const { data, error } = await supabase
      .from('products')
      .update(normalizedUpdates)
      .eq('id', id)
      .select()
      .single()

    // Update local mock ledger for UI parity
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id)
    if (index !== -1) {
      MOCK_PRODUCTS[index] = normalizeProduct({ ...MOCK_PRODUCTS[index], ...normalizedUpdates })
      saveProductsToLocal()
    }

    if (error) {
      console.warn('Supabase update blocked, implement local commit:', error)
      return MOCK_PRODUCTS[index]
    }
    return normalizeProduct(data)
  } catch (err) {
    console.warn('Data pipeline interruption during update, executing local mutation:', err)
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id)
    if (index !== -1) {
      MOCK_PRODUCTS[index] = normalizeProduct({ ...MOCK_PRODUCTS[index], ...normalizedUpdates })
      saveProductsToLocal()
      return MOCK_PRODUCTS[index]
    }
    return null
  }
}

export async function addProductImage(productImage: { product_id: string, image_url: string, image_type: string, sort_order: number }) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('product_images')
    .insert([productImage])
    .select()

  if (error) throw error
  return data
}

export async function addProduct3DModel(productModel: { product_id: string, model_url: string, model_type: string }) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('product_3d_models')
    .insert([productModel])
    .select()

  if (error) throw error
  return data
}

export async function deleteProduct(id: string) {
  const supabase = createClient()
  
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    // Parallel removal from mock ledger for absolute UI parity
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id)
    if (index !== -1) {
      MOCK_PRODUCTS.splice(index, 1)
      saveProductsToLocal()
    }

    if (error) {
      console.warn('Supabase delete blocked, purged from local ledger only:', error)
    }
  } catch (err) {
    console.warn('Data pipeline interruption during purge, executing local removal:', err)
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id)
    if (index !== -1) {
      MOCK_PRODUCTS.splice(index, 1)
      saveProductsToLocal()
    }
  }
}
export async function decrementProductStock(productId: string, quantity: number) {
  const supabase = createClient()
  
  try {
    // 1. Fetch current stock
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_count, serial_numbers')
      .eq('id', productId)
      .single()

    if (fetchError || !product) throw new Error('Product not found in DB')

    const currentSerials = Array.isArray(product.serial_numbers) ? product.serial_numbers : []
    const nextSerials = currentSerials.slice(quantity)
    const baseStock =
      typeof product.stock_count === 'number'
        ? product.stock_count
        : currentSerials.length
    const newStock = Math.max(0, currentSerials.length > 0 ? nextSerials.length : baseStock - quantity)

    // 2. Update stock and last_sold_date in DB
    const { error: updateError } = await supabase
      .from('products')
      .update({
        stock_count: newStock,
        serial_numbers: currentSerials.length > 0 ? nextSerials : product.serial_numbers,
        last_sold_date: new Date().toISOString(),
      })
      .eq('id', productId)

    // 3. Keep mock in sync
    const index = MOCK_PRODUCTS.findIndex(p => p.id === productId)
    if (index !== -1) {
      MOCK_PRODUCTS[index].stock_count = newStock
      if ((MOCK_PRODUCTS[index].serial_numbers || []).length > 0) {
        MOCK_PRODUCTS[index].serial_numbers = (MOCK_PRODUCTS[index].serial_numbers || []).slice(quantity)
      }
      MOCK_PRODUCTS[index].last_sold_date = new Date().toISOString()
      saveProductsToLocal()
    }

    if (updateError) throw updateError
    return true
  } catch (err) {
    console.warn('DB Sync Failed for stock depletion - Executing Local Overwrite:', err)
    const index = MOCK_PRODUCTS.findIndex(p => p.id === productId)
    if (index !== -1) {
      const currentSerials = MOCK_PRODUCTS[index].serial_numbers || []
      if (currentSerials.length > 0) {
        MOCK_PRODUCTS[index].serial_numbers = currentSerials.slice(quantity)
        MOCK_PRODUCTS[index].stock_count = MOCK_PRODUCTS[index].serial_numbers.length
      } else {
        MOCK_PRODUCTS[index].stock_count = Math.max(0, MOCK_PRODUCTS[index].stock_count - quantity)
      }
      MOCK_PRODUCTS[index].last_sold_date = new Date().toISOString()
      saveProductsToLocal()
      return true
    }
    return false
  }
}
