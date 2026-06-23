/**
 * Modelo de dominio: Servicio
 */

export class Servicio {
  constructor({ id_servicio, nombre_servicio, precio_base, descripcion, estado_servicio }) {
    this.id = id_servicio
    this.nombre = nombre_servicio || ''
    this.precioBase = precio_base || 0
    this.descripcion = descripcion || ''
    this.estado = estado_servicio || 'activo'
  }

  get precioFormateado() {
    return `$${this.precioBase.toFixed(2)}`
  }

  get activo() {
    return this.estado === 'activo'
  }

  static fromAPI(data) {
    return new Servicio(data)
  }
}
