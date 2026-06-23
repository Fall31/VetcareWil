const Cliente = require('../entities/cliente')

function makeCreateCliente({ clienteRepository }) {
  return async function createCliente({ payload }) {
    const cliente = new Cliente(payload)
    const errors = cliente.validate()
    if (errors.length) {
      return { success: false, errors }
    }

    const { data, error } = await clienteRepository.insertCliente(payload)
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

function makeListClientes({ clienteRepository }) {
  return async function listClientes({ limit = 100 } = {}) {
    const { data, error } = await clienteRepository.listClientes(limit)
    if (error) return { success: false, error }
    return { success: true, data }
  }
}

module.exports = {
  makeCreateCliente,
  makeListClientes,
}
