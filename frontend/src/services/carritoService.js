/**
 * Servicio de Carrito
 */
import { httpService } from './httpService'

export const carritoService = {
  async get(ci_cliente) {
    const response = await httpService.get(`/carrito/${ci_cliente}`)
    return response.carrito
  },

  async agregarProducto(ci_cliente, id_producto, cantidad) {
    return await httpService.post('/carrito/agregar', { ci_cliente, id_producto, cantidad })
  },
}
