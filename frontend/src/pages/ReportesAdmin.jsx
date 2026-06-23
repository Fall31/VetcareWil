import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './ReportesAdmin.css'

const ReportesAdmin = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [inventario, setInventario] = useState([])
  const [horariosAsignaciones, setHorariosAsignaciones] = useState([])
  const [clientesCount, setClientesCount] = useState(0)
  const [stats, setStats] = useState({ totalInventario: 0, stockBajo: 0, totalHorarios: 0, totalPersonal: 0 })

  useEffect(() => {
    cargarReporte()
  }, [])

  const cargarReporte = async () => {
    try {
      setLoading(true)
      setError('')

      // Inventario (unir con producto para nombres)
      const invRes = await supabase
        .from('inventario')
        .select(`
          *,
          producto:id_producto (
            id_producto,
            nombre_producto,
            precio
          )
        `)
        .order('id_inventario', { ascending: false })

      if (invRes.error) throw invRes.error

      const inventarioData = invRes.data || []
      setInventario(inventarioData)

      // Horarios asignaciones: unir horario_personal con horario y personal
      const hpRes = await supabase
        .from('horario_personal')
        .select(`
          id_horario_personal,
          id_horario,
          ci_personal,
          fecha_asignacion,
          personal:ci_personal (
            ci_personal,
            nombre_personal,
            primer_apellido,
            id_cargo,
            cargo:id_cargo ( nombre_cargo )
          ),
          horario:id_horario (
            id_horario,
            dia_semana,
            hora_inicio,
            hora_fin,
            descripcion
          )
        `)
        .order('fecha_asignacion', { ascending: true })

      if (hpRes.error) throw hpRes.error
      setHorariosAsignaciones(hpRes.data || [])

      // Contar clientes
      const clientesRes = await supabase.from('cliente').select('*', { count: 'exact', head: true })
      if (clientesRes.error) throw clientesRes.error
      setClientesCount(clientesRes.count || 0)

      // Stats básicos
      const stockBajo = inventarioData.filter(i => (i.stock_actual ?? 0) <= (i.stock_minimo ?? 0)).length
      const totalInventario = inventarioData.length

      // contar personal y horarios
      const personalRes = await supabase.from('personal').select('*')
      const horariosRes = await supabase.from('horario').select('*')

      setStats({ totalInventario, stockBajo, totalHorarios: (horariosRes.data || []).length, totalPersonal: (personalRes.data || []).length })

      setLoading(false)
    } catch (err) {
      console.error('Error generando reporte:', err)
      setError(err.message || String(err))
      setLoading(false)
    }
  }

  if (loading) return <div className="reportes-loading">⏳ Generando reporte...</div>

  return (
    <div className="reportes-page">
      <div className="page-header">
        <h1>📑 Reportes Administrativos</h1>
        <p className="subtitle">Inventario, Horarios y Conteo de Clientes</p>
      </div>

      {error && <div className="error-banner">❌ {error}</div>}

      <div className="summary-grid">
        <div className="summary-card">
          <div className="card-icon">📦</div>
          <div className="card-body">
            <h3>Inventario</h3>
            <div className="big-number">{stats.totalInventario}</div>
            <p>{stats.stockBajo} items con stock bajo</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">🕐</div>
          <div className="card-body">
            <h3>Horarios</h3>
            <div className="big-number">{stats.totalHorarios}</div>
            <p>{horariosAsignaciones.length} asignaciones activas</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">👥</div>
          <div className="card-body">
            <h3>Clientes</h3>
            <div className="big-number">{clientesCount}</div>
            <p>Total de clientes registrados</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon">👨‍⚕️</div>
          <div className="card-body">
            <h3>Personal</h3>
            <div className="big-number">{stats.totalPersonal}</div>
            <p>Total personal registrado</p>
          </div>
        </div>
      </div>

      <div className="report-tables">
        <div className="panel">
          <h2>📋 Inventario detallado</h2>
          {inventario.length === 0 ? (
            <p className="no-data">No hay registros en inventario</p>
          ) : (
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Stock Mínimo</th>
                    <th>Stock Actual</th>
                    <th>Fecha Actualización</th>
                  </tr>
                </thead>
                <tbody>
                  {inventario.map(i => (
                    <tr key={i.id_inventario} className={(i.stock_actual ?? 0) <= (i.stock_minimo ?? 0) ? 'row-warning' : ''}>
                      <td>{i.id_inventario}</td>
                      <td>{i.producto?.nombre_producto || `#${i.id_producto}`}</td>
                      <td>{i.stock_minimo}</td>
                      <td>{i.stock_actual}</td>
                      <td>{i.fecha_actualizacion ? new Date(i.fecha_actualizacion).toLocaleDateString('es-ES') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel">
          <h2>🧭 Horarios y personal asignado</h2>
          {horariosAsignaciones.length === 0 ? (
            <p className="no-data">No hay asignaciones de horario</p>
          ) : (
            // Agrupar por horario
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Horario</th>
                    <th>Día</th>
                    <th>Empleado</th>
                    <th>Cargo</th>
                    <th>Fecha Asignación</th>
                  </tr>
                </thead>
                <tbody>
                  {horariosAsignaciones.map(hp => (
                    <tr key={hp.id_horario_personal}>
                      <td>{hp.horario?.hora_inicio} → {hp.horario?.hora_fin}</td>
                      <td>{hp.horario?.dia_semana}</td>
                      <td>{hp.personal ? `${hp.personal.nombre_personal} ${hp.personal.primer_apellido}` : hp.ci_personal}</td>
                      <td>{hp.personal?.cargo?.nombre_cargo || 'Sin cargo'}</td>
                      <td>{hp.fecha_asignacion ? new Date(hp.fecha_asignacion).toLocaleDateString('es-ES') : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="refresh-actions">
        <button className="btn-refresh" onClick={cargarReporte}>🔄 Volver a cargar reporte</button>
      </div>
    </div>
  )
}

export default ReportesAdmin
