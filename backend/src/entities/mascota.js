class Mascota {
  constructor({ ci_mascota, ci_cliente, nombre_mascota, especie, raza, fecha_nacimiento, sexo } = {}) {
    this.ci_mascota = ci_mascota || null
    this.ci_cliente = ci_cliente || null
    this.nombre_mascota = nombre_mascota || ''
    this.especie = especie || ''
    this.raza = raza || ''
    this.fecha_nacimiento = fecha_nacimiento || null
    this.sexo = sexo || ''
  }

  validate() {
    const errors = []
    if (!this.nombre_mascota) errors.push('nombre_mascota es requerido')
    if (!this.especie) errors.push('especie es requerido')
    if (!this.ci_cliente) errors.push('ci_cliente es requerido')
    return errors
  }
}

module.exports = Mascota
