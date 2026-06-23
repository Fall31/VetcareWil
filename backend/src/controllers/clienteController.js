const container = require('../../container')
const { makeCreateCliente, makeListClientes } = require('../../usecases/clienteUsecases')

const createClienteUsecase = makeCreateCliente({ clienteRepository: container.clienteRepository })
const listClientesUsecase = makeListClientes({ clienteRepository: container.clienteRepository })

async function createCliente(req, res) {
  try {
    const payload = req.body
    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({ error: 'Body vacío. Enviar los datos a insertar.' })
    }

    const result = await createClienteUsecase({ payload })
    if (!result.success) {
      return res.status(400).json({ error: result.errors || result.error })
    }
    res.status(201).json({ inserted: result.data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno' })
  }
}

async function getClientes(req, res) {
  try {
    const result = await listClientesUsecase({ limit: 100 })
    if (!result.success) return res.status(500).json({ error: result.error })
    res.json({ clientes: result.data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno' })
  }
}

module.exports = {
  createCliente,
  getClientes,
}
