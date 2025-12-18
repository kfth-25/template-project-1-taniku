import api from './api'

const normalizeCategorySlug = (category) => {
  const c = String(category || '').toLowerCase().trim()
  if (c.includes('pupuk')) return 'pupuk'
  if (c.includes('obat tanaman')) return 'obat-tanaman'
  if (c.includes('obat')) return 'obat'
  return c || 'pupuk'
}

const produkService = {
  getAllProduk: async () => {
    const response = await api.get('/api/products.php')
    return response.data
  },

  // Mendapatkan detail produk berdasarkan ID
  getProdukById: async (id) => {
    const response = await api.get('/api/products.php', { params: { id } })
    return response.data
  },

  // Mendapatkan produk berdasarkan kategori
  getProdukByCategory: async (category) => {
    const slug = normalizeCategorySlug(category)
    const response = await api.get('/api/products.php', { params: { category: slug } })
    return response.data
  },

  // Menambahkan produk baru
  createProduk: async (produkData) => {
    const payload = {
      name: produkData?.name,
      sku: produkData?.sku,
      category: normalizeCategorySlug(produkData?.category),
      price: Number(produkData?.price),
      stock: Number(produkData?.stock ?? 0),
      description: produkData?.description ?? ''
    }
    const response = await api.post('/api/products.php', payload)
    return response.data
  },

  // Mengupdate produk
  updateProduk: async (id, produkData) => {
    const payload = { id: Number(id) }
    if (produkData?.name != null) payload.name = produkData.name
    if (produkData?.description != null) payload.description = produkData.description
    if (produkData?.price != null) payload.price = Number(produkData.price)
    if (produkData?.stock != null) payload.stock = Number(produkData.stock)
    if (produkData?.status != null) payload.status = String(produkData.status)
    if (produkData?.category != null) payload.category = normalizeCategorySlug(produkData.category)
    const response = await api.put('/api/products.php', payload)
    return response.data
  },

  // Menghapus produk
  deleteProduk: async (id) => {
    const response = await api.delete('/api/products.php', { data: { id } })
    return response.data
  }
}

export default produkService
