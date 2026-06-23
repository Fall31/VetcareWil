import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { supabase } from '../lib/supabaseClient'
import './Inventario.css'

const Inventario = () => {
  const [inventario, setInventario] = useState([])
  const [productos, setProductos] = useState([])
  const [form, setForm] = useState({ 
    id_producto: '', 
    stock_minimo: 0, 
    stock_actual: 0, 
    fecha_actualizacion: new Date().toISOString().split('T')[0] 
  })
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchDatos = async () => {
    setLoading(true)
    await Promise.all([fetchInventario(), fetchProductos()])
    setLoading(false)
  }

  const fetchInventario = async () => {
    try {
      const { data, error } = await supabase
        .from('inventario')
        .select(`
          *,
          producto:id_producto (
            nombre_producto,
            precio
          )
        `)
        .order('id_inventario', { ascending: false })

      if (error) throw error
      setInventario(data || [])
    } catch (err) {
      console.error(err)
      setError('Error cargando inventario')
    }
  }

  const fetchProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select('*')
        .order('nombre_producto')

      if (error) throw error
      setProductos(data || [])
    } catch (err) {
      console.error(err)
      setError('Error cargando productos')
    }
  }

  const handleCreate = async () => {
    setError('')
    setMensaje('')
    
    try {
      if (!form.id_producto) {
        setError('Selecciona un producto')
        return
      }

      const { error } = await supabase
        .from('inventario')
        .insert([form])

      if (error) throw error

      setMensaje('✅ Registro creado correctamente')
      setForm({ 
        id_producto: '', 
        stock_minimo: 0, 
        stock_actual: 0, 
        fecha_actualizacion: new Date().toISOString().split('T')[0] 
      })
      fetchInventario()
    } catch (err) {
      console.error(err)
      setError('Error creando registro: ' + err.message)
    }
  }

  const handleSave = async (id) => {
    setError('')
    setMensaje('')
    
    try {
      const item = inventario.find(i => i.id_inventario === id)
      if (!item) return

      const payload = { 
        stock_minimo: item.stock_minimo, 
        stock_actual: item.stock_actual, 
        fecha_actualizacion: new Date().toISOString() 
      }

      const { error } = await supabase
        .from('inventario')
        .update(payload)
        .eq('id_inventario', id)

      if (error) throw error

      setMensaje('✅ Actualizado correctamente')
      setEditId(null)
      fetchInventario()
    } catch (err) {
      console.error(err)
      setError('Error actualizando: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro de inventario?')) return

    try {
      const { error } = await supabase
        .from('inventario')
        .delete()
        .eq('id_inventario', id)

      if (error) throw error

      setMensaje('✅ Eliminado correctamente')
      fetchInventario()
    } catch (err) {
      console.error(err)
      setError('Error eliminando: ' + err.message)
    }
  }

  if (loading) {
    return <div className="inventario-loading">⏳ Cargando inventario...</div>
  }

  return (
    <div className="inventario-page">
      <div className="inventario-header">
        <h1>📦 Gestión de Inventario</h1>
        <p className="subtitle">Control de stock de productos</p>
      </div>

      {error && <div className="error-message">❌ {error}</div>}
      {mensaje && <div className="success-message">{mensaje}</div>}

      <div className="inventario-form-card">
        <h2>📝 Nuevo Registro</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="producto">Producto *</label>
            <select 
              id="producto"
              value={form.id_producto} 
              onChange={(e) => setForm({...form, id_producto: e.target.value })}
            >
              <option value="">Seleccionar producto</option>
              {productos.map(p => (
                <option key={p.id_producto} value={p.id_producto}>
                  {p.nombre_producto} - Bs. {p.precio}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="stock-minimo">Stock Mínimo *</label>
            <input 
              id="stock-minimo"
              type="number" 
              min="0"
              value={form.stock_minimo} 
              onChange={(e) => setForm({...form, stock_minimo: Number(e.target.value)})} 
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="stock-actual">Stock Actual *</label>
            <input 
              id="stock-actual"
              type="number" 
              min="0"
              value={form.stock_actual} 
              onChange={(e) => setForm({...form, stock_actual: Number(e.target.value)})} 
            />
          </div>

          <div className="form-group">
            <label htmlFor="fecha">Fecha de Actualización</label>
            <DatePicker
              selected={form.fecha_actualizacion ? new Date(form.fecha_actualizacion) : null}
              onChange={(date) => setForm({...form, fecha_actualizacion: date ? date.toISOString().split('T')[0] : ''})}
              dateFormat="dd/MM/yyyy"
              placeholderText="Seleccionar fecha"
              className="date-picker-input"
            />
          </div>
        </div>

        <button className="btn-crear" onClick={handleCreate}>
          ➕ Crear Registro
        </button>
      </div>

      <div className="inventario-table-card">
        <h2>📋 Registros de Inventario</h2>
        
        <div className="table-responsive">
          <table className="inventario-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Stock Mínimo</th>
                <th>Stock Actual</th>
                <th>Estado</th>
                <th>Última Actualización</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {inventario.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    📦 No hay registros de inventario
                  </td>
                </tr>
              ) : (
                inventario.map(item => (
                  <tr key={item.id_inventario} className={item.stock_actual <= item.stock_minimo ? 'row-warning' : ''}>
                    <td>{item.id_inventario}</td>
                    <td className="producto-name">
                      {item.producto?.nombre_producto || `Producto #${item.id_producto}`}
                    </td>
                    <td>
                      {editId === item.id_inventario ? (
                        <input 
                          type="number" 
                          min="0"
                          className="inline-input"
                          value={item.stock_minimo} 
                          onChange={(e) => setInventario(
                            inventario.map(i => 
                              i.id_inventario === item.id_inventario 
                                ? {...i, stock_minimo: Number(e.target.value)} 
                                : i
                            )
                          )} 
                        />
                      ) : (
                        <span className="stock-value">{item.stock_minimo}</span>
                      )}
                    </td>
                    <td>
                      {editId === item.id_inventario ? (
                        <input 
                          type="number" 
                          min="0"
                          className="inline-input"
                          value={item.stock_actual} 
                          onChange={(e) => setInventario(
                            inventario.map(i => 
                              i.id_inventario === item.id_inventario 
                                ? {...i, stock_actual: Number(e.target.value)} 
                                : i
                            )
                          )} 
                        />
                      ) : (
                        <span className="stock-value">{item.stock_actual}</span>
                      )}
                    </td>
                    <td>
                      {item.stock_actual <= item.stock_minimo ? (
                        <span className="badge badge-danger">⚠️ Bajo</span>
                      ) : item.stock_actual <= item.stock_minimo * 1.5 ? (
                        <span className="badge badge-warning">⚡ Medio</span>
                      ) : (
                        <span className="badge badge-success">✅ OK</span>
                      )}
                    </td>
                    <td>
                      {item.fecha_actualizacion 
                        ? new Date(item.fecha_actualizacion).toLocaleDateString('es-ES') 
                        : '-'
                      }
                    </td>
                    <td>
                      <div className="action-buttons">
                        {editId === item.id_inventario ? (
                          <>
                            <button 
                              className="btn-save" 
                              onClick={() => handleSave(item.id_inventario)}
                            >
                              💾
                            </button>
                            <button 
                              className="btn-cancel" 
                              onClick={() => setEditId(null)}
                            >
                              ✖️
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              className="btn-edit" 
                              onClick={() => setEditId(item.id_inventario)}
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn-delete" 
                              onClick={() => handleDelete(item.id_inventario)}
                            >
                              🗑️
                            </button>
                          </>
                        )}
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

export default Inventario
