const Mascota = require('../entities/mascota')

function makeCreateMascota({ mascotaRepository }) {
  return async function createMascota({ payload }) {
    const mascota = new Mascota(payload)
    const errors = mascota.validate()
    if (errors.length) return { success: false, errors }

    const { data, error } = await mascotaRepository.insertMascota(payload)
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

function makeListMascotasByCliente({ mascotaRepository }) {
  return async function listMascotasByCliente({ ci_cliente }) {
    const { data, error } = await mascotaRepository.listMascotasByCliente(ci_cliente)
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

function makeUpdateMascota({ mascotaRepository }) {
  return async function updateMascota({ ci_mascota, updates }) {
    const { data, error } = await mascotaRepository.updateMascota(ci_mascota, updates)
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

function makeDeleteMascota({ mascotaRepository }) {
  return async function deleteMascota({ ci_mascota }) {
    const { error } = await mascotaRepository.deleteMascota(ci_mascota)
    if (error) return { success: false, error }
    return { success: true }
  }
}

module.exports = {
  makeCreateMascota,
  makeListMascotasByCliente,
  makeUpdateMascota,
  makeDeleteMascota,
}
