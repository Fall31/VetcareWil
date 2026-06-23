import { useState, useEffect, useCallback } from 'react'
import { reservasService } from '@/services'

/**
 * Hook para gestionar reservas
 */
export function useReservas(clienteId = null) {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchReservas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = clienteId 
        ? await reservasService.getByCliente(clienteId)
        : await reservasService.getAll()
      setReservas(data)
    } catch (err) {
      setError(err.message || 'Error al cargar reservas')
      console.error('Error en useReservas:', err)
    } finally {
      setLoading(false)
    }
  }, [clienteId])

  const createReserva = useCallback(async (reservaData) => {
    try {
      await reservasService.create(reservaData)
      await fetchReservas()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [fetchReservas])

  const updateReserva = useCallback(async (id, reservaData) => {
    try {
      await reservasService.update(id, reservaData)
      await fetchReservas()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [fetchReservas])

  const deleteReserva = useCallback(async (id) => {
    try {
      await reservasService.delete(id)
      await fetchReservas()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [fetchReservas])

  useEffect(() => {
    fetchReservas()
  }, [fetchReservas])

  return {
    reservas,
    loading,
    error,
    createReserva,
    updateReserva,
    deleteReserva,
    refetch: fetchReservas
  }
}
