/**
 * 🗄️ Servicios de Supabase - CORREGIDOS para estructura real de BD
 * Todos los nombres de tablas en lowercase según PostgreSQL
 */

import { supabase } from '../../lib/supabaseClient'

/**
 * 🐕 MASCOTAS SERVICE
 */
export const mascotasSupabase = {
  // Obtener todas las mascotas de un cliente
  async getByCliente(ci_cliente) {
    const { data, error } = await supabase
      .from('mascota')
      .select('*')
      .eq('ci_cliente', ci_cliente)
    
    if (error) throw error
    return data
  },

  // Obtener todas las mascotas
  async getAll() {
    const { data, error } = await supabase
      .from('mascota')
      .select('*')
      .order('nombre_mascota', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Obtener una mascota por ID
  async getById(ci_mascota) {
    const { data, error } = await supabase
      .from('mascota')
      .select('*')
      .eq('ci_mascota', ci_mascota)
      .single()
    
    if (error) throw error
    return data
  },

  // Crear nueva mascota
  async create(mascota) {
    const { data, error } = await supabase
      .from('mascota')
      .insert([mascota])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Actualizar mascota
  async update(ci_mascota, updates) {
    const { data, error } = await supabase
      .from('mascota')
      .update(updates)
      .eq('ci_mascota', ci_mascota)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Eliminar mascota
  async delete(ci_mascota) {
    const { error } = await supabase
      .from('mascota')
      .delete()
      .eq('ci_mascota', ci_mascota)
    
    if (error) throw error
    return true
  }
}

/**
 * 📅 RESERVAS SERVICE
 */
export const reservasSupabase = {
  // Obtener todas las reservas
  async getAll() {
    const { data, error } = await supabase
      .from('reserva')
      .select(`
        *,
        mascota:ci_mascota (nombre_mascota, especie, raza),
        servicio:id_servicio (nombre_servicio, precio_base)
      `)
      .order('fecha_reserva', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Obtener reservas de una mascota
  async getByMascota(ci_mascota) {
    const { data, error } = await supabase
      .from('reserva')
      .select(`
        *,
        servicio:id_servicio (nombre_servicio, precio_base)
      `)
      .eq('ci_mascota', ci_mascota)
      .order('fecha_reserva', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Crear nueva reserva
  async create(reserva) {
    const { data, error } = await supabase
      .from('reserva')
      .insert([reserva])
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Actualizar estado de reserva
  async updateEstado(id_reserva, estado_reserva) {
    const { data, error } = await supabase
      .from('reserva')
      .update({ estado_reserva })
      .eq('id_reserva', id_reserva)
      .select()
    
    if (error) throw error
    return data[0]
  }
}

/**
 * 👨‍⚕️ DOCTORES/PERSONAL SERVICE
 */
export const doctoresSupabase = {
  // Obtener todo el personal activo
  async getAll() {
    const { data, error } = await supabase
      .from('personal')
      .select('*')
      .eq('estado', 'activo')
      .order('nombre_personal', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Obtener personal por ID
  async getById(ci_personal) {
    const { data, error } = await supabase
      .from('personal')
      .select('*')
      .eq('ci_personal', ci_personal)
      .single()
    
    if (error) throw error
    return data
  }
}

/**
 * 🛍️ PRODUCTOS SERVICE
 */
export const productosSupabase = {
  // Obtener todos los productos
  async getAll() {
    const { data, error } = await supabase
      .from('producto')
      .select('*')
      .order('nombre_producto', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Obtener productos por categoría
  async getByCategoria(categoria) {
    const { data, error } = await supabase
      .from('producto')
      .select('*')
      .eq('categoria', categoria)
      .order('nombre_producto', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Obtener producto por ID
  async getById(id_producto) {
    const { data, error } = await supabase
      .from('producto')
      .select('*')
      .eq('id_producto', id_producto)
      .single()
    
    if (error) throw error
    return data
  },

  // Buscar productos
  async search(query) {
    const { data, error } = await supabase
      .from('producto')
      .select('*')
      .or(`nombre_producto.ilike.%${query}%,descripcion.ilike.%${query}%`)
    
    if (error) throw error
    return data
  }
}

/**
 * 🏥 SERVICIOS SERVICE
 */
export const serviciosSupabase = {
  // Obtener todos los servicios
  async getAll() {
    const { data, error } = await supabase
      .from('servicio')
      .select('*')
      .order('nombre_servicio', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Obtener servicio por ID
  async getById(id_servicio) {
    const { data, error } = await supabase
      .from('servicio')
      .select('*')
      .eq('id_servicio', id_servicio)
      .single()
    
    if (error) throw error
    return data
  }
}

/**
 * 💉 VACUNAS SERVICE
 */
export const vacunasSupabase = {
  // Obtener todas las vacunas del catálogo
  async getCatalogo() {
    const { data, error } = await supabase
      .from('vacunacatalog')
      .select('*')
      .order('nombre_vacuna_cat', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Obtener vacunas aplicadas a una mascota
  async getByMascota(ci_mascota) {
    const { data, error } = await supabase
      .from('vacuna')
      .select(`
        *,
        historial_medico!inner(id_mascota)
      `)
      .eq('historial_medico.id_mascota', ci_mascota)
      .order('fecha_aplicacion', { ascending: false })
    
    if (error) throw error
    return data
  }
}

/**
 * 🛒 CARRITO SERVICE
 */
export const carritoSupabase = {
  // Obtener carrito del cliente
  async get(ci_cliente) {
    const { data, error } = await supabase
      .from('carrito')
      .select(`
        *,
        detalle_carrito(
          *,
          producto:id_producto (*)
        )
      `)
      .eq('ci_cliente', ci_cliente)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No hay carrito, crear uno nuevo
        const { data: newCarrito, error: createError } = await supabase
          .from('carrito')
          .insert([{ ci_cliente }])
          .select()
          .single()
        
        if (createError) throw createError
        return newCarrito
      }
      throw error
    }
    return data
  },

  // Agregar producto al carrito
  async agregarProducto(id_carrito, id_producto, cantidad = 1) {
    // Verificar si ya existe en detalle_carrito
    const { data: existing } = await supabase
      .from('detalle_carrito')
      .select('*')
      .eq('id_carrito', id_carrito)
      .eq('id_producto', id_producto)
      .single()
    
    if (existing) {
      // Actualizar cantidad
      const { data, error } = await supabase
        .from('detalle_carrito')
        .update({ cantidad: existing.cantidad + cantidad })
        .eq('id_detalle_carrito', existing.id_detalle_carrito)
        .select()
      
      if (error) throw error
      return data[0]
    } else {
      // Insertar nuevo
      const { data, error } = await supabase
        .from('detalle_carrito')
        .insert([{ id_carrito, id_producto, cantidad }])
        .select()
      
      if (error) throw error
      return data[0]
    }
  },

  // Eliminar producto del carrito
  async eliminarProducto(id_detalle_carrito) {
    const { error } = await supabase
      .from('detalle_carrito')
      .delete()
      .eq('id_detalle_carrito', id_detalle_carrito)
    
    if (error) throw error
    return true
  },

  // Vaciar carrito
  async vaciar(id_carrito) {
    const { error } = await supabase
      .from('detalle_carrito')
      .delete()
      .eq('id_carrito', id_carrito)
    
    if (error) throw error
    return true
  }
}

/**
 * 📊 HISTORIAL MÉDICO SERVICE
 */
export const historialSupabase = {
  // Obtener historial médico de una mascota
  async getByMascota(ci_mascota) {
    const { data, error } = await supabase
      .from('historial_medico')
      .select(`
        *,
        historial_medico_detalle(*)
      `)
      .eq('id_mascota', ci_mascota)
      .order('fecha_creacion', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Crear entrada en historial
  async create(entrada) {
    const { data, error } = await supabase
      .from('historial_medico')
      .insert([entrada])
      .select()
    
    if (error) throw error
    return data[0]
  }
}

/**
 * 📰 ARTÍCULOS DE BLOG SERVICE
 */
export const articulosSupabase = {
  // Obtener todos los artículos
  async getAll() {
    const { data, error } = await supabase
      .from('articulosblog')
      .select('*')
      .order('fecha_publicacion', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Obtener artículo por ID
  async getById(id_articulo) {
    const { data, error } = await supabase
      .from('articulosblog')
      .select('*')
      .eq('id_articulo', id_articulo)
      .single()
    
    if (error) throw error
    return data
  }
}

/**
 * 🏨 HABITACIONES SERVICE
 */
export const habitacionesSupabase = {
  // Obtener todas las habitaciones
  async getAll() {
    const { data, error } = await supabase
      .from('habitacion')
      .select('*')
      .order('tipo', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Obtener habitaciones disponibles
  async getDisponibles() {
    const { data, error } = await supabase
      .from('habitacion')
      .select('*')
      .eq('estado', 'disponible')
      .order('tipo', { ascending: true })
    
    if (error) throw error
    return data
  }
}

/**
 * 👤 CLIENTES SERVICE (autenticación y perfil)
 */
export const clientesSupabase = {
  // Obtener perfil del cliente
  async getProfile(ci_cliente) {
    const { data, error } = await supabase
      .from('cliente')
      .select('*')
      .eq('ci_cliente', ci_cliente)
      .single()
    
    if (error) throw error
    return data
  },

  // Actualizar perfil
  async updateProfile(ci_cliente, updates) {
    const { data, error } = await supabase
      .from('cliente')
      .update(updates)
      .eq('ci_cliente', ci_cliente)
      .select()
    
    if (error) throw error
    return data[0]
  },

  // Registrar nuevo cliente
  async register(cliente) {
    const { data, error } = await supabase
      .from('cliente')
      .insert([cliente])
      .select()
    
    if (error) throw error
    return data[0]
  }
}

// Exportar todo
export default {
  mascotas: mascotasSupabase,
  reservas: reservasSupabase,
  doctores: doctoresSupabase,
  productos: productosSupabase,
  servicios: serviciosSupabase,
  vacunas: vacunasSupabase,
  carrito: carritoSupabase,
  historial: historialSupabase,
  articulos: articulosSupabase,
  habitaciones: habitacionesSupabase,
  clientes: clientesSupabase
}
