import api from './api'

const tryPaths = async (method, path, options) => {
  const req = async (u) => (await api[method](u, ...(options ?? []))).data
  try {
    return await req(path)
  } catch (err) {
    const isOrders = path.includes('/orders') || path.includes('/api/orders.php')
    const primary = isOrders ? ['/orders', '/api/orders.php'] : [path]
    const candidates = [
      ...primary,
      ...primary.map(p => `http://localhost/backend${p}`),
      ...primary.map(p => `http://127.0.0.1/backend${p}`),
      ...primary.map(p => `http://localhost:5176${p}`),
    ]
    for (const u of candidates) {
      try { return await req(u) } catch { void 0 }
    }
    throw err
  }
}

export const createOrder = async (payload) => {
  let d
  try {
    d = await tryPaths('post', '/orders', [payload])
  } catch {
    try {
      await tryPaths('get', '/database/setup_base.php')
      await tryPaths('get', '/database/setup_orders.php')
      await tryPaths('get', '/database/seed_products.php')
    } catch { void 0 }
    d = await tryPaths('post', '/orders', [payload])
  }
  if (d && typeof d === 'object' && 'ok' in d) {
    return {
      ok: !!d.ok,
      data: {
        order_id: d.id,
        order_code: d.order_code,
        total: d.total
      }
    }
  }
  return d
}

export const getOrderById = async (id) => {
  const d = await tryPaths('get', '/orders', [{ params: { id } }])
  if (d && d.ok && d.data) {
    const o = d.data
    const items = Array.isArray(o.items) ? o.items : []
    return {
      ok: true,
      data: {
        order: {
          id: o.id,
          order_number: o.order_code,
          status: o.status,
          total: o.total,
          customer_name: o.customer_name,
          customer_email: o.customer_email,
          customer_phone: o.customer_phone,
          shipping_address: o.shipping_address,
          payment_method: o.payment_method || null,
          created_at: o.order_date,
          map_url: o.map_url || null,
          tracking_code: o.tracking_code || null
        },
        items: items.map(it => ({
          product_id: it.product_id,
          product_name: it.name,
          quantity: it.quantity,
          price: it.price,
          subtotal: it.total
        }))
      }
    }
  }
  return d
}

export const getOrderByNumber = async (number) => {
  return await tryPaths('get', '/orders', [{ params: { number } }])
}

export const listOrders = async ({ q, status, limit = 20 } = {}) => {
  const params = {}
  if (q && String(q).trim().length > 0) params.q = String(q).trim()
  if (status && String(status).trim().length > 0) params.status = String(status).trim()
  params.limit = Number(limit) || 20
  const d = await tryPaths('get', '/orders', [{ params }])
  if (d && d.ok && Array.isArray(d.data)) {
    const items = d.data.map(o => ({
      id: o.id,
      order_number: o.order_code,
      status: o.status,
      total: Math.round(Number(o.total) || 0),
      created_at: o.order_date,
      customer_name: o.customer_name,
      customer_email: o.customer_email,
      customer_phone: o.customer_phone,
      map_url: o.map_url || null,
      tracking_code: o.tracking_code || null
    }))
    return { ok: true, data: items }
  }
  return d
}

export default { createOrder, getOrderById, getOrderByNumber, listOrders }
