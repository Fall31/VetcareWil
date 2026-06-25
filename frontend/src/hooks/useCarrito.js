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

  const findCiCliente = useCallback(async (user) => {
    if (!user) return null
    const email = user.email

    const { data: byUserId, error: userIdError } = await supabase
      .from('cliente')
      .select('ci_cliente')
      .eq('user_id', user.id)
      .maybeSingle()

    if (userIdError) {
      console.warn('Error buscando ci_cliente por user_id:', userIdError)
    }
    if (byUserId && byUserId.ci_cliente) return byUserId.ci_cliente

    if (!email) return null

    const { data: byEmail, error: emailError } = await supabase
      .from('cliente')
      .select('ci_cliente')
      .ilike('correo_cliente', email)
      .maybeSingle()

    if (emailError) {
      console.warn('Error buscando ci_cliente por correo_cliente:', emailError)
    }
    return byEmail?.ci_cliente || null
  }, [])

  /**
   * Agregar producto al carrito
   * Guarda en localStorage y sincroniza con backend si hay usuario autenticado
   */
  const agregarProducto = useCallback(async (producto, cantidad = 1) => {
    setLoading(true)
    setError(null)

    try {
      // 1. Actualizar localStorage
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
        const ci_cliente = await findCiCliente(user)
        if (ci_cliente) {
          await carritoService.agregarProducto(ci_cliente, producto.id_producto, cantidad)
        } else {
          console.warn('No se encontró ci_cliente para el usuario autenticado')
        }
      }

      return { success: true }
    } catch (err) {
      const errorMsg = err.message || 'Error al agregar al carrito'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [findCiCliente])

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

  const obtenerCarritoBackend = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const ci_cliente = await findCiCliente(user)
    if (!ci_cliente) return null

    try {
      return await carritoService.get(ci_cliente)
    } catch (err) {
      console.warn('Error obteniendo carrito backend:', err)
      return null
    }
  }, [findCiCliente])

  /**
   * Limpiar carrito local y backend
   */
  const limpiarCarrito = useCallback(async () => {
    localStorage.removeItem('carrito')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const ci_cliente = await findCiCliente(user)
    if (!ci_cliente) return

    try {
      await carritoService.vaciarCarrito(ci_cliente)
    } catch (err) {
      console.warn('Error vaciando carrito en backend:', err)
    }
  }, [findCiCliente])

  return {
    agregarProducto,
    obtenerCarritoLocal,
    obtenerCarritoBackend,
    limpiarCarrito,
    loading,
    error
  }
}
