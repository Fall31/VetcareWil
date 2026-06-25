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

async function createCarritoActivo(ci_cliente) {
  const now = new Date().toISOString()
  const { data: nuevoCarrito, error } = await supabase
    .from('carrito')
    .insert([{ ci_cliente, estado: 'activo', total: 0, fecha_creacion: now }])
    .select()
    .single()
  return { data: nuevoCarrito, error }
}

async function updateCarritoTotal(id_carrito) {
  const { data, error } = await supabase
    .from('detalle_carrito')
    .select('cantidad, precio_unitario')
    .eq('id_carrito', id_carrito)

  if (error) return { error }

  const total = (data || []).reduce(
    (sum, item) => sum + ((item.cantidad || 0) * (item.precio_unitario || 0)),
    0
  )

  const { error: updateError } = await supabase
    .from('carrito')
    .update({ total })
    .eq('id_carrito', id_carrito)

  return { total, error: updateError || null }
}

async function vaciarCarritoActivo(ci_cliente) {
  const { data: carrito, error: carritoError } = await supabase
    .from('carrito')
    .select('*')
    .eq('ci_cliente', ci_cliente)
    .eq('estado', 'activo')
    .maybeSingle()

  if (carritoError) {
    return { data: null, error: carritoError }
  }

  if (!carrito) {
    return { data: null, error: null }
  }

  const { error: deleteDetailsError } = await supabase
    .from('detalle_carrito')
    .delete()
    .eq('id_carrito', carrito.id_carrito)

  if (deleteDetailsError) {
    return { data: null, error: deleteDetailsError }
  }

  const { error: deleteCarritoError } = await supabase
    .from('carrito')
    .delete()
    .eq('id_carrito', carrito.id_carrito)

  if (deleteCarritoError) {
    return { data: null, error: deleteCarritoError }
  }

  return { data: null, error: null }
}

async function agregarProducto({ ci_cliente, id_producto, cantidad }) {
  // Buscar carrito activo
  let { data: carrito, error } = await supabase
    .from('carrito')
    .select('*')
    .eq('ci_cliente', ci_cliente)
    .eq('estado', 'activo')
    .single()

  if (error && error.code !== 'PGRST116') {
    return { data: null, error }
  }

  if (!carrito) {
    const result = await createCarritoActivo(ci_cliente)
    if (result.error) return { data: null, error: result.error }
    carrito = result.data
  }

  // Obtener precio del producto
  const { data: producto, error: productoError } = await supabase
    .from('producto')
    .select('precio')
    .eq('id_producto', id_producto)
    .single()

  if (productoError) return { data: null, error: productoError }

  // Verificar si ya existe detalle
  const { data: existing, error: existingError } = await supabase
    .from('detalle_carrito')
    .select('*')
    .eq('id_carrito', carrito.id_carrito)
    .eq('id_producto', id_producto)
    .maybeSingle()

  if (existingError) return { data: null, error: existingError }

  let detalleResult
  if (existing) {
    const { data: updatedDetalle, error: updateError } = await supabase
      .from('detalle_carrito')
      .update({ cantidad: existing.cantidad + cantidad })
      .eq('id_detalle_carrito', existing.id_detalle_carrito)
      .select()

    if (updateError) return { data: null, error: updateError }
    detalleResult = updatedDetalle[0]
  } else {
    const { data: newDetalle, error: errorDetalle } = await supabase
      .from('detalle_carrito')
      .insert([{
        id_carrito: carrito.id_carrito,
        id_producto,
        cantidad,
        precio_unitario: producto?.precio || 0
      }])
      .select()

    if (errorDetalle) return { data: null, error: errorDetalle }
    detalleResult = newDetalle[0]
  }

  const totalResult = await updateCarritoTotal(carrito.id_carrito)
  if (totalResult.error) return { data: detalleResult, error: totalResult.error }

  return { data: detalleResult, error: null }
}

module.exports = {
  getCarritoActivo,
  agregarProducto,
  vaciarCarritoActivo,
}
