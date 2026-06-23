import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import './GestionBlog.css';

function GestionBlog() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ci_personal, setCiPersonal] = useState(null);

  // Estados para artículos
  const [articulos, setArticulos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');

  // Estados para modales
  const [modalNuevoArticulo, setModalNuevoArticulo] = useState(false);
  const [modalEditarArticulo, setModalEditarArticulo] = useState(false);
  const [articuloSeleccionado, setArticuloSeleccionado] = useState(null);

  // Estado para formulario de artículo
  const [formularioArticulo, setFormularioArticulo] = useState({
    titulo: '',
    contenido: '',
    imagen_url: '',
    estado: 'borrador',
    categoria: ''
  });

  const [alertaExito, setAlertaExito] = useState('');
  const [imagenPreview, setImagenPreview] = useState('');

  // Verificar autenticación
  useEffect(() => {
    verificarAutenticacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verificarAutenticacion = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/iniciar-sesion');
        return;
      }

      const { data: personalData, error: personalError } = await supabase
        .from('personal')
        .select('ci_personal, nombre, apellidos')
        .eq('user_id', user.id)
        .single();

      if (personalError || !personalData) {
        setError('No se encontró el perfil del personal');
        setLoading(false);
        return;
      }

      setCiPersonal(personalData.ci_personal);
      await cargarArticulos(personalData.ci_personal);
    } catch (err) {
      console.error('Error al verificar autenticación:', err);
      setError('Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Cargar artículos
  const cargarArticulos = async (ci) => {
    try {
      const { data, error } = await supabase
        .from('articulosblog')
        .select(`
          *,
          personal:ci_personal (
            nombre,
            apellidos
          )
        `)
        .eq('ci_personal', ci)
        .order('fecha_publicacion', { ascending: false });

      if (error) throw error;
      setArticulos(data || []);
    } catch (err) {
      console.error('Error al cargar artículos:', err);
      setError('Error al cargar los artículos');
    }
  };

  // Abrir modal para nuevo artículo
  const abrirModalNuevo = () => {
    setFormularioArticulo({
      titulo: '',
      contenido: '',
      imagen_url: '',
      estado: 'borrador',
      categoria: ''
    });
    setImagenPreview('');
    setModalNuevoArticulo(true);
  };

  // Abrir modal para editar artículo
  const abrirModalEditar = (articulo) => {
    setArticuloSeleccionado(articulo);
    setFormularioArticulo({
      titulo: articulo.titulo || '',
      contenido: articulo.contenido || '',
      imagen_url: articulo.imagen_url || '',
      estado: articulo.estado || 'borrador',
      categoria: articulo.categoria || ''
    });
    setImagenPreview(articulo.imagen_url || '');
    setModalEditarArticulo(true);
  };

  // Manejar cambios en el formulario
  const manejarCambio = (campo, valor) => {
    setFormularioArticulo({ ...formularioArticulo, [campo]: valor });
    
    if (campo === 'imagen_url') {
      setImagenPreview(valor);
    }
  };

  // Crear nuevo artículo
  const crearArticulo = async () => {
    try {
      if (!formularioArticulo.titulo || !formularioArticulo.contenido) {
        alert('El título y el contenido son obligatorios');
        return;
      }

      setLoading(true);

      const nuevoArticulo = {
        titulo: formularioArticulo.titulo,
        contenido: formularioArticulo.contenido,
        imagen_url: formularioArticulo.imagen_url || null,
        estado: formularioArticulo.estado,
        categoria: formularioArticulo.categoria || null,
        ci_personal,
        fecha_publicacion: formularioArticulo.estado === 'publicado' 
          ? new Date().toISOString() 
          : null
      };

      const { error } = await supabase
        .from('articulosblog')
        .insert(nuevoArticulo);

      if (error) throw error;

      setAlertaExito('✅ Artículo creado exitosamente');
      setTimeout(() => setAlertaExito(''), 3000);
      setModalNuevoArticulo(false);
      await cargarArticulos(ci_personal);
    } catch (err) {
      console.error('Error al crear artículo:', err);
      alert('Error al crear el artículo');
    } finally {
      setLoading(false);
    }
  };

  // Actualizar artículo
  const actualizarArticulo = async () => {
    try {
      if (!formularioArticulo.titulo || !formularioArticulo.contenido) {
        alert('El título y el contenido son obligatorios');
        return;
      }

      setLoading(true);

      const articuloActualizado = {
        titulo: formularioArticulo.titulo,
        contenido: formularioArticulo.contenido,
        imagen_url: formularioArticulo.imagen_url || null,
        estado: formularioArticulo.estado,
        categoria: formularioArticulo.categoria || null
      };

      // Si se está publicando por primera vez, agregar fecha
      if (formularioArticulo.estado === 'publicado' && !articuloSeleccionado.fecha_publicacion) {
        articuloActualizado.fecha_publicacion = new Date().toISOString();
      }

      const { error } = await supabase
        .from('articulosblog')
        .update(articuloActualizado)
        .eq('id_articulo', articuloSeleccionado.id_articulo);

      if (error) throw error;

      setAlertaExito('✅ Artículo actualizado exitosamente');
      setTimeout(() => setAlertaExito(''), 3000);
      setModalEditarArticulo(false);
      await cargarArticulos(ci_personal);
    } catch (err) {
      console.error('Error al actualizar artículo:', err);
      alert('Error al actualizar el artículo');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar artículo
  const eliminarArticulo = async (id_articulo) => {
    if (!window.confirm('¿Estás seguro de eliminar este artículo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('articulosblog')
        .delete()
        .eq('id_articulo', id_articulo);

      if (error) throw error;

      setAlertaExito('✅ Artículo eliminado exitosamente');
      setTimeout(() => setAlertaExito(''), 3000);
      await cargarArticulos(ci_personal);
    } catch (err) {
      console.error('Error al eliminar artículo:', err);
      alert('Error al eliminar el artículo');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de publicación rápido
  const cambiarEstadoArticulo = async (articulo, nuevoEstado) => {
    try {
      setLoading(true);

      const actualizacion = {
        estado: nuevoEstado
      };

      // Si se está publicando, agregar fecha
      if (nuevoEstado === 'publicado' && !articulo.fecha_publicacion) {
        actualizacion.fecha_publicacion = new Date().toISOString();
      }

      const { error } = await supabase
        .from('articulosblog')
        .update(actualizacion)
        .eq('id_articulo', articulo.id_articulo);

      if (error) throw error;

      setAlertaExito(`✅ Artículo ${nuevoEstado === 'publicado' ? 'publicado' : 'guardado como borrador'}`);
      setTimeout(() => setAlertaExito(''), 3000);
      await cargarArticulos(ci_personal);
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      alert('Error al cambiar el estado del artículo');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar artículos
  const articulosFiltrados = articulos.filter(articulo => {
    const cumpleBusqueda = articulo.titulo?.toLowerCase().includes(busqueda.toLowerCase()) ||
                          articulo.contenido?.toLowerCase().includes(busqueda.toLowerCase()) ||
                          articulo.categoria?.toLowerCase().includes(busqueda.toLowerCase());
    
    const cumpleEstado = filtroEstado === 'todos' || articulo.estado === filtroEstado;
    
    return cumpleBusqueda && cumpleEstado;
  });

  if (loading && !ci_personal) {
    return (
      <div className="blog-loading">
        <div className="loader"></div>
        <p>Cargando gestión de blog...</p>
      </div>
    );
  }

  if (error && !ci_personal) {
    return (
      <div className="blog-error">
        <p>❌ {error}</p>
        <button className="btn-volver" onClick={() => navigate('/dashboard-personal')}>
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="gestion-blog">
      {/* Header */}
      <div className="blog-header">
        <h1>📝 Gestión de Blog</h1>
        <p className="subtitle">Crea y administra artículos para el blog de la veterinaria</p>
      </div>

      {alertaExito && (
        <div className="alert alert-success">{alertaExito}</div>
      )}

      {/* Barra de acciones */}
      <div className="acciones-bar">
        <div className="filtros-container">
          <input
            type="text"
            placeholder="Buscar artículos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-busqueda"
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="select-filtro"
          >
            <option value="todos">Todos los estados</option>
            <option value="borrador">Borradores</option>
            <option value="publicado">Publicados</option>
          </select>
        </div>
        <button className="btn-nuevo-articulo" onClick={abrirModalNuevo}>
          ➕ Nuevo Artículo
        </button>
      </div>

      {/* Estadísticas */}
      <div className="stats-blog">
        <div className="stat-card">
          <div className="stat-icono">📄</div>
          <div className="stat-info">
            <h3>{articulos.length}</h3>
            <p>Total Artículos</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icono">✅</div>
          <div className="stat-info">
            <h3>{articulos.filter(a => a.estado === 'publicado').length}</h3>
            <p>Publicados</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icono">📝</div>
          <div className="stat-info">
            <h3>{articulos.filter(a => a.estado === 'borrador').length}</h3>
            <p>Borradores</p>
          </div>
        </div>
      </div>

      {/* Lista de artículos */}
      <div className="articulos-container">
        {articulosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h2>No hay artículos</h2>
            <p>Comienza creando tu primer artículo para el blog</p>
            <button className="btn-crear-primero" onClick={abrirModalNuevo}>
              Crear Primer Artículo
            </button>
          </div>
        ) : (
          <div className="articulos-grid">
            {articulosFiltrados.map(articulo => (
              <div key={articulo.id_articulo} className="articulo-card">
                {articulo.imagen_url && (
                  <div className="articulo-imagen">
                    <img src={articulo.imagen_url} alt={articulo.titulo} />
                  </div>
                )}
                
                <div className="articulo-contenido">
                  <div className="articulo-header">
                    <span className={`estado-badge ${articulo.estado}`}>
                      {articulo.estado === 'publicado' ? '✅ Publicado' : '📝 Borrador'}
                    </span>
                    {articulo.categoria && (
                      <span className="categoria-badge">{articulo.categoria}</span>
                    )}
                  </div>

                  <h3>{articulo.titulo}</h3>
                  <p className="articulo-preview">
                    {articulo.contenido?.substring(0, 150)}
                    {articulo.contenido?.length > 150 ? '...' : ''}
                  </p>

                  <div className="articulo-footer">
                    <p className="fecha-publicacion">
                      📅 {articulo.fecha_publicacion 
                        ? new Date(articulo.fecha_publicacion).toLocaleDateString('es-ES')
                        : 'Sin publicar'}
                    </p>
                  </div>

                  <div className="articulo-acciones">
                    <button 
                      className="btn-editar"
                      onClick={() => abrirModalEditar(articulo)}
                    >
                      ✏️ Editar
                    </button>
                    
                    {articulo.estado === 'borrador' ? (
                      <button 
                        className="btn-publicar"
                        onClick={() => cambiarEstadoArticulo(articulo, 'publicado')}
                      >
                        ✅ Publicar
                      </button>
                    ) : (
                      <button 
                        className="btn-despublicar"
                        onClick={() => cambiarEstadoArticulo(articulo, 'borrador')}
                      >
                        📝 Borrador
                      </button>
                    )}
                    
                    <button 
                      className="btn-eliminar"
                      onClick={() => eliminarArticulo(articulo.id_articulo)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Nuevo Artículo */}
      {modalNuevoArticulo && (
        <div className="modal-overlay" onClick={() => setModalNuevoArticulo(false)}>
          <div className="modal-content modal-grande" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Nuevo Artículo</h2>
              <button className="btn-cerrar" onClick={() => setModalNuevoArticulo(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-grupo">
                <label>📌 Título *</label>
                <input
                  type="text"
                  value={formularioArticulo.titulo}
                  onChange={(e) => manejarCambio('titulo', e.target.value)}
                  className="input-busqueda"
                  placeholder="Ingrese el título del artículo..."
                />
              </div>

              <div className="form-grupo">
                <label>🏷️ Categoría</label>
                <input
                  type="text"
                  value={formularioArticulo.categoria}
                  onChange={(e) => manejarCambio('categoria', e.target.value)}
                  className="input-busqueda"
                  placeholder="Ej: Salud, Cuidados, Nutrición..."
                />
              </div>

              <div className="form-grupo">
                <label>📝 Contenido *</label>
                <textarea
                  value={formularioArticulo.contenido}
                  onChange={(e) => manejarCambio('contenido', e.target.value)}
                  className="textarea-articulo"
                  rows="10"
                  placeholder="Escriba el contenido del artículo..."
                ></textarea>
              </div>

              <div className="form-grupo">
                <label>🖼️ URL de Imagen</label>
                <input
                  type="text"
                  value={formularioArticulo.imagen_url}
                  onChange={(e) => manejarCambio('imagen_url', e.target.value)}
                  className="input-busqueda"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                {imagenPreview && (
                  <div className="imagen-preview">
                    <img src={imagenPreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-grupo">
                <label>📊 Estado</label>
                <select
                  value={formularioArticulo.estado}
                  onChange={(e) => manejarCambio('estado', e.target.value)}
                  className="select-filtro"
                >
                  <option value="borrador">📝 Borrador</option>
                  <option value="publicado">✅ Publicar inmediatamente</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalNuevoArticulo(false)}>
                Cancelar
              </button>
              <button className="btn-guardar" onClick={crearArticulo} disabled={loading}>
                {loading ? 'Guardando...' : '💾 Crear Artículo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Artículo */}
      {modalEditarArticulo && articuloSeleccionado && (
        <div className="modal-overlay" onClick={() => setModalEditarArticulo(false)}>
          <div className="modal-content modal-grande" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Editar Artículo</h2>
              <button className="btn-cerrar" onClick={() => setModalEditarArticulo(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-grupo">
                <label>📌 Título *</label>
                <input
                  type="text"
                  value={formularioArticulo.titulo}
                  onChange={(e) => manejarCambio('titulo', e.target.value)}
                  className="input-busqueda"
                  placeholder="Ingrese el título del artículo..."
                />
              </div>

              <div className="form-grupo">
                <label>🏷️ Categoría</label>
                <input
                  type="text"
                  value={formularioArticulo.categoria}
                  onChange={(e) => manejarCambio('categoria', e.target.value)}
                  className="input-busqueda"
                  placeholder="Ej: Salud, Cuidados, Nutrición..."
                />
              </div>

              <div className="form-grupo">
                <label>📝 Contenido *</label>
                <textarea
                  value={formularioArticulo.contenido}
                  onChange={(e) => manejarCambio('contenido', e.target.value)}
                  className="textarea-articulo"
                  rows="10"
                  placeholder="Escriba el contenido del artículo..."
                ></textarea>
              </div>

              <div className="form-grupo">
                <label>🖼️ URL de Imagen</label>
                <input
                  type="text"
                  value={formularioArticulo.imagen_url}
                  onChange={(e) => manejarCambio('imagen_url', e.target.value)}
                  className="input-busqueda"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
                {imagenPreview && (
                  <div className="imagen-preview">
                    <img src={imagenPreview} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-grupo">
                <label>📊 Estado</label>
                <select
                  value={formularioArticulo.estado}
                  onChange={(e) => manejarCambio('estado', e.target.value)}
                  className="select-filtro"
                >
                  <option value="borrador">📝 Borrador</option>
                  <option value="publicado">✅ Publicado</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalEditarArticulo(false)}>
                Cancelar
              </button>
              <button className="btn-guardar" onClick={actualizarArticulo} disabled={loading}>
                {loading ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionBlog;
