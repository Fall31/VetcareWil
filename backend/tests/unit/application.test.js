const Cliente = require('../../src/entities/cliente')
const Producto = require('../../src/entities/producto')
const Servicio = require('../../src/entities/servicio')
const Mascota = require('../../src/entities/mascota')
const Reserva = require('../../src/entities/reserva')
const Carrito = require('../../src/entities/carrito')

const {
  makeCreateCliente,
  makeListClientes,
} = require('../../src/usecases/clienteUsecases')
const {
  makeCreateProducto,
  makeListProductos,
} = require('../../src/usecases/productoUsecases')
const {
  makeCreateServicio,
  makeListServicios,
} = require('../../src/usecases/servicioUsecases')
const {
  makeCreateMascota,
  makeUpdateMascota,
  makeDeleteMascota,
} = require('../../src/usecases/mascotaUsecases')
const {
  makeCreateReserva,
  makeListReservasByCliente,
} = require('../../src/usecases/reservaUsecases')

describe('Entidades y validaciones', () => {
  test('Producto sin precio devuelve error de precio inválido', () => {
    const producto = new Producto({ nombre_producto: 'Juguete' })
    expect(producto.validate()).toContain('precio inválido')
  })

  test('Producto sin nombre y sin precio devuelve ambos errores', () => {
    const producto = new Producto({})
    const errores = producto.validate()
    expect(errores).toContain('nombre_producto es requerido')
    expect(errores).toContain('precio inválido')
  })

  test('Servicio válido no devuelve errores y estado activo por defecto', () => {
    const servicio = new Servicio({ nombre_servicio: 'Consulta', precio_base: 120 })
    expect(servicio.validate()).toEqual([])
    expect(servicio.estado_servicio).toBe('activo')
  })

  test('Reserva válido no devuelve errores y valores por defecto', () => {
    const reserva = new Reserva({ ci_mascota: 'M001', id_servicio: 'S001', fecha_reserva: '2026-06-01' })
    expect(reserva.validate()).toEqual([])
    expect(reserva.estado_reserva).toBe('pendiente')
    expect(reserva.tipo_reserva).toBe('cita')
  })

  test('Carrito con ci_cliente válido no devuelve errores y su estado por defecto es activo', () => {
    const carrito = new Carrito({ ci_cliente: 'C001' })
    expect(carrito.validate()).toEqual([])
    expect(carrito.estado).toBe('activo')
  })

  test('Cliente creado sin ci_cliente deja ci_cliente en null', () => {
    const cliente = new Cliente({ nombre: 'Luis', email: 'luis@dominio.com' })
    expect(cliente.ci_cliente).toBeNull()
    expect(cliente.validate()).toEqual([])
  })
})

describe('Usecases de cliente', () => {
  test('makeCreateCliente devuelve error de validación cuando payload incompleto', async () => {
    const createCliente = makeCreateCliente({ clienteRepository: { insertCliente: jest.fn() } })
    const result = await createCliente({ payload: { nombre: '' } })
    expect(result.success).toBe(false)
    expect(result.errors).toContain('nombre es requerido')
    expect(result.errors).toContain('email es requerido')
  })

  test('makeCreateCliente devuelve error cuando repository falla', async () => {
    const createCliente = makeCreateCliente({ clienteRepository: { insertCliente: async () => ({ error: 'DB error' }) } })
    const result = await createCliente({ payload: { nombre: 'Ana', email: 'ana@ejemplo.com' } })
    expect(result.success).toBe(false)
    expect(result.error).toBe('DB error')
  })

  test('makeListClientes devuelve error cuando el repository falla', async () => {
    const listClientes = makeListClientes({ clienteRepository: { listClientes: async () => ({ error: 'list error' }) } })
    const result = await listClientes({})
    expect(result.success).toBe(false)
    expect(result.error).toBe('list error')
  })
})

describe('Usecases de producto', () => {
  test('makeCreateProducto devuelve error de validación cuando precio inválido', async () => {
    const createProducto = makeCreateProducto({ productoRepository: { insertProducto: jest.fn() } })
    const result = await createProducto({ payload: { nombre_producto: 'Arena', precio: 'barato' } })
    expect(result.success).toBe(false)
    expect(result.errors).toContain('precio inválido')
  })

  test('makeListProductos devuelve error cuando el repository falla', async () => {
    const listProductos = makeListProductos({ productoRepository: { listProductos: async () => ({ error: 'repo failure' }) } })
    const result = await listProductos({})
    expect(result.success).toBe(false)
    expect(result.error).toBe('repo failure')
  })
})

describe('Usecases de mascota', () => {
  test('makeCreateMascota devuelve error cuando falta ci_cliente', async () => {
    const createMascota = makeCreateMascota({ mascotaRepository: { insertMascota: jest.fn() } })
    const result = await createMascota({ payload: { nombre_mascota: 'Firulais', especie: 'Perro' } })
    expect(result.success).toBe(false)
    expect(result.errors).toContain('ci_cliente es requerido')
  })

  test('makeUpdateMascota retorna éxito con datos del repository', async () => {
    const expected = { ci_mascota: 'M001', nombre_mascota: 'Luna' }
    const updateMascota = makeUpdateMascota({ mascotaRepository: { updateMascota: async () => ({ data: expected }) } })
    const result = await updateMascota({ ci_mascota: 'M001', updates: { nombre_mascota: 'Luna' } })
    expect(result.success).toBe(true)
    expect(result.data).toEqual(expected)
  })

  test('makeDeleteMascota retorna éxito cuando repository no falla', async () => {
    const deleteMascota = makeDeleteMascota({ mascotaRepository: { deleteMascota: async () => ({}) } })
    const result = await deleteMascota({ ci_mascota: 'M001' })
    expect(result.success).toBe(true)
  })
})

describe('Usecases de reserva', () => {
  test('makeCreateReserva devuelve error cuando falta id_servicio', async () => {
    const createReserva = makeCreateReserva({ reservaRepository: { insertReserva: jest.fn() } })
    const result = await createReserva({ payload: { ci_mascota: 'M001', fecha_reserva: '2026-06-01' } })
    expect(result.success).toBe(false)
    expect(result.errors).toContain('id_servicio es requerido')
  })

  test('makeListReservasByCliente devuelve error cuando el repository falla', async () => {
    const listReservas = makeListReservasByCliente({ reservaRepository: { listReservasByCliente: async () => ({ error: 'repo fail' }) } })
    const result = await listReservas({ ci_cliente: 'C001' })
    expect(result.success).toBe(false)
    expect(result.error).toBe('repo fail')
  })
})
