const mockAdapter = require('../../src/frameworks/mockMascotaAdapter')
const { makeCreateMascota, makeListMascotasByCliente } = require('../../src/usecases/mascotaUsecases')

beforeEach(() => mockAdapter.__reset())

test('createMascota success', async () => {
  const create = makeCreateMascota({ mascotaRepository: mockAdapter })
  const result = await create({ payload: { nombre_mascota: 'Firulais', especie: 'perro', ci_cliente: 'abc123' } })
  expect(result.success).toBe(true)
})

test('listMascotasByCliente returns created', async () => {
  const create = makeCreateMascota({ mascotaRepository: mockAdapter })
  await create({ payload: { nombre_mascota: 'Firulais', especie: 'perro', ci_cliente: 'abc123' } })
  const list = makeListMascotasByCliente({ mascotaRepository: mockAdapter })
  const result = await list({ ci_cliente: 'abc123' })
  expect(result.success).toBe(true)
  expect(result.data.length).toBe(1)
})
