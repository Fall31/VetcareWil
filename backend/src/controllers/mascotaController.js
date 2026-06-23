const container = require('../../container')
const {
  makeCreateMascota,
  makeListMascotasByCliente,
  makeUpdateMascota,
  makeDeleteMascota,
} = require('../../usecases/mascotaUsecases')

const createMascotaUsecase = makeCreateMascota({ mascotaRepository: container.mascotaRepository })
const listMascotasUsecase = makeListMascotasByCliente({ mascotaRepository: container.mascotaRepository })
const updateMascotaUsecase = makeUpdateMascota({ mascotaRepository: container.mascotaRepository })
const deleteMascotaUsecase = makeDeleteMascota({ mascotaRepository: container.mascotaRepository })

async function getMascotasByUserId(req, res) {
  try {
    const { userId } = req.params
    const result = await listMascotasUsecase({ ci_cliente: userId })
    if (!result.success) return res.status(500).json({ error: result.error })
    res.json({ mascotas: result.data || [] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo mascotas' })
  }
}

async function createMascota(req, res) {
  try {
    const payload = req.body
    const result = await createMascotaUsecase({ payload })
    if (!result.success) return res.status(400).json({ error: result.errors || result.error })
    res.status(201).json({ success: true, mascota: result.data[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error registrando mascota' })
  }
}

async function updateMascota(req, res) {
  try {
    const { ci_mascota } = req.params
    const updates = req.body
    const result = await updateMascotaUsecase({ ci_mascota, updates })
    if (!result.success) return res.status(400).json({ error: result.error })
    res.json({ success: true, data: result.data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error actualizando mascota' })
  }
}

async function deleteMascota(req, res) {
  try {
    const { ci_mascota } = req.params
    const result = await deleteMascotaUsecase({ ci_mascota })
    if (!result.success) return res.status(400).json({ error: result.error })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error eliminando mascota' })
  }
}

module.exports = {
  getMascotasByUserId,
  createMascota,
  updateMascota,
  deleteMascota,
}
