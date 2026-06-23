import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Servicios.css'

const Servicios = () => {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [editId, setEditId] = useState(null)

  const [form, setForm] = useState({
    nombre_servicio: '',
    precio_base: '',
    descripcion: '',
    duracion: '',
    estado_servicio: 'activo',
    categoria: '',
    requiere_equipo: false,
  })

  useEffect(() => {
    fetchServicios()
  }, [])

  const fetchServicios = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('servicio')
        .select('*')
        .order('id_servicio', { ascending: true })

      if (error) throw error
      setServicios(data || [])
      setError('')
    } catch (err) {
      console.error(err)
      setError('Error cargando servicios: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMensaje('')

    try {
      // Validar campos obligatorios
      if (!form.nombre_servicio.trim()) {
        setError('El nombre del servicio es obligatorio')
        return
      }
      if (!form.precio_base || Number(form.precio_base) < 0) {
        setError('El precio debe ser mayor o igual a 0')
        return
      }

      const payload = {
        nombre_servicio: form.nombre_servicio.trim(),
        precio_base: Number(form.precio_base),
        descripcion: form.descripcion.trim() || null,
        duracion: form.duracion ? Number(form.duracion) : null,
        estado_servicio: form.estado_servicio,
        categoria: form.categoria.trim() || null,
        requiere_equipo: form.requiere_equipo,
      }

      if (editId) {
        // Actualizar
        const { error: updateError } = await supabase
          .from('servicio')
          .update(payload)
          .eq('id_servicio', editId)

        if (updateError) throw updateError
        setMensaje('✅ Servicio actualizado correctamente')
        setEditId(null)
      } else {
        // Crear
        const { error: insertError } = await supabase
          .from('servicio')
          .insert([payload])

        if (insertError) throw insertError
        setMensaje('✅ Servicio creado correctamente')
      }

      resetForm()
      fetchServicios()
    } catch (err) {
      console.error(err)
      setError('Error guardando servicio: ' + err.message)
    }
  }

  const handleEdit = (servicio) => {
    setForm({
      nombre_servicio: servicio.nombre_servicio,
      precio_base: servicio.precio_base,
      descripcion: servicio.descripcion || '',
      duracion: servicio.duracion || '',
      estado_servicio: servicio.estado_servicio,
      categoria: servicio.categoria || '',
      requiere_equipo: servicio.requiere_equipo || false,
    })
    setEditId(servicio.id_servicio)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este servicio?')) return

    try {
      setError('')
      const { error: deleteError } = await supabase
        .from('servicio')
        .delete()
        .eq('id_servicio', id)

      if (deleteError) throw deleteError
      setMensaje('✅ Servicio eliminado correctamente')
      fetchServicios()
    } catch (err) {
      console.error(err)
      setError('Error eliminando servicio: ' + err.message)
    }
  }

  const resetForm = () => {
    setForm({
      nombre_servicio: '',
      precio_base: '',
      descripcion: '',
      duracion: '',
      estado_servicio: 'activo',
      categoria: '',
      requiere_equipo: false,
    })
    setEditId(null)
  }

  const handleCancel = () => {
    resetForm()
  }

  if (loading) {
    return <div className="servicios-loading">⏳ Cargando servicios...</div>
  }

  return (
    <div className="servicios-page">
      <div className="page-header">
        <h1>💼 Gestión de Servicios</h1>
        <p className="subtitle">Administra los servicios disponibles</p>
      </div>

      {error && <div className="error-banner">❌ {error}</div>}
      {mensaje && <div className="success-banner">✅ {mensaje}</div>}

      <div className="servicios-form-card">
        <h2>{editId ? '✏️ Editar Servicio' : '➕ Nuevo Servicio'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre_servicio">Nombre del servicio *</label>
              <input
                id="nombre_servicio"
                type="text"
                name="nombre_servicio"
                value={form.nombre_servicio}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="precio_base">Precio base (Bs.) *</label>
              <input
                id="precio_base"
                type="number"
                name="precio_base"
                value={form.precio_base}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="duracion">Duración (minutos)</label>
              <input
                id="duracion"
                type="number"
                name="duracion"
                value={form.duracion}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="categoria">Categoría</label>
              <input
                id="categoria"
                type="text"
                name="categoria"
                value={form.categoria}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estado_servicio">Estado</label>
              <select
                id="estado_servicio"
                name="estado_servicio"
                value={form.estado_servicio}
                onChange={handleInputChange}
              >
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
                <option value="suspendido">Suspendido</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label htmlFor="requiere_equipo">
                <input
                  id="requiere_equipo"
                  type="checkbox"
                  name="requiere_equipo"
                  checked={form.requiere_equipo}
                  onChange={handleInputChange}
                />
                <span>Requiere equipo especial</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={form.descripcion}
              onChange={handleInputChange}
              rows={3}
            ></textarea>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              {editId ? '💾 Actualizar' : '➕ Crear Servicio'}
            </button>
            {editId && (
              <button type="button" className="btn-cancel" onClick={handleCancel}>
                ✖️ Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="servicios-list-card">
        <h2>📋 Lista de Servicios ({servicios.length})</h2>

        {servicios.length === 0 ? (
          <div className="no-data">
            <p>📋 No hay servicios registrados</p>
          </div>
        ) : (
          <div className="servicios-grid">
            {servicios.map(servicio => (
              <div key={servicio.id_servicio} className="servicio-card">
                <div className="card-header">
                  <h3>{servicio.nombre_servicio}</h3>
                  <span className={`status-badge status-${servicio.estado_servicio}`}>
                    {servicio.estado_servicio.charAt(0).toUpperCase() + servicio.estado_servicio.slice(1)}
                  </span>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Precio:</span>
                    <span className="value">Bs. {Number(servicio.precio_base).toFixed(2)}</span>
                  </div>

                  {servicio.duracion && (
                    <div className="info-row">
                      <span className="label">Duración:</span>
                      <span className="value">{servicio.duracion} min</span>
                    </div>
                  )}

                  {servicio.categoria && (
                    <div className="info-row">
                      <span className="label">Categoría:</span>
                      <span className="value">{servicio.categoria}</span>
                    </div>
                  )}

                  {servicio.descripcion && (
                    <div className="description">
                      {servicio.descripcion}
                    </div>
                  )}

                  {servicio.requiere_equipo && (
                    <div className="equipo-badge">
                      ⚙️ Requiere equipo especial
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(servicio)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(servicio.id_servicio)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Servicios
