class Cliente {
  constructor({ ci_cliente, nombre, email, telefono, user_id } = {}) {
    this.ci_cliente = ci_cliente || null
    this.nombre = nombre || ''
    this.email = email || ''
    this.telefono = telefono || ''
    this.user_id = user_id || null
  }

  validate() {
    const errors = []
    if (!this.nombre) errors.push('nombre es requerido')
    if (!this.email) errors.push('email es requerido')
    return errors
  }
}

module.exports = Cliente
