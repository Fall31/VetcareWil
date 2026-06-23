import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import './DashboardPersonal.css'

const DashboardPersonal = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [personalData, setPersonalData] = useState(null)
  const [reservasHoy, setReservasHoy] = useState([])
  const [reservasProximas, setReservasProximas] = useState([])
  const [horarioHoy, setHorarioHoy] = useState([])
  const [estadisticas, setEstadisticas] = useState({
    atenciones_hoy: 0,
    atenciones_mes: 0,
    pacientes_total: 0,
    tratamientos_activos: 0
  })

  useEffect(() => {
    cargarDashboard()
  }, [])

  const cargarDashboard = async () => {
    try {
      setLoading(true)
      await Promise.all([
        cargarDatosPersonal(),
        cargarReservasHoy(),
        cargarReservasProximas(),
        cargarHorarioHoy(),
        cargarEstadisticas()
      ])
      setLoading(false)
    } catch (err) {
      console.error('Error cargando dashboard:', err)
      setError('Error al cargar el dashboard')
      setLoading(false)
    }
  }

  const cargarDatosPersonal = async () => {
    try {
      // Obtener el usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        navigate('/iniciar-sesion')
        return
      }

      // Buscar datos del personal por user_id
      const { data, error } = await supabase
        .from('personal')
        .select(`
          *,
          cargo:id_cargo (
            nombre_cargo
          )
        `)
        .eq('user_id', user.id)
        .single()

      if (error) throw error
      
      if (!data) {
        // Usuario autenticado pero no es personal
        console.warn('Usuario no es personal, redirigiendo a dashboard de cliente')
        navigate('/dashboard')
        return
      }
      
      setPersonalData(data)
    } catch (err) {
      console.error('Error cargando datos del personal:', err)
      setError('No se pudieron cargar los datos del personal. Verifica que tu cuenta esté vinculada correctamente.')
    }
  }

  const cargarReservasHoy = async () => {
    try {
      if (!personalData) return

      const hoy = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('reserva')
        .select(`
          *,
          mascota:ci_mascota (
            nombre_mascota,
            especie,
            cliente:ci_cliente (
              nombre_cliente,
              primer_apellido,
              telefono
            )
          ),
          servicio:id_servicio (
            nombre_servicio
          )
        `)
        .eq('ci_personal', personalData.ci_personal)
        .eq('fecha_reserva', hoy)
        .order('hora_reserva', { ascending: true })

      if (error) throw error
      setReservasHoy(data || [])
    } catch (err) {
      console.error('Error cargando reservas de hoy:', err)
    }
  }

  const cargarReservasProximas = async () => {
    try {
      if (!personalData) return

      const hoy = new Date().toISOString().split('T')[0]
      const proximos7dias = new Date()
      proximos7dias.setDate(proximos7dias.getDate() + 7)
      const fechaLimite = proximos7dias.toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('reserva')
        .select(`
          *,
          mascota:ci_mascota (
            nombre_mascota,
            especie,
            cliente:ci_cliente (
              nombre_cliente,
              primer_apellido
            )
          ),
          servicio:id_servicio (
            nombre_servicio
          )
        `)
        .eq('ci_personal', personalData.ci_personal)
        .gt('fecha_reserva', hoy)
        .lte('fecha_reserva', fechaLimite)
        .order('fecha_reserva', { ascending: true })
        .order('hora_reserva', { ascending: true })
        .limit(5)

      if (error) throw error
      setReservasProximas(data || [])
    } catch (err) {
      console.error('Error cargando reservas próximas:', err)
    }
  }

  const cargarHorarioHoy = async () => {
    try {
      if (!personalData) return

      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      const hoy = diasSemana[new Date().getDay()]

      const { data, error } = await supabase
        .from('horario_personal')
        .select(`
          *,
          horario:id_horario (
            dia_semana,
            hora_inicio,
            hora_fin
          )
        `)
        .eq('ci_personal', personalData.ci_personal)

      if (error) throw error

      // Filtrar solo los horarios del día actual
      const horariosHoy = data?.filter(hp => 
        hp.horario?.dia_semana === hoy
      ) || []

      setHorarioHoy(horariosHoy)
    } catch (err) {
      console.error('Error cargando horario de hoy:', err)
    }
  }

  const cargarEstadisticas = async () => {
    try {
      if (!personalData) return

      const hoy = new Date().toISOString().split('T')[0]
      const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      // Atenciones de hoy (reservas completadas)
      const { count: atencionesHoy } = await supabase
        .from('reserva')
        .select('*', { count: 'exact', head: true })
        .eq('ci_personal', personalData.ci_personal)
        .eq('fecha_reserva', hoy)
        .eq('estado_reserva', 'Completada')

      // Atenciones del mes
      const { count: atencionesMes } = await supabase
        .from('reserva')
        .select('*', { count: 'exact', head: true })
        .eq('ci_personal', personalData.ci_personal)
        .gte('fecha_reserva', primerDiaMes)
        .eq('estado_reserva', 'Completada')

      // Total de pacientes únicos atendidos
      const { data: reservasUnicas } = await supabase
        .from('reserva')
        .select('ci_mascota')
        .eq('ci_personal', personalData.ci_personal)
        .eq('estado_reserva', 'Completada')

      const pacientesUnicos = [...new Set(reservasUnicas?.map(r => r.ci_mascota) || [])]

      // Tratamientos activos (si existe tabla tratamiento)
      const { count: tratamientosActivos } = await supabase
        .from('tratamiento')
        .select('*', { count: 'exact', head: true })
        .eq('ci_personal', personalData.ci_personal)
        .eq('estado', 'En curso')
        .catch(() => ({ count: 0 }))

      setEstadisticas({
        atenciones_hoy: atencionesHoy || 0,
        atenciones_mes: atencionesMes || 0,
        pacientes_total: pacientesUnicos.length,
        tratamientos_activos: tratamientosActivos || 0
      })
    } catch (err) {
      console.error('Error cargando estadísticas:', err)
    }
  }

  const formatearHora = (hora) => {
    if (!hora) return ''
    return hora.substring(0, 5) // HH:MM
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return ''
    const date = new Date(fecha + 'T00:00:00')
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    })
  }

  if (loading) {
    return (
      <div className="dashboard-personal-loading">
        <div className="loader"></div>
        <p>⏳ Cargando tu dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-personal-error">
        <p>❌ {error}</p>
        <button onClick={cargarDashboard} className="btn-retry">Reintentar</button>
      </div>
    )
  }

  return (
    <div className="dashboard-personal">
      {/* HEADER */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>¡Bienvenido/a, {personalData?.nombre_personal}!</h1>
          <p className="subtitle">{personalData?.cargo?.nombre_cargo || 'Personal'}</p>
          <p className="date-info">{new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
          })}</p>
        </div>
      </div>

      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <p className="stat-label">Atenciones Hoy</p>
            <h3 className="stat-value">{estadisticas.atenciones_hoy}</h3>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <p className="stat-label">Atenciones Este Mes</p>
            <h3 className="stat-value">{estadisticas.atenciones_mes}</h3>
          </div>
        </div>

        <div className="stat-card stat-info">
          <div className="stat-icon">🐾</div>
          <div className="stat-info">
            <p className="stat-label">Pacientes Totales</p>
            <h3 className="stat-value">{estadisticas.pacientes_total}</h3>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">💊</div>
          <div className="stat-info">
            <p className="stat-label">Tratamientos Activos</p>
            <h3 className="stat-value">{estadisticas.tratamientos_activos}</h3>
          </div>
        </div>
      </div>

      {/* ACCESOS RÁPIDOS */}
      <div className="section quick-access-section">
        <h2>⚡ Accesos Rápidos</h2>
        <div className="quick-actions-grid">
          <div className="action-card" onClick={() => navigate('/mis-reservas')}>
            <div className="action-icon">📅</div>
            <h3>Mis Reservas</h3>
            <p>Ver y gestionar citas</p>
          </div>

          <div className="action-card" onClick={() => navigate('/historial-medico-personal')}>
            <div className="action-icon">📋</div>
            <h3>Historial Médico</h3>
            <p>Registros de pacientes</p>
          </div>

          <div className="action-card" onClick={() => navigate('/recetas-tratamientos')}>
            <div className="action-icon">💊</div>
            <h3>Recetas</h3>
            <p>Prescripciones médicas</p>
          </div>

          <div className="action-card" onClick={() => navigate('/gestion-blog')}>
            <div className="action-icon">📝</div>
            <h3>Blog</h3>
            <p>Gestionar artículos</p>
          </div>

          <div className="action-card" onClick={() => navigate('/chat-personal')}>
            <div className="action-icon">💬</div>
            <h3>Chat Interno</h3>
            <p>Mensajería del equipo</p>
          </div>

          <div className="action-card" onClick={() => navigate('/mis-horarios')}>
            <div className="action-icon">🗓️</div>
            <h3>Mis Horarios</h3>
            <p>Calendario de turnos</p>
          </div>

          <div className="action-card" onClick={() => navigate('/perfil-personal')}>
            <div className="action-icon">👤</div>
            <h3>Mi Perfil</h3>
            <p>Editar información</p>
          </div>
        </div>
      </div>

      {/* GRID PRINCIPAL */}
      <div className="main-grid">
        {/* HORARIO DE HOY */}
        <div className="card-section">
          <div className="section-header">
            <h2>🕐 Mi Horario de Hoy</h2>
          </div>
          
          {horarioHoy.length === 0 ? (
            <div className="empty-state">
              <p>No tienes horario asignado para hoy</p>
            </div>
          ) : (
            <div className="horario-list">
              {horarioHoy.map((hp) => (
                <div key={hp.id_horario_personal} className="horario-item">
                  <div className="horario-time">
                    <span className="time-inicio">{formatearHora(hp.horario?.hora_inicio)}</span>
                    <span className="time-separator">→</span>
                    <span className="time-fin">{formatearHora(hp.horario?.hora_fin)}</span>
                  </div>
                  <div className="horario-day">{hp.horario?.dia_semana}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RESERVAS DE HOY */}
        <div className="card-section">
          <div className="section-header">
            <h2>📋 Reservas de Hoy</h2>
            <span className="badge-count">{reservasHoy.length}</span>
          </div>

          {reservasHoy.length === 0 ? (
            <div className="empty-state">
              <p>No tienes reservas para hoy</p>
            </div>
          ) : (
            <div className="reservas-list">
              {reservasHoy.map((reserva) => (
                <div key={reserva.id_reserva} className="reserva-item">
                  <div className="reserva-time-badge">
                    {formatearHora(reserva.hora_reserva)}
                  </div>
                  <div className="reserva-details">
                    <h4>{reserva.mascota?.nombre_mascota || 'Sin nombre'}</h4>
                    <p className="reserva-cliente">
                      🧑 {reserva.mascota?.cliente?.nombre_cliente} {reserva.mascota?.cliente?.primer_apellido}
                    </p>
                    <p className="reserva-servicio">
                      📌 {reserva.servicio?.nombre_servicio || 'Consulta general'}
                    </p>
                    <span className={`status-badge status-${reserva.estado_reserva}`}>
                      {reserva.estado_reserva}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRÓXIMAS RESERVAS */}
      <div className="card-section">
        <div className="section-header">
          <h2>📅 Próximas Reservas (7 días)</h2>
        </div>

        {reservasProximas.length === 0 ? (
          <div className="empty-state">
            <p>No tienes reservas programadas próximamente</p>
          </div>
        ) : (
          <div className="proximas-reservas-grid">
            {reservasProximas.map((reserva) => (
              <div key={reserva.id_reserva} className="proxima-reserva-card">
                <div className="fecha-badge">
                  {formatearFecha(reserva.fecha_reserva)}
                </div>
                <div className="reserva-content">
                  <h4>🐾 {reserva.mascota?.nombre_mascota}</h4>
                  <p className="cliente-info">
                    {reserva.mascota?.cliente?.nombre_cliente} {reserva.mascota?.cliente?.primer_apellido}
                  </p>
                  <p className="servicio-info">{reserva.servicio?.nombre_servicio}</p>
                  <div className="reserva-footer">
                    <span className="hora-info">🕐 {formatearHora(reserva.hora_reserva)}</span>
                    <span className={`status-badge status-${reserva.estado_reserva}`}>
                      {reserva.estado_reserva}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DashboardPersonal
