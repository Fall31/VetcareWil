/**
 * Custom Hook: useProductos
 * Encapsula lógica de negocio para productos (capa de aplicación)
 */
import { useState, useEffect } from 'react'
import { productosService } from '../services'
import { Producto } from '../domain'

export function useProductos() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchProductos = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await productosService.getAll()
      const productosModels = data.map(p => Producto.fromAPI(p))
      setProductos(productosModels)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductos()
  }, [])

  return {
    productos,
    loading,
    error,
    refetch: fetchProductos,
  }
}
