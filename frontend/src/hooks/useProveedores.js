import { useState, useEffect, useCallback } from 'react'
import { getProveedores, getProveedorById, createProveedor, updateProveedor, deleteProveedor, getTiposIdentificacion, getCuentasPagar, createAbono } from '../api/proveedoresService'

/**
 * Hook personalizado para gestión de proveedores y cuentas por pagar
 */
export function useProveedores() {
  const [proveedores, setProveedores] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [tiposIdentificacion, setTiposIdentificacion] = useState([])
  // Cuentas por pagar
  const [cuentasPagar, setCuentasPagar] = useState([])
  const [cuentasTotal, setCuentasTotal] = useState(0)
  const [filtroEstado, setFiltroEstado] = useState('')
  const pageSize = 20

  const fetchProveedores = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getProveedores({ search, page, pageSize })
      setProveedores(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  const fetchCuentasPagar = useCallback(async () => {
    try {
      const result = await getCuentasPagar({ estado: filtroEstado, page, pageSize })
      setCuentasPagar(result.data)
      setCuentasTotal(result.total)
    } catch (err) {
      console.error('Error al cargar cuentas por pagar:', err)
    }
  }, [filtroEstado, page])

  const fetchTiposIdentificacion = useCallback(async () => {
    try {
      const data = await getTiposIdentificacion()
      setTiposIdentificacion(data || [])
    } catch (err) {
      console.error('Error al cargar tipos identificación:', err)
    }
  }, [])

  useEffect(() => {
    fetchProveedores()
  }, [fetchProveedores])

  useEffect(() => {
    fetchTiposIdentificacion()
  }, [fetchTiposIdentificacion])

  const getProveedor = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      return await getProveedorById(id)
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const crearProveedor = useCallback(async (proveedor) => {
    setLoading(true)
    setError(null)
    try {
      const result = await createProveedor(proveedor)
      await fetchProveedores()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchProveedores])

  const editarProveedor = useCallback(async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const result = await updateProveedor(id, updates)
      await fetchProveedores()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchProveedores])

  const eliminarProveedor = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await deleteProveedor(id)
      await fetchProveedores()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchProveedores])

  const registrarAbono = useCallback(async (abono) => {
    setLoading(true)
    setError(null)
    try {
      const result = await createAbono(abono)
      await fetchCuentasPagar()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchCuentasPagar])

  return {
    proveedores,
    total,
    loading,
    error,
    page,
    search,
    tiposIdentificacion,
    cuentasPagar,
    cuentasTotal,
    filtroEstado,
    totalPages: Math.ceil(total / pageSize),
    setPage,
    setSearch,
    setFiltroEstado,
    fetchProveedores,
    fetchCuentasPagar,
    getProveedor,
    crearProveedor,
    editarProveedor,
    eliminarProveedor,
    registrarAbono
  }
}

