const container = require('../../container')
const { makeCreateProducto, makeListProductos } = require('../../usecases/productoUsecases')

const createProductoUsecase = makeCreateProducto({ productoRepository: container.productoRepository })
const listProductosUsecase = makeListProductos({ productoRepository: container.productoRepository })

async function listProductos(req, res) {
  try {
    const result = await listProductosUsecase({ limit: 50 })
    if (!result.success) return res.status(500).json({ error: result.error })
    res.json({ productos: result.data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo productos' })
  }
}

async function createProducto(req, res) {
  try {
    const payload = req.body
    const result = await createProductoUsecase({ payload })
    if (!result.success) return res.status(400).json({ error: result.errors || result.error })
    res.status(201).json({ inserted: result.data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creando producto' })
  }
}

module.exports = { listProductos, createProducto }
