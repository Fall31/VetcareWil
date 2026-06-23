let mockData = []
let idCounter = 1

async function insertReserva(payload) {
  const record = { ...payload, id_reserva: idCounter++, estado_reserva: payload.estado_reserva || 'pendiente' }
  mockData.push(record)
  return { data: [record], error: null }
}

async function listReservasByCliente(ci_cliente) {
  // en mock: devolver todas las reservas (sin filtro real por ahora)
  return { data: mockData, error: null }
}

module.exports = {
  insertReserva,
  listReservasByCliente,
  __reset: () => { mockData = []; idCounter = 1 }
}
