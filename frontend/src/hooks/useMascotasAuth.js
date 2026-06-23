import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { mascotasService } from '@/services'

/**
 * Hook completo para gestión de mascotas con autenticación
 */
export function useMascotasAuth() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [mascotas, setMascotas] = useState([])
  const [loading, setLoading] = useState(true)
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

  const fetchMascotas = useCallback(async (userId) => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await mascotasService.getByCliente(userId)
      setMascotas(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching mascotas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createMascota = useCallback(async (mascotaData) => {
    try {
      await mascotasService.create({ ...mascotaData, ci_cliente: user.id })
      await fetchMascotas(user.id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [user, fetchMascotas])

  const updateMascota = useCallback(async (ci_mascota, mascotaData) => {
    try {
      await mascotasService.update(ci_mascota, mascotaData)
      await fetchMascotas(user.id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [user, fetchMascotas])

  const deleteMascota = useCallback(async (ci_mascota) => {
    try {
      await mascotasService.delete(ci_mascota)
      await fetchMascotas(user.id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [user, fetchMascotas])

  useEffect(() => {
    const init = async () => {
      const authUser = await checkAuth()
      if (authUser) {
        await fetchMascotas(authUser.id)
      }
    }
    init()
  }, [checkAuth, fetchMascotas])

  return {
    user,
    mascotas,
    loading,
    error,
    createMascota,
    updateMascota,
    deleteMascota,
    refetch: () => fetchMascotas(user?.id)
  }
}
