import React, { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { uploadImage } from '../lib/uploadImage'
import './PerfilPersonal.css'

const PerfilPersonal = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [personal, setPersonal] = useState(null)
  const [cargos, setCargos] = useState([])
  const [imagenFile, setImagenFile] = useState(null)
  const [imagenPreview, setImagenPreview] = useState(null)

  const [formData, setFormData] = useState({
    nombre_personal: '',
    primer_apellido: '',
    segundo_apellido: '',
    telefono: '',
    correo: '',
    direccion: '',
    id_cargo: '',
    titulo_universitario: '',
    anos_experiencia: 0,
    numero_licencia: '',
    fecha_contratacion: ''
  })

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        navigate('/iniciar-sesion')
        return
      }

      // Cargar datos del personal
      const { data: personalData, error: personalError } = await supabase
        .from('personal')
        .select(`
          *,
          cargo:id_cargo (
            id_cargo,
            nombre_cargo
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (personalError) throw personalError

      setPersonal(personalData)
      setFormData({
        nombre_personal: personalData.nombre_personal || '',
        primer_apellido: personalData.primer_apellido || '',
        segundo_apellido: personalData.segundo_apellido || '',
        telefono: personalData.telefono || '',
        correo: personalData.correo || '',
        direccion: personalData.direccion || '',
        id_cargo: personalData.id_cargo || '',
        titulo_universitario: personalData.titulo_universitario || '',
        anos_experiencia: personalData.anos_experiencia || 0,
        numero_licencia: personalData.numero_licencia || '',
        fecha_contratacion: personalData.fecha_contratacion || ''
      })

      // Si tiene imagen, cargar preview
      if (personalData.imagen) {
        setImagenPreview(personalData.imagen)
      }

      // Cargar cargos
      const { data: cargosData, error: cargosError } = await supabase
        .from('cargo')
        .select('*')
        .order('nombre_cargo')

      if (cargosError) throw cargosError
      setCargos(cargosData || [])

      setLoading(false)
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar los datos del perfil')
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImagenChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const maxImageSizeBytes = 20 * 1024 * 1024
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona una imagen válida')
        return
      }

      // Validar tamaño (max 20MB)
      if (file.size > maxImageSizeBytes) {
        setError('La imagen no debe superar 20MB')
        return
      }

      setImagenFile(file)

      // Crear preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagenPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const subirImagen = async () => {
    if (!imagenFile || !personal) return null

    try {
      // Subir nueva imagen
      const fileExt = imagenFile.name.split('.').pop()
      const filePath = `${personal.ci_personal}.${fileExt}`

      const publicUrl = await uploadImage({
        file: imagenFile,
        bucket: 'personal-fotos',
        path: filePath,
      })

      return publicUrl
    } catch (err) {
      console.error('Error subiendo imagen:', err)
      throw new Error('No se pudo subir la imagen')
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      navigate('/iniciar-sesion')
    } catch (err) {
      console.error('Error cerrando sesión:', err)
      setError('No se pudo cerrar sesión. Intenta de nuevo.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')
    setGuardando(true)

    try {
      if (!personal || !personal.ci_personal) {
        throw new Error('No se pudieron cargar los datos del personal')
      }

      let imagenUrl = personal.imagen

      // Subir nueva imagen si hay una seleccionada
      if (imagenFile) {
        imagenUrl = await subirImagen()
      }

      // Actualizar datos del personal
      const { error: updateError } = await supabase
        .from('personal')
        .update({
          nombre_personal: formData.nombre_personal,
          primer_apellido: formData.primer_apellido,
          segundo_apellido: formData.segundo_apellido,
          telefono: formData.telefono,
          correo: formData.correo,
          direccion: formData.direccion,
          id_cargo: formData.id_cargo,
          titulo_universitario: formData.titulo_universitario,
          anos_experiencia: parseInt(formData.anos_experiencia) || 0,
          numero_licencia: formData.numero_licencia,
          fecha_contratacion: formData.fecha_contratacion,
          imagen: imagenUrl
        })
        .eq('ci_personal', personal.ci_personal)

      if (updateError) throw updateError

      setMensaje('✅ Perfil actualizado correctamente')
      setImagenFile(null)
      
      // Recargar datos
      await cargarDatos()

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMensaje(''), 3000)
    } catch (err) {
      console.error('Error guardando perfil:', err)
      setError('Error al actualizar el perfil: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  const eliminarImagen = async () => {
    if (!window.confirm('¿Eliminar la foto de perfil?')) return

    try {
      setGuardando(true)

      // Actualizar en BD
      const { error } = await supabase
        .from('personal')
        .update({ imagen: null })
        .eq('ci_personal', personal.ci_personal)

      if (error) throw error

      setImagenPreview(null)
      setImagenFile(null)
      setMensaje('✅ Imagen eliminada correctamente')
      
      await cargarDatos()
    } catch (err) {
      console.error('Error eliminando imagen:', err)
      setError('Error al eliminar la imagen')
    } finally {
      setGuardando(false)
    }
  }

  if (loading) {
    return (
      <div className="perfil-personal-loading">
        <div className="loader"></div>
        <p>⏳ Cargando perfil...</p>
      </div>
    )
  }

  if (!personal) {
    return (
      <div className="perfil-personal-error">
        <p>❌ No se encontraron datos del personal</p>
        <button onClick={() => navigate('/dashboard-personal')} className="btn-volver">
          Volver al Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="perfil-personal">
      <div className="perfil-header">
        <h1>👤 Mi Perfil</h1>
        <p className="subtitle">Administra tu información personal</p>
      </div>

      {error && (
        <div className="alert alert-error">
          ❌ {error}
        </div>
      )}

      {mensaje && (
        <div className="alert alert-success">
          {mensaje}
        </div>
      )}

      <div className="perfil-grid">
        {/* SECCIÓN DE FOTO */}
        <div className="foto-section card-section">
          <h2>📸 Foto de Perfil</h2>
          
          <div className="foto-container">
            {imagenPreview ? (
              <img 
                src={imagenPreview} 
                alt="Foto de perfil" 
                className="foto-perfil"
              />
            ) : (
              <div className="foto-placeholder">
                <span className="icon-placeholder">👤</span>
                <p>Sin foto</p>
              </div>
            )}
          </div>

          <div className="foto-actions">
            <label htmlFor="upload-imagen" className="btn-upload">
              📷 {imagenPreview ? 'Cambiar Foto' : 'Subir Foto'}
            </label>
            <input
              type="file"
              id="upload-imagen"
              accept="image/*"
              onChange={handleImagenChange}
              style={{ display: 'none' }}
            />

            {imagenPreview && (
              <button 
                type="button" 
                onClick={eliminarImagen} 
                className="btn-eliminar"
                disabled={guardando}
              >
                🗑️ Eliminar
              </button>
            )}
          </div>

          {imagenFile && (
            <p className="imagen-info">
              📎 Archivo seleccionado: {imagenFile.name}
            </p>
          )}
        </div>

        {/* INFORMACIÓN BÁSICA */}
        <div className="info-section card-section">
          <h2>ℹ️ Información Básica</h2>
          
          <div className="info-display">
            <div className="info-item">
              <span className="info-label">CI:</span>
              <span className="info-value">{personal.ci_personal}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Cargo:</span>
              <span className="info-value">{personal.cargo?.nombre_cargo || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Fecha de Contratación:</span>
              <span className="info-value">
                {personal.fecha_contratacion 
                  ? new Date(personal.fecha_contratacion).toLocaleDateString('es-ES')
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FORMULARIO DE EDICIÓN */}
      <form onSubmit={handleSubmit} className="perfil-form card-section">
        <h2>✏️ Editar Información</h2>

        <div className="form-grid">
          {/* Nombres */}
          <div className="form-group">
            <label htmlFor="nombre_personal">Nombre *</label>
            <input
              type="text"
              id="nombre_personal"
              name="nombre_personal"
              value={formData.nombre_personal}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="primer_apellido">Primer Apellido *</label>
            <input
              type="text"
              id="primer_apellido"
              name="primer_apellido"
              value={formData.primer_apellido}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="segundo_apellido">Segundo Apellido</label>
            <input
              type="text"
              id="segundo_apellido"
              name="segundo_apellido"
              value={formData.segundo_apellido}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          {/* Contacto */}
          <div className="form-group">
            <label htmlFor="telefono">Teléfono *</label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="correo">Correo Electrónico *</label>
            <input
              type="email"
              id="correo"
              name="correo"
              value={formData.correo}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="direccion">Dirección</label>
            <input
              type="text"
              id="direccion"
              name="direccion"
              value={formData.direccion}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          {/* Información Profesional */}
          <div className="form-group">
            <label htmlFor="id_cargo">Cargo</label>
            <select
              id="id_cargo"
              name="id_cargo"
              value={formData.id_cargo}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="">Seleccionar cargo</option>
              {cargos.map(cargo => (
                <option key={cargo.id_cargo} value={cargo.id_cargo}>
                  {cargo.nombre_cargo}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="titulo_universitario">Título Universitario</label>
            <input
              type="text"
              id="titulo_universitario"
              name="titulo_universitario"
              value={formData.titulo_universitario}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Ej: Doctor en Veterinaria"
            />
          </div>

          <div className="form-group">
            <label htmlFor="numero_licencia">Número de Licencia</label>
            <input
              type="text"
              id="numero_licencia"
              name="numero_licencia"
              value={formData.numero_licencia}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="anos_experiencia">Años de Experiencia</label>
            <input
              type="number"
              id="anos_experiencia"
              name="anos_experiencia"
              value={formData.anos_experiencia}
              onChange={handleInputChange}
              min="0"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="fecha_contratacion">Fecha de Contratación</label>
            <DatePicker
              selected={formData.fecha_contratacion ? new Date(formData.fecha_contratacion) : null}
              onChange={(date) => setFormData({...formData, fecha_contratacion: date ? date.toISOString().split('T')[0] : ''})}
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha"
              className="date-picker-input"
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={() => navigate('/dashboard-personal')} 
            className="btn-cancelar"
            disabled={guardando}
          >
            Cancelar
          </button>
          <button 
            type="button" 
            onClick={handleLogout} 
            className="btn-logout"
            disabled={guardando}
          >
            🚪 Cerrar sesión
          </button>
          <button 
            type="submit" 
            className="btn-guardar"
            disabled={guardando}
          >
            {guardando ? '⏳ Guardando...' : '💾 Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PerfilPersonal
