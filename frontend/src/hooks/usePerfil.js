import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { clientesService } from '@/services'

/**
 * Hook para gestionar perfil de usuario con autenticación
 */
export function usePerfil() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const fetchPerfil = useCallback(async (userId) => {
    if (!userId) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await clientesService.getById(userId)
      setPerfil(data)
    } catch (err) {
      setError(err.message)
      console.error('Error fetching perfil:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const updatePerfil = useCallback(async (perfilData) => {
    if (!user) return { success: false, error: 'No hay usuario autenticado' }
    
    setSaving(true)
    try {
      await clientesService.update(user.id, perfilData)
      await fetchPerfil(user.id)
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setSaving(false)
    }
  }, [user, fetchPerfil])

  const changePassword = useCallback(async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const authUser = await checkAuth()
      if (authUser) {
        await fetchPerfil(authUser.id)
      }
    }
    init()
  }, [checkAuth, fetchPerfil])

  return {
    user,
    perfil,
    loading,
    saving,
    error,
    updatePerfil,
    changePassword,
    refetch: () => fetchPerfil(user?.id)
  }
}
