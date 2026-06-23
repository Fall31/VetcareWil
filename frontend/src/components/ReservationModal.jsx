import { useState } from 'react'
import './ReservationModal.css'

const ReservationModal = ({ visible, onClose }) => {
  const [name, setName] = useState('')
  const [date, setDate] = useState('')

  if (!visible) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    alert(`Reserva creada para ${name} el ${date}`)
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        <h3>Nueva reserva</h3>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Nombre de la mascota</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />

          <label>Fecha y hora</label>
          <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />

          <div className="modal-actions">
            <button type="button" className="btn-muted" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Reservar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReservationModal
