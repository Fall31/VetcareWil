import React, { useState, useEffect } from 'react'
import './CatalogoVacunas.css'

// Datos extendidos de vacunas
const VACUNAS_DATA = [
  { 
    id: 1, 
    nombre: 'Vacuna Antirrábica', 
    descripcion: 'Protección esencial contra el virus de la rabia, enfermedad mortal que afecta el sistema nervioso',
    precio: 50,
    especie: 'Ambos',
    dosis: 'Anual',
    edad_minima: '3 meses',
    icon: '💉'
  },
  { 
    id: 2, 
    nombre: 'Vacuna Triple Felina', 
    descripcion: 'Protección integral contra panleucopenia, rinotraqueítis y calicivirus felino',
    precio: 80,
    especie: 'Gatos',
    dosis: 'Anual',
    edad_minima: '6 semanas',
    icon: '🐱'
  },
  { 
    id: 3, 
    nombre: 'Vacuna Parvovirus', 
    descripcion: 'Prevención contra el parvovirus canino, enfermedad gastrointestinal grave',
    precio: 60,
    especie: 'Perros',
    dosis: 'Cada 3 años',
    edad_minima: '6 semanas',
    icon: '🐕'
  },
  { 
    id: 4, 
    nombre: 'Vacuna Séxtuple Canina', 
    descripcion: 'Protección completa contra moquillo, hepatitis, parvovirus, parainfluenza y leptospirosis',
    precio: 90,
    especie: 'Perros',
    dosis: 'Anual',
    edad_minima: '6 semanas',
    icon: '🐶'
  },
  { 
    id: 5, 
    nombre: 'Vacuna Leucemia Felina', 
    descripcion: 'Prevención del virus de leucemia felina (FeLV), enfermedad inmunosupresora',
    precio: 70,
    especie: 'Gatos',
    dosis: 'Anual',
    edad_minima: '8 semanas',
    icon: '🐈'
  },
  { 
    id: 6, 
    nombre: 'Vacuna Bordetella', 
    descripcion: 'Protección contra la tos de las perreras, infección respiratoria contagiosa',
    precio: 55,
    especie: 'Perros',
    dosis: 'Cada 6 meses',
    edad_minima: '8 semanas',
    icon: '🏥'
  },
]

const CatalogoVacunas = () => {
  const [vacunas, setVacunas] = useState(VACUNAS_DATA)
  const [busqueda, setBusqueda] = useState('')
  const [especieFiltro, setEspecieFiltro] = useState('Todos')
  const [ordenPrecio, setOrdenPrecio] = useState('Todos')

  // Filtrar vacunas
  useEffect(() => {
    let resultado = [...VACUNAS_DATA]

    // Filtro por búsqueda
    if (busqueda) {
      resultado = resultado.filter(vacuna =>
        vacuna.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        vacuna.descripcion.toLowerCase().includes(busqueda.toLowerCase())
      )
    }

    // Filtro por especie
    if (especieFiltro !== 'Todos') {
      resultado = resultado.filter(vacuna => 
        vacuna.especie === especieFiltro || vacuna.especie === 'Ambos'
      )
    }

    // Ordenar por precio
    if (ordenPrecio === 'Menor a Mayor') {
      resultado.sort((a, b) => a.precio - b.precio)
    } else if (ordenPrecio === 'Mayor a Menor') {
      resultado.sort((a, b) => b.precio - a.precio)
    }

    setVacunas(resultado)
  }, [busqueda, especieFiltro, ordenPrecio])

  const handleAgendar = (vacuna) => {
    alert(`¡Agendando cita para: ${vacuna.nombre}!\nPor favor, dirígete a la sección de Reservas para completar tu cita.`)
  }

  return (
    <div className="catalogo-vacunas-page">
      <div className="vacunas-header">
        <h1>Catálogo de Vacunas</h1>
        <p className="vacunas-subtitle">
          Plan de vacunación completo para proteger la salud de tu mascota
        </p>
      </div>

      <div className="search-filters-container">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder="Buscar vacunas por nombre o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="especie-filter">Especie</label>
            <select
              id="especie-filter"
              className="filter-select"
              value={especieFiltro}
              onChange={(e) => setEspecieFiltro(e.target.value)}
            >
              <option value="Todos">Todas las especies</option>
              <option value="Perros">Perros</option>
              <option value="Gatos">Gatos</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="precio-filter">Ordenar por Precio</label>
            <select
              id="precio-filter"
              className="filter-select"
              value={ordenPrecio}
              onChange={(e) => setOrdenPrecio(e.target.value)}
            >
              <option value="Todos">Sin ordenar</option>
              <option value="Menor a Mayor">Menor a Mayor</option>
              <option value="Mayor a Menor">Mayor a Menor</option>
            </select>
          </div>
        </div>
      </div>

      {vacunas.length > 0 ? (
        <div className="vacunas-grid">
          {vacunas.map((vacuna, index) => (
            <div 
              key={vacuna.id} 
              className="vacuna-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="vacuna-icon">{vacuna.icon}</div>
              <h3 className="vacuna-nombre">{vacuna.nombre}</h3>
              <p className="vacuna-descripcion">{vacuna.descripcion}</p>

              <div className="vacuna-info-row">
                <span className="info-label">Especie:</span>
                <span className="info-value">{vacuna.especie}</span>
              </div>

              <div className="vacuna-info-row">
                <span className="info-label">Frecuencia:</span>
                <span className="info-value">{vacuna.dosis}</span>
              </div>

              <div className="vacuna-info-row">
                <span className="info-label">Edad Mínima:</span>
                <span className="info-value">{vacuna.edad_minima}</span>
              </div>

              <div className="vacuna-precio">
                <span className="precio-label">Precio</span>
                Bs. {vacuna.precio}
              </div>

              <button 
                className="btn-agendar-vacuna"
                onClick={() => handleAgendar(vacuna)}
              >
                📅 Agendar Cita
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-vacunas">
          <div className="no-vacunas-icon">💉</div>
          <p>No se encontraron vacunas con los filtros seleccionados</p>
        </div>
      )}
    </div>
  )
}

export default CatalogoVacunas