import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './DashboardAdmin.css'

const DashboardAdmin = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Servicios
  const [servicios, setServicios] = useState([])
  const [statsServicios, setStatsServicios] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    precioPromedio: 0,
  })

  // Inventario
  const [inventario, setInventario] = useState([])
  const [statsInventario, setStatsInventario] = useState({
    total: 0,
    stockBajo: 0,
    stockPromedio: 0,
    valorTotal: 0,
  })

  // Proveedores
  const [proveedores, setProveedores] = useState([])
  const [statsProveedores, setStatsProveedores] = useState({
    total: 0,
  })

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      setError('')

      const [serviciosData, inventarioData, proveedoresData] = await Promise.all([
        supabase.from('servicio').select('*'),
        supabase.from('inventario').select('*'),
        supabase.from('proveedor').select('*'),
      ])

      if (serviciosData.error) throw serviciosData.error
      if (inventarioData.error) throw inventarioData.error
      if (proveedoresData.error) throw proveedoresData.error

      // Procesar servicios
      const servicios = serviciosData.data || []
      setServicios(servicios.slice(0, 10)) // Mostrar top 10
      const activos = servicios.filter(s => s.estado_servicio === 'activo').length
      const inactivos = servicios.filter(s => s.estado_servicio !== 'activo').length
      const precioPromedio = servicios.length > 0
        ? (servicios.reduce((sum, s) => sum + (s.precio_base || 0), 0) / servicios.length).toFixed(2)
        : 0

      setStatsServicios({
        total: servicios.length,
        activos,
        inactivos,
        precioPromedio,
      })

      // Procesar inventario
      const inventario = inventarioData.data || []
      setInventario(inventario.slice(0, 10)) // Mostrar top 10
      const stockBajo = inventario.filter(i => i.stock_actual <= i.stock_minimo).length
      const stockPromedio = inventario.length > 0
        ? (inventario.reduce((sum, i) => sum + (i.stock_actual || 0), 0) / inventario.length).toFixed(1)
        : 0

      setStatsInventario({
        total: inventario.length,
        stockBajo,
        stockPromedio,
        valorTotal: '0', // Podría calcularse si hay precio en inventario
      })

      // Procesar proveedores
      const proveedores = proveedoresData.data || []
      setProveedores(proveedores.slice(0, 10))

      setStatsProveedores({
        total: proveedores.length,
      })

      setLoading(false)
    } catch (err) {
      console.error('Error cargando datos:', err)
      setError('Error cargando datos del dashboard: ' + err.message)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="dashboard-loading">⏳ Cargando dashboard administrativo...</div>
  }

  return (
    <div className="dashboard-admin-page">
      <div className="page-header">
        <h1>📊 Dashboard Administrativo</h1>
        <p className="subtitle">Resumen de Servicios, Inventario y Proveedores</p>
      </div>

      {error && <div className="error-banner">❌ {error}</div>}

      {/* ROW 1: Stats principales */}
      <div className="stats-grid">
        <div className="stat-card stat-servicios">
          <div className="stat-icon">💼</div>
          <div className="stat-content">
            <h3>Servicios</h3>
            <div className="stat-number">{statsServicios.total}</div>
            <div className="stat-details">
              <span className="detail-item active">{statsServicios.activos} activos</span>
              <span className="detail-item inactive">{statsServicios.inactivos} inactivos</span>
            </div>
            <p className="stat-info">Precio promedio: Bs. {statsServicios.precioPromedio}</p>
          </div>
        </div>

        <div className="stat-card stat-inventario">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Inventario</h3>
            <div className="stat-number">{statsInventario.total}</div>
            <div className="stat-details">
              <span className="detail-item warning">{statsInventario.stockBajo} stock bajo</span>
            </div>
            <p className="stat-info">Stock promedio: {statsInventario.stockPromedio} unidades</p>
          </div>
        </div>

        <div className="stat-card stat-proveedores">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <h3>Proveedores</h3>
            <div className="stat-number">{statsProveedores.total}</div>
            <p className="stat-info">Proveedores activos</p>
          </div>
        </div>
      </div>

      {/* ROW 2: Tablas de resumen */}
      <div className="tables-grid">
        {/* Tabla Servicios */}
        <div className="table-card">
          <h2>💼 Servicios Recientes</h2>
          {servicios.length === 0 ? (
            <p className="no-data">No hay servicios</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th>Categoría</th>
                  </tr>
                </thead>
                <tbody>
                  {servicios.map(s => (
                    <tr key={s.id_servicio}>
                      <td className="name-cell">{s.nombre_servicio}</td>
                      <td>Bs. {Number(s.precio_base).toFixed(2)}</td>
                      <td>
                        <span className={`status-badge status-${s.estado_servicio}`}>
                          {s.estado_servicio.charAt(0).toUpperCase() + s.estado_servicio.slice(1)}
                        </span>
                      </td>
                      <td>{s.categoria || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tabla Inventario */}
        <div className="table-card">
          <h2>📦 Stock Bajo</h2>
          {inventario.filter(i => i.stock_actual <= i.stock_minimo).length === 0 ? (
            <p className="no-data">✅ No hay items con stock bajo</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID Producto</th>
                    <th>Stock Mínimo</th>
                    <th>Stock Actual</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario
                    .filter(i => i.stock_actual <= i.stock_minimo)
                    .map(i => (
                      <tr key={i.id_inventario} className="row-warning">
                        <td>{i.id_producto}</td>
                        <td>{i.stock_minimo}</td>
                        <td className="value-low">{i.stock_actual}</td>
                        <td>
                          <span className="status-badge status-bajo">⚠️ Bajo</span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tabla Proveedores */}
        <div className="table-card">
          <h2>🏢 Proveedores</h2>
          {proveedores.length === 0 ? (
            <p className="no-data">No hay proveedores</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Contacto</th>
                    <th>Teléfono</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {proveedores.map(p => (
                    <tr key={p.id_proveedor}>
                      <td className="name-cell">{p.nombre || p.razon_social || '-'}</td>
                      <td>{p.nombre_contacto || '-'}</td>
                      <td>{p.telefono || '-'}</td>
                      <td className="email-cell">{p.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ROW 3: Alertas y acciones */}
      <div className="alerts-section">
        <h2>🔔 Alertas y Recomendaciones</h2>
        <div className="alerts-grid">
          {statsInventario.stockBajo > 0 && (
            <div className="alert-item alert-warning">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <h4>Stock Bajo</h4>
                <p>{statsInventario.stockBajo} productos tienen stock bajo o crítico. Considera hacer pedidos a proveedores.</p>
              </div>
            </div>
          )}

          {statsServicios.inactivos > 0 && (
            <div className="alert-item alert-info">
              <span className="alert-icon">ℹ️</span>
              <div className="alert-content">
                <h4>Servicios Inactivos</h4>
                <p>{statsServicios.inactivos} servicios están marcados como inactivos.</p>
              </div>
            </div>
          )}

          {statsProveedores.total > 0 && (
            <div className="alert-item alert-success">
              <span className="alert-icon">✅</span>
              <div className="alert-content">
                <h4>Proveedores Disponibles</h4>
                <p>Tienes {statsProveedores.total} proveedores registrados en el sistema.</p>
              </div>
            </div>
          )}

          {statsServicios.total === 0 && (
            <div className="alert-item alert-info">
              <span className="alert-icon">ℹ️</span>
              <div className="alert-content">
                <h4>Sin Servicios</h4>
                <p>Aún no has registrado servicios. Ve a la sección de Servicios para agregar algunos.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Botón de actualizar */}
      <div className="refresh-section">
        <button onClick={fetchAllData} className="btn-refresh">
          🔄 Actualizar Datos
        </button>
      </div>
    </div>
  )
}

export default DashboardAdmin
