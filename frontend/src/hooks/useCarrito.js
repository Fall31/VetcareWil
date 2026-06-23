import { useState, useCallback } from 'react'
import { carritoService } from '@/services'
import { supabase } from '@/lib/supabaseClient'

/**
 * Hook para gestionar el carrito de compras
 * Maneja sincronización entre localStorage y backend
 */
export function useCarrito() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Agregar producto al carrito
   * Guarda en localStorage y sincroniza con backend si hay usuario autenticado
   */
  const agregarProducto = useCallback(async (producto, cantidad = 1) => {
    setLoading(true)
    setError(null)

    try {
      // 1. Actualizar localStorage (inmediato para todos los usuarios)
      const carrito = JSON.parse(localStorage.getItem('carrito') || '[]')
      const existingIndex = carrito.findIndex(
        item => item.id_producto === producto.id_producto
      )
      
      if (existingIndex >= 0) {
        carrito[existingIndex].cantidad += cantidad
      } else {
        carrito.push({
          id_producto: producto.id_producto,
          nombre: producto.nombre_producto,
          precio: producto.precio,
          cantidad
        })
      }
      localStorage.setItem('carrito', JSON.stringify(carrito))

      // 2. Sincronizar con backend si hay usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await carritoService.agregar(user.id, producto.id_producto, cantidad)
      }

      return { success: true }
    } catch (err) {
      const errorMsg = err.message || 'Error al agregar al carrito'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Obtener items del carrito desde localStorage
   */
  const obtenerCarritoLocal = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('carrito') || '[]')
    } catch {
      return []
    }
  }, [])

  /**
   * Limpiar carrito local
   */
  const limpiarCarrito = useCallback(() => {
    localStorage.removeItem('carrito')
  }, [])

  return {
    agregarProducto,
    obtenerCarritoLocal,
    limpiarCarrito,
    loading,
    error
  }
}
