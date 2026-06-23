import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import './MisReservas.css'

const MisReservas = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [personal, setPersonal] = useState(null)
  const [reservas, setReservas] = useState([])
  const [reservasFiltradas, setReservasFiltradas] = useState([])
  
  // Filtros
  const [filtroEstado, setFiltroEstado] = useState('todas')
  const [filtroFecha, setFiltroFecha] = useState('todas')
  const [busqueda, setBusqueda] = useState('')

  // Modal de detalles/edición
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [comentario, setComentario] = useState('')

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    aplicarFiltros()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservas, filtroEstado, filtroFecha, busqueda])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        navigate('/iniciar-sesion')
        return
      }

      // Buscar datos del personal
      const { data: personalData, error: personalError } = await supabase
        .from('personal')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (personalError) throw personalError
      setPersonal(personalData)

      // Cargar reservas del personal
      await cargarReservas(personalData.ci_personal)

      setLoading(false)
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error al cargar los datos')
      setLoading(false)
    }
  }

  const cargarReservas = async (ci_personal) => {
    try {
      const { data, error } = await supabase
        .from('reserva')
        .select(`
          *,
          mascota:ci_mascota (
            ci_mascota,
            nombre_mascota,
            especie,
            raza,
            edad,
            cliente:ci_cliente (
              ci_cliente,
              nombre_cliente,
              primer_apellido,
              telefono,
              correo
            )
          ),
          servicio:id_servicio (
            id_servicio,
            nombre_servicio,
            descripcion,
            precio
          )
        `)
        .eq('ci_personal', ci_personal)
        .order('fecha_reserva', { ascending: false })
        .order('hora_reserva', { ascending: false })

      if (error) throw error
      setReservas(data || [])
    } catch (err) {
      console.error('Error cargando reservas:', err)
      setError('Error al cargar las reservas')
    }
  }

  const aplicarFiltros = () => {
    let filtradas = [...reservas]

    // Filtro por estado
    if (filtroEstado !== 'todas') {
      filtradas = filtradas.filter(r => r.estado_reserva === filtroEstado)
    }

    // Filtro por fecha
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    switch (filtroFecha) {
      case 'hoy':
        filtradas = filtradas.filter(r => {
          const fecha = new Date(r.fecha_reserva + 'T00:00:00')
          return fecha.getTime() === hoy.getTime()
        })
        break
      case 'semana': {
        const unaSemana = new Date()
        unaSemana.setDate(hoy.getDate() + 7)
        filtradas = filtradas.filter(r => {
          const fecha = new Date(r.fecha_reserva + 'T00:00:00')
          return fecha >= hoy && fecha <= unaSemana
        })
        break
      }
      case 'mes': {
        const unMes = new Date()
        unMes.setMonth(hoy.getMonth() + 1)
        filtradas = filtradas.filter(r => {
          const fecha = new Date(r.fecha_reserva + 'T00:00:00')
          return fecha >= hoy && fecha <= unMes
        })
        break
      }
      case 'pasadas':
        filtradas = filtradas.filter(r => {
          const fecha = new Date(r.fecha_reserva + 'T00:00:00')
          return fecha < hoy
        })
        break
      default:
        break
    }

    // Búsqueda por nombre de mascota o cliente
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase()
      filtradas = filtradas.filter(r =>
        r.mascota?.nombre_mascota?.toLowerCase().includes(termino) ||
        r.mascota?.cliente?.nombre_cliente?.toLowerCase().includes(termino) ||
        r.mascota?.cliente?.primer_apellido?.toLowerCase().includes(termino)
      )
    }

    setReservasFiltradas(filtradas)
  }

  const abrirModal = (reserva) => {
    setReservaSeleccionada(reserva)
    setComentario(reserva.comentarios || '')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setReservaSeleccionada(null)
    setModalAbierto(false)
    setComentario('')
    setError('')
    setMensaje('')
  }

  const cambiarEstado = async (nuevoEstado) => {
    if (!reservaSeleccionada) return

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const { error: updateError } = await supabase
        .from('reserva')
        .update({ 
          estado_reserva: nuevoEstado,
          comentarios: comentario.trim() || null
        })
        .eq('id_reserva', reservaSeleccionada.id_reserva)

      if (updateError) throw updateError

      setMensaje(`✅ Reserva marcada como ${nuevoEstado}`)
      
      // Recargar reservas
      await cargarReservas(personal.ci_personal)
      
      setTimeout(() => {
        cerrarModal()
      }, 1500)
    } catch (err) {
      console.error('Error actualizando estado:', err)
      setError('Error al actualizar el estado de la reserva')
    } finally {
      setGuardando(false)
    }
  }

  const guardarComentario = async () => {
    if (!reservaSeleccionada) return

    try {
      setGuardando(true)
      setError('')
      setMensaje('')

      const { error: updateError } = await supabase
        .from('reserva')
        .update({ comentarios: comentario.trim() || null })
        .eq('id_reserva', reservaSeleccionada.id_reserva)

      if (updateError) throw updateError

      setMensaje('✅ Comentario guardado correctamente')
      
      await cargarReservas(personal.ci_personal)
      
      setTimeout(() => {
        setMensaje('')
      }, 2000)
    } catch (err) {
      console.error('Error guardando comentario:', err)
      setError('Error al guardar el comentario')
    } finally {
      setGuardando(false)
    }
  }

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A'
    const date = new Date(fecha + 'T00:00:00')
    return date.toLocaleDateString('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    })
  }

  const formatearHora = (hora) => {
    if (!hora) return 'N/A'
    return hora.substring(0, 5) // HH:MM
  }

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'estado-pendiente'
      case 'Confirmada':
        return 'estado-confirmada'
      case 'Completada':
        return 'estado-completada'
      case 'Cancelada':
        return 'estado-cancelada'
      default:
        return ''
    }
  }

  if (loading) {
    return (
      <div className="mis-reservas-loading">
        <div className="loader"></div>
        <p>⏳ Cargando reservas...</p>
      </div>
    )
  }

  if (!personal) {
    return (
      <div className="mis-reservas-error">
        <p>❌ No se encontraron datos del personal</p>
        <button onClick={() => navigate('/dashboard-personal')} className="btn-volver">
          Volver al Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="mis-reservas">
      <div className="reservas-header">
        <h1>📅 Mis Reservas</h1>
        <p className="subtitle">Gestiona tus citas y atenciones</p>
      </div>

      {/* FILTROS */}
      <div className="filtros-section">
        <div className="filtro-grupo">
          <label>🔍 Buscar:</label>
          <input
            type="text"
            placeholder="Buscar por mascota o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-busqueda"
          />
        </div>

        <div className="filtro-grupo">
          <label>📊 Estado:</label>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="select-filtro"
          >
            <option value="todas">Todas</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Completada">Completada</option>
            <option value="Cancelada">Cancelada</option>
          </select>
        </div>

        <div className="filtro-grupo">
          <label>📅 Fecha:</label>
          <select 
            value={filtroFecha} 
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="select-filtro"
          >
            <option value="todas">Todas</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="pasadas">Pasadas</option>
          </select>
        </div>

        <div className="resultados-info">
          <span className="badge-resultados">
            {reservasFiltradas.length} reserva{reservasFiltradas.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* LISTA DE RESERVAS */}
      {reservasFiltradas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No se encontraron reservas con los filtros aplicados</p>
          <button 
            onClick={() => {
              setFiltroEstado('todas')
              setFiltroFecha('todas')
              setBusqueda('')
            }}
            className="btn-limpiar"
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="reservas-grid">
          {reservasFiltradas.map((reserva) => (
            <div 
              key={reserva.id_reserva} 
              className="reserva-card"
              onClick={() => abrirModal(reserva)}
            >
              <div className="reserva-header-card">
                <div className="reserva-fecha">
                  <span className="fecha-dia">{new Date(reserva.fecha_reserva + 'T00:00:00').getDate()}</span>
                  <span className="fecha-mes">
                    {new Date(reserva.fecha_reserva + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short' })}
                  </span>
                </div>
                <div className="reserva-hora">
                  🕐 {formatearHora(reserva.hora_reserva)}
                </div>
              </div>

              <div className="reserva-body">
                <div className="mascota-info">
                  <h3>🐾 {reserva.mascota?.nombre_mascota || 'Sin nombre'}</h3>
                  <p className="mascota-detalles">
                    {reserva.mascota?.especie} • {reserva.mascota?.raza || 'Sin raza'}
                  </p>
                </div>

                <div className="cliente-info">
                  <p className="cliente-nombre">
                    🧑 {reserva.mascota?.cliente?.nombre_cliente} {reserva.mascota?.cliente?.primer_apellido}
                  </p>
                  <p className="cliente-contacto">
                    📞 {reserva.mascota?.cliente?.telefono}
                  </p>
                </div>

                <div className="servicio-info">
                  <p className="servicio-nombre">
                    📌 {reserva.servicio?.nombre_servicio || 'Sin servicio'}
                  </p>
                </div>

                <div className="reserva-footer-card">
                  <span className={`estado-badge ${getEstadoClass(reserva.estado_reserva)}`}>
                    {reserva.estado_reserva}
                  </span>
                  {reserva.comentarios && (
                    <span className="tiene-comentarios" title="Tiene comentarios">💬</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE DETALLES */}
      {modalAbierto && reservaSeleccionada && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📋 Detalles de la Reserva</h2>
              <button onClick={cerrarModal} className="btn-cerrar">✕</button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {mensaje && <div className="alert alert-success">{mensaje}</div>}

            <div className="modal-body">
              {/* Información de la reserva */}
              <div className="detalle-section">
                <h3>🐾 Mascota</h3>
                <p><strong>Nombre:</strong> {reservaSeleccionada.mascota?.nombre_mascota}</p>
                <p><strong>Especie:</strong> {reservaSeleccionada.mascota?.especie}</p>
                <p><strong>Raza:</strong> {reservaSeleccionada.mascota?.raza || 'No especificada'}</p>
                <p><strong>Edad:</strong> {reservaSeleccionada.mascota?.edad || 'No especificada'}</p>
              </div>

              <div className="detalle-section">
                <h3>🧑 Cliente</h3>
                <p><strong>Nombre:</strong> {reservaSeleccionada.mascota?.cliente?.nombre_cliente} {reservaSeleccionada.mascota?.cliente?.primer_apellido}</p>
                <p><strong>Teléfono:</strong> {reservaSeleccionada.mascota?.cliente?.telefono}</p>
                <p><strong>Correo:</strong> {reservaSeleccionada.mascota?.cliente?.correo || 'No registrado'}</p>
              </div>

              <div className="detalle-section">
                <h3>📅 Cita</h3>
                <p><strong>Fecha:</strong> {formatearFecha(reservaSeleccionada.fecha_reserva)}</p>
                <p><strong>Hora:</strong> {formatearHora(reservaSeleccionada.hora_reserva)}</p>
                <p><strong>Servicio:</strong> {reservaSeleccionada.servicio?.nombre_servicio}</p>
                <p><strong>Estado:</strong> 
                  <span className={`estado-badge ${getEstadoClass(reservaSeleccionada.estado_reserva)}`}>
                    {reservaSeleccionada.estado_reserva}
                  </span>
                </p>
              </div>

              {/* Comentarios/Notas */}
              <div className="detalle-section">
                <h3>💬 Comentarios/Notas</h3>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  placeholder="Agregar comentarios sobre la consulta, diagnóstico, recomendaciones..."
                  className="textarea-comentario"
                  rows="4"
                />
                <button 
                  onClick={guardarComentario}
                  disabled={guardando}
                  className="btn-guardar-comentario"
                >
                  {guardando ? '⏳ Guardando...' : '💾 Guardar Comentario'}
                </button>
              </div>
            </div>

            <div className="modal-footer">
              <h3>Cambiar Estado:</h3>
              <div className="botones-estado">
                <button
                  onClick={() => cambiarEstado('Pendiente')}
                  disabled={guardando || reservaSeleccionada.estado_reserva === 'Pendiente'}
                  className="btn-estado btn-pendiente"
                >
                  ⏳ Pendiente
                </button>
                <button
                  onClick={() => cambiarEstado('Confirmada')}
                  disabled={guardando || reservaSeleccionada.estado_reserva === 'Confirmada'}
                  className="btn-estado btn-confirmada"
                >
                  ✅ Confirmada
                </button>
                <button
                  onClick={() => cambiarEstado('Completada')}
                  disabled={guardando || reservaSeleccionada.estado_reserva === 'Completada'}
                  className="btn-estado btn-completada"
                >
                  ✔️ Completada
                </button>
                <button
                  onClick={() => cambiarEstado('Cancelada')}
                  disabled={guardando || reservaSeleccionada.estado_reserva === 'Cancelada'}
                  className="btn-estado btn-cancelada"
                >
                  ❌ Cancelada
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MisReservas
