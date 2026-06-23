const container = require('../../container')
const { makeCreateServicio, makeListServicios } = require('../../usecases/servicioUsecases')

const createServicioUsecase = makeCreateServicio({ servicioRepository: container.servicioRepository })
const listServiciosUsecase = makeListServicios({ servicioRepository: container.servicioRepository })

async function listServicios(req, res) {
  try {
    const result = await listServiciosUsecase({ limit: 50 })
    if (!result.success) return res.status(500).json({ error: result.error })
    res.json({ servicios: result.data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo servicios' })
  }
}

async function createServicio(req, res) {
  try {
    const payload = req.body
    const result = await createServicioUsecase({ payload })
    if (!result.success) return res.status(400).json({ error: result.errors || result.error })
    res.status(201).json({ inserted: result.data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creando servicio' })
  }
}

module.exports = { listServicios, createServicio }
