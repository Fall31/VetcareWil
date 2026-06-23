const mockAdapter = require('../../src/frameworks/mockClienteAdapter')
const { makeCreateCliente, makeListClientes } = require('../../src/usecases/clienteUsecases')

beforeEach(() => {
  mockAdapter.__reset()
})

test('createCliente success', async () => {
  const create = makeCreateCliente({ clienteRepository: mockAdapter })
  const result = await create({ payload: { nombre: 'Ana', email: 'ana@ejemplo.com' } })
  expect(result.success).toBe(true)
  expect(result.data).toBeDefined()
})

test('listClientes returns created', async () => {
  const create = makeCreateCliente({ clienteRepository: mockAdapter })
  await create({ payload: { nombre: 'Ana', email: 'ana@ejemplo.com' } })
  const list = makeListClientes({ clienteRepository: mockAdapter })
  const result = await list({ limit: 10 })
  expect(result.success).toBe(true)
  expect(result.data.length).toBe(1)
})
