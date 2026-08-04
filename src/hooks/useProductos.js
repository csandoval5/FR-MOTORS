import { useState, useEffect, useCallback } from 'react'
import {
  getProductos,
  getProductoById,
  createProducto,
  updateProducto,
  deleteProducto,
  getCategorias,
  getProveedoresActivos,
  searchProductosQuick,
  verificarSkuExistente
} from '../api/productosService'

/**
 * Hook personalizado para gestión de productos/inventario
 * CRUD completo con filtros, paginación y ordenamiento
 */
export function useProductos() {
  const [productos, setProductos] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState('')
  const [filtroStock, setFiltroStock] = useState('todos')
  const [pageSize, setPageSize] = useState(10)
  const [sortColumn, setSortColumn] = useState('nombre_producto')
  const [sortDirection, setSortDirection] = useState('asc')
  const [categorias, setCategorias] = useState([])
  const [proveedores, setProveedores] = useState([])

  const fetchProductos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getProductos({
        search,
        categoria,
        filtroStock,
        page,
        pageSize,
        sortColumn,
        sortDirection
      })
      setProductos(result.data)
      setTotal(result.total)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, categoria, filtroStock, page, pageSize, sortColumn, sortDirection])

  const fetchCategorias = useCallback(async () => {
    try {
      const data = await getCategorias()
      setCategorias(data || [])
    } catch (err) {
      console.error('Error al cargar categorías:', err)
    }
  }, [])

  const fetchProveedores = useCallback(async () => {
    try {
      const data = await getProveedoresActivos()
      setProveedores(data || [])
    } catch (err) {
      console.error('Error al cargar proveedores:', err)
    }
  }, [])

  useEffect(() => {
    fetchProductos()
  }, [fetchProductos])

  useEffect(() => {
    fetchCategorias()
  }, [fetchCategorias])

  useEffect(() => {
    fetchProveedores()
  }, [fetchProveedores])

  // Resetear página al cambiar filtros
  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setPage(1)
  }

  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(col)
      setSortDirection('asc')
    }
  }

const searchProductos = useCallback(async (query) => {
    // Propagar el error real para que el componente pueda mostrarlo
    return await searchProductosQuick(query)
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

  const verificarSku = useCallback(async (sku, excludeId = null) => {
    try {
      return await verificarSkuExistente(sku, excludeId)
    } catch (err) {
      console.error('Error al verificar SKU:', err)
      return false
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
    filtroStock,
    categorias,
    proveedores,
    pageSize,
    sortColumn,
    sortDirection,
    totalPages: Math.ceil(total / pageSize),
    setPage,
    setSearch,
    setCategoria,
    setFiltroStock,
    setPageSize: handlePageSizeChange,
    handleSort,
    fetchProductos,
    getProducto,
    searchProductos,
    verificarSku,
    crearProducto,
    editarProducto,
    eliminarProducto
  }
}
