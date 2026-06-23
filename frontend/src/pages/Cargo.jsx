import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Cargo.css'

const Cargo = () => {
  const [cargos, setCargos] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nombre_cargo: '', estado_cargo: 'Activo', rol: '' })
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchCargos()
  }, [])

  const fetchCargos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('cargo').select('*').order('id_cargo', { ascending: true })
      if (error) throw error
      setCargos(data || [])
    } catch (err) {
      console.error('Error cargando cargos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingId) {
        const { error } = await supabase.from('cargo').update({
          nombre_cargo: form.nombre_cargo,
          estado_cargo: form.estado_cargo,
          rol: form.rol,
        }).eq('id_cargo', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase.from('cargo').insert([{ nombre_cargo: form.nombre_cargo, estado_cargo: form.estado_cargo, rol: form.rol }])
        if (error) throw error
      }
      setForm({ nombre_cargo: '', estado_cargo: 'Activo', rol: '' })
      setEditingId(null)
      fetchCargos()
    } catch (err) {
      console.error('Error guardando cargo:', err)
      alert('Error guardando cargo: ' + err.message)
    }
  }

  const startEdit = (cargo) => {
    setEditingId(cargo.id_cargo)
    setForm({ nombre_cargo: cargo.nombre_cargo || '', estado_cargo: cargo.estado_cargo || 'Activo', rol: cargo.rol || '' })
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este cargo?')) return
    try {
      const { error } = await supabase.from('cargo').delete().eq('id_cargo', id)
      if (error) throw error
      fetchCargos()
    } catch (err) {
      console.error('Error eliminando cargo:', err)
      alert('Error eliminando cargo: ' + err.message)
    }
  }

  return (
    <div className="cargo-page">
      <h1>⚙️ Cargos</h1>

      <section className="cargo-form-section">
        <form onSubmit={handleSubmit} className="cargo-form">
          <div className="form-row">
            <div className="form-group">
              <label>Nombre del Cargo</label>
              <input name="nombre_cargo" value={form.nombre_cargo} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Estado</label>
              <select name="estado_cargo" value={form.estado_cargo} onChange={handleChange}>
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </div>
            <div className="form-group">
              <label>Rol</label>
              <input name="rol" value={form.rol} onChange={handleChange} placeholder="p.ej. doctor, asistente" />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit">{editingId ? 'Actualizar' : 'Agregar'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ nombre_cargo: '', estado_cargo: 'Activo', rol: '' }) }}>Cancelar</button>}
          </div>
        </form>
      </section>

      <section className="cargo-list-section">
        <h2>Listado de Cargos</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table className="cargo-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Estado</th>
                <th>Rol</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargos.map(c => (
                <tr key={c.id_cargo}>
                  <td>{c.id_cargo}</td>
                  <td>{c.nombre_cargo}</td>
                  <td>{c.estado_cargo}</td>
                  <td>{c.rol}</td>
                  <td>
                    <button onClick={() => startEdit(c)}>Editar</button>
                    <button onClick={() => handleDelete(c.id_cargo)}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

export default Cargo
