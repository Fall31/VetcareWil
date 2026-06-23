let mockData = []
let idCounter = 1

async function insertProducto(payload) {
  const record = { ...payload, id_producto: idCounter++ }
  mockData.push(record)
  return { data: [record], error: null }
}

async function listProductos(limit = 50) {
  return { data: mockData.slice(0, limit), error: null }
}

module.exports = {
  insertProducto,
  listProductos,
  __reset: () => { mockData = []; idCounter = 1 }
}
