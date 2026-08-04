import { useState, useEffect, useCallback } from 'react'
import { getVentas, getVentaById, createVenta, anularVenta, getVentasDelDia, getMetodosPago } from '../api/ventasService'

/**
 * Hook personalizado para gestión de ventas/POS
 */
export function useVentas() {
  const [ventas, setVentas] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [metodosPago, setMetodosPago] = useState([])
  const [ventasDelDia, setVentasDelDia] = useState({ total: 0, cantidad: 0 })
  const pageSize = 20

  const fetchVentas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getVentas({ search, fechaDesde, fechaHasta, page, pageSize })
      setVentas(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, fechaDesde, fechaHasta, page])

  const fetchMetodosPago = useCallback(async () => {
    try {
      const data = await getMetodosPago()
      setMetodosPago(data || [])
    } catch (err) {
      console.error('Error al cargar métodos de pago:', err)
    }
  }, [])

  const fetchVentasDelDia = useCallback(async () => {
    try {
      const data = await getVentasDelDia()
      setVentasDelDia(data)
    } catch (err) {
      console.error('Error al cargar ventas del día:', err)
    }
  }, [])

  useEffect(() => {
    fetchVentas()
  }, [fetchVentas])

  useEffect(() => {
    fetchMetodosPago()
    fetchVentasDelDia()
  }, [fetchMetodosPago, fetchVentasDelDia])

  const getVenta = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      return await getVentaById(id)
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const registrarVenta = useCallback(async (ventaData) => {
    setLoading(true)
    setError(null)
    try {
      const result = await createVenta(ventaData)
      await fetchVentas()
      await fetchVentasDelDia()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchVentas, fetchVentasDelDia])

  const anular = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await anularVenta(id)
      await fetchVentas()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchVentas])

  return {
    ventas,
    total,
    loading,
    error,
    page,
    search,
    fechaDesde,
    fechaHasta,
    metodosPago,
    ventasDelDia,
    totalPages: Math.ceil(total / pageSize),
    setPage,
    setSearch,
    setFechaDesde,
    setFechaHasta,
    fetchVentas,
    getVenta,
    registrarVenta,
    anular
  }
}

