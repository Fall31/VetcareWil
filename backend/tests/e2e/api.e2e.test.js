process.env.USE_MOCK = 'true'
const request = require('supertest')
const app = require('../../server')

const mockCliente = require('../../src/frameworks/mockClienteAdapter')
const mockProducto = require('../../src/frameworks/mockProductoAdapter')
const mockServicio = require('../../src/frameworks/mockServicioAdapter')
const mockMascota = require('../../src/frameworks/mockMascotaAdapter')
const mockCarrito = require('../../src/frameworks/mockCarritoAdapter')

beforeEach(() => {
  mockCliente.__reset()
  mockProducto.__reset()
  mockServicio.__reset()
  mockMascota.__reset()
  mockCarrito.__reset()
})

describe('E2E de API backend usando express + mocks', () => {
  test('GET / devuelve el mensaje de servidor funcionando', async () => {
    const res = await request(app).get('/')
    expect(res.status).toBe(200)
    expect(res.text).toContain('Servidor backend funcionando')
  })

  test('GET /api/saludo devuelve JSON con mensaje', async () => {
    const res = await request(app).get('/api/saludo')
    expect(res.status).toBe(200)
    expect(res.body.mensaje).toBe('Hola desde el backend de JavaScript')
  })

  test('POST /api/cliente sin body retorna 400', async () => {
    const res = await request(app).post('/api/cliente').send({})
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/Body vacío/i)
  })

  test('POST /api/cliente crea un cliente correctamente', async () => {
    const res = await request(app).post('/api/cliente').send({ nombre: 'Carla', email: 'carla@vet.com' })
    expect(res.status).toBe(201)
    expect(res.body.inserted[0].nombre).toBe('Carla')
  })

  test('GET /api/cliente devuelve lista de clientes', async () => {
    await request(app).post('/api/cliente').send({ nombre: 'Ana', email: 'ana@vet.com' })
    const res = await request(app).get('/api/cliente')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.clientes)).toBe(true)
    expect(res.body.clientes.length).toBeGreaterThanOrEqual(1)
  })

  test('POST /api/productos crea producto y responde 201', async () => {
    const res = await request(app).post('/api/productos').send({ nombre_producto: 'Cama', precio: 120 })
    expect(res.status).toBe(201)
    expect(res.body.inserted[0].nombre_producto).toBe('Cama')
  })

  test('GET /api/productos devuelve productos creados', async () => {
    await request(app).post('/api/productos').send({ nombre_producto: 'Arena', precio: 35 })
    const res = await request(app).get('/api/productos')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.productos)).toBe(true)
  })

  test('POST /api/servicios crea servicio y responde 201', async () => {
    const res = await request(app).post('/api/servicios').send({ nombre_servicio: 'Vacunación', precio_base: 50 })
    expect(res.status).toBe(201)
    expect(res.body.inserted[0].nombre_servicio).toBe('Vacunación')
  })

  test('GET /api/servicios devuelve servicios existentes', async () => {
    await request(app).post('/api/servicios').send({ nombre_servicio: 'Consulta', precio_base: 45 })
    const res = await request(app).get('/api/servicios')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.servicios)).toBe(true)
  })

  test('POST /api/mascotas crea mascota y responde con success', async () => {
    const res = await request(app).post('/api/mascotas').send({ ci_cliente: 'C100', nombre_mascota: 'Loki', especie: 'Perro' })
    expect(res.status).toBe(201)
    expect(res.body.success).toBe(true)
    expect(res.body.mascota.nombre_mascota).toBe('Loki')
  })

  test('GET /api/mascotas/:userId devuelve mascota creada para cliente', async () => {
    await request(app).post('/api/mascotas').send({ ci_cliente: 'C110', nombre_mascota: 'Nala', especie: 'Gato' })
    const res = await request(app).get('/api/mascotas/C110')
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.mascotas)).toBe(true)
    expect(res.body.mascotas[0].nombre_mascota).toBe('Nala')
  })

  test('PUT /api/mascotas/:ci_mascota actualiza mascota existente', async () => {
    const createRes = await request(app).post('/api/mascotas').send({ ci_cliente: 'C120', nombre_mascota: 'Oso', especie: 'Perro' })
    const ci_mascota = createRes.body.mascota.ci_mascota
    const res = await request(app).put(`/api/mascotas/${ci_mascota}`).send({ nombre_mascota: 'Osito' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data[0].nombre_mascota).toBe('Osito')
  })

  test('DELETE /api/mascotas/:ci_mascota elimina mascota', async () => {
    const createRes = await request(app).post('/api/mascotas').send({ ci_cliente: 'C130', nombre_mascota: 'Lily', especie: 'Gato' })
    const ci_mascota = createRes.body.mascota.ci_mascota
    const res = await request(app).delete(`/api/mascotas/${ci_mascota}`)
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  test('POST /api/carrito/agregar agrega producto y responde success', async () => {
    const res = await request(app).post('/api/carrito/agregar').send({ ci_cliente: 'C140', id_producto: 'P140', cantidad: 2 })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  test('GET /api/carrito/:ci_cliente devuelve carrito con productos', async () => {
    await request(app).post('/api/carrito/agregar').send({ ci_cliente: 'C150', id_producto: 'P150', cantidad: 1 })
    const res = await request(app).get('/api/carrito/C150')
    expect(res.status).toBe(200)
    expect(res.body.carrito).toBeDefined()
    expect(res.body.carrito.detalle_carrito.length).toBe(1)
  })
})
