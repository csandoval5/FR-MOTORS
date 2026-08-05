import { useState, useEffect, useCallback } from 'react'
import {
  getProveedores,
  getProveedorById,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  verificarRucExistente
} from '../api/proveedoresService'

/**
 * Hook personalizado para gestión de proveedores
 * CRUD completo con búsqueda, paginación y manejo de estados
 */
export function useProveedores() {
  const [proveedores, setProveedores] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const pageSize = 20

  const fetchProveedores = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getProveedores({ search, page, pageSize })
      setProveedores(result.data)
      setTotal(result.total || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    fetchProveedores()
  }, [fetchProveedores])

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

  const verificarRuc = useCallback(async (rucCedula, excludeId = null) => {
    try {
      return await verificarRucExistente(rucCedula, excludeId)
    } catch (err) {
      console.error('Error al verificar RUC/Cédula:', err)
      return false
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

  return {
    proveedores,
    total,
    loading,
    error,
    page,
    search,
    totalPages: Math.ceil(total / pageSize),
    setPage,
    setSearch,
    fetchProveedores,
    getProveedor,
    verificarRuc,
    crearProveedor,
    editarProveedor,
    eliminarProveedor
  }
}
