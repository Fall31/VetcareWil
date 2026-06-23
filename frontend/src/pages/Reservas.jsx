import React, { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { supabase } from '../lib/supabaseClient'
import supabaseServices from '../services/supabase'
import './Reservas.css'

const Reservas = () => {
  const [reservas, setReservas] = useState([])
  const [servicios, setServicios] = useState([])
  const [mascotas, setMascotas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [cliente, setCliente] = useState(null)
  
  // Form data para nueva reserva
  const [formData, setFormData] = useState({
    ci_mascota: '',
    id_servicio: '',
    fecha_reserva: '',
    hora_reserva: '',
    comentarios: ''
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      setLoading(true)
      
      // Obtener usuario autenticado
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        // Obtener cliente
        const { data: clienteData } = await supabase
          .from('cliente')
          .select('*')
          .eq('user_id', user.id)
          .single()

        setCliente(clienteData)

        if (clienteData) {
          // Cargar mascotas del cliente
          const mascotasData = await supabaseServices.mascotas.getByCliente(clienteData.ci_cliente)
          setMascotas(mascotasData)

          // Cargar reservas del cliente
          const { data: reservasData } = await supabase
            .from('reserva')
            .select(`
              *,
              mascota!inner(nombre_mascota, especie, raza, ci_cliente),
              servicio(nombre_servicio, precio_base, duracion)
            `)
            .eq('mascota.ci_cliente', clienteData.ci_cliente)
            .order('fecha_reserva', { ascending: false })

          setReservas(reservasData || [])
        }
      }

      // Cargar servicios disponibles
      const serviciosData = await supabaseServices.servicios.getAll()
      setServicios(serviciosData.filter(s => s.estado === 'activo'))

      setLoading(false)
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!cliente) {
      alert('Debes iniciar sesión para crear una reserva')
      return
    }

    try {
      const { data, error } = await supabase
        .from('reserva')
        .insert([{
          ci_mascota: parseInt(formData.ci_mascota),
          id_servicio: parseInt(formData.id_servicio),
          fecha_reserva: formData.fecha_reserva,
          hora_reserva: formData.hora_reserva,
          estado_reserva: 'pendiente',
          notificacion: true,
          comentarios: formData.comentarios,
          ci_cliente: cliente.ci_cliente
        }])
        .select()

      if (error) throw error

      alert('✅ Reserva creada exitosamente')
      setShowModal(false)
      setFormData({
        ci_mascota: '',
        id_servicio: '',
        fecha_reserva: '',
        hora_reserva: '',
        comentarios: ''
      })
      cargarDatos()
    } catch (err) {
      console.error('Error creando reserva:', err)
      alert('Error al crear la reserva: ' + err.message)
    }
  }

  const cancelarReserva = async (idReserva) => {
    if (!window.confirm('¿Estás seguro de cancelar esta reserva?')) return

    try {
      const { error } = await supabase
        .from('reserva')
        .update({ estado_reserva: 'cancelada' })
        .eq('id_reserva', idReserva)

      if (error) throw error

      alert('Reserva cancelada')
      cargarDatos()
    } catch (err) {
      console.error('Error cancelando reserva:', err)
      alert('Error al cancelar: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="reservas-page">
        <div className="loading-spinner">Cargando reservas...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="reservas-page">
        <div className="error-message">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="reservas-page">
      <div className="page-header">
        <h1>Mis Reservas</h1>
        <p className="subtitle">Gestiona tus citas veterinarias</p>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          + Nueva Reserva
        </button>
      </div>

      <div className="reservas-list">
        {reservas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>No tienes reservas programadas</p>
            <button className="btn-secondary" onClick={() => setShowModal(true)}>
              Crear mi primera reserva
            </button>
          </div>
        ) : (
          reservas.map((r) => {
            const fechaReserva = new Date(r.fecha_reserva)
            const isPast = fechaReserva < new Date()
            
            return (
              <div key={r.id_reserva} className={`reserva-card ${isPast ? 'past' : ''}`}>
                <div className="reserva-header">
                  <div className="reserva-icon">🐾</div>
                  <div className="reserva-info">
                    <h3>{r.mascota?.nombre_mascota || 'Mascota'}</h3>
                    <p className="reserva-especie">{r.mascota?.especie} • {r.mascota?.raza || 'Sin raza'}</p>
                  </div>
                  <span className={`status-badge ${r.estado_reserva}`}>
                    {r.estado_reserva}
                  </span>
                </div>
                
                <div className="reserva-body">
                  <div className="reserva-detail">
                    <span className="icon">🏥</span>
                    <div>
                      <strong>Servicio:</strong>
                      <p>{r.servicio?.nombre_servicio || '-'}</p>
                    </div>
                  </div>
                  
                  <div className="reserva-detail">
                    <span className="icon">📅</span>
                    <div>
                      <strong>Fecha:</strong>
                      <p>{fechaReserva.toLocaleDateString('es-ES', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}</p>
                    </div>
                  </div>
                  
                  <div className="reserva-detail">
                    <span className="icon">⏰</span>
                    <div>
                      <strong>Hora:</strong>
                      <p>{r.hora_reserva}</p>
                    </div>
                  </div>

                  {r.servicio?.duracion && (
                    <div className="reserva-detail">
                      <span className="icon">⏱️</span>
                      <div>
                        <strong>Duración:</strong>
                        <p>{r.servicio.duracion} minutos</p>
                      </div>
                    </div>
                  )}

                  {r.comentarios && (
                    <div className="reserva-detail full-width">
                      <span className="icon">💬</span>
                      <div>
                        <strong>Comentarios:</strong>
                        <p>{r.comentarios}</p>
                      </div>
                    </div>
                  )}
                </div>

                {r.estado_reserva === 'pendiente' && !isPast && (
                  <div className="reserva-actions">
                    <button 
                      className="btn-cancel"
                      onClick={() => cancelarReserva(r.id_reserva)}
                    >
                      Cancelar Reserva
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Modal para crear nueva reserva */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nueva Reserva</h2>
              <button className="btn-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="reserva-form">
              <div className="form-group">
                <label htmlFor="mascota">Mascota *</label>
                <select
                  id="mascota"
                  required
                  value={formData.ci_mascota}
                  onChange={(e) => setFormData({...formData, ci_mascota: e.target.value})}
                >
                  <option value="">Selecciona una mascota</option>
                  {mascotas.map(m => (
                    <option key={m.ci_mascota} value={m.ci_mascota}>
                      {m.nombre_mascota} ({m.especie})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="servicio">Servicio *</label>
                <select
                  id="servicio"
                  required
                  value={formData.id_servicio}
                  onChange={(e) => setFormData({...formData, id_servicio: e.target.value})}
                >
                  <option value="">Selecciona un servicio</option>
                  {servicios.map(s => (
                    <option key={s.id_servicio} value={s.id_servicio}>
                      {s.nombre_servicio} - ${s.precio_base}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fecha">Fecha *</label>
                  <DatePicker
                    selected={formData.fecha_reserva ? new Date(formData.fecha_reserva) : null}
                    onChange={(date) => setFormData({...formData, fecha_reserva: date ? date.toISOString().split('T')[0] : ''})}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Seleccionar fecha"
                    minDate={new Date()}
                    className="date-picker-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="hora">Hora *</label>
                  <input
                    type="time"
                    id="hora"
                    required
                    value={formData.hora_reserva}
                    onChange={(e) => setFormData({...formData, hora_reserva: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="comentarios">Comentarios</label>
                <textarea
                  id="comentarios"
                  rows="3"
                  placeholder="Información adicional sobre la reserva..."
                  value={formData.comentarios}
                  onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Crear Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reservas
