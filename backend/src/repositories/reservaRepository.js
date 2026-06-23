const { supabase } = require('../lib/supabaseClient')

async function insertReserva(payload) {
  const { data, error } = await supabase.from('reserva').insert([payload]).select()
  return { data, error }
}

async function listReservasByCliente(ci_cliente) {
  const { data, error } = await supabase
    .from('reserva')
    .select(`
      *,
      servicio(nombre_servicio, precio_base),
      mascota(nombre_mascota, especie)
    `)
    .eq('mascota.ci_cliente', ci_cliente)
    .order('fecha_reserva', { ascending: false })
    .limit(20)
  return { data, error }
}

module.exports = {
  insertReserva,
  listReservasByCliente,
}
