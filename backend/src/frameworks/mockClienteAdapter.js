let mockData = []
let idCounter = 1

async function insertCliente(payload) {
  const record = { ...payload, id: idCounter++ }
  mockData.push(record)
  return { data: [record], error: null }
}

async function listClientes(limit = 100) {
  return { data: mockData.slice(0, limit), error: null }
}

module.exports = {
  insertCliente,
  listClientes,
  // helpers for tests
  __reset: () => { mockData = []; idCounter = 1 },
}
