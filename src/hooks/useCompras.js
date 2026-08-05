import { useState, useEffect, useCallback } from 'react'
import {
  getCompras,
  getCompraById,
  crearCompra,
  searchProductosCompra,
  generarNumeroCompra
} from '../api/comprasService'

/**
 * Hook personalizado para gestión de compras
 * Listado, creación, búsqueda de productos y manejo de estados
 */
export function useCompras() {
  const [compras, setCompras] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const pageSize = 20

  const fetchCompras = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getCompras({ search, page, pageSize })
      setCompras(result.data)
      setTotal(result.total || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    fetchCompras()
  }, [fetchCompras])

  const searchProductos = useCallback(async (query) => {
    return await searchProductosCompra(query)
  }, [])

  const getCompra = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      return await getCompraById(id)
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const registrarCompra = useCallback(async (compraData, session) => {
    setLoading(true)
    setError(null)
    try {
      const result = await crearCompra({ ...compraData, session })
      await fetchCompras()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchCompras])

  const obtenerNumeroCompra = useCallback(async () => {
    try {
      return await generarNumeroCompra()
    } catch (err) {
      console.error('Error al generar número de compra:', err)
      return `COMP-${Date.now()}`
    }
  }, [])

  return {
    compras,
    total,
    loading,
    error,
    page,
    search,
    totalPages: Math.ceil(total / pageSize),
    setPage,
    setSearch,
    fetchCompras,
    getCompra,
    searchProductos,
    registrarCompra,
    obtenerNumeroCompra
  }
}
