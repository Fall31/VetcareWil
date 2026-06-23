const mockAdapter = require('../../src/frameworks/mockProductoAdapter')
const { makeCreateProducto, makeListProductos } = require('../../src/usecases/productoUsecases')

beforeEach(() => mockAdapter.__reset())

test('createProducto success', async () => {
  const create = makeCreateProducto({ productoRepository: mockAdapter })
  const result = await create({ payload: { nombre_producto: 'Juguete', precio: 10 } })
  expect(result.success).toBe(true)
})

test('listProductos returns created', async () => {
  const create = makeCreateProducto({ productoRepository: mockAdapter })
  await create({ payload: { nombre_producto: 'Juguete', precio: 10 } })
  const list = makeListProductos({ productoRepository: mockAdapter })
  const result = await list({ limit: 10 })
  expect(result.success).toBe(true)
  expect(result.data.length).toBe(1)
})
