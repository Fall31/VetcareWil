/**
 * Servicio de Reservas
 */
import { httpService } from './httpService'

export const reservasService = {
  async getByCliente(ci_cliente) {
    const response = await httpService.get(`/reservas/${ci_cliente}`)
    return response.reservas || []
  },

  async create(reservaData) {
    return await httpService.post('/reservas', reservaData)
  },
}
