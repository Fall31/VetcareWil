import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import './RecetasTratamientos.css';

function RecetasTratamientos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ci_personal, setCiPersonal] = useState(null);

  // Estados para datos
  const [recetas, setRecetas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mascotas, setMascotas] = useState([]);
  const [tratamientos, setTratamientos] = useState([]);

  // Estados de filtros
  const [busqueda, setBusqueda] = useState('');

  // Estados para modales
  const [modalNuevaReceta, setModalNuevaReceta] = useState(false);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);

  // Estado para nueva receta
  const [nuevaReceta, setNuevaReceta] = useState({
    ci_mascota: '',
    id_tratamiento: '',
    diagnostico: '',
    indicaciones: '',
    duracion_dias: '',
    productos: [] // Array de {id_producto, cantidad, dosis, frecuencia}
  });

  const [alertaExito, setAlertaExito] = useState('');

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
      await cargarDatos(personalData.ci_personal);
    } catch (err) {
      console.error('Error al verificar autenticación:', err);
      setError('Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Cargar todos los datos necesarios
  const cargarDatos = async (ci) => {
    try {
      await Promise.all([
        cargarRecetas(ci),
        cargarProductosMedicamentos(),
        cargarMascotasAtendidas(ci),
        cargarTratamientos()
      ]);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar la información');
    }
  };

  // Cargar recetas (usando tabla tratamiento como base)
  const cargarRecetas = async (ci) => {
    try {
      // Obtenemos tratamientos de historiales médicos de pacientes del personal
      const { data: historialData, error: historialError } = await supabase
        .from('historial_medico_detalle')
        .select(`
          *,
          tratamiento:id_tratamiento (*),
          diagnostico:id_diagnostico (*),
          historial_medico!inner (
            *,
            mascota:id_mascota (
              ci_mascota,
              nombre_mascota,
              especie,
              raza,
              cliente:ci_cliente (
                nombre_cliente,
                primer_apellido,
                telefono
              )
            )
          )
        `)
        .not('id_tratamiento', 'is', null)
        .order('id_detalle', { ascending: false });

      if (historialError) throw historialError;

      // Filtrar solo las mascotas que tienen reservas con este personal
      const { data: reservasData } = await supabase
        .from('reserva')
        .select('ci_mascota')
        .eq('ci_personal', ci);

      const mascotasDelPersonal = new Set(reservasData?.map(r => r.ci_mascota) || []);

      const recetasFiltradas = historialData?.filter(h => 
        mascotasDelPersonal.has(h.historial_medico?.id_mascota)
      ) || [];

      setRecetas(recetasFiltradas);
    } catch (err) {
      console.error('Error al cargar recetas:', err);
    }
  };

  // Cargar productos que son medicamentos
  const cargarProductosMedicamentos = async () => {
    try {
      const { data, error } = await supabase
        .from('producto')
        .select(`
          *,
          inventario:inventario (stock_actual)
        `)
        .in('categoria', ['Medicamento', 'Suplemento', 'Vitamina'])
        .order('nombre_producto');

      if (error) throw error;
      setProductos(data || []);
    } catch (err) {
      console.error('Error al cargar productos:', err);
    }
  };

  // Cargar mascotas atendidas por el personal
  const cargarMascotasAtendidas = async (ci) => {
    try {
      const { data: reservasData, error } = await supabase
        .from('reserva')
        .select(`
          ci_mascota,
          mascota:ci_mascota (
            ci_mascota,
            nombre_mascota,
            especie,
            raza,
            cliente:ci_cliente (
              nombre_cliente,
              primer_apellido
            )
          )
        `)
        .eq('ci_personal', ci);

      if (error) throw error;

      // Eliminar duplicados
      const mascotasUnicas = [];
      const cis = new Set();
      
      reservasData?.forEach(item => {
        if (item.mascota && !cis.has(item.mascota.ci_mascota)) {
          cis.add(item.mascota.ci_mascota);
          mascotasUnicas.push(item.mascota);
        }
      });

      setMascotas(mascotasUnicas);
    } catch (err) {
      console.error('Error al cargar mascotas:', err);
    }
  };

  // Cargar tratamientos disponibles
  const cargarTratamientos = async () => {
    try {
      const { data, error } = await supabase
        .from('tratamiento')
        .select('*')
        .order('id_tratamiento', { ascending: false });

      if (error) throw error;
      setTratamientos(data || []);
    } catch (err) {
      console.error('Error al cargar tratamientos:', err);
    }
  };

  // Agregar producto a la receta
  const agregarProductoReceta = () => {
    setNuevaReceta({
      ...nuevaReceta,
      productos: [
        ...nuevaReceta.productos,
        { id_producto: '', cantidad: 1, dosis: '', frecuencia: '' }
      ]
    });
  };

  // Actualizar producto en la receta
  const actualizarProductoReceta = (index, campo, valor) => {
    const nuevosProductos = [...nuevaReceta.productos];
    nuevosProductos[index][campo] = valor;
    setNuevaReceta({ ...nuevaReceta, productos: nuevosProductos });
  };

  // Eliminar producto de la receta
  const eliminarProductoReceta = (index) => {
    const nuevosProductos = nuevaReceta.productos.filter((_, i) => i !== index);
    setNuevaReceta({ ...nuevaReceta, productos: nuevosProductos });
  };

  // Crear nueva receta
  const crearReceta = async () => {
    try {
      if (!nuevaReceta.ci_mascota || !nuevaReceta.id_tratamiento || !nuevaReceta.diagnostico) {
        alert('Complete los campos obligatorios: Mascota, Tratamiento y Diagnóstico');
        return;
      }

      setLoading(true);

      // 1. Crear o actualizar historial médico
      let { data: historialData, error: historialError } = await supabase
        .from('historial_medico')
        .select('id_historial')
        .eq('id_mascota', nuevaReceta.ci_mascota)
        .single();

      let id_historial;

      if (historialError || !historialData) {
        const { data: nuevoHistorial, error: errorNuevo } = await supabase
          .from('historial_medico')
          .insert({
            id_mascota: nuevaReceta.ci_mascota,
            fecha_creacion: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (errorNuevo) throw errorNuevo;
        id_historial = nuevoHistorial.id_historial;
      } else {
        id_historial = historialData.id_historial;
      }

      // 2. Crear diagnóstico si es necesario
      const { data: diagnosticoData, error: diagnosticoError } = await supabase
        .from('diagnostico')
        .insert({ descripcion: nuevaReceta.diagnostico })
        .select()
        .single();

      if (diagnosticoError) throw diagnosticoError;

      // 3. Crear detalle del historial médico (receta)
      const observaciones = `
PRESCRIPCIÓN MÉDICA
===================
Diagnóstico: ${nuevaReceta.diagnostico}
Duración del tratamiento: ${nuevaReceta.duracion_dias || 'No especificado'} días
Indicaciones: ${nuevaReceta.indicaciones || 'Sin indicaciones adicionales'}

MEDICAMENTOS PRESCRITOS:
${nuevaReceta.productos.map((p, i) => {
  const producto = productos.find(prod => prod.id_producto === parseInt(p.id_producto));
  return `${i + 1}. ${producto?.nombre_producto || 'Producto'}
   - Cantidad: ${p.cantidad}
   - Dosis: ${p.dosis}
   - Frecuencia: ${p.frecuencia}`;
}).join('\n\n')}
      `.trim();

      const { error: detalleError } = await supabase
        .from('historial_medico_detalle')
        .insert({
          id_historial,
          id_diagnostico: diagnosticoData.id_diagnostico,
          id_tratamiento: nuevaReceta.id_tratamiento,
          observaciones
        });

      if (detalleError) throw detalleError;

      setAlertaExito('✅ Receta creada exitosamente');
      setTimeout(() => setAlertaExito(''), 3000);
      setModalNuevaReceta(false);
      resetFormularioReceta();
      await cargarRecetas(ci_personal);
    } catch (err) {
      console.error('Error al crear receta:', err);
      alert('Error al crear la receta médica');
    } finally {
      setLoading(false);
    }
  };

  // Resetear formulario
  const resetFormularioReceta = () => {
    setNuevaReceta({
      ci_mascota: '',
      id_tratamiento: '',
      diagnostico: '',
      indicaciones: '',
      duracion_dias: '',
      productos: []
    });
  };

  // Abrir detalle de receta
  const abrirDetalle = (receta) => {
    setRecetaSeleccionada(receta);
    setModalDetalle(true);
  };

  // Imprimir receta (simulación)
  const imprimirReceta = () => {
    window.print();
  };

  // Filtrar recetas
  const recetasFiltradas = recetas.filter(receta => {
    const busquedaLower = busqueda.toLowerCase();
    const nombreMascota = receta.historial_medico?.mascota?.nombre_mascota?.toLowerCase() || '';
    const nombreCliente = receta.historial_medico?.mascota?.cliente?.nombre_cliente?.toLowerCase() || '';
    const medicamento = receta.tratamiento?.medicamento?.toLowerCase() || '';
    
    return (nombreMascota.includes(busquedaLower) || 
            nombreCliente.includes(busquedaLower) || 
            medicamento.includes(busquedaLower));
  });

  if (loading && !ci_personal) {
    return (
      <div className="recetas-loading">
        <div className="loader"></div>
        <p>Cargando recetas y tratamientos...</p>
      </div>
    );
  }

  if (error && !ci_personal) {
    return (
      <div className="recetas-error">
        <p>❌ {error}</p>
        <button className="btn-volver" onClick={() => navigate('/dashboard-personal')}>
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="recetas-tratamientos">
      {/* Header */}
      <div className="recetas-header">
        <h1>💊 Recetas y Tratamientos</h1>
        <p className="subtitle">Gestión de prescripciones médicas</p>
      </div>

      {alertaExito && (
        <div className="alert alert-success">{alertaExito}</div>
      )}

      {/* Barra de acciones */}
      <div className="acciones-bar">
        <div className="busqueda-container">
          <input
            type="text"
            placeholder="Buscar por mascota, cliente o medicamento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input-busqueda"
          />
        </div>
        <button className="btn-nueva-receta" onClick={() => setModalNuevaReceta(true)}>
          ➕ Nueva Receta
        </button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="stats-recetas">
        <div className="stat-card">
          <div className="stat-icono">📋</div>
          <div className="stat-info">
            <h3>{recetas.length}</h3>
            <p>Total Recetas</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icono">💊</div>
          <div className="stat-info">
            <h3>{productos.length}</h3>
            <p>Medicamentos Disponibles</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icono">🐾</div>
          <div className="stat-info">
            <h3>{mascotas.length}</h3>
            <p>Pacientes Activos</p>
          </div>
        </div>
      </div>

      {/* Lista de recetas */}
      <div className="recetas-container">
        <h2 className="seccion-titulo">📝 Recetas Registradas</h2>
        
        {recetasFiltradas.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💊</div>
            <h2>No hay recetas registradas</h2>
            <p>Comienza creando una nueva prescripción médica</p>
            <button className="btn-crear-primera" onClick={() => setModalNuevaReceta(true)}>
              Crear Primera Receta
            </button>
          </div>
        ) : (
          <div className="recetas-grid">
            {recetasFiltradas.map(receta => (
              <div key={receta.id_detalle} className="receta-card" onClick={() => abrirDetalle(receta)}>
                <div className="receta-card-header">
                  <div className="mascota-badge">
                    {receta.historial_medico?.mascota?.especie === 'Perro' ? '🐕' : 
                     receta.historial_medico?.mascota?.especie === 'Gato' ? '🐈' : '🐾'}
                    <span>{receta.historial_medico?.mascota?.nombre_mascota}</span>
                  </div>
                  <span className="fecha-receta">
                    {new Date(receta.historial_medico?.fecha_creacion).toLocaleDateString('es-ES')}
                  </span>
                </div>
                
                <div className="receta-card-body">
                  <h3>{receta.diagnostico?.descripcion || 'Sin diagnóstico'}</h3>
                  <p className="medicamento-principal">
                    💊 {receta.tratamiento?.medicamento}
                  </p>
                  <p className="dosis-info">
                    📏 {receta.tratamiento?.dosis}
                  </p>
                  <p className="duracion-info">
                    ⏱️ {receta.tratamiento?.duracion}
                  </p>
                </div>

                <div className="receta-card-footer">
                  <p className="cliente-info">
                    👤 {receta.historial_medico?.mascota?.cliente?.nombre_cliente} {receta.historial_medico?.mascota?.cliente?.primer_apellido}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Nueva Receta */}
      {modalNuevaReceta && (
        <div className="modal-overlay" onClick={() => setModalNuevaReceta(false)}>
          <div className="modal-content modal-grande" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Nueva Prescripción Médica</h2>
              <button className="btn-cerrar" onClick={() => setModalNuevaReceta(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Selección de paciente */}
              <div className="form-grupo">
                <label>🐾 Paciente *</label>
                <select
                  value={nuevaReceta.ci_mascota}
                  onChange={(e) => setNuevaReceta({ ...nuevaReceta, ci_mascota: e.target.value })}
                  className="select-filtro"
                >
                  <option value="">Seleccionar mascota...</option>
                  {mascotas.map(m => (
                    <option key={m.ci_mascota} value={m.ci_mascota}>
                      {m.nombre_mascota} ({m.especie}) - {m.cliente?.nombre_cliente} {m.cliente?.primer_apellido}
                    </option>
                  ))}
                </select>
              </div>

              {/* Diagnóstico */}
              <div className="form-grupo">
                <label>🔬 Diagnóstico *</label>
                <textarea
                  value={nuevaReceta.diagnostico}
                  onChange={(e) => setNuevaReceta({ ...nuevaReceta, diagnostico: e.target.value })}
                  className="textarea-comentario"
                  rows="3"
                  placeholder="Describa el diagnóstico del paciente..."
                ></textarea>
              </div>

              {/* Tratamiento base */}
              <div className="form-grupo">
                <label>💊 Tratamiento Base *</label>
                <select
                  value={nuevaReceta.id_tratamiento}
                  onChange={(e) => setNuevaReceta({ ...nuevaReceta, id_tratamiento: e.target.value })}
                  className="select-filtro"
                >
                  <option value="">Seleccionar tratamiento...</option>
                  {tratamientos.map(t => (
                    <option key={t.id_tratamiento} value={t.id_tratamiento}>
                      {t.medicamento} - {t.dosis} ({t.duracion})
                    </option>
                  ))}
                </select>
              </div>

              {/* Duración */}
              <div className="form-grupo">
                <label>⏱️ Duración del Tratamiento (días)</label>
                <input
                  type="number"
                  value={nuevaReceta.duracion_dias}
                  onChange={(e) => setNuevaReceta({ ...nuevaReceta, duracion_dias: e.target.value })}
                  className="input-busqueda"
                  placeholder="Ej: 7"
                  min="1"
                />
              </div>

              {/* Indicaciones */}
              <div className="form-grupo">
                <label>📝 Indicaciones Adicionales</label>
                <textarea
                  value={nuevaReceta.indicaciones}
                  onChange={(e) => setNuevaReceta({ ...nuevaReceta, indicaciones: e.target.value })}
                  className="textarea-comentario"
                  rows="3"
                  placeholder="Instrucciones especiales, precauciones, etc..."
                ></textarea>
              </div>

              {/* Medicamentos adicionales */}
              <div className="form-grupo">
                <div className="productos-header">
                  <label>💊 Medicamentos Prescritos</label>
                  <button className="btn-agregar-producto" onClick={agregarProductoReceta}>
                    ➕ Agregar Medicamento
                  </button>
                </div>

                {nuevaReceta.productos.length === 0 ? (
                  <p className="texto-ayuda">Agregue medicamentos del inventario a la receta</p>
                ) : (
                  <div className="productos-lista">
                    {nuevaReceta.productos.map((prod, index) => (
                      <div key={index} className="producto-item">
                        <div className="producto-campos">
                          <select
                            value={prod.id_producto}
                            onChange={(e) => actualizarProductoReceta(index, 'id_producto', e.target.value)}
                            className="select-producto"
                          >
                            <option value="">Seleccionar medicamento...</option>
                            {productos.map(p => (
                              <option key={p.id_producto} value={p.id_producto}>
                                {p.nombre_producto} - Stock: {p.inventario?.[0]?.stock_actual || 0}
                              </option>
                            ))}
                          </select>

                          <input
                            type="number"
                            value={prod.cantidad}
                            onChange={(e) => actualizarProductoReceta(index, 'cantidad', e.target.value)}
                            className="input-cantidad"
                            placeholder="Cant."
                            min="1"
                          />

                          <input
                            type="text"
                            value={prod.dosis}
                            onChange={(e) => actualizarProductoReceta(index, 'dosis', e.target.value)}
                            className="input-dosis"
                            placeholder="Dosis (ej: 250mg)"
                          />

                          <input
                            type="text"
                            value={prod.frecuencia}
                            onChange={(e) => actualizarProductoReceta(index, 'frecuencia', e.target.value)}
                            className="input-frecuencia"
                            placeholder="Frecuencia (ej: cada 12h)"
                          />
                        </div>

                        <button 
                          className="btn-eliminar-producto"
                          onClick={() => eliminarProductoReceta(index)}
                        >
                          🗑️
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalNuevaReceta(false)}>
                Cancelar
              </button>
              <button className="btn-guardar" onClick={crearReceta} disabled={loading}>
                {loading ? 'Creando...' : '💾 Crear Receta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Detalle de Receta */}
      {modalDetalle && recetaSeleccionada && (
        <div className="modal-overlay" onClick={() => setModalDetalle(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💊 Detalle de Receta Médica</h2>
              <button className="btn-cerrar" onClick={() => setModalDetalle(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Info del paciente */}
              <div className="detalle-section">
                <h3>🐾 Información del Paciente</h3>
                <p><strong>Nombre:</strong> {recetaSeleccionada.historial_medico?.mascota?.nombre_mascota}</p>
                <p><strong>Especie:</strong> {recetaSeleccionada.historial_medico?.mascota?.especie}</p>
                <p><strong>Raza:</strong> {recetaSeleccionada.historial_medico?.mascota?.raza}</p>
                <p><strong>Propietario:</strong> {recetaSeleccionada.historial_medico?.mascota?.cliente?.nombre_cliente} {recetaSeleccionada.historial_medico?.mascota?.cliente?.primer_apellido}</p>
                <p><strong>Teléfono:</strong> {recetaSeleccionada.historial_medico?.mascota?.cliente?.telefono}</p>
              </div>

              {/* Diagnóstico */}
              <div className="detalle-section">
                <h3>🔬 Diagnóstico</h3>
                <p>{recetaSeleccionada.diagnostico?.descripcion}</p>
              </div>

              {/* Tratamiento */}
              <div className="detalle-section">
                <h3>💊 Tratamiento Prescrito</h3>
                <p><strong>Medicamento:</strong> {recetaSeleccionada.tratamiento?.medicamento}</p>
                <p><strong>Descripción:</strong> {recetaSeleccionada.tratamiento?.descripcion}</p>
                <p><strong>Dosis:</strong> {recetaSeleccionada.tratamiento?.dosis}</p>
                <p><strong>Duración:</strong> {recetaSeleccionada.tratamiento?.duracion}</p>
              </div>

              {/* Observaciones completas */}
              <div className="detalle-section">
                <h3>📝 Observaciones e Indicaciones</h3>
                <pre className="observaciones-pre">{recetaSeleccionada.observaciones}</pre>
              </div>

              {/* Fecha */}
              <div className="detalle-section">
                <h3>📅 Fecha de Prescripción</h3>
                <p>{new Date(recetaSeleccionada.historial_medico?.fecha_creacion).toLocaleDateString('es-ES', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-imprimir" onClick={imprimirReceta}>
                🖨️ Imprimir Receta
              </button>
              <button className="btn-cancelar" onClick={() => setModalDetalle(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecetasTratamientos;
