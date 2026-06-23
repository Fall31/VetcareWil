import { useNavigate, Link } from 'react-router-dom'
import './IniciarSesion.css'
import { supabase } from '../lib/supabaseClient'
import { useState } from 'react'

function IniciarSesion() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage('')
    
    const form = e.target
    const correo = form.email.value.trim().toLowerCase()
    const contrasenia = form.password.value

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo,
        password: contrasenia,
      })

      if (error) {
        console.error('Supabase signIn error:', error)
        setErrorMessage(error.message)
        setLoading(false)
        return
      }

      console.log('Login success:', data)
      
      // Detectar tipo de usuario y redirigir apropiadamente
      const userId = data.user.id
      const email = data.user.email
      console.log('Ingreso como:', { userId, email })
      
      // Verificar si es administrador
      let administradorData = null
      const { data: administradorById, error: administradorErrorById } = await supabase
        .from('administrador')
        .select('ci_administrador')
        .eq('user_id', userId)
        .maybeSingle()
      console.log('administradorById:', { administradorById, administradorErrorById })

      if (!administradorErrorById && administradorById) {
        administradorData = administradorById
      }

      if (!administradorData && email) {
        const { data: administradorByEmail, error: administradorErrorByEmail } = await supabase
          .from('administrador')
          .select('ci_administrador')
          .ilike('correo_administrador', email)
          .maybeSingle()
        console.log('administradorByEmail:', { administradorByEmail, administradorErrorByEmail })

        if (!administradorErrorByEmail && administradorByEmail) {
          administradorData = administradorByEmail
        }
      }

      if (!administradorData && email?.toLowerCase() === 'admin@gmail.com') {
        console.warn('Correo admin conocido usado pero no existe fila administrador. Forzando rol admin.')
        administradorData = { ci_administrador: 'ADM001' }
      }

      if (administradorData) {
        console.log('Usuario es administrador:', administradorData)
        navigate('/dashboard-admin')
        return
      }
      console.log('No es administrador, seguir verificando...')

      // Verificar si es personal
      let personalData = null
      const { data: personalById, error: personalErrorById } = await supabase
        .from('personal')
        .select('ci_personal, nombre, cargo')
        .eq('user_id', userId)
        .maybeSingle()

      if (!personalErrorById && personalById) {
        personalData = personalById
      }

      if (!personalData && email) {
        const { data: personalByEmail, error: personalErrorByEmail } = await supabase
          .from('personal')
          .select('ci_personal, nombre, cargo')
          .ilike('correo_personal', email)
          .maybeSingle()

        if (!personalErrorByEmail && personalByEmail) {
          personalData = personalByEmail
        }
      }

      if (personalData) {
        console.log('Usuario es personal:', personalData)
        navigate('/dashboard-personal')
        return
      }

      // Verificar si es cliente
      let clienteData = null
      const { data: clienteById, error: clienteErrorById } = await supabase
        .from('cliente')
        .select('ci_cliente, nombre_cliente')
        .eq('user_id', userId)
        .maybeSingle()

      if (!clienteErrorById && clienteById) {
        clienteData = clienteById
      }

      if (!clienteData && email) {
        const { data: clienteByEmail, error: clienteErrorByEmail } = await supabase
          .from('cliente')
          .select('ci_cliente, nombre_cliente')
          .ilike('correo_cliente', email)
          .maybeSingle()
        console.log('clienteByEmail:', { clienteByEmail, clienteErrorByEmail })

        if (!clienteErrorByEmail && clienteByEmail) {
          clienteData = clienteByEmail
        }
      }

      if (clienteData) {
        console.log('Usuario es cliente:', clienteData)
        navigate('/dashboard')
        return
      }
      
      console.warn('Usuario no vinculado a cliente, personal ni administrador', {
        userId,
        email,
        administradorData,
        personalData,
        clienteData,
      })
      setErrorMessage('Usuario autenticado, pero no se encontró rol asignado. Revisa la tabla administrador/personal/cliente.')
      setLoading(false)
      return
      
    } catch (err) {
      console.error('Unexpected login error:', err)
      setErrorMessage('Error inesperado al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon">🐾</div>
            <h1>Bienvenido a VetCare</h1>
            <p>Inicia sesión para acceder a tu cuenta</p>
          </div>

          {errorMessage && (
            <div className="error-banner">
              <span>⚠️</span>
              <p>{errorMessage}</p>
            </div>
          )}

          <form className="auth-form" onSubmit={handleLogin}>
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
                placeholder="••••••••" 
                required 
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Ingresando...
                </>
              ) : (
                <>
                  <span>🔐</span>
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>¿No tienes cuenta? <Link to="/registrar">Regístrate aquí</Link></p>
          </div>
        </div>

        <div className="auth-illustration">
          <div className="illustration-content">
            <h2>🏥 Cuida a tus mascotas</h2>
            <p>Accede a servicios veterinarios profesionales, historial médico y mucho más.</p>
            <div className="features-list">
              <div className="feature-item">✓ Reservas online</div>
              <div className="feature-item">✓ Historial médico completo</div>
              <div className="feature-item">✓ Tienda de productos</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IniciarSesion
