const express = require('express')
const cors = require('cors')

const { supabase } = require('./src/lib/supabaseClient')

const app = express()
app.use(cors())
app.use(express.json({ limit: '35mb' }))

async function ensureStorageBuckets() {
  if (!process.env.SUPABASE_SERVICE_KEY) {
    return
  }

  const requiredBuckets = [
    { name: 'imagenes', public: true },
    { name: 'personal-fotos', public: true },
  ]

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('Error listing Supabase buckets:', listError)
      return
    }

    const existingBucketNames = new Set((buckets || []).map((bucket) => bucket.name))

    for (const bucket of requiredBuckets) {
      if (existingBucketNames.has(bucket.name)) {
        continue
      }

      const { error: createError } = await supabase.storage.createBucket(bucket.name, {
        public: bucket.public,
      })

      if (createError) {
        console.error(`Error creating bucket ${bucket.name}:`, createError)
      } else {
        console.log(`Created Supabase bucket: ${bucket.name}`)
      }
    }
  } catch (error) {
    console.error('Unexpected error ensuring Supabase buckets:', error)
  }
}

app.get('/', (req, res) => {
  res.send('Servidor backend funcionando 🚀')
})

// Ejemplo de endpoint API
app.get('/api/saludo', (req, res) => {
  res.json({ mensaje: 'Hola desde el backend de JavaScript' })
})

app.post('/api/storage/upload-image', async (req, res) => {
  try {
    if (!process.env.SUPABASE_SERVICE_KEY) {
      return res.status(403).json({ error: 'Image upload disabled: missing SUPABASE_SERVICE_KEY in backend environment.' })
    }

    const { bucket, path, fileBase64, contentType, upsert = true } = req.body

    if (!bucket || !path || !fileBase64 || !contentType) {
      return res.status(400).json({ error: 'bucket, path, fileBase64 and contentType are required' })
    }

    const buffer = Buffer.from(fileBase64, 'base64')

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, { contentType, upsert })

    if (uploadError) {
      console.error('Error uploading image to Supabase:', uploadError)
      return res.status(500).json({ error: uploadError.message || 'Error uploading image' })
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path)

    return res.status(201).json({ publicUrl: data.publicUrl, path, bucket })
  } catch (err) {
    console.error('Unexpected image upload error:', err)
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
})

// POST /api/admin/create-user -> crear usuario en Supabase usando SERVICE_ROLE (no envía email)
app.post('/api/admin/create-user', async (req, res) => {
  try {
    // Requerir que el backend tenga la service key configurada
    if (!process.env.SUPABASE_SERVICE_KEY) {
      return res.status(403).json({ error: 'Admin user creation disabled: missing SUPABASE_SERVICE_KEY in backend environment.' })
    }

    const { email, password, nombre } = req.body
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' })

    // Crear usuario usando la API admin (marca email como confirmado para evitar envío)
    const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
      email: String(email).trim().toLowerCase(),
      password,
      user_metadata: { nombre },
      email_confirm: true
    })

    if (createError) {
      console.error('Error creating admin user:', createError)
      return res.status(500).json({ error: createError.message || 'Error creating user' })
    }

    // Insertar perfil básico en tabla cliente
    const userId = createdUser.user?.id || createdUser.id || null
    if (userId) {
      const clienteRow = {
        user_id: userId,
        nombre_cliente: (nombre || '').split(' ')[0] || nombre || '-',
        primer_apellido: (nombre || '').split(' ')[1] || '-',
        correo_cliente: email,
        ci_cliente: `TEMP_${Date.now()}`,
        telefono_cliente: '00000000',
        direccion: 'Por completar',
        genero: 'O',
        nit: '0'
      }

      const { error: profileError } = await supabase.from('cliente').insert([clienteRow])
      if (profileError) console.error('Error creating cliente profile after admin user:', profileError)
    }

    res.status(201).json({ user: createdUser })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// --- Endpoints para PRODUCTOS ---
const productoController = require('./src/controllers/productoController')
app.get('/api/productos', productoController.listProductos)
app.post('/api/productos', productoController.createProducto)

// --- Endpoints para SERVICIOS ---
const servicioController = require('./src/controllers/servicioController')
app.get('/api/servicios', servicioController.listServicios)
app.post('/api/servicios', servicioController.createServicio)

// --- Endpoints para CARRITO ---
const carritoController = require('./src/controllers/carritoController')
app.get('/api/carrito/:ci_cliente', carritoController.getCarrito)
app.post('/api/carrito/agregar', carritoController.agregarProducto)
app.delete('/api/carrito/:ci_cliente', carritoController.vaciarCarrito)

// --- Endpoints para DOCTORES (Personal) ---
app.get('/api/doctores', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('personal')
      .select(`
        *,
        cargo(nombre_cargo),
        personal_especialidad(
          especialidad(nombre_especialidad, descripcion)
        )
      `)
      .eq('estado', 'activo')
      .limit(20)
    if (error) throw error
    res.json({ doctores: data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo doctores' })
  }
})

// --- Endpoints para RESERVAS ---
const reservaController = require('./src/controllers/reservaController')
app.get('/api/reservas/:ci_cliente', reservaController.getReservasByCliente)
app.post('/api/reservas', reservaController.createReserva)

// --- Endpoints para HISTORIAL MÉDICO ---
const clienteController = require('./src/controllers/clienteController')

// Delegar rutas de cliente al controller (separación de capas)
app.post('/api/cliente', clienteController.createCliente)
app.get('/api/cliente', clienteController.getClientes)
// --- Endpoints para CHATBOT ---
app.post('/api/chatbot/mensaje', async (req, res) => {
  try {
    const { ci_cliente, texto_mensaje } = req.body
    let intent_id = null
    const texto = (texto_mensaje || '').toLowerCase()
    if (texto.includes('reserva') || texto.includes('cita')) {
      intent_id = 1 // asumiendo que intent 1 es para reservas
    } else if (texto.includes('precio') || texto.includes('costo')) {
      intent_id = 2 // intent para precios
    }
    
    // Crear sesión si no existe
    let { data: sesion } = await supabase
      .from('chatbot_sesion')
      .select('*')
      .eq('ci_cliente', ci_cliente)
      .eq('estado', 'activa')
      .single()
    
    if (!sesion) {
      const { data: nuevaSesion } = await supabase
        .from('chatbot_sesion')
        .insert([{ ci_cliente, estado: 'activa' }])
        .select()
        .single()
      sesion = nuevaSesion
    }
    
    // Guardar mensaje del usuario
    await supabase
      .from('chatbot_mensaje')
      .insert([{
        id_sesion: sesion.id_sesion,
        es_usuario: true,
        texto_mensaje,
        id_intent: intent_id
      }])
    
    // Obtener respuesta
    let respuesta = 'Gracias por tu mensaje. ¿En qué más puedo ayudarte?'
    if (intent_id) {
      const { data: respuestaData } = await supabase
        .from('chatbot_respuesta')
        .select('texto_respuesta')
        .eq('id_intent', intent_id)
        .limit(1)
        .single()
      if (respuestaData) respuesta = respuestaData.texto_respuesta
    }
    
    // Guardar respuesta del bot
    await supabase
      .from('chatbot_mensaje')
      .insert([{
        id_sesion: sesion.id_sesion,
        es_usuario: false,
        texto_mensaje: respuesta,
        id_intent: intent_id
      }])
    
    res.json({ respuesta })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error procesando mensaje' })
  }
})

// --- Endpoints para PERFIL DE USUARIO ---
// GET /api/cliente/:userId -> obtener datos del cliente por user_id
app.get('/api/cliente/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { data, error } = await supabase
      .from('cliente')
      .select('*')
      .eq('ci_cliente', userId)
      .single()
    
    if (error) throw error
    res.json({ cliente: data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo perfil' })
  }
})

// PUT /api/cliente/:userId -> actualizar datos del cliente
app.put('/api/cliente/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const updates = req.body
    
    const { data, error } = await supabase
      .from('cliente')
      .update(updates)
      .eq('ci_cliente', userId)
    
    if (error) throw error
    res.json({ success: true, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error actualizando perfil' })
  }
})

// --- Endpoints para MASCOTAS ---
const mascotaController = require('./src/controllers/mascotaController')
app.get('/api/mascotas/:userId', mascotaController.getMascotasByUserId)
app.post('/api/mascotas', mascotaController.createMascota)
app.put('/api/mascotas/:ci_mascota', mascotaController.updateMascota)
app.delete('/api/mascotas/:ci_mascota', mascotaController.deleteMascota)


const PORT = process.env.PORT || 5000

if (require.main === module) {
  ensureStorageBuckets()
    .finally(() => {
      app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`))
    })
}

module.exports = app
