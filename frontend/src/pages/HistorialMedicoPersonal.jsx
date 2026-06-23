import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import './HistorialMedicoPersonal.css';

function HistorialMedicoPersonal() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ci_personal, setCiPersonal] = useState(null);

  // Estados para datos
  const [mascotas, setMascotas] = useState([]);
  const [mascotaSeleccionada, setMascotaSeleccionada] = useState(null);
  const [historiales, setHistoriales] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Estados para el modal de detalle
  const [modalDetalle, setModalDetalle] = useState(false);
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null);

  // Estados para crear nuevo registro
  const [modalNuevo, setModalNuevo] = useState(false);
  const [servicios, setServicios] = useState([]);
  const [diagnosticos, setDiagnosticos] = useState([]);
  const [tratamientos, setTratamientos] = useState([]);
  const [nuevoRegistro, setNuevoRegistro] = useState({
    id_diagnostico: '',
    id_servicio: '',
    id_tratamiento: '',
    observaciones: ''
  });

  // Estados para crear diagnóstico/tratamiento
  const [modalDiagnostico, setModalDiagnostico] = useState(false);
  const [modalTratamiento, setModalTratamiento] = useState(false);
  const [nuevoDiagnostico, setNuevoDiagnostico] = useState({ descripcion: '' });
  const [nuevoTratamiento, setNuevoTratamiento] = useState({
    descripcion: '',
    medicamento: '',
    dosis: '',
    duracion: ''
  });

  const [alertaExito, setAlertaExito] = useState('');

  // Verificar autenticación y obtener CI del personal
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
        .select('ci_personal')
        .eq('user_id', user.id)
        .single();

      if (personalError || !personalData) {
        setError('No se encontró el perfil del personal');
        setLoading(false);
        return;
      }

      setCiPersonal(personalData.ci_personal);
      await cargarMascotas(personalData.ci_personal);
      await cargarCatalogos();
    } catch (err) {
      console.error('Error al verificar autenticación:', err);
      setError('Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Cargar mascotas que han tenido citas con este personal
  const cargarMascotas = async (ci) => {
    try {
      // Obtener mascotas únicas de las reservas del personal
      const { data: reservasData, error: reservasError } = await supabase
        .from('reserva')
        .select(`
          ci_mascota,
          mascota:ci_mascota (
            ci_mascota,
            nombre_mascota,
            especie,
            raza,
            edad,
            peso,
            sexo,
            cliente:ci_cliente (
              nombre_cliente,
              primer_apellido,
              segundo_apellido,
              telefono
            )
          )
        `)
        .eq('ci_personal', ci);

      if (reservasError) throw reservasError;

      // Eliminar duplicados por ci_mascota
      const mascotasUnicas = [];
      const cis = new Set();
      
      reservasData.forEach(item => {
        if (item.mascota && !cis.has(item.mascota.ci_mascota)) {
          cis.add(item.mascota.ci_mascota);
          mascotasUnicas.push(item.mascota);
        }
      });

      setMascotas(mascotasUnicas);
    } catch (err) {
      console.error('Error al cargar mascotas:', err);
      setError('Error al cargar la lista de mascotas');
    }
  };

  // Cargar catálogos (servicios, diagnósticos, tratamientos)
  const cargarCatalogos = async () => {
    try {
      const [serviciosRes, diagnosticosRes, tratamientosRes] = await Promise.all([
        supabase.from('servicio').select('*').eq('estado', 'activo'),
        supabase.from('diagnostico').select('*'),
        supabase.from('tratamiento').select('*')
      ]);

      if (serviciosRes.error) throw serviciosRes.error;
      if (diagnosticosRes.error) throw diagnosticosRes.error;
      if (tratamientosRes.error) throw tratamientosRes.error;

      setServicios(serviciosRes.data || []);
      setDiagnosticos(diagnosticosRes.data || []);
      setTratamientos(tratamientosRes.data || []);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
    }
  };

  // Cargar historial de una mascota
  const cargarHistorial = async (ci_mascota) => {
    try {
      setLoading(true);
      setMascotaSeleccionada(mascotas.find(m => m.ci_mascota === ci_mascota));

      const { data, error } = await supabase
        .from('historial_medico')
        .select(`
          *,
          historial_medico_detalle:historial_medico_detalle (
            *,
            diagnostico:id_diagnostico (*),
            servicio:id_servicio (*),
            tratamiento:id_tratamiento (*)
          )
        `)
        .eq('id_mascota', ci_mascota)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      setHistoriales(data || []);
    } catch (err) {
      console.error('Error al cargar historial:', err);
      setError('Error al cargar el historial médico');
    } finally {
      setLoading(false);
    }
  };

  // Abrir detalle de registro
  const abrirDetalle = (detalle) => {
    setDetalleSeleccionado(detalle);
    setModalDetalle(true);
  };

  // Crear nuevo registro médico
  const abrirModalNuevo = () => {
    setNuevoRegistro({
      id_diagnostico: '',
      id_servicio: '',
      id_tratamiento: '',
      observaciones: ''
    });
    setModalNuevo(true);
  };

  const crearRegistro = async () => {
    try {
      if (!nuevoRegistro.id_diagnostico || !nuevoRegistro.observaciones) {
        alert('El diagnóstico y las observaciones son obligatorios');
        return;
      }

      setLoading(true);

      // Obtener o crear historial para la mascota
      let { data: historialData, error: historialError } = await supabase
        .from('historial_medico')
        .select('id_historial')
        .eq('id_mascota', mascotaSeleccionada.ci_mascota)
        .single();

      let id_historial;

      if (historialError || !historialData) {
        // Crear nuevo historial
        const { data: nuevoHistorial, error: errorNuevo } = await supabase
          .from('historial_medico')
          .insert({
            id_mascota: mascotaSeleccionada.ci_mascota,
            fecha_creacion: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (errorNuevo) throw errorNuevo;
        id_historial = nuevoHistorial.id_historial;
      } else {
        id_historial = historialData.id_historial;
      }

      // Crear detalle
      const { error: detalleError } = await supabase
        .from('historial_medico_detalle')
        .insert({
          id_historial,
          id_diagnostico: nuevoRegistro.id_diagnostico || null,
          id_servicio: nuevoRegistro.id_servicio || null,
          id_tratamiento: nuevoRegistro.id_tratamiento || null,
          observaciones: nuevoRegistro.observaciones
        });

      if (detalleError) throw detalleError;

      setAlertaExito('✅ Registro médico creado exitosamente');
      setTimeout(() => setAlertaExito(''), 3000);
      setModalNuevo(false);
      await cargarHistorial(mascotaSeleccionada.ci_mascota);
    } catch (err) {
      console.error('Error al crear registro:', err);
      alert('Error al crear el registro médico');
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo diagnóstico
  const crearDiagnostico = async () => {
    try {
      if (!nuevoDiagnostico.descripcion.trim()) {
        alert('La descripción del diagnóstico es obligatoria');
        return;
      }

      const { data, error } = await supabase
        .from('diagnostico')
        .insert({ descripcion: nuevoDiagnostico.descripcion })
        .select()
        .single();

      if (error) throw error;

      setDiagnosticos([...diagnosticos, data]);
      setNuevoRegistro({ ...nuevoRegistro, id_diagnostico: data.id_diagnostico });
      setModalDiagnostico(false);
      setNuevoDiagnostico({ descripcion: '' });
      setAlertaExito('✅ Diagnóstico creado exitosamente');
      setTimeout(() => setAlertaExito(''), 3000);
    } catch (err) {
      console.error('Error al crear diagnóstico:', err);
      alert('Error al crear el diagnóstico');
    }
  };

  // Crear nuevo tratamiento
  const crearTratamiento = async () => {
    try {
      if (!nuevoTratamiento.descripcion.trim() || !nuevoTratamiento.medicamento.trim()) {
        alert('La descripción y el medicamento son obligatorios');
        return;
      }

      const { data, error } = await supabase
        .from('tratamiento')
        .insert(nuevoTratamiento)
        .select()
        .single();

      if (error) throw error;

      setTratamientos([...tratamientos, data]);
      setNuevoRegistro({ ...nuevoRegistro, id_tratamiento: data.id_tratamiento });
      setModalTratamiento(false);
      setNuevoTratamiento({ descripcion: '', medicamento: '', dosis: '', duracion: '' });
      setAlertaExito('✅ Tratamiento creado exitosamente');
      setTimeout(() => setAlertaExito(''), 3000);
    } catch (err) {
      console.error('Error al crear tratamiento:', err);
      alert('Error al crear el tratamiento');
    }
  };

  // Filtrar mascotas por búsqueda
  const mascotasFiltradas = mascotas.filter(m => 
    m.nombre_mascota.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.cliente?.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
    m.especie.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading && !ci_personal) {
    return (
      <div className="historial-loading">
        <div className="loader"></div>
        <p>Cargando historial médico...</p>
      </div>
    );
  }

  if (error && !ci_personal) {
    return (
      <div className="historial-error">
        <p>❌ {error}</p>
        <button className="btn-volver" onClick={() => navigate('/dashboard-personal')}>
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="historial-medico-personal">
      {/* Header */}
      <div className="historial-header">
        <h1>📋 Historial Médico</h1>
        <p className="subtitle">Gestión de registros médicos de pacientes</p>
      </div>

      {alertaExito && (
        <div className="alert alert-success">{alertaExito}</div>
      )}

      <div className="historial-container">
        {/* Panel izquierdo: Lista de mascotas */}
        <div className="panel-mascotas">
          <div className="panel-header">
            <h2>🐾 Mis Pacientes</h2>
            <div className="busqueda-mascotas">
              <input
                type="text"
                placeholder="Buscar por nombre, dueño o especie..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="input-busqueda"
              />
            </div>
          </div>

          <div className="lista-mascotas">
            {mascotasFiltradas.length === 0 ? (
              <div className="empty-mascotas">
                <p>No se encontraron pacientes</p>
              </div>
            ) : (
              mascotasFiltradas.map(mascota => (
                <div
                  key={mascota.ci_mascota}
                  className={`mascota-item ${mascotaSeleccionada?.ci_mascota === mascota.ci_mascota ? 'activa' : ''}`}
                  onClick={() => cargarHistorial(mascota.ci_mascota)}
                >
                  <div className="mascota-avatar">
                    {mascota.especie === 'Perro' ? '🐕' : mascota.especie === 'Gato' ? '🐈' : '🐾'}
                  </div>
                  <div className="mascota-info-item">
                    <h3>{mascota.nombre_mascota}</h3>
                    <p className="mascota-especie">{mascota.especie} • {mascota.raza}</p>
                    <p className="mascota-dueno">
                      👤 {mascota.cliente?.nombre_cliente} {mascota.cliente?.primer_apellido}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panel derecho: Historial de la mascota seleccionada */}
        <div className="panel-historial">
          {!mascotaSeleccionada ? (
            <div className="empty-state">
              <div className="empty-icon">🏥</div>
              <h2>Selecciona un paciente</h2>
              <p>Elige una mascota de la lista para ver su historial médico completo</p>
            </div>
          ) : (
            <>
              {/* Info de la mascota */}
              <div className="mascota-detalle-header">
                <div className="mascota-titulo">
                  <h2>{mascotaSeleccionada.nombre_mascota}</h2>
                  <span className="mascota-chip">{mascotaSeleccionada.especie}</span>
                </div>
                <div className="mascota-datos-grid">
                  <div className="dato-item">
                    <strong>Raza:</strong> {mascotaSeleccionada.raza}
                  </div>
                  <div className="dato-item">
                    <strong>Edad:</strong> {mascotaSeleccionada.edad} años
                  </div>
                  <div className="dato-item">
                    <strong>Peso:</strong> {mascotaSeleccionada.peso} kg
                  </div>
                  <div className="dato-item">
                    <strong>Sexo:</strong> {mascotaSeleccionada.sexo}
                  </div>
                </div>
                <button className="btn-nuevo-registro" onClick={abrirModalNuevo}>
                  ➕ Nuevo Registro Médico
                </button>
              </div>

              {/* Timeline de historial */}
              <div className="timeline-historial">
                {historiales.length === 0 ? (
                  <div className="empty-historial">
                    <p>📝 No hay registros médicos para este paciente</p>
                    <button className="btn-crear-primero" onClick={abrirModalNuevo}>
                      Crear primer registro
                    </button>
                  </div>
                ) : (
                  historiales.map(historial => (
                    <div key={historial.id_historial} className="historial-grupo">
                      <div className="historial-fecha-principal">
                        📅 {new Date(historial.fecha_creacion).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </div>

                      {historial.historial_medico_detalle?.map(detalle => (
                        <div
                          key={detalle.id_detalle}
                          className="registro-card"
                          onClick={() => abrirDetalle(detalle)}
                        >
                          <div className="registro-icono">🩺</div>
                          <div className="registro-contenido">
                            <h4>{detalle.diagnostico?.descripcion || 'Sin diagnóstico'}</h4>
                            {detalle.servicio && (
                              <p className="registro-servicio">
                                🏥 {detalle.servicio.nombre_servicio}
                              </p>
                            )}
                            {detalle.tratamiento && (
                              <p className="registro-tratamiento">
                                💊 {detalle.tratamiento.medicamento}
                              </p>
                            )}
                            <p className="registro-observaciones">
                              {detalle.observaciones?.substring(0, 100)}
                              {detalle.observaciones?.length > 100 ? '...' : ''}
                            </p>
                          </div>
                          <div className="registro-flecha">›</div>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal: Detalle de registro */}
      {modalDetalle && detalleSeleccionado && (
        <div className="modal-overlay" onClick={() => setModalDetalle(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🩺 Detalle del Registro Médico</h2>
              <button className="btn-cerrar" onClick={() => setModalDetalle(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detalle-section">
                <h3>🔬 Diagnóstico</h3>
                <p>{detalleSeleccionado.diagnostico?.descripcion || 'No especificado'}</p>
              </div>

              {detalleSeleccionado.servicio && (
                <div className="detalle-section">
                  <h3>🏥 Servicio Realizado</h3>
                  <p><strong>Nombre:</strong> {detalleSeleccionado.servicio.nombre_servicio}</p>
                  <p><strong>Descripción:</strong> {detalleSeleccionado.servicio.descripcion}</p>
                  <p><strong>Precio:</strong> S/. {detalleSeleccionado.servicio.precio}</p>
                </div>
              )}

              {detalleSeleccionado.tratamiento && (
                <div className="detalle-section">
                  <h3>💊 Tratamiento</h3>
                  <p><strong>Descripción:</strong> {detalleSeleccionado.tratamiento.descripcion}</p>
                  <p><strong>Medicamento:</strong> {detalleSeleccionado.tratamiento.medicamento}</p>
                  <p><strong>Dosis:</strong> {detalleSeleccionado.tratamiento.dosis}</p>
                  <p><strong>Duración:</strong> {detalleSeleccionado.tratamiento.duracion}</p>
                </div>
              )}

              <div className="detalle-section">
                <h3>📝 Observaciones</h3>
                <p>{detalleSeleccionado.observaciones || 'Sin observaciones'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuevo registro */}
      {modalNuevo && (
        <div className="modal-overlay" onClick={() => setModalNuevo(false)}>
          <div className="modal-content modal-grande" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Nuevo Registro Médico</h2>
              <button className="btn-cerrar" onClick={() => setModalNuevo(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grupo">
                <label>🔬 Diagnóstico *</label>
                <div className="input-con-boton">
                  <select
                    value={nuevoRegistro.id_diagnostico}
                    onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, id_diagnostico: e.target.value })}
                    className="select-filtro"
                  >
                    <option value="">Seleccionar diagnóstico...</option>
                    {diagnosticos.map(d => (
                      <option key={d.id_diagnostico} value={d.id_diagnostico}>
                        {d.descripcion}
                      </option>
                    ))}
                  </select>
                  <button className="btn-agregar-rapido" onClick={() => setModalDiagnostico(true)}>
                    ➕
                  </button>
                </div>
              </div>

              <div className="form-grupo">
                <label>🏥 Servicio (Opcional)</label>
                <select
                  value={nuevoRegistro.id_servicio}
                  onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, id_servicio: e.target.value })}
                  className="select-filtro"
                >
                  <option value="">Seleccionar servicio...</option>
                  {servicios.map(s => (
                    <option key={s.id_servicio} value={s.id_servicio}>
                      {s.nombre_servicio} - S/. {s.precio}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-grupo">
                <label>💊 Tratamiento (Opcional)</label>
                <div className="input-con-boton">
                  <select
                    value={nuevoRegistro.id_tratamiento}
                    onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, id_tratamiento: e.target.value })}
                    className="select-filtro"
                  >
                    <option value="">Seleccionar tratamiento...</option>
                    {tratamientos.map(t => (
                      <option key={t.id_tratamiento} value={t.id_tratamiento}>
                        {t.medicamento} - {t.dosis}
                      </option>
                    ))}
                  </select>
                  <button className="btn-agregar-rapido" onClick={() => setModalTratamiento(true)}>
                    ➕
                  </button>
                </div>
              </div>

              <div className="form-grupo">
                <label>📝 Observaciones *</label>
                <textarea
                  value={nuevoRegistro.observaciones}
                  onChange={(e) => setNuevoRegistro({ ...nuevoRegistro, observaciones: e.target.value })}
                  className="textarea-comentario"
                  rows="5"
                  placeholder="Ingrese las observaciones del registro médico..."
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalNuevo(false)}>
                Cancelar
              </button>
              <button className="btn-guardar" onClick={crearRegistro} disabled={loading}>
                {loading ? 'Guardando...' : '💾 Guardar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuevo diagnóstico */}
      {modalDiagnostico && (
        <div className="modal-overlay" onClick={() => setModalDiagnostico(false)}>
          <div className="modal-content modal-pequeno" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🔬 Nuevo Diagnóstico</h2>
              <button className="btn-cerrar" onClick={() => setModalDiagnostico(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grupo">
                <label>Descripción del Diagnóstico *</label>
                <textarea
                  value={nuevoDiagnostico.descripcion}
                  onChange={(e) => setNuevoDiagnostico({ descripcion: e.target.value })}
                  className="textarea-comentario"
                  rows="4"
                  placeholder="Ej: Gastroenteritis leve, requiere dieta blanda..."
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalDiagnostico(false)}>
                Cancelar
              </button>
              <button className="btn-guardar" onClick={crearDiagnostico}>
                💾 Crear Diagnóstico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nuevo tratamiento */}
      {modalTratamiento && (
        <div className="modal-overlay" onClick={() => setModalTratamiento(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>💊 Nuevo Tratamiento</h2>
              <button className="btn-cerrar" onClick={() => setModalTratamiento(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grupo">
                <label>Descripción del Tratamiento *</label>
                <input
                  type="text"
                  value={nuevoTratamiento.descripcion}
                  onChange={(e) => setNuevoTratamiento({ ...nuevoTratamiento, descripcion: e.target.value })}
                  className="input-busqueda"
                  placeholder="Ej: Tratamiento para gastroenteritis"
                />
              </div>
              <div className="form-grupo">
                <label>Medicamento *</label>
                <input
                  type="text"
                  value={nuevoTratamiento.medicamento}
                  onChange={(e) => setNuevoTratamiento({ ...nuevoTratamiento, medicamento: e.target.value })}
                  className="input-busqueda"
                  placeholder="Ej: Metronidazol"
                />
              </div>
              <div className="form-grupo">
                <label>Dosis</label>
                <input
                  type="text"
                  value={nuevoTratamiento.dosis}
                  onChange={(e) => setNuevoTratamiento({ ...nuevoTratamiento, dosis: e.target.value })}
                  className="input-busqueda"
                  placeholder="Ej: 250mg cada 12h"
                />
              </div>
              <div className="form-grupo">
                <label>Duración</label>
                <input
                  type="text"
                  value={nuevoTratamiento.duracion}
                  onChange={(e) => setNuevoTratamiento({ ...nuevoTratamiento, duracion: e.target.value })}
                  className="input-busqueda"
                  placeholder="Ej: 7 días"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancelar" onClick={() => setModalTratamiento(false)}>
                Cancelar
              </button>
              <button className="btn-guardar" onClick={crearTratamiento}>
                💾 Crear Tratamiento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default HistorialMedicoPersonal;
