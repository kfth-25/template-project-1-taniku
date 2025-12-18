import React, { useEffect, useMemo, useState } from 'react'
import { AdminStoreContext } from './AdminStoreContext.js'

const AdminStoreProvider = ({ children }) => {
  const [editProduct, setEditProductState] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('editProduct') || 'null') } catch (e) { console.warn('Initial parse failed', e); return null }
  })

  const setEditProduct = (p) => {
    setEditProductState(p || null)
    try { sessionStorage.setItem('editProduct', JSON.stringify(p || null)) } catch (e) { console.warn('Cache set failed', e) }
  }

  useEffect(() => {
    const onStorage = () => {
      try { setEditProductState(JSON.parse(sessionStorage.getItem('editProduct') || 'null')) } catch (e) { console.warn('Storage event parse failed', e) }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(() => ({ editProduct, setEditProduct }), [editProduct])
  return <AdminStoreContext.Provider value={value}>{children}</AdminStoreContext.Provider>
}

export default AdminStoreProvider
