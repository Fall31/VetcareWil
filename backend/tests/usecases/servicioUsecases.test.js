const mockAdapter = require('../../src/frameworks/mockServicioAdapter')
const { makeCreateServicio, makeListServicios } = require('../../src/usecases/servicioUsecases')

beforeEach(() => mockAdapter.__reset())

test('createServicio success', async () => {
  const create = makeCreateServicio({ servicioRepository: mockAdapter })
  const result = await create({ payload: { nombre_servicio: 'Consulta', precio_base: 20 } })
  expect(result.success).toBe(true)
})

test('listServicios returns created', async () => {
  const create = makeCreateServicio({ servicioRepository: mockAdapter })
  await create({ payload: { nombre_servicio: 'Consulta', precio_base: 20 } })
  const list = makeListServicios({ servicioRepository: mockAdapter })
  const result = await list({ limit: 10 })
  expect(result.success).toBe(true)
  expect(result.data.length).toBe(1)
})
