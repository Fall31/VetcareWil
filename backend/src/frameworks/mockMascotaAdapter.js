let mockData = []
let idCounter = 1

async function insertMascota(payload) {
  const record = { ...payload, ci_mascota: payload.ci_mascota || `mock-${idCounter++}` }
  mockData.push(record)
  return { data: [record], error: null }
}

async function listMascotasByCliente(ci_cliente) {
  const filtered = mockData.filter(m => m.ci_cliente === ci_cliente)
  return { data: filtered, error: null }
}

async function updateMascota(ci_mascota, updates) {
  const idx = mockData.findIndex(m => m.ci_mascota === ci_mascota)
  if (idx === -1) return { data: null, error: { message: 'Not found' } }
  mockData[idx] = { ...mockData[idx], ...updates }
  return { data: [mockData[idx]], error: null }
}

async function deleteMascota(ci_mascota) {
  const idx = mockData.findIndex(m => m.ci_mascota === ci_mascota)
  if (idx === -1) return { error: { message: 'Not found' } }
  mockData.splice(idx, 1)
  return { error: null }
}

module.exports = {
  insertMascota,
  listMascotasByCliente,
  updateMascota,
  deleteMascota,
  __reset: () => { mockData = []; idCounter = 1 }
}
