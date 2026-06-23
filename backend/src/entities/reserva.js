class Reserva {
  constructor({ id_reserva, ci_mascota, id_servicio, fecha_reserva, hora_reserva, estado_reserva, comentarios, tipo_reserva } = {}) {
    this.id_reserva = id_reserva || null
    this.ci_mascota = ci_mascota || null
    this.id_servicio = id_servicio || null
    this.fecha_reserva = fecha_reserva || null
    this.hora_reserva = hora_reserva || null
    this.estado_reserva = estado_reserva || 'pendiente'
    this.comentarios = comentarios || ''
    this.tipo_reserva = tipo_reserva || 'cita'
  }

  validate() {
    const errors = []
    if (!this.ci_mascota) errors.push('ci_mascota es requerido')
    if (!this.id_servicio) errors.push('id_servicio es requerido')
    if (!this.fecha_reserva) errors.push('fecha_reserva es requerido')
    return errors
  }
}

module.exports = Reserva
