/**
 * Servicio de Productos (capa de infraestructura/adaptador)
 * Comunica con el backend y transforma datos si es necesario
 */
import { httpService } from './httpService'

export const productosService = {
  async getAll() {
    const response = await httpService.get('/productos')
    return response.productos || []
  },

  async create(productoData) {
    const response = await httpService.post('/productos', productoData)
    return response.inserted || response.data
  },
}
