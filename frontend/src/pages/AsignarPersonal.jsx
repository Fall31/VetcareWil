import { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { supabase } from '../lib/supabaseClient'
import './AsignarPersonal.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

export default function AsignarPersonal() {
  const [personal, setPersonal] = useState([])
  const [cargos, setCargos] = useState([])
  const [loading, setLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)

  const [form, setForm] = useState({
    correo_personal: '',
    contrasenia: '',
    nombre_personal: '',
    primer_apellido: '',
    segundo_apellido: '',
    direccion: '',
    estado: 'activo',
    genero_personal: '',
    titulo_universitario: '',
    fecha_nacimiento: '',
    telefono_personal: '',
    descripcion: '',
    id_cargo: '',
    perfil_completo: false,
    imagenFile: null,
  })

  useEffect(() => {
    fetchPersonal()
    fetchCargos()
  }, [])

  async function fetchPersonal() {
    const { data, error } = await supabase.from('personal').select('*').limit(200)
    if (error) {
      console.error('Error fetching personal', error)
      return
    }
    setPersonal(data || [])
  }

  async function fetchCargos() {
    const { data, error } = await supabase.from('cargo').select('id_cargo, nombre_cargo').order('nombre_cargo')
    if (error) {
      console.error('Error fetching cargos', error)
      return
    }
    setCargos(data || [])
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    const newValue = type === 'checkbox' ? checked : value
    setForm(prev => {
      const updated = { ...prev, [name]: newValue }
      // Auto-check perfil_completo if all fields are filled (password optional)
      const allFilled = updated.correo_personal && updated.nombre_personal && updated.primer_apellido && updated.direccion && updated.genero_personal && updated.titulo_universitario && updated.fecha_nacimiento && updated.telefono_personal && updated.descripcion && updated.id_cargo && updated.imagenFile
      if (allFilled) updated.perfil_completo = true
      else if (name !== 'perfil_completo') updated.perfil_completo = false
      return updated
    })
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0] || null
    setForm(prev => {
      const updated = { ...prev, imagenFile: file }
      // Recalculate perfil_completo when image is added/changed (password optional)
      const allFilled = updated.correo_personal && updated.nombre_personal && updated.primer_apellido && updated.direccion && updated.genero_personal && updated.titulo_universitario && updated.fecha_nacimiento && updated.telefono_personal && updated.descripcion && updated.id_cargo && updated.imagenFile
      if (allFilled) updated.perfil_completo = true
      else updated.perfil_completo = false
      return updated
    })
    if (file) setPreviewUrl(URL.createObjectURL(file))
    else setPreviewUrl(null)
  }

  // Generate ci_personal similar to clientes (TEMP_<timestamp>)
  function generateCiPersonal() {
    return `TEMP_${Date.now()}`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      // 1) Create auth user via backend admin endpoint
      const createResp = await fetch(`${API_BASE}/api/admin/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.correo_personal, password: form.contrasenia || Math.random().toString(36).slice(-8), nombre: form.nombre_personal + ' ' + form.primer_apellido })
      })

      if (!createResp.ok) {
        const err = await createResp.json().catch(() => ({}))
        throw new Error(err.error || 'Error creando usuario en Auth')
      }

      const created = await createResp.json()
      // created.user may contain the supabase admin response
      const userId = created?.user?.user?.id || created?.user?.id || created?.user?.data?.id || created?.user?.user_id || null

      // 2) Upload image to storage (if any)
      let publicUrl = null
      const bucket = 'personal-fotos'
      const ci_personal = generateCiPersonal()

      if (form.imagenFile) {
        const fileExt = form.imagenFile.name.split('.').pop()
        const path = `personal/${ci_personal}_${Date.now()}.${fileExt}`
        // try direct upload with anon client first
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, form.imagenFile, { upsert: true })
        if (uploadError) {
          console.warn('Direct storage upload failed, attempting backend upload', uploadError)
          // fallback: upload via backend endpoint which uses service key
          const b64 = await fileToBase64(form.imagenFile)
          const backendResp = await fetch(`${API_BASE}/api/storage/upload-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ bucket, path, fileBase64: b64.split(',')[1], contentType: form.imagenFile.type })
          })
          if (!backendResp.ok) {
            const berr = await backendResp.json().catch(() => ({}))
            throw new Error(berr.error || 'Error subiendo imagen al backend')
          }
          const backendData = await backendResp.json()
          publicUrl = backendData.publicUrl || backendData.publicUrl || backendData?.data?.publicUrl || null
        } else {
          const { data } = supabase.storage.from(bucket).getPublicUrl(path)
          publicUrl = data?.publicUrl || null
        }
      }

      // 3) Insert into personal table
      const row = {
        ci_personal,
        nombre_personal: form.nombre_personal,
        primer_apellido: form.primer_apellido,
        segundo_apellido: form.segundo_apellido || null,
        direccion: form.direccion || null,
        estado: form.estado || 'activo',
        genero_personal: form.genero_personal || null,
        titulo_universitario: form.titulo_universitario || null,
        fecha_nacimiento: form.fecha_nacimiento || null,
        telefono_personal: form.telefono_personal || null,
        descripcion: form.descripcion || null,
        imagen: publicUrl || null,
        id_cargo: form.id_cargo || null,
        perfil_completo: form.perfil_completo || false,
        correo_personal: form.correo_personal || null,
        user_id: userId || null,
      }

      const { error: insertError } = await supabase.from('personal').insert([row])
      if (insertError) throw insertError

      // success
      setForm({ correo_personal: '', contrasenia: '', nombre_personal: '', primer_apellido: '', segundo_apellido: '', direccion: '', estado: 'activo', genero_personal: '', titulo_universitario: '', fecha_nacimiento: '', telefono_personal: '', descripcion: '', id_cargo: '', perfil_completo: false, imagenFile: null })
      setPreviewUrl(null)
      await fetchPersonal()
      alert('Personal creado correctamente')
    } catch (err) {
      console.error('Error creando personal:', err)
      alert('Error: ' + (err.message || JSON.stringify(err)))
    } finally {
      setLoading(false)
    }
  }

  async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  return (
    <div className="asignar-container">
      <h1>Asignar / Crear Personal</h1>

      <form onSubmit={handleSubmit} className="asignar-form"> 
        <div className="form-grid">
          <div>
            <label>Correo</label>
            <input name="correo_personal" value={form.correo_personal} onChange={handleChange} type="email" required />
          </div>
          <div>
            <label>Contraseña</label>
            <input name="contrasenia" value={form.contrasenia} onChange={handleChange} type="password" placeholder="Dejar vacío para generar" />
          </div>
          <div>
            <label>Nombre</label>
            <input name="nombre_personal" value={form.nombre_personal} onChange={handleChange} required />
          </div>
          <div>
            <label>Primer apellido</label>
            <input name="primer_apellido" value={form.primer_apellido} onChange={handleChange} required />
          </div>
          <div>
            <label>Segundo apellido</label>
            <input name="segundo_apellido" value={form.segundo_apellido} onChange={handleChange} />
          </div>
          <div>
            <label>Dirección</label>
            <input name="direccion" value={form.direccion} onChange={handleChange} />
          </div>
          <div>
            <label>Estado</label>
            <select name="estado" value={form.estado} onChange={handleChange}>
              <option value="activo">activo</option>
              <option value="inactivo">inactivo</option>
            </select>
          </div>
          <div>
            <label>Género</label>
            <select name="genero_personal" value={form.genero_personal} onChange={handleChange}>
              <option value="">Seleccionar género</option>
              <option value="M">M</option>
              <option value="F">F</option>
            </select>
          </div>
          <div>
            <label>Título universitario</label>
            <input name="titulo_universitario" value={form.titulo_universitario} onChange={handleChange} />
          </div>
          <div>
            <label>Fecha nacimiento</label>
            <DatePicker
              selected={form.fecha_nacimiento ? new Date(form.fecha_nacimiento) : null}
              onChange={(date) => handleChange({ target: { name: 'fecha_nacimiento', value: date ? date.toISOString().split('T')[0] : '' } })}
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha"
              className="date-picker-input"
            />
          </div>
          <div>
            <label>Teléfono</label>
            <input name="telefono_personal" value={form.telefono_personal} onChange={handleChange} />
          </div>
          <div>
            <label>Descripción</label>
            <textarea name="descripcion" value={form.descripcion} onChange={handleChange} />
          </div>
          <div>
            <label>Cargo</label>
            <select name="id_cargo" value={form.id_cargo} onChange={handleChange}>
              <option value="">Seleccionar cargo</option>
              {cargos.map(c => <option key={c.id_cargo} value={c.id_cargo}>{c.nombre_cargo}</option>)}
            </select>
          </div>
          <div>
            <label>Perfil completo</label>
            <input name="perfil_completo" type="checkbox" checked={form.perfil_completo} disabled readOnly />
          </div>
          <div>
            <label>Imagen (foto)</label>
            <input name="imagen" type="file" accept="image/*" onChange={handleFileChange} />
            {previewUrl && <img src={previewUrl} alt="preview" style={{ width: 140, marginTop: 8, borderRadius: 8 }} />}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading}>{loading ? 'Creando...' : 'Crear personal'}</button>
        </div>
      </form>

      <h2>Personal existente</h2>
      <ul className="personal-list">
        {personal.map(p => (
          <li key={p.ci_personal} className="personal-item">
            {p.imagen && <img src={p.imagen} alt="foto" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, marginRight: 8 }} />}
            <strong>{p.nombre_personal} {p.primer_apellido}</strong> — {p.correo_personal} {p.id_cargo ? `(cargo ${p.id_cargo})` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
