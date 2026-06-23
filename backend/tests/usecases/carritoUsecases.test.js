const mockAdapter = require('../../src/frameworks/mockCarritoAdapter')
const { makeGetCarritoActivo, makeAgregarAlCarrito } = require('../../src/usecases/carritoUsecases')

beforeEach(() => mockAdapter.__reset())

test('agregarAlCarrito creates cart if not exists', async () => {
  const agregar = makeAgregarAlCarrito({ carritoRepository: mockAdapter })
  const result = await agregar({ ci_cliente: 'abc', id_producto: 'p1', cantidad: 2 })
  expect(result.success).toBe(true)
})

test('getCarritoActivo returns cart with items', async () => {
  const agregar = makeAgregarAlCarrito({ carritoRepository: mockAdapter })
  await agregar({ ci_cliente: 'abc', id_producto: 'p1', cantidad: 2 })
  const get = makeGetCarritoActivo({ carritoRepository: mockAdapter })
  const result = await get({ ci_cliente: 'abc' })
  expect(result.success).toBe(true)
  expect(result.data).toBeDefined()
})
