import React, { useState, useEffect } from 'react'
import supabaseServices from '../services/supabase'
import './Doctores.css'

const Doctores = () => {
  const [doctores, setDoctores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    cargarDoctores()
  }, [])

  const cargarDoctores = async () => {
    try {
      setLoading(true)
      const data = await supabaseServices.doctores.getAll()
      setDoctores(data)
    } catch (err) {
      console.error('Error cargando doctores:', err)
      setError('No se pudieron cargar los doctores')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="doctores-page">
        <div className="loading-spinner">Cargando doctores...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="doctores-page">
        <div className="error-message">{error}</div>
      </div>
    )
  }

  return (
    <div className="doctores-page">
      <div className="page-header">
        <h1>Nuestro Equipo Médico</h1>
        <p className="subtitle">Profesionales certificados dedicados al cuidado de tus mascotas</p>
      </div>

      <div className="doctors-grid">
        {doctores.length === 0 ? (
          <p className="no-data">No hay doctores disponibles en este momento.</p>
        ) : (
          doctores.map((doctor) => {
            const iniciales = `${doctor.primer_nombre?.[0] || ''}${doctor.primer_apellido?.[0] || ''}`
            const nombreCompleto = `${doctor.primer_nombre || ''} ${doctor.segundo_nombre || ''} ${doctor.primer_apellido || ''} ${doctor.segundo_apellido || ''}`.trim()
            
            return (
              <div key={doctor.ci_personal} className="doctor-card-page">
                <div className="doctor-avatar">
                  <div className="avatar-circle">{iniciales}</div>
                  {doctor.estado === 'activo' && <span className="status-badge">✓ Activo</span>}
                </div>
                <div className="doctor-details">
                  <div className="doctor-name">{nombreCompleto}</div>
                  <div className="doctor-specialty">
                    <span className="icon">🩺</span>
                    {doctor.funcion || 'Veterinario'}
                  </div>
                  {doctor.correo && (
                    <div className="doctor-contact">
                      <span className="icon">📧</span>
                      <a href={`mailto:${doctor.correo}`}>{doctor.correo}</a>
                    </div>
                  )}
                  {doctor.telefono && (
                    <div className="doctor-contact">
                      <span className="icon">📞</span>
                      <a href={`tel:${doctor.telefono}`}>{doctor.telefono}</a>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Doctores
