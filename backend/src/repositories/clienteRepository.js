const { supabase } = require('../lib/supabaseClient')

/**
 * Repositorio para operaciones sobre la tabla 'cliente'.
 * Aquí se encapsula el acceso a la fuente de datos (Supabase).
 */
async function insertCliente(payload) {
  // Mapeo compatible con la lógica antigua: si viene ci_cliente como UUID
  const body = { ...payload }
  const maybe = String(body.ci_cliente || '')
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89ABab][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/
  if (maybe && uuidRegex.test(maybe)) {
    body.user_id = maybe
    if (!body.ci_cliente) {
      body.ci_cliente = maybe
    }
  }

  const { data, error } = await supabase.from('cliente').insert([body])
  return { data, error }
}

async function listClientes(limit = 100) {
  const { data, error } = await supabase.from('cliente').select('*').limit(limit)
  return { data, error }
}

module.exports = {
  insertCliente,
  listClientes,
}
