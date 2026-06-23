const { supabase } = require('../lib/supabaseClient')

async function listServicios(limit = 50) {
  const { data, error } = await supabase.from('servicio').select('*').limit(limit)
  return { data, error }
}

async function insertServicio(payload) {
  const { data, error } = await supabase.from('servicio').insert([payload]).select()
  return { data, error }
}

module.exports = { listServicios, insertServicio }
