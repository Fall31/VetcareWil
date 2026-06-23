/**
 * Servicio de Clientes
 */
import { httpService } from './httpService'

export const clientesService = {
  async getAll() {
    const response = await httpService.get('/cliente')
    return response.clientes || []
  },

  async create(clienteData) {
    const response = await httpService.post('/cliente', clienteData)
    return response.inserted || response.data
  },

  async getById(userId) {
    const response = await httpService.get(`/cliente/${userId}`)
    return response.cliente
  },

  async update(userId, updates) {
    return await httpService.put(`/cliente/${userId}`, updates)
  },
}
