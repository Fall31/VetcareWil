const { supabase } = require('../lib/supabaseClient')

async function insertMascota(payload) {
  const { data, error } = await supabase.from('mascota').insert([payload]).select()
  return { data, error }
}

async function listMascotasByCliente(ci_cliente) {
  const { data, error } = await supabase.from('mascota').select('*').eq('ci_cliente', ci_cliente)
  return { data, error }
}

async function updateMascota(ci_mascota, updates) {
  const { data, error } = await supabase.from('mascota').update(updates).eq('ci_mascota', ci_mascota).select()
  return { data, error }
}

async function deleteMascota(ci_mascota) {
  const { error } = await supabase.from('mascota').delete().eq('ci_mascota', ci_mascota)
  return { error }
}

module.exports = {
  insertMascota,
  listMascotasByCliente,
  updateMascota,
  deleteMascota,
}
