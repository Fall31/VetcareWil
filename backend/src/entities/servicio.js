class Servicio {
  constructor({ id_servicio, nombre_servicio, precio_base, descripcion, estado_servicio } = {}) {
    this.id_servicio = id_servicio || null
    this.nombre_servicio = nombre_servicio || ''
    this.precio_base = (precio_base === undefined) ? null : precio_base
    this.descripcion = descripcion || ''
    this.estado_servicio = estado_servicio || 'activo'
  }

  validate() {
    const errors = []
    if (!this.nombre_servicio) errors.push('nombre_servicio es requerido')
    if (this.precio_base == null || isNaN(this.precio_base)) errors.push('precio_base inválido')
    return errors
  }
}

module.exports = Servicio
