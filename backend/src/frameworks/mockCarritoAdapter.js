let mockCarritos = []
let mockDetalles = []
let idCarrito = 1
let idDetalle = 1

async function getCarritoActivo(ci_cliente) {
  const carrito = mockCarritos.find(c => c.ci_cliente === ci_cliente && c.estado === 'activo')
  if (!carrito) return { data: null, error: null }
  const detalles = mockDetalles.filter(d => d.id_carrito === carrito.id_carrito)
  return { data: { ...carrito, detalle_carrito: detalles }, error: null }
}

async function agregarProducto({ ci_cliente, id_producto, cantidad }) {
  let carrito = mockCarritos.find(c => c.ci_cliente === ci_cliente && c.estado === 'activo')
  if (!carrito) {
    carrito = { id_carrito: idCarrito++, ci_cliente, estado: 'activo' }
    mockCarritos.push(carrito)
  }
  const detalle = { id_detalle: idDetalle++, id_carrito: carrito.id_carrito, id_producto, cantidad, precio_unitario: 10 }
  mockDetalles.push(detalle)
  return { data: detalle, error: null }
}

module.exports = {
  getCarritoActivo,
  agregarProducto,
  __reset: () => { mockCarritos = []; mockDetalles = []; idCarrito = 1; idDetalle = 1 }
}
