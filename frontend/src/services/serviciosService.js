/**
 * Servicio de Servicios veterinarios
 */
import { httpService } from './httpService'

export const serviciosService = {
  async getAll() {
    const response = await httpService.get('/servicios')
    return response.servicios || []
  },
}
