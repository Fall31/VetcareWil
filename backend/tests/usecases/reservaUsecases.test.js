const mockAdapter = require('../../src/frameworks/mockReservaAdapter')
const { makeCreateReserva, makeListReservasByCliente } = require('../../src/usecases/reservaUsecases')

beforeEach(() => mockAdapter.__reset())

test('createReserva success', async () => {
  const create = makeCreateReserva({ reservaRepository: mockAdapter })
  const result = await create({ payload: { ci_mascota: 'm1', id_servicio: 's1', fecha_reserva: '2025-10-25' } })
  expect(result.success).toBe(true)
})

test('listReservasByCliente returns created', async () => {
  const create = makeCreateReserva({ reservaRepository: mockAdapter })
  await create({ payload: { ci_mascota: 'm1', id_servicio: 's1', fecha_reserva: '2025-10-25' } })
  const list = makeListReservasByCliente({ reservaRepository: mockAdapter })
  const result = await list({ ci_cliente: 'abc' })
  expect(result.success).toBe(true)
  expect(result.data.length).toBe(1)
})
