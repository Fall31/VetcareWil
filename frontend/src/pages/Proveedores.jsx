import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Proveedores.css'

const Proveedores = () => {
  const [proveedores, setProveedores] = useState([])
  const [form, setForm] = useState({ 
    nombre_proveedor: '', 
    telefono_proveedor: '', 
    correo_proveedor: '', 
    direccion_proveedor: '' 
  })
  const [editId, setEditId] = useState(null)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProveedores()
  }, [])

  const fetchProveedores = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('proveedor')
        .select('*')
        .order('nombre_proveedor')

      if (error) throw error
      setProveedores(data || [])
      setLoading(false)
    } catch (err) {
      console.error(err)
      setError('Error cargando proveedores')
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    setError('')
    setMensaje('')

    try {
      if (!form.nombre_proveedor) { 
        setError('El nombre es requerido')
        return 
      }

      const { error } = await supabase
        .from('proveedor')
        .insert([form])

      if (error) throw error

      setMensaje('✅ Proveedor creado correctamente')
      setForm({ 
        nombre_proveedor: '', 
        telefono_proveedor: '', 
        correo_proveedor: '', 
        direccion_proveedor: '' 
      })
      fetchProveedores()
    } catch (err) {
      console.error(err)
      setError('Error creando proveedor: ' + err.message)
    }
  }

  const handleSave = async (id) => {
    setError('')
    setMensaje('')

    try {
      const item = proveedores.find(p => p.id_proveedor === id)
      if (!item) return

      const payload = { 
        nombre_proveedor: item.nombre_proveedor, 
        telefono_proveedor: item.telefono_proveedor, 
        correo_proveedor: item.correo_proveedor, 
        direccion_proveedor: item.direccion_proveedor 
      }

      const { error } = await supabase
        .from('proveedor')
        .update(payload)
        .eq('id_proveedor', id)

      if (error) throw error

      setMensaje('✅ Proveedor actualizado correctamente')
      setEditId(null)
      fetchProveedores()
    } catch (err) {
      console.error(err)
      setError('Error actualizando proveedor: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este proveedor?')) return

    try {
      const { error } = await supabase
        .from('proveedor')
        .delete()
        .eq('id_proveedor', id)

      if (error) throw error

      setMensaje('✅ Proveedor eliminado correctamente')
      fetchProveedores()
    } catch (err) {
      console.error(err)
      setError('Error eliminando proveedor: ' + err.message)
    }
  }

  if (loading) {
    return <div className="proveedores-loading">⏳ Cargando proveedores...</div>
  }

  return (
    <div className="proveedores-page">
      <div className="proveedores-header">
        <h1>🏭 Gestión de Proveedores</h1>
        <p className="subtitle">Administración de proveedores de productos</p>
      </div>

      {error && <div className="error-message">❌ {error}</div>}
      {mensaje && <div className="success-message">{mensaje}</div>}

      <div className="proveedores-form-card">
        <h2>📝 Nuevo Proveedor</h2>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nombre">Nombre *</label>
            <input 
              id="nombre"
              type="text"
              value={form.nombre_proveedor} 
              onChange={(e) => setForm({...form, nombre_proveedor: e.target.value})} 
              placeholder="Nombre del proveedor"
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefono">Teléfono</label>
            <input 
              id="telefono"
              type="tel"
              value={form.telefono_proveedor} 
              onChange={(e) => setForm({...form, telefono_proveedor: e.target.value})} 
              placeholder="Número de teléfono"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="correo">Correo Electrónico</label>
            <input 
              id="correo"
              type="email"
              value={form.correo_proveedor} 
              onChange={(e) => setForm({...form, correo_proveedor: e.target.value})} 
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="direccion">Dirección</label>
            <input 
              id="direccion"
              type="text"
              value={form.direccion_proveedor} 
              onChange={(e) => setForm({...form, direccion_proveedor: e.target.value})} 
              placeholder="Dirección del proveedor"
            />
          </div>
        </div>

        <button className="btn-crear" onClick={handleCreate}>
          ➕ Crear Proveedor
        </button>
      </div>

      <div className="proveedores-table-card">
        <h2>📋 Lista de Proveedores</h2>
        
        <div className="table-responsive">
          <table className="proveedores-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Dirección</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {proveedores.length === 0 ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    🏭 No hay proveedores registrados
                  </td>
                </tr>
              ) : (
                proveedores.map(p => (
                  <tr key={p.id_proveedor}>
                    <td>{p.id_proveedor}</td>
                    <td>
                      {editId === p.id_proveedor ? (
                        <input 
                          className="inline-input full-width"
                          value={p.nombre_proveedor} 
                          onChange={(e) => setProveedores(
                            proveedores.map(pp => 
                              pp.id_proveedor === p.id_proveedor 
                                ? {...pp, nombre_proveedor: e.target.value} 
                                : pp
                            )
                          )}
                        />
                      ) : (
                        <span className="proveedor-name">{p.nombre_proveedor}</span>
                      )}
                    </td>
                    <td>
                      {editId === p.id_proveedor ? (
                        <input 
                          className="inline-input"
                          value={p.telefono_proveedor} 
                          onChange={(e) => setProveedores(
                            proveedores.map(pp => 
                              pp.id_proveedor === p.id_proveedor 
                                ? {...pp, telefono_proveedor: e.target.value} 
                                : pp
                            )
                          )}
                        />
                      ) : (
                        p.telefono_proveedor || '-'
                      )}
                    </td>
                    <td>
                      {editId === p.id_proveedor ? (
                        <input 
                          className="inline-input full-width"
                          value={p.correo_proveedor} 
                          onChange={(e) => setProveedores(
                            proveedores.map(pp => 
                              pp.id_proveedor === p.id_proveedor 
                                ? {...pp, correo_proveedor: e.target.value} 
                                : pp
                            )
                          )}
                        />
                      ) : (
                        p.correo_proveedor || '-'
                      )}
                    </td>
                    <td>
                      {editId === p.id_proveedor ? (
                        <input 
                          className="inline-input full-width"
                          value={p.direccion_proveedor} 
                          onChange={(e) => setProveedores(
                            proveedores.map(pp => 
                              pp.id_proveedor === p.id_proveedor 
                                ? {...pp, direccion_proveedor: e.target.value} 
                                : pp
                            )
                          )}
                        />
                      ) : (
                        p.direccion_proveedor || '-'
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        {editId === p.id_proveedor ? (
                          <>
                            <button 
                              className="btn-save" 
                              onClick={() => handleSave(p.id_proveedor)}
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
                              onClick={() => setEditId(p.id_proveedor)}
                            >
                              ✏️
                            </button>
                            <button 
                              className="btn-delete" 
                              onClick={() => handleDelete(p.id_proveedor)}
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

export default Proveedores
