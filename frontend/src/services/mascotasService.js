/**
 * Servicio de Mascotas
 */
import { httpService } from './httpService'

export const mascotasService = {
  async getByUserId(userId) {
    const response = await httpService.get(`/mascotas/${userId}`)
    return response.mascotas || []
  },

  async create(mascotaData) {
    return await httpService.post('/mascotas', mascotaData)
  },

  async update(ci_mascota, updates) {
    return await httpService.put(`/mascotas/${ci_mascota}`, updates)
  },

  async delete(ci_mascota) {
    return await httpService.delete(`/mascotas/${ci_mascota}`)
  },
}
