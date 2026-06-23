import './PetHistory.css'

const PetHistory = ({ userId }) => {
  // placeholder sample data; in a real app fetch using userId
  const samplePets = [
    { id: 1, name: 'Firulais', especie: 'Perro', historial: [{ id: 1, text: 'Vacunación completa - 2024-03-10' }, { id: 2, text: 'Limpieza dental - 2024-09-01' }] },
    { id: 2, name: 'Mishi', especie: 'Gato', historial: [{ id: 1, text: 'Esterilización - 2023-06-12' }] },
  ]

  return (
    <div className="pet-history">
      <p className="muted">Mostrando historial para el cliente: <strong>{userId ?? 'Anon'}</strong></p>
      <div className="pets-scroll">
        {samplePets.map((p) => (
          <div key={p.id} className="pet-card">
            <div className="pet-name">{p.name} <span className="pet-specie">({p.especie})</span></div>
            <ul className="history-list">
              {p.historial.map((h) => (
                <li key={h.id}>{h.text}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}

export default PetHistory
