const container = require('../../container')
const { makeCreateReserva, makeListReservasByCliente } = require('../../usecases/reservaUsecases')

const createReservaUsecase = makeCreateReserva({ reservaRepository: container.reservaRepository })
const listReservasUsecase = makeListReservasByCliente({ reservaRepository: container.reservaRepository })

async function getReservasByCliente(req, res) {
  try {
    const { ci_cliente } = req.params
    const result = await listReservasUsecase({ ci_cliente })
    if (!result.success) return res.status(500).json({ error: result.error })
    res.json({ reservas: result.data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo reservas' })
  }
}

async function createReserva(req, res) {
  try {
    const payload = req.body
    const result = await createReservaUsecase({ payload })
    if (!result.success) return res.status(400).json({ error: result.errors || result.error })
    res.json({ success: true, reserva: result.data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creando reserva' })
  }
}

module.exports = {
  getReservasByCliente,
  createReserva,
}
