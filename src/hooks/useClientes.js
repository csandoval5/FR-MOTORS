import { useState, useEffect, useCallback } from 'react'
import {
  getClientes,
  getClientesActivos,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  verificarIdentificacionExistente
} from '../api/clientesService'

/**
 * Hook personalizado para gestión de clientes
 */
export function useClientes() {
  const [clientes, setClientes] = useState([])
  const [clientesActivos, setClientesActivos] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const pageSize = 20

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getClientes({ search, page, pageSize })
      setClientes(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  const fetchClientesActivos = useCallback(async () => {
    try {
      const data = await getClientesActivos()
      setClientesActivos(data || [])
    } catch (err) {
      console.error('Error al cargar clientes activos:', err)
    }
  }, [])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  useEffect(() => {
    fetchClientesActivos()
  }, [fetchClientesActivos])

  const getCliente = useCallback(async (id) => {
    try {
      return await getClienteById(id)
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  const crearCliente = useCallback(async (cliente) => {
    setLoading(true)
    setError(null)
    try {
      const result = await createCliente(cliente)
      await fetchClientes()
      await fetchClientesActivos()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchClientes, fetchClientesActivos])

  const editarCliente = useCallback(async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const result = await updateCliente(id, updates)
      await fetchClientes()
      await fetchClientesActivos()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchClientes, fetchClientesActivos])

  const eliminarCliente = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await deleteCliente(id)
      await fetchClientes()
      await fetchClientesActivos()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchClientes, fetchClientesActivos])

  const verificarIdentificacion = useCallback(async (numero, excludeId) => {
    return verificarIdentificacionExistente(numero, excludeId)
  }, [])

  return {
    clientes,
    clientesActivos,
    total,
    loading,
    error,
    page,
    search,
    totalPages: Math.ceil(total / pageSize),
    setPage,
    setSearch,
    fetchClientes,
    fetchClientesActivos,
    getCliente,
    crearCliente,
    editarCliente,
    eliminarCliente,
    verificarIdentificacion
  }
}
