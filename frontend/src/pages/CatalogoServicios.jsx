import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './CatalogoServicios.css';

function CatalogoServicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState('all');
  const [sortBy, setSortBy] = useState('nombre-asc');
  const navigate = useNavigate();

  const categorias = useMemo(() => {
    if (!servicios.length) return [];
    return [...new Set(servicios.map(s => s.categoria))].sort();
  }, [servicios]);

  const serviciosFiltrados = useMemo(() => {
    let filtered = [...servicios];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.nombre.toLowerCase().includes(term) ||
        s.descripcion?.toLowerCase().includes(term)
      );
    }

    if (selectedCategoria !== 'all') {
      filtered = filtered.filter(s => s.categoria === selectedCategoria);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'nombre-asc':
          return a.nombre.localeCompare(b.nombre);
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre);
        case 'precio-asc':
          return parseFloat(a.precio) - parseFloat(b.precio);
        case 'precio-desc':
          return parseFloat(b.precio) - parseFloat(a.precio);
        default:
          return 0;
      }
    });

    return filtered;
  }, [servicios, searchTerm, selectedCategoria, sortBy]);

  useEffect(() => {
    fetchServicios();
  }, []);

  const fetchServicios = async () => {
    try {
      const { data, error } = await supabase
        .from('servicio')
        .select('*')
        .order('nombre');

      if (error) throw error;
      setServicios(data || []);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
    } finally {
      setLoading(false);
    }
  };

  const abrirReserva = (servicio) => {
    navigate('/reservas', { state: { servicioSeleccionado: servicio } });
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategoria('all');
    setSortBy('nombre-asc');
  };

  if (loading) {
    return (
      <div className="catalogo-servicios">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando servicios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="catalogo-servicios">
      <div className="catalogo-header">
        <h1>Catálogo de Servicios</h1>
        <p className="catalogo-subtitle">Descubre todos nuestros servicios veterinarios</p>
        {serviciosFiltrados.length > 0 && (
          <div className="results-count">
            {serviciosFiltrados.length} {serviciosFiltrados.length === 1 ? 'servicio encontrado' : 'servicios encontrados'}
          </div>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar servicios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-selects">
          <select
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="nombre-asc">Nombre A-Z</option>
            <option value="nombre-desc">Nombre Z-A</option>
            <option value="precio-asc">Precio: Menor a Mayor</option>
            <option value="precio-desc">Precio: Mayor a Menor</option>
          </select>
        </div>
      </div>

      {serviciosFiltrados.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"></div>
          <h3>No se encontraron servicios</h3>
          <p>Intenta ajustar los filtros de búsqueda</p>
          <button onClick={resetFilters} className="btn-reset">
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="servicios-grid">
          {serviciosFiltrados.map((servicio, index) => (
            <div
              key={servicio.id}
              className="servicio-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="servicio-header">
                <h3>{servicio.nombre}</h3>
                <span className="categoria-badge">{servicio.categoria}</span>
              </div>

              <p className="servicio-descripcion">{servicio.descripcion}</p>

              <div className="servicio-details">
                {servicio.duracion && (
                  <div className="detail-item">
                    <span className="detail-icon"></span>
                    <span>{servicio.duracion} min</span>
                  </div>
                )}
                {servicio.equipo && (
                  <div className="detail-item">
                    <span className="detail-icon"></span>
                    <span>{servicio.equipo}</span>
                  </div>
                )}
              </div>

              <div className="servicio-footer">
                <div className="precio-container">
                  <span className="precio-label">Precio</span>
                  <span className="precio"></span>
                </div>
                <button
                  className="btn-reservar"
                  onClick={() => abrirReserva(servicio)}
                >
                  Reservar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CatalogoServicios;
