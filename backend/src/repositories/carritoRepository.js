const { supabase } = require('../lib/supabaseClient')

async function getCarritoActivo(ci_cliente) {
  const { data, error } = await supabase
    .from('carrito')
    .select(`
      *,
      detalle_carrito(
        *,
        producto(nombre_producto, precio, imagen)
      )
    `)
    .eq('ci_cliente', ci_cliente)
    .eq('estado', 'activo')
  return { data: data && data[0] ? data[0] : null, error }
}

async function agregarProducto({ ci_cliente, id_producto, cantidad }) {
  // Buscar carrito activo
  let { data: carrito, error } = await supabase
    .from('carrito')
    .select('*')
    .eq('ci_cliente', ci_cliente)
    .eq('estado', 'activo')
    .single()

  if (!carrito) {
    const { data: nuevoCarrito, error: errorCarrito } = await supabase
      .from('carrito')
      .insert([{ ci_cliente, estado: 'activo' }])
      .select()
      .single()
    if (errorCarrito) return { data: null, error: errorCarrito }
    carrito = nuevoCarrito
  }

  // Obtener precio del producto
  const { data: producto } = await supabase
    .from('producto')
    .select('precio')
    .eq('id_producto', id_producto)
    .single()

  // Insertar detalle
  const { data, error: errorDetalle } = await supabase
    .from('detalle_carrito')
    .insert([{
      id_carrito: carrito.id_carrito,
      id_producto,
      cantidad,
      precio_unitario: producto?.precio || 0
    }])

  if (errorDetalle) return { data: null, error: errorDetalle }
  return { data, error: null }
}

module.exports = {
  getCarritoActivo,
  agregarProducto,
}
