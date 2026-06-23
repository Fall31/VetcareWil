const Producto = require('../entities/producto')

function makeCreateProducto({ productoRepository }) {
  return async function createProducto({ payload }) {
    const producto = new Producto(payload)
    const errors = producto.validate()
    if (errors.length) return { success: false, errors }

    const { data, error } = await productoRepository.insertProducto(payload)
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

function makeListProductos({ productoRepository }) {
  return async function listProductos({ limit = 50 } = {}) {
    const { data, error } = await productoRepository.listProductos(limit)
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

module.exports = {
  makeCreateProducto,
  makeListProductos,
}
