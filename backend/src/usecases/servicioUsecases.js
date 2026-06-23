const Servicio = require('../entities/servicio')

function makeCreateServicio({ servicioRepository }) {
  return async function createServicio({ payload }) {
    const servicio = new Servicio(payload)
    const errors = servicio.validate()
    if (errors.length) return { success: false, errors }

    const { data, error } = await servicioRepository.insertServicio(payload)
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

function makeListServicios({ servicioRepository }) {
  return async function listServicios({ limit = 50 } = {}) {
    const { data, error } = await servicioRepository.listServicios(limit)
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

module.exports = {
  makeCreateServicio,
  makeListServicios,
}
