import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { mascotasService, reservasService } from '@/services'

/**
 * Hook para Dashboard con datos agregados del usuario
 */
export function useDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    mascotas: 0,
    reservas: 0,
    compras: 0,
    ultimaVisita: null
  })
  const [mascotas, setMascotas] = useState([])
  const [error, setError] = useState(null)

  const checkAuth = useCallback(async () => {
    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !authUser) {
        navigate('/iniciar-sesion')
        return null
      }

      setUser(authUser)
      return authUser
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [navigate])

  const fetchDashboardData = useCallback(async (userId) => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    try {
      // Fetch mascotas
      const mascotasData = await mascotasService.getByCliente(userId)
      setMascotas(mascotasData)

      // Fetch reservas (intentar obtener, si falla usar 0)
      let reservasCount = 0
      try {
        const reservasData = await reservasService.getByCliente(userId)
        reservasCount = reservasData.length
      } catch {
        // Si no hay endpoint de reservas, ignorar
      }

      setStats({
        mascotas: mascotasData.length,
        reservas: reservasCount,
        compras: 0, // TODO: implementar cuando exista endpoint
        ultimaVisita: null // TODO: implementar cuando exista endpoint
      })
    } catch (err) {
      setError(err.message)
      console.error('Error fetching dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const authUser = await checkAuth()
      if (authUser) {
        await fetchDashboardData(authUser.id)
      }
    }
    init()
  }, [checkAuth, fetchDashboardData])

  return {
    user,
    stats,
    mascotas,
    loading,
    error,
    refetch: () => fetchDashboardData(user?.id)
  }
}
