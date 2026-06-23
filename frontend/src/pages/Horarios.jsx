import React, { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { supabase } from '../lib/supabaseClient'
import './Horarios.css'

const Horarios = () => {
  const [horariosPersonal, setHorariosPersonal] = useState([])
  const [personal, setPersonal] = useState([])
  const [horariosBase, setHorariosBase] = useState([])
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)
  const [nuevaAsignacion, setNuevaAsignacion] = useState({
    ci_personal: '',
    id_horario: '',
    fecha_asignacion: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    await Promise.all([
      cargarHorarioPersonal(),
      cargarPersonal(),
      cargarHorariosBase()
    ])
    setLoading(false)
  }

  const cargarHorarioPersonal = async () => {
    try {
      const { data, error } = await supabase
        .from('horario_personal')
        .select(`
          id_horario_personal,
          ci_personal,
          id_horario,
          fecha_asignacion,
          personal:ci_personal (
            nombre_personal,
            primer_apellido,
            id_cargo,
            cargo:id_cargo (
              nombre_cargo
            )
          ),
          horario:id_horario (
            dia_semana,
            hora_inicio,
            hora_fin
          )
        `)
        .order('fecha_asignacion', { ascending: false })
      
      if (error) throw error
      setHorariosPersonal(data || [])
    } catch (error) {
      setError('Error al cargar los horarios del personal')
      console.error('Error:', error)
    }
  }

  const cargarPersonal = async () => {
    try {
      const { data, error } = await supabase
        .from('personal')
        .select(`
          ci_personal,
          nombre_personal,
          primer_apellido,
          id_cargo,
          cargo:id_cargo (
            nombre_cargo
          )
        `)
        .order('nombre_personal')
      
      if (error) throw error
      setPersonal(data || [])
    } catch (error) {
      setError('Error al cargar el personal')
      console.error('Error:', error)
    }
  }

  const cargarHorariosBase = async () => {
    try {
      const { data, error } = await supabase
        .from('horario')
        .select('*')
        .order('dia_semana', { ascending: true })
      
      if (error) throw error
      setHorariosBase(data || [])
    } catch (error) {
      setError('Error al cargar los horarios base')
      console.error('Error:', error)
    }
  }

  const guardarAsignacionHorario = async () => {
    setError('')
    setMensaje('')

    try {
      if (!nuevaAsignacion.ci_personal || !nuevaAsignacion.id_horario) {
        setError('Debe seleccionar el personal y el horario')
        return
      }

      const { error } = await supabase
        .from('horario_personal')
        .insert([nuevaAsignacion])

      if (error) throw error
      
      setMensaje('✅ Horario asignado correctamente')
      setNuevaAsignacion({
        ci_personal: '',
        id_horario: '',
        fecha_asignacion: new Date().toISOString().split('T')[0]
      })
      cargarHorarioPersonal()
    } catch (error) {
      setError('Error al guardar la asignación: ' + error.message)
      console.error('Error:', error)
    }
  }

  const eliminarAsignacion = async (id) => {
    if (!window.confirm('¿Eliminar esta asignación de horario?')) return

    try {
      const { error } = await supabase
        .from('horario_personal')
        .delete()
        .eq('id_horario_personal', id)

      if (error) throw error
      
      setMensaje('✅ Asignación eliminada correctamente')
      cargarHorarioPersonal()
    } catch (error) {
      setError('Error al eliminar: ' + error.message)
      console.error('Error:', error)
    }
  }

  if (loading) {
    return <div className="horarios-loading">⏳ Cargando horarios...</div>
  }

  return (
    <div className="horarios-page">
      <div className="horarios-header">
        <h1>🕐 Administración de Horarios</h1>
        <p className="subtitle">Gestión de horarios del personal veterinario</p>
      </div>

      {error && <div className="error-message">❌ {error}</div>}
      {mensaje && <div className="success-message">{mensaje}</div>}
      
      <div className="horarios-form-card">
        <h2>📝 Nueva Asignación de Horario</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="personal">Personal *</label>
            <select
              id="personal"
              value={nuevaAsignacion.ci_personal}
              onChange={(e) => setNuevaAsignacion({...nuevaAsignacion, ci_personal: e.target.value})}
            >
              <option value="">Seleccionar Personal</option>
              {personal.map(p => (
                <option key={p.ci_personal} value={p.ci_personal}>
                  {p.nombre_personal} {p.primer_apellido} - {p.cargo?.nombre_cargo || 'Sin cargo'}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="horario">Horario *</label>
            <select
              id="horario"
              value={nuevaAsignacion.id_horario}
              onChange={(e) => setNuevaAsignacion({...nuevaAsignacion, id_horario: e.target.value})}
            >
              <option value="">Seleccionar Horario</option>
              {horariosBase.map(h => (
                <option key={h.id_horario} value={h.id_horario}>
                  {h.dia_semana} - {h.hora_inicio} a {h.hora_fin}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fecha">Fecha de Asignación *</label>
            <DatePicker
              selected={nuevaAsignacion.fecha_asignacion ? new Date(nuevaAsignacion.fecha_asignacion) : null}
              onChange={(date) => setNuevaAsignacion({...nuevaAsignacion, fecha_asignacion: date ? date.toISOString().split('T')[0] : ''})}
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha"
              className="date-picker-input"
            />
          </div>
        </div>

        <button className="btn-crear" onClick={guardarAsignacionHorario}>
          ➕ Asignar Horario
        </button>
      </div>
      
      <div className="horarios-table-card">
        <h2>📋 Horarios Asignados</h2>
        
        <div className="table-responsive">
          <table className="horarios-table">
            <thead>
              <tr>
                <th>Personal</th>
                <th>Cargo</th>
                <th>Día</th>
                <th>Horario</th>
                <th>Fecha Asignación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {horariosPersonal.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    🕐 No hay horarios asignados
                  </td>
                </tr>
              ) : (
                horariosPersonal.map((item) => (
                  <tr key={item.id_horario_personal}>
                    <td className="personal-name">
                      {item.personal?.nombre_personal} {item.personal?.primer_apellido}
                    </td>
                    <td>
                      <span className="badge badge-cargo">
                        {item.personal?.cargo?.nombre_cargo || 'Sin cargo'}
                      </span>
                    </td>
                    <td>
                      <span className="dia-semana">
                        {item.horario?.dia_semana || '-'}
                      </span>
                    </td>
                    <td>
                      <div className="horario-hours">
                        <span className="hora-inicio">{item.horario?.hora_inicio}</span>
                        <span className="separador">→</span>
                        <span className="hora-fin">{item.horario?.hora_fin}</span>
                      </div>
                    </td>
                    <td>
                      {item.fecha_asignacion 
                        ? new Date(item.fecha_asignacion).toLocaleDateString('es-ES') 
                        : '-'
                      }
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-delete"
                          onClick={() => eliminarAsignacion(item.id_horario_personal)}
                          title="Eliminar asignación"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Horarios
