import { useState, useEffect, useCallback } from 'react'
import { getOrdenesTaller, getOrdenTallerById, createOrdenTaller, updateOrdenTaller, addRepuestosToOrden, getEstadosOrdenTaller, getOrdenesActivas } from '../api/tallerService'

/**
 * Hook personalizado para gestión de órdenes de taller
 */
export function useTaller() {
  const [ordenes, setOrdenes] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [estados, setEstados] = useState([])
  const [ordenesActivas, setOrdenesActivas] = useState([])
  const pageSize = 20

  const fetchOrdenes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getOrdenesTaller({ search, estado: filtroEstado, page, pageSize })
      setOrdenes(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, filtroEstado, page])

  const fetchEstados = useCallback(async () => {
    try {
      const data = await getEstadosOrdenTaller()
      setEstados(data || [])
    } catch (err) {
      console.error('Error al cargar estados:', err)
    }
  }, [])

  const fetchOrdenesActivas = useCallback(async () => {
    try {
      const data = await getOrdenesActivas()
      setOrdenesActivas(data || [])
    } catch (err) {
      console.error('Error al cargar órdenes activas:', err)
    }
  }, [])

  useEffect(() => {
    fetchOrdenes()
  }, [fetchOrdenes])

  useEffect(() => {
    fetchEstados()
    fetchOrdenesActivas()
  }, [fetchEstados, fetchOrdenesActivas])

  const getOrden = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      return await getOrdenTallerById(id)
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const crearOrden = useCallback(async (orden) => {
    setLoading(true)
    setError(null)
    try {
      const result = await createOrdenTaller(orden)
      await fetchOrdenes()
      await fetchOrdenesActivas()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchOrdenes, fetchOrdenesActivas])

  const editarOrden = useCallback(async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const result = await updateOrdenTaller(id, updates)
      await fetchOrdenes()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchOrdenes])

  const agregarRepuestos = useCallback(async (id_orden, repuestos) => {
    setLoading(true)
    setError(null)
    try {
      const result = await addRepuestosToOrden(id_orden, repuestos)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    ordenes,
    total,
    loading,
    error,
    page,
    search,
    filtroEstado,
    estados,
    ordenesActivas,
    totalPages: Math.ceil(total / pageSize),
    setPage,
    setSearch,
    setFiltroEstado,
    fetchOrdenes,
    getOrden,
    crearOrden,
    editarOrden,
    agregarRepuestos
  }
}

