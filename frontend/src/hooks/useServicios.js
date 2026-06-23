import { useState, useEffect, useCallback } from 'react'
import { serviciosService } from '@/services'

/**
 * Hook para gestionar servicios veterinarios
 */
export function useServicios() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchServicios = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await serviciosService.getAll()
      setServicios(data)
    } catch (err) {
      setError(err.message || 'Error al cargar servicios')
      console.error('Error en useServicios:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchServicios()
  }, [fetchServicios])

  return {
    servicios,
    loading,
    error,
    refetch: fetchServicios
  }
}
