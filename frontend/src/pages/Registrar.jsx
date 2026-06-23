import { useNavigate, Link } from 'react-router-dom'
import './Registrar.css'
import { useState } from 'react'

const BACKEND_API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api'

function Registrar() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    
    const form = e.target
    const nombre = form.nombre.value
    const correo = form.email.value.trim().toLowerCase()
    const contrasenia = form.password.value
    const confirmarContrasenia = form.confirmPassword.value

    // Validar contraseñas coincidan
    if (contrasenia !== confirmarContrasenia) {
      setErrorMessage('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    // Validar longitud de contraseña
    if (contrasenia.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    try {
      // Registrar usuario usando el endpoint admin del backend sin enviar email
      try {
        const resp = await fetch(`${BACKEND_API_BASE}/admin/create-user`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: correo, password: contrasenia, nombre })
        })

        const json = await resp.json()
        if (!resp.ok) {
          console.error('Backend create-user error:', json)
          setErrorMessage(json.error || 'Error al crear cuenta en backend')
          setLoading(false)
          return
        }

        console.log('Usuario creado via backend admin:', json.user)
      } catch (err) {
        console.error('Error calling backend create-user:', err)
        setErrorMessage('Error comunicando con el servidor. Intenta de nuevo más tarde.')
        setLoading(false)
        return
      }

      setSuccessMessage('¡Registro exitoso! Ya puedes iniciar sesión con tu nueva cuenta. Luego completa tu perfil con tus datos personales.')
      
      // Redirigir después de 4 segundos
      setTimeout(() => {
        navigate('/iniciar-sesion')
      }, 4000)
      
    } catch (err) {
      console.error('Error inesperado:', err)
      setErrorMessage('Error inesperado al registrar. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">🐾</div>
            <h1>Únete a VetCare</h1>
            <p>Crea tu cuenta y comienza a cuidar a tus mascotas</p>
          </div>

          {errorMessage && (
            <div className="error-banner">
              <span>⚠️</span>
              <p>{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="success-banner">
              <span>✅</span>
              <p>{successMessage}</p>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nombre">Nombre Completo</label>
              <input 
                id="nombre"
                name="nombre" 
                type="text" 
                placeholder="Juan Pérez" 
                required 
                autoComplete="name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo Electrónico</label>
              <input 
                id="email"
                name="email" 
                type="email" 
                placeholder="tu@email.com" 
                required 
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input 
                id="password"
                name="password" 
                type="password" 
                placeholder="Mínimo 6 caracteres" 
                required 
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input 
                id="confirmPassword"
                name="confirmPassword" 
                type="password" 
                placeholder="Repite tu contraseña" 
                required 
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Registrando...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Crear Cuenta
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>¿Ya tienes cuenta? <Link to="/iniciar-sesion">Inicia sesión aquí</Link></p>
          </div>
        </div>

        <div className="auth-illustration">
          <div className="illustration-content">
            <h2>🎉 Bienvenido a la familia</h2>
            <p>Únete a miles de dueños que confían en VetCare para el cuidado de sus mascotas.</p>
            <div className="features-list">
              <div className="feature-item">✓ Gestión de mascotas</div>
              <div className="feature-item">✓ Citas veterinarias online</div>
              <div className="feature-item">✓ Seguimiento de vacunas</div>
              <div className="feature-item">✓ Tienda de productos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Registrar
