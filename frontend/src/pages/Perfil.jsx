import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import { uploadImage } from '../lib/uploadImage'
import './Perfil.css'

const Perfil = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  
  const [formData, setFormData] = useState({
    nombre_cliente: '',
    primer_apellido: '',
    segundo_apellido: '',
    direccion: '',
    telefono_cliente: '',
    nit: '',
    genero: '',
    foto_url: ''
  })

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    cargarPerfil()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cargarPerfil = async () => {
    try {
      setLoading(true)
      
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (!authUser) {
        navigate('/iniciar-sesion')
        return
      }

      setUser(authUser)

      const { data: clienteData, error: clienteError } = await supabase
        .from('cliente')
        .select('*')
        .eq('user_id', authUser.id)
        .single()

      if (clienteError) {
        console.error('Error cargando cliente:', clienteError)
        // Si no existe, crear registro básico
        if (clienteError.code === 'PGRST116') {
          console.log('Cliente no existe, creando perfil básico...')
          const { data: nuevoCliente, error: insertError } = await supabase
            .from('cliente')
            .insert([{
              user_id: authUser.id,
              nombre_cliente: authUser.user_metadata?.nombre || 'Usuario',
              primer_apellido: '-',
              correo_cliente: authUser.email,
              ci_cliente: `TEMP_${Date.now()}`,
              telefono_cliente: '00000000',
              direccion: 'Por completar',
              genero: 'O',
              nit: '0',
              perfil_completo: false
            }])
            .select()
            .single()
          
          if (!insertError && nuevoCliente) {
            setPerfil(nuevoCliente)
            setFormData({
              nombre_cliente: nuevoCliente.nombre_cliente || '',
              primer_apellido: nuevoCliente.primer_apellido || '',
              segundo_apellido: nuevoCliente.segundo_apellido || '',
              direccion: nuevoCliente.direccion || '',
              telefono_cliente: nuevoCliente.telefono_cliente || '',
              nit: nuevoCliente.nit || '',
              genero: nuevoCliente.genero || '',
              foto_url: nuevoCliente.foto_url || ''
            })
          }
        }
      } else if (clienteData) {
        setPerfil(clienteData)
        setFormData({
          nombre_cliente: clienteData.nombre_cliente || '',
          primer_apellido: clienteData.primer_apellido || '',
          segundo_apellido: clienteData.segundo_apellido || '',
          direccion: clienteData.direccion || '',
          telefono_cliente: clienteData.telefono_cliente || '',
          nit: clienteData.nit || '',
          genero: clienteData.genero || '',
          foto_url: clienteData.foto_url || ''
        })
      }

      setLoading(false)
    } catch (err) {
      console.error('Error cargando perfil:', err)
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    
    if (!perfil || !perfil.ci_cliente) {
      alert('Error: No se pudo cargar el perfil. Por favor, recarga la página.')
      return
    }
    
    setSaving(true)

    try {
      const { error } = await supabase
        .from('cliente')
        .update(formData)
        .eq('ci_cliente', perfil.ci_cliente)

      if (error) throw error

      alert('✅ Perfil actualizado correctamente')
      cargarPerfil()
    } catch (err) {
      console.error('Error actualizando perfil:', err)
      alert('Error al actualizar el perfil: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Las contraseñas no coinciden')
      return
    }

    if (passwordData.newPassword.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      alert('✅ Contraseña actualizada correctamente')
      setPasswordData({ newPassword: '', confirmPassword: '' })
    } catch (err) {
      console.error('Error cambiando contraseña:', err)
      alert('Error al cambiar la contraseña: ' + err.message)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de cerrar sesión?')) {
      await supabase.auth.signOut()
      navigate('/iniciar-sesion')
    }
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxImageSizeBytes = 20 * 1024 * 1024

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida')
      return
    }

    // Validar tamaño (max 20MB)
    if (file.size > maxImageSizeBytes) {
      alert('La imagen no puede superar los 20MB')
      return
    }

    try {
      setUploadingImage(true)

      // Preview local
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)

      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop()
      const filePath = `perfiles/${user.id}.${fileExt}`

      const publicUrl = await uploadImage({
        file,
        bucket: 'imagenes',
        path: filePath,
      })

      // Actualizar en la base de datos
      const { error: updateError } = await supabase
        .from('cliente')
        .update({ foto_url: publicUrl })
        .eq('ci_cliente', perfil.ci_cliente)

      if (updateError) throw updateError

      setFormData(prev => ({ ...prev, foto_url: publicUrl }))
      alert('✅ Foto de perfil actualizada correctamente')
    } catch (err) {
      console.error('Error subiendo imagen:', err)
      alert('Error al subir la imagen: ' + err.message)
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
    }
  }

  if (loading) {
    return <div className="perfil-loading">Cargando perfil...</div>
  }

  return (
    <div className="perfil-page">
      <div className="perfil-header">
        <div>
          <h1>Mi Perfil</h1>
          <p>Gestiona tu información personal y configuración de cuenta</p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          🚪 Cerrar Sesión
        </button>
      </div>

      <div className="perfil-content">
        {/* Account Info Card */}
        <div className="account-card">
          <div className="account-avatar">
            <div className="avatar-circle">
              {imagePreview || formData.foto_url ? (
                <img 
                  src={imagePreview || formData.foto_url} 
                  alt="Perfil" 
                  className="avatar-image"
                />
              ) : (
                formData.nombre_cliente?.[0]?.toUpperCase() || '👤'
              )}
            </div>
            <label htmlFor="avatar-upload" className="avatar-upload-btn" title="Cambiar foto">
              📷
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          <div className="account-info">
            <h3>{formData.nombre_cliente} {formData.primer_apellido}</h3>
            <p>{user?.email}</p>
            <span className="account-badge">✓ Cuenta Activa</span>
          </div>
        </div>

        {/* Personal Information Section */}
        <section className="perfil-section">
          <h2>📋 Información Personal</h2>
          <form onSubmit={handleSaveProfile} className="perfil-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  id="nombre"
                  type="text"
                  name="nombre_cliente"
                  value={formData.nombre_cliente}
                  onChange={handleInputChange}
                  required
                  placeholder="Tu nombre"
                />
              </div>
              <div className="form-group">
                <label htmlFor="primer_apellido">Primer Apellido *</label>
                <input
                  id="primer_apellido"
                  type="text"
                  name="primer_apellido"
                  value={formData.primer_apellido}
                  onChange={handleInputChange}
                  required
                  placeholder="Tu apellido"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="segundo_apellido">Segundo Apellido</label>
              <input
                id="segundo_apellido"
                type="text"
                name="segundo_apellido"
                value={formData.segundo_apellido}
                onChange={handleInputChange}
                placeholder="Segundo apellido (opcional)"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  id="telefono"
                  type="tel"
                  name="telefono_cliente"
                  value={formData.telefono_cliente}
                  onChange={handleInputChange}
                  placeholder="+591 12345678"
                />
              </div>
              <div className="form-group">
                <label htmlFor="nit">NIT</label>
                <input
                  id="nit"
                  type="text"
                  name="nit"
                  value={formData.nit}
                  onChange={handleInputChange}
                  placeholder="12345678"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="direccion">Dirección</label>
              <input
                id="direccion"
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                placeholder="Calle, Número, Ciudad"
              />
            </div>

            <div className="form-group">
              <label htmlFor="genero">Género</label>
              <select id="genero" name="genero" value={formData.genero} onChange={handleInputChange}>
                <option value="">Seleccionar</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input 
                id="email"
                type="email" 
                value={user?.email || ''} 
                disabled 
                className="disabled-input"
              />
              <small className="form-hint">El correo no se puede cambiar desde aquí</small>
            </div>

            <button type="submit" className="btn-save" disabled={saving}>
              {saving ? '⏳ Guardando...' : '💾 Guardar Cambios'}
            </button>
          </form>
        </section>

        {/* Password Change Section */}
        <section className="perfil-section">
          <h2>🔐 Cambiar Contraseña</h2>
          <form onSubmit={handleChangePassword} className="perfil-form">
            <div className="form-group">
              <label htmlFor="newPassword">Nueva Contraseña *</label>
              <input
                id="newPassword"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Nueva Contraseña *</label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                placeholder="Repite la contraseña"
              />
            </div>

            <button type="submit" className="btn-save">
              🔑 Cambiar Contraseña
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default Perfil
