import { useState, useEffect } from "react";
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { supabase } from "../lib/supabaseClient";
import { uploadImage } from "../lib/uploadImage";
import "./AgregarProducto.css";

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001'

function AgregarProducto() {
  const [producto, setProducto] = useState({
    nombre: "",
    categoria: "",
    precio: "",
    descripcion: "",
    marca: "",
    imagen: null,
    fecha_vencimiento: "",
    lote: "",
    tipo: "",
    id_proveedor: "",
  });

  const [preview, setPreview] = useState(null);
  const [proveedores, setProveedores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "imagen" && files && files.length > 0) {
      setProducto({ ...producto, imagen: files[0] });
      setPreview(URL.createObjectURL(files[0]));
    } else {
      setProducto({ ...producto, [name]: value });
    }
  };

  useEffect(() => {
    const fetchRelations = async () => {
      try {
        // Cargar proveedores: id_proveedor (pk), nombre_proveedor, telefono_proveedor, correo_proveedor, direccion_proveedor
        const { data: prov, error: errProv } = await supabase
          .from('proveedor')
          .select('id_proveedor, nombre_proveedor, telefono_proveedor, correo_proveedor, direccion_proveedor')
          .order('nombre_proveedor', { ascending: true });
        if (!errProv && prov) setProveedores(prov);

      } catch (err) {
        console.error('Error cargando proveedores/catalogos:', err);
      }
    }

    fetchRelations()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null)
    setLoading(true)

    try {
      const maxImageSizeBytes = 20 * 1024 * 1024
      let imagenUrl = null

      // Si hay un File, subir a Storage
      if (producto.imagen && producto.imagen instanceof File) {
        const file = producto.imagen
        if (file.size > maxImageSizeBytes) {
          throw new Error('La imagen no puede superar los 20MB')
        }
        const fileExt = file.name.split('.').pop()
        const fileName = `${(producto.nombre || 'producto').replace(/\s+/g, '_')}-${Date.now()}.${fileExt}`
        const filePath = `productos/${fileName}`

        imagenUrl = await uploadImage({
          file,
          bucket: 'imagenes',
          path: filePath,
        })
      } else if (typeof producto.imagen === 'string' && producto.imagen) {
        imagenUrl = producto.imagen
      }

      const payload = {
        nombre_producto: producto.nombre,
        categoria: producto.categoria || null,
        precio: producto.precio ? Number(producto.precio) : 0,
        descripcion: producto.descripcion || null,
        marca: producto.marca || null,
        imagen: imagenUrl,
        fecha_vencimiento: producto.fecha_vencimiento || null,
        lote: producto.lote || null,
        tipo: producto.tipo || null,
        id_proveedor: producto.id_proveedor || null,
      }

      // Enviar payload al backend (usa la API del servidor)
        const res = await fetch(`${API_BASE}/api/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status}`)
      }

      alert('Producto agregado correctamente')

      setProducto({
        nombre: "",
        categoria: "",
        precio: "",
        descripcion: "",
        marca: "",
        imagen: null,
        fecha_vencimiento: "",
        lote: "",
        tipo: "",
        id_proveedor: "",
      })
      setPreview(null)
    } catch (err) {
      console.error('Error guardando producto:', err)
      setError(err.message || String(err))
      alert('Error guardando producto: ' + (err.message || String(err)))
    } finally {
      setLoading(false)
    }
  };

  return (
    <div className="agregar-page">
      <div className="page-header">
        <h1>🛒 Agregar Producto</h1>
        <p className="subtitle">Añade un nuevo producto al catálogo</p>
      </div>

      <div className="agregar-card">
        <form onSubmit={handleSubmit} className="agregar-form">
          {error && <div className="error-banner">❌ {error}</div>}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nombre">Nombre del producto</label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                value={producto.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="precio">Precio (Bs.)</label>
              <input
                id="precio"
                type="number"
                name="precio"
                value={producto.precio}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="categoria">Categoría</label>
              <select id="categoria" name="categoria" value={producto.categoria} onChange={handleChange} required>
                <option value="">-- Seleccionar categoría --</option>
                <option value="Medicamentos">Medicamentos</option>
                <option value="Alimentos y Suplementos">Alimentos y Suplementos</option>
                <option value="Higiene y Cuidado">Higiene y Cuidado</option>
                <option value="Equipos Médicos">Equipos Médicos</option>
                <option value="Accesorios">Accesorios</option>
                <option value="Juguetes">Juguetes</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="marca">Marca</label>
              <input id="marca" type="text" name="marca" value={producto.marca} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tipo">Tipo</label>
              <select id="tipo" name="tipo" value={producto.tipo} onChange={handleChange} required>
                <option value="">-- Seleccionar tipo --</option>
                {producto.categoria === "Medicamentos" && (
                  <>
                    <option value="Antibióticos">Antibióticos</option>
                    <option value="Antiinflamatorios">Antiinflamatorios</option>
                    <option value="Vitaminas">Vitaminas</option>
                    <option value="Desparasitantes">Desparasitantes</option>
                  </>
                )}
                {producto.categoria === "Alimentos y Suplementos" && (
                  <>
                    <option value="Alimento para Perros">Alimento para Perros</option>
                    <option value="Alimento para Gatos">Alimento para Gatos</option>
                    <option value="Suplementos">Suplementos</option>
                  </>
                )}
                {producto.categoria === "Higiene y Cuidado" && (
                  <>
                    <option value="Champús">Champús</option>
                    <option value="Desinfectantes">Desinfectantes</option>
                    <option value="Toallitas">Toallitas</option>
                    <option value="Cortaúñas">Cortaúñas</option>
                  </>
                )}
                {producto.categoria === "Equipos Médicos" && (
                  <>
                    <option value="Termómetros">Termómetros</option>
                    <option value="Inyectoras">Inyectoras</option>
                    <option value="Kits de Curación">Kits de Curación</option>
                  </>
                )}
                {producto.categoria === "Accesorios" && (
                  <>
                    <option value="Correas">Correas</option>
                    <option value="Collares">Collares</option>
                    <option value="Transportines">Transportines</option>
                  </>
                )}
                {producto.categoria === "Juguetes" && (
                  <>
                    <option value="Pelotas">Pelotas</option>
                    <option value="Juguetes de Cuerda">Juguetes de Cuerda</option>
                    <option value="Juguetes Interactivos">Juguetes Interactivos</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="lote">Lote</label>
              <input id="lote" type="text" name="lote" value={producto.lote} onChange={handleChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fecha_vencimiento">Fecha de vencimiento</label>
              <DatePicker
                selected={producto.fecha_vencimiento ? new Date(producto.fecha_vencimiento) : null}
                onChange={(date) => setProducto({ ...producto, fecha_vencimiento: date ? date.toISOString().split('T')[0] : '' })}
                dateFormat="dd/MM/yyyy"
                placeholderText="Seleccionar fecha"
                className="date-picker-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="id_proveedor">Proveedor</label>
              <select id="id_proveedor" name="id_proveedor" value={producto.id_proveedor} onChange={handleChange} required>
                <option value="">-- Seleccionar proveedor --</option>
                {proveedores.map(p => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.nombre_proveedor}
                  </option>
                ))}
              </select>
            </div>
          </div>


          <div className="form-group">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={producto.descripcion}
              onChange={handleChange}
              required
              rows={4}
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="imagen">Imagen del producto</label>
            <input id="imagen" type="file" name="imagen" accept="image/*" onChange={handleChange} />
          </div>

          {preview && (
            <div className="preview">
              <p>Vista previa</p>
              <img src={preview} alt="Vista previa" />
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              ➕ Agregar producto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AgregarProducto;
