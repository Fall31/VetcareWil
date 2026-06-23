import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import './Perfil.css'

const PerfilAdmin = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    nombre_administrador: '',
    primer_apellido: '',
    segundo_apellido: '',
    direccion: '',
    telefono_administrador: '',
    nit: '',
    genero: ''
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

      const { data: adminData, error: adminError } = await supabase
        .from('administrador')
        .select('*')
        .eq('user_id', authUser.id)
        .single()

      if (adminError) {
        console.error('Error cargando administrador:', adminError)
        if (adminError.code === 'PGRST116') {
          const { data: nuevoAdmin, error: insertError } = await supabase
            .from('administrador')
            .insert([{
              user_id: authUser.id,
              nombre_administrador: authUser.user_metadata?.nombre || 'Administrador',
              primer_apellido: '-',
              correo_administrador: authUser.email,
              ci_administrador: `ADM_${Date.now()}`,
              telefono_administrador: '00000000',
              direccion: 'Por completar',
              genero: 'O',
              nit: '0',
              perfil_completo: false
            }])
            .select()
            .single()

          if (!insertError && nuevoAdmin) {
            setPerfil(nuevoAdmin)
            setFormData({
              nombre_administrador: nuevoAdmin.nombre_administrador || '',
              primer_apellido: nuevoAdmin.primer_apellido || '',
              segundo_apellido: nuevoAdmin.segundo_apellido || '',
              direccion: nuevoAdmin.direccion || '',
              telefono_administrador: nuevoAdmin.telefono_administrador || '',
              nit: nuevoAdmin.nit || '',
              genero: nuevoAdmin.genero || ''
            })
          }
        }
      } else if (adminData) {
        setPerfil(adminData)
        setFormData({
          nombre_administrador: adminData.nombre_administrador || '',
          primer_apellido: adminData.primer_apellido || '',
          segundo_apellido: adminData.segundo_apellido || '',
          direccion: adminData.direccion || '',
          telefono_administrador: adminData.telefono_administrador || '',
          nit: adminData.nit || '',
          genero: adminData.genero || ''
        })
      }

      setLoading(false)
    } catch (err) {
      console.error('Error cargando perfil admin:', err)
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
    if (!perfil || !perfil.ci_administrador) {
      alert('Error: No se pudo cargar el perfil. Por favor, recarga la página.')
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from('administrador')
        .update(formData)
        .eq('ci_administrador', perfil.ci_administrador)

      if (error) throw error

      alert('✅ Perfil actualizado correctamente')
      cargarPerfil()
    } catch (err) {
      console.error('Error actualizando perfil admin:', err)
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
      console.error('Error cambiando contraseña admin:', err)
      alert('Error al cambiar la contraseña: ' + err.message)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de cerrar sesión?')) {
      await supabase.auth.signOut()
      navigate('/iniciar-sesion')
    }
  }

  if (loading) {
    return <div className="perfil-loading">Cargando perfil...</div>
  }

  return (
    <div className="perfil-page">
      <div className="perfil-header">
        <div>
          <h1>Perfil Administrador</h1>
          <p>Gestiona tu información personal y configuración de cuenta</p>
        </div>
        <button className="btn-logout" onClick={handleLogout}>
          🚪 Cerrar Sesión
        </button>
      </div>

      <div className="perfil-content">
        <div className="account-card">
          <div className="account-avatar">
            <div className="avatar-circle">
              {formData.nombre_administrador?.[0]?.toUpperCase() || '👤'}
            </div>
          </div>
          <div className="account-info">
            <h3>{formData.nombre_administrador} {formData.primer_apellido}</h3>
            <p>{user?.email}</p>
            <span className="account-badge">✓ Cuenta Activa</span>
          </div>
        </div>

        <section className="perfil-section">
          <h2>📋 Información Personal</h2>
          <form onSubmit={handleSaveProfile} className="perfil-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  id="nombre"
                  type="text"
                  name="nombre_administrador"
                  value={formData.nombre_administrador}
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
                  name="telefono_administrador"
                  value={formData.telefono_administrador}
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

export default PerfilAdmin
