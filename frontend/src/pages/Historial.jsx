import React, { useState } from 'react'
import './Historial.css'

// Datos estáticos de historial (pueden migrarse a un servicio después)
const HISTORIAL_DATA = [
  { id: 1, pet: 'Firulais', date: '2024-03-10', note: 'Vacunación completa' },
  { id: 2, pet: 'Mishi', date: '2023-06-12', note: 'Esterilización' },
]

const Historial = () => {
  const [entries] = useState(HISTORIAL_DATA)

  return (
    <div className="historial-page">
      <div className="page-header">
        <h1>Historial de mascotas</h1>
        <p className="subtitle">Registros médicos y atención</p>
      </div>

      <div className="history-list">
        {entries.length === 0 ? (
          <p>No hay registros en el historial.</p>
        ) : (
          entries.map((e) => (
            <div key={e.id} className="history-card">
              <div className="history-left">
                <div className="pet-name">{e.pet}</div>
                <div className="history-date">{e.date}</div>
              </div>
              <div className="history-note">{e.note}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Historial
