let mockData = []
let idCounter = 1

async function insertServicio(payload) {
  const record = { ...payload, id_servicio: idCounter++ }
  mockData.push(record)
  return { data: [record], error: null }
}

async function listServicios(limit = 50) {
  return { data: mockData.slice(0, limit), error: null }
}

module.exports = { insertServicio, listServicios, __reset: () => { mockData = []; idCounter = 1 } }
