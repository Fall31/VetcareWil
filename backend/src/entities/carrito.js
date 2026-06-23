class Carrito {
  constructor({ id_carrito, ci_cliente, estado, fecha_creacion } = {}) {
    this.id_carrito = id_carrito || null
    this.ci_cliente = ci_cliente || null
    this.estado = estado || 'activo'
    this.fecha_creacion = fecha_creacion || null
  }

  validate() {
    const errors = []
    if (!this.ci_cliente) errors.push('ci_cliente es requerido')
    return errors
  }
}

module.exports = Carrito
