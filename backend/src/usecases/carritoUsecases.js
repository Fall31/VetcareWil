const Carrito = require('../entities/carrito')

function makeGetCarritoActivo({ carritoRepository }) {
  return async function getCarritoActivo({ ci_cliente }) {
    const { data, error } = await carritoRepository.getCarritoActivo(ci_cliente)
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

function makeAgregarAlCarrito({ carritoRepository }) {
  return async function agregarAlCarrito({ ci_cliente, id_producto, cantidad }) {
    const { data, error } = await carritoRepository.agregarProducto({ ci_cliente, id_producto, cantidad })
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

module.exports = {
  makeGetCarritoActivo,
  makeAgregarAlCarrito,
}
