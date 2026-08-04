import { useState, useEffect, useCallback } from 'react'
import { getProductos, getProductoById, createProducto, updateProducto, deleteProducto, getCategorias, searchProductosQuick } from '../api/productosService'

/**
 * Hook personalizado para gestión de productos/inventario
 */
export function useProductos() {
  const [productos, setProductos] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('')
  const [categorias, setCategorias] = useState([])
  const pageSize = 20

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getProductos({ search, categoria, page, pageSize })
      setProductos(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, categoria, page])

  const fetchCategorias = useCallback(async () => {
    try {
      const data = await getCategorias()
      setCategorias(data || [])
    } catch (err) {
      console.error('Error al cargar categorías:', err)
    }
  }, [])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])

  const searchProductos = useCallback(async (query) => {
    try {
      return await searchProductosQuick(query)
    } catch (err) {
      console.error('Error en búsqueda:', err)
      return []
    }
  }, [])

  const getProducto = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      return await getProductoById(id)
    } catch (err) {
      setError(err.message)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const crearProducto = useCallback(async (producto) => {
    setLoading(true)
    setError(null)
    try {
      const result = await createProducto(producto)
      await fetchProductos()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchProductos])

  const editarProducto = useCallback(async (id, updates) => {
    setLoading(true)
    setError(null)
    try {
      const result = await updateProducto(id, updates)
      await fetchProductos()
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchProductos])

  const eliminarProducto = useCallback(async (id) => {
    setLoading(true)
    setError(null)
    try {
      await deleteProducto(id)
      await fetchProductos()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchProductos])

  return {
    productos,
    total,
    loading,
    error,
    page,
    search,
    categoria,
    categorias,
    totalPages: Math.ceil(total / pageSize),
    setPage,
    setSearch,
    setCategoria,
    fetchProductos,
    getProducto,
    searchProductos,
    crearProducto,
    editarProducto,
    eliminarProducto
  }
}

