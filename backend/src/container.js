// Contenedor sencillo para inyección de dependencias
// Selecciona adaptadores en función del entorno (mock si no hay credenciales)
const hasSupabaseCreds = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY))
let clienteRepository
if (process.env.USE_MOCK === 'true' || !hasSupabaseCreds) {
  clienteRepository = require('./frameworks/mockClienteAdapter')
} else {
  clienteRepository = require('./repositories/clienteRepository')
}

let productoRepository
if (process.env.USE_MOCK === 'true' || !hasSupabaseCreds) {
  productoRepository = require('./frameworks/mockProductoAdapter')
} else {
  productoRepository = require('./repositories/productoRepository')
}

let servicioRepository
if (process.env.USE_MOCK === 'true' || !hasSupabaseCreds) {
  servicioRepository = require('./frameworks/mockServicioAdapter')
} else {
  servicioRepository = require('./repositories/servicioRepository')
}

let mascotaRepository
if (process.env.USE_MOCK === 'true' || !hasSupabaseCreds) {
  mascotaRepository = require('./frameworks/mockMascotaAdapter')
} else {
  mascotaRepository = require('./repositories/mascotaRepository')
}

let reservaRepository
if (process.env.USE_MOCK === 'true' || !hasSupabaseCreds) {
  reservaRepository = require('./frameworks/mockReservaAdapter')
} else {
  reservaRepository = require('./repositories/reservaRepository')
}

let carritoRepository
if (process.env.USE_MOCK === 'true' || !hasSupabaseCreds) {
  carritoRepository = require('./frameworks/mockCarritoAdapter')
} else {
  carritoRepository = require('./repositories/carritoRepository')
}

module.exports = {
  clienteRepository,
  productoRepository,
  servicioRepository,
  mascotaRepository,
  reservaRepository,
  carritoRepository,
}
