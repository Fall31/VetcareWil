const { supabase } = require('../lib/supabaseClient')

async function listProductos(limit = 50) {
  const { data, error } = await supabase.from('producto').select('*').limit(limit)
  return { data, error }
}

async function insertProducto(payload) {
  const { data, error } = await supabase.from('producto').insert([payload]).select()
  return { data, error }
}

module.exports = {
  listProductos,
  insertProducto,
}
