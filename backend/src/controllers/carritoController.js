const container = require('../../container')
const { makeGetCarritoActivo, makeAgregarAlCarrito } = require('../../usecases/carritoUsecases')

const getCarritoUsecase = makeGetCarritoActivo({ carritoRepository: container.carritoRepository })
const agregarUsecase = makeAgregarAlCarrito({ carritoRepository: container.carritoRepository })

async function getCarrito(req, res) {
  try {
    const { ci_cliente } = req.params
    const result = await getCarritoUsecase({ ci_cliente })
    if (!result.success) return res.status(500).json({ error: result.error })
    res.json({ carrito: result.data || null })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo carrito' })
  }
}

async function agregarProducto(req, res) {
  try {
    const { ci_cliente, id_producto, cantidad } = req.body
    const result = await agregarUsecase({ ci_cliente, id_producto, cantidad })
    if (!result.success) return res.status(400).json({ error: result.error })
    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error agregando al carrito' })
  }
}

module.exports = {
  getCarrito,
  agregarProducto,
}
