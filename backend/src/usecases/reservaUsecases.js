const Reserva = require('../entities/reserva')

function makeCreateReserva({ reservaRepository }) {
  return async function createReserva({ payload }) {
    const reserva = new Reserva(payload)
    const errors = reserva.validate()
    if (errors.length) return { success: false, errors }

    const { data, error } = await reservaRepository.insertReserva(payload)
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

function makeListReservasByCliente({ reservaRepository }) {
  return async function listReservasByCliente({ ci_cliente }) {
    const { data, error } = await reservaRepository.listReservasByCliente(ci_cliente)
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

module.exports = {
  makeCreateReserva,
  makeListReservasByCliente,
}
