/**
 * Modelo de dominio: Mascota
 */

export class Mascota {
  constructor({ ci_mascota, ci_cliente, nombre_mascota, especie, raza, fecha_nacimiento, sexo }) {
    this.id = ci_mascota
    this.clienteId = ci_cliente
    this.nombre = nombre_mascota || ''
    this.especie = especie || ''
    this.raza = raza || ''
    this.fechaNacimiento = fecha_nacimiento
    this.sexo = sexo || ''
  }

  get edad() {
    if (!this.fechaNacimiento) return null
    const hoy = new Date()
    const nacimiento = new Date(this.fechaNacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mes = hoy.getMonth() - nacimiento.getMonth()
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    return edad
  }

  static fromAPI(data) {
    return new Mascota(data)
  }
}
