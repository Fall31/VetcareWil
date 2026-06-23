const { makeCreateCliente, makeListClientes } = require('../../src/usecases/clienteUsecases')
const { makeCreateProducto, makeListProductos } = require('../../src/usecases/productoUsecases')
const { makeCreateServicio, makeListServicios } = require('../../src/usecases/servicioUsecases')
const { makeCreateMascota, makeUpdateMascota, makeDeleteMascota } = require('../../src/usecases/mascotaUsecases')
const { makeCreateReserva, makeListReservasByCliente } = require('../../src/usecases/reservaUsecases')
const { makeGetCarritoActivo, makeAgregarAlCarrito } = require('../../src/usecases/carritoUsecases')

const mockCliente = require('../../src/frameworks/mockClienteAdapter')
const mockProducto = require('../../src/frameworks/mockProductoAdapter')
const mockServicio = require('../../src/frameworks/mockServicioAdapter')
const mockMascota = require('../../src/frameworks/mockMascotaAdapter')
const mockReserva = require('../../src/frameworks/mockReservaAdapter')
const mockCarrito = require('../../src/frameworks/mockCarritoAdapter')

beforeEach(() => {
  mockCliente.__reset()
  mockProducto.__reset()
  mockServicio.__reset()
  mockMascota.__reset()
  mockReserva.__reset()
  mockCarrito.__reset()
})

describe('Integración de usecases con repositorios mock', () => {
  test('createCliente crea cliente exitosamente', async () => {
    const createCliente = makeCreateCliente({ clienteRepository: mockCliente })
    const result = await createCliente({ payload: { nombre: 'Rosa', email: 'rosa@vet.com' } })
    expect(result.success).toBe(true)
    expect(result.data[0].nombre).toBe('Rosa')
  })

  test('createCliente retorna error de validación cuando faltan datos', async () => {
    const createCliente = makeCreateCliente({ clienteRepository: mockCliente })
    const result = await createCliente({ payload: { email: 'sin-nombre@vet.com' } })
    expect(result.success).toBe(false)
    expect(result.errors).toContain('nombre es requerido')
  })

  test('listClientes devuelve clientes creados', async () => {
    const createCliente = makeCreateCliente({ clienteRepository: mockCliente })
    const listClientes = makeListClientes({ clienteRepository: mockCliente })
    await createCliente({ payload: { nombre: 'Mia', email: 'mia@vet.com' } })
    const result = await listClientes({})
    expect(result.success).toBe(true)
    expect(result.data.length).toBe(1)
  })

  test('createProducto crea producto con precio válido', async () => {
    const createProducto = makeCreateProducto({ productoRepository: mockProducto })
    const result = await createProducto({ payload: { nombre_producto: 'Collar', precio: 15 } })
    expect(result.success).toBe(true)
    expect(result.data[0].nombre_producto).toBe('Collar')
  })

  test('createProducto retorna error de validación con precio inválido', async () => {
    const createProducto = makeCreateProducto({ productoRepository: mockProducto })
    const result = await createProducto({ payload: { nombre_producto: 'Arena', precio: 'barato' } })
    expect(result.success).toBe(false)
    expect(result.errors).toContain('precio inválido')
  })

  test('listProductos devuelve productos creados', async () => {
    const createProducto = makeCreateProducto({ productoRepository: mockProducto })
    const listProductos = makeListProductos({ productoRepository: mockProducto })
    await createProducto({ payload: { nombre_producto: 'Juguete', precio: 30 } })
    const result = await listProductos({})
    expect(result.success).toBe(true)
    expect(result.data.length).toBe(1)
  })

  test('createServicio crea servicio exitosamente', async () => {
    const createServicio = makeCreateServicio({ servicioRepository: mockServicio })
    const result = await createServicio({ payload: { nombre_servicio: 'Baño', precio_base: 25 } })
    expect(result.success).toBe(true)
    expect(result.data[0].nombre_servicio).toBe('Baño')
  })

  test('createServicio retorna error con servicio sin nombre', async () => {
    const createServicio = makeCreateServicio({ servicioRepository: mockServicio })
    const result = await createServicio({ payload: { precio_base: 25 } })
    expect(result.success).toBe(false)
    expect(result.errors).toContain('nombre_servicio es requerido')
  })

  test('listServicios devuelve servicios existentes', async () => {
    const createServicio = makeCreateServicio({ servicioRepository: mockServicio })
    const listServicios = makeListServicios({ servicioRepository: mockServicio })
    await createServicio({ payload: { nombre_servicio: 'Consulta', precio_base: 40 } })
    const result = await listServicios({})
    expect(result.success).toBe(true)
    expect(result.data.length).toBe(1)
  })

  test('createMascota crea mascota correctamente', async () => {
    const createMascota = makeCreateMascota({ mascotaRepository: mockMascota })
    const result = await createMascota({ payload: { ci_cliente: 'C001', nombre_mascota: 'Luna', especie: 'Gato' } })
    expect(result.success).toBe(true)
    expect(result.data[0].nombre_mascota).toBe('Luna')
  })

  test('updateMascota modifica los datos de mascota existente', async () => {
    const createMascota = makeCreateMascota({ mascotaRepository: mockMascota })
    const updateMascota = makeUpdateMascota({ mascotaRepository: mockMascota })
    const createResult = await createMascota({ payload: { ci_cliente: 'C001', nombre_mascota: 'Rex', especie: 'Perro' } })
    const ci_mascota = createResult.data[0].ci_mascota
    const updateResult = await updateMascota({ ci_mascota, updates: { nombre_mascota: 'Rexito' } })
    expect(updateResult.success).toBe(true)
    expect(updateResult.data[0].nombre_mascota).toBe('Rexito')
  })

  test('deleteMascota elimina mascota correctamente', async () => {
    const createMascota = makeCreateMascota({ mascotaRepository: mockMascota })
    const deleteMascota = makeDeleteMascota({ mascotaRepository: mockMascota })
    const createResult = await createMascota({ payload: { ci_cliente: 'C002', nombre_mascota: 'Peca', especie: 'Perro' } })
    const ci_mascota = createResult.data[0].ci_mascota
    const deleteResult = await deleteMascota({ ci_mascota })
    expect(deleteResult.success).toBe(true)
  })

  test('createReserva guarda la reserva y retorna datos', async () => {
    const createReserva = makeCreateReserva({ reservaRepository: mockReserva })
    const result = await createReserva({ payload: { ci_mascota: 'M012', id_servicio: 'S005', fecha_reserva: '2026-06-10' } })
    expect(result.success).toBe(true)
    expect(result.data[0].ci_mascota).toBe('M012')
  })

  test('listReservasByCliente devuelve reservas creadas', async () => {
    const createReserva = makeCreateReserva({ reservaRepository: mockReserva })
    const listReservas = makeListReservasByCliente({ reservaRepository: mockReserva })
    await createReserva({ payload: { ci_mascota: 'M014', id_servicio: 'S007', fecha_reserva: '2026-06-11' } })
    const result = await listReservas({ ci_cliente: 'C009' })
    expect(result.success).toBe(true)
    expect(result.data.length).toBe(1)
  })

  test('agregarAlCarrito crea carrito y getCarritoActivo lo devuelve', async () => {
    const agregar = makeAgregarAlCarrito({ carritoRepository: mockCarrito })
    const getCarrito = makeGetCarritoActivo({ carritoRepository: mockCarrito })
    const agregarResult = await agregar({ ci_cliente: 'C003', id_producto: 'P01', cantidad: 2 })
    expect(agregarResult.success).toBe(true)
    const carritoResult = await getCarrito({ ci_cliente: 'C003' })
    expect(carritoResult.success).toBe(true)
    expect(carritoResult.data.detalle_carrito.length).toBe(1)
  })
})
