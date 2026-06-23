/**
 * Custom Hook: useMascotas
 * Encapsula lógica de negocio para mascotas
 */
import { useState, useEffect } from 'react'
import { mascotasService } from '../services'
import { Mascota } from '../domain'

export function useMascotas(userId) {
  const [mascotas, setMascotas] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchMascotas = async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await mascotasService.getByUserId(userId)
      const mascotasModels = data.map(m => Mascota.fromAPI(m))
      setMascotas(mascotasModels)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMascotas()
  }, [userId])

  const createMascota = async (mascotaData) => {
    setLoading(true)
    setError(null)
    try {
      await mascotasService.create(mascotaData)
      await fetchMascotas()
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  const deleteMascota = async (ci_mascota) => {
    setLoading(true)
    setError(null)
    try {
      await mascotasService.delete(ci_mascota)
      await fetchMascotas()
      return { success: true }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }

  return {
    mascotas,
    loading,
    error,
    refetch: fetchMascotas,
    createMascota,
    deleteMascota,
  }
}
