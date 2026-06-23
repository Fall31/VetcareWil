import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import './MisHorarios.css';

function MisHorarios() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [personalInfo, setPersonalInfo] = useState(null);

  // Estados para horarios
  const [horariosAsignados, setHorariosAsignados] = useState([]);
  const [vistaActual, setVistaActual] = useState('semana'); // 'semana' o 'mes'
  const [fechaActual, setFechaActual] = useState(new Date());

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Verificar autenticación
  useEffect(() => {
    verificarAutenticacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const verificarAutenticacion = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('Debes iniciar sesión para acceder a esta sección');
        setLoading(false);
        return;
      }

      const { data: personalData, error: personalError } = await supabase
        .from('personal')
        .select('ci_personal, nombre, apellidos, cargo')
        .eq('user_id', user.id)
        .single();

      if (personalError || !personalData) {
        setError('No se encontró el perfil del personal');
        setLoading(false);
        return;
      }

      setPersonalInfo(personalData);
      await cargarHorarios(personalData.ci_personal);
    } catch (err) {
      console.error('Error al verificar autenticación:', err);
      setError('Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Cargar horarios asignados
  const cargarHorarios = async (ci) => {
    try {
      const { data, error } = await supabase
        .from('horario_personal')
        .select(`
          *,
          horario:id_horario (
            id_horario,
            dia_semana,
            hora_inicio,
            hora_fin,
            descanso_inicio,
            descanso_fin,
            disponibilidad,
            es_emergencia,
            servicio:id_servicio (
              nombre_servicio,
              descripcion
            )
          )
        `)
        .eq('ci_personal', ci)
        .order('fecha_asignacion', { ascending: false });

      if (error) throw error;

      setHorariosAsignados(data || []);
    } catch (err) {
      console.error('Error al cargar horarios:', err);
    }
  };

  // Obtener días de la semana actual
  const obtenerDiasSemana = () => {
    const inicio = new Date(fechaActual);
    inicio.setDate(inicio.getDate() - inicio.getDay() + 1); // Lunes

    const dias = [];
    for (let i = 0; i < 7; i++) {
      const dia = new Date(inicio);
      dia.setDate(inicio.getDate() + i);
      dias.push(dia);
    }
    return dias;
  };

  // Obtener días del mes actual
  const obtenerDiasMes = () => {
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    
    // Ajustar para que la semana empiece en lunes
    const primerDiaSemana = primerDia.getDay() === 0 ? 6 : primerDia.getDay() - 1;
    
    const dias = [];
    
    // Días del mes anterior
    for (let i = primerDiaSemana - 1; i >= 0; i--) {
      const dia = new Date(año, mes, -i);
      dias.push({ fecha: dia, esOtroMes: true });
    }
    
    // Días del mes actual
    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      const dia = new Date(año, mes, i);
      dias.push({ fecha: dia, esOtroMes: false });
    }
    
    // Días del mes siguiente para completar la última semana
    const diasRestantes = 42 - dias.length; // 6 semanas * 7 días
    for (let i = 1; i <= diasRestantes; i++) {
      const dia = new Date(año, mes + 1, i);
      dias.push({ fecha: dia, esOtroMes: true });
    }
    
    return dias;
  };

  // Obtener horarios para un día específico
  const obtenerHorariosDia = (fecha) => {
    const diaSemana = fecha.getDay() === 0 ? 'Domingo' : diasSemana[fecha.getDay() - 1];
    
    return horariosAsignados.filter(h => {
      if (!h.horario) return false;
      return h.horario.dia_semana === diaSemana;
    });
  };

  // Navegar en el calendario
  const cambiarSemana = (direccion) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setDate(nuevaFecha.getDate() + (direccion * 7));
    setFechaActual(nuevaFecha);
  };

  const cambiarMes = (direccion) => {
    const nuevaFecha = new Date(fechaActual);
    nuevaFecha.setMonth(nuevaFecha.getMonth() + direccion);
    setFechaActual(nuevaFecha);
  };

  const irHoy = () => {
    setFechaActual(new Date());
  };

  // Formatear hora
  const formatearHora = (hora) => {
    if (!hora) return '';
    return hora.substring(0, 5); // HH:MM
  };

  // Verificar si es hoy
  const esHoy = (fecha) => {
    const hoy = new Date();
    return fecha.toDateString() === hoy.toDateString();
  };

  // Agrupar horarios por servicio
  const agruparPorServicio = () => {
    const servicios = {};
    
    horariosAsignados.forEach(h => {
      if (!h.horario || !h.horario.servicio) return;
      
      const servicioNombre = h.horario.servicio.nombre_servicio;
      if (!servicios[servicioNombre]) {
        servicios[servicioNombre] = [];
      }
      servicios[servicioNombre].push(h);
    });
    
    return servicios;
  };

  if (loading) {
    return (
      <div className="horarios-loading">
        <div className="loader"></div>
        <p>Cargando horarios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="horarios-error">
        <p>❌ {error}</p>
        <button onClick={() => navigate('/dashboard-personal')} className="btn-volver">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  const diasSemanaActual = obtenerDiasSemana();
  const diasMesActual = obtenerDiasMes();
  const serviciosAgrupados = agruparPorServicio();

  return (
    <div className="mis-horarios">
      <div className="horarios-header-top">
        <div>
          <h1>🗓️ Mis Horarios</h1>
          <p className="subtitle">
            Calendario de horarios asignados - {personalInfo?.nombre} {personalInfo?.apellidos}
          </p>
        </div>
        <button onClick={() => navigate('/dashboard-personal')} className="btn-volver">
          ← Volver
        </button>
      </div>

      {/* CONTROLES DE NAVEGACION */}
      <div className="calendario-controles">
        <div className="vista-selector">
          <button
            className={`btn-vista ${vistaActual === 'semana' ? 'activo' : ''}`}
            onClick={() => setVistaActual('semana')}
          >
            📅 Semana
          </button>
          <button
            className={`btn-vista ${vistaActual === 'mes' ? 'activo' : ''}`}
            onClick={() => setVistaActual('mes')}
          >
            📆 Mes
          </button>
        </div>

        <div className="navegacion-fecha">
          <button
            onClick={() => vistaActual === 'semana' ? cambiarSemana(-1) : cambiarMes(-1)}
            className="btn-nav"
          >
            ‹
          </button>
          
          <div className="fecha-actual">
            {vistaActual === 'semana' ? (
              <>
                {diasSemanaActual[0].toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                {' - '}
                {diasSemanaActual[6].toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </>
            ) : (
              <>
                {meses[fechaActual.getMonth()]} {fechaActual.getFullYear()}
              </>
            )}
          </div>
          
          <button
            onClick={() => vistaActual === 'semana' ? cambiarSemana(1) : cambiarMes(1)}
            className="btn-nav"
          >
            ›
          </button>
        </div>

        <button onClick={irHoy} className="btn-hoy">
          Hoy
        </button>
      </div>

      {/* ESTADISTICAS RAPIDAS */}
      <div className="stats-horarios">
        <div className="stat-card">
          <div className="stat-icono">📋</div>
          <div className="stat-info">
            <h3>{horariosAsignados.length}</h3>
            <p>Horarios Asignados</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icono">🏥</div>
          <div className="stat-info">
            <h3>{Object.keys(serviciosAgrupados).length}</h3>
            <p>Servicios</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icono">🕐</div>
          <div className="stat-info">
            <h3>{horariosAsignados.filter(h => h.horario?.es_emergencia).length}</h3>
            <p>Emergencias</p>
          </div>
        </div>
      </div>

      {/* VISTA DE SEMANA */}
      {vistaActual === 'semana' && (
        <div className="calendario-semana">
          <div className="semana-grid">
            {diasSemanaActual.map((dia, index) => {
              const horariosDia = obtenerHorariosDia(dia);
              const esHoyDia = esHoy(dia);

              return (
                <div key={index} className={`dia-card ${esHoyDia ? 'hoy' : ''}`}>
                  <div className="dia-header">
                    <div className="dia-nombre">{diasSemana[index]}</div>
                    <div className="dia-fecha">
                      {dia.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </div>
                  </div>

                  <div className="dia-horarios">
                    {horariosDia.length === 0 ? (
                      <div className="sin-horarios">
                        <p>📭</p>
                        <p>Sin horarios</p>
                      </div>
                    ) : (
                      horariosDia.map((horario, idx) => (
                        <div
                          key={idx}
                          className={`horario-bloque ${horario.horario.es_emergencia ? 'emergencia' : ''}`}
                        >
                          <div className="horario-servicio">
                            {horario.horario.servicio?.nombre_servicio || 'Sin servicio'}
                          </div>
                          <div className="horario-tiempo">
                            ⏰ {formatearHora(horario.horario.hora_inicio)} - {formatearHora(horario.horario.hora_fin)}
                          </div>
                          {horario.horario.descanso_inicio && horario.horario.descanso_fin && (
                            <div className="horario-descanso">
                              ☕ Descanso: {formatearHora(horario.horario.descanso_inicio)} - {formatearHora(horario.horario.descanso_fin)}
                            </div>
                          )}
                          {horario.horario.es_emergencia && (
                            <div className="badge-emergencia">🚨 Emergencia</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA DE MES */}
      {vistaActual === 'mes' && (
        <div className="calendario-mes">
          <div className="mes-headers">
            {diasSemana.map(dia => (
              <div key={dia} className="dia-header-mes">{dia.substring(0, 3)}</div>
            ))}
          </div>

          <div className="mes-grid">
            {diasMesActual.map((diaObj, index) => {
              const horariosDia = obtenerHorariosDia(diaObj.fecha);
              const esHoyDia = esHoy(diaObj.fecha);

              return (
                <div
                  key={index}
                  className={`dia-mes ${diaObj.esOtroMes ? 'otro-mes' : ''} ${esHoyDia ? 'hoy' : ''}`}
                >
                  <div className="dia-numero">{diaObj.fecha.getDate()}</div>
                  
                  {!diaObj.esOtroMes && horariosDia.length > 0 && (
                    <div className="dia-indicadores">
                      {horariosDia.map((h, idx) => (
                        <div
                          key={idx}
                          className={`indicador-horario ${h.horario.es_emergencia ? 'emergencia' : ''}`}
                          title={`${h.horario.servicio?.nombre_servicio} - ${formatearHora(h.horario.hora_inicio)}-${formatearHora(h.horario.hora_fin)}`}
                        >
                          <span className="indicador-punto"></span>
                          <span className="indicador-texto">
                            {h.horario.servicio?.nombre_servicio.substring(0, 15)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* LISTA DE HORARIOS POR SERVICIO */}
      <div className="horarios-por-servicio">
        <h2>📋 Resumen por Servicio</h2>
        
        {Object.keys(serviciosAgrupados).length === 0 ? (
          <div className="sin-horarios-servicio">
            <p>📭</p>
            <p>No tienes horarios asignados actualmente</p>
          </div>
        ) : (
          Object.entries(serviciosAgrupados).map(([servicio, horarios]) => (
            <div key={servicio} className="servicio-grupo">
              <div className="servicio-header">
                <h3>{servicio}</h3>
                <span className="servicio-count">{horarios.length} horarios</span>
              </div>
              
              <div className="horarios-lista">
                {horarios.map((h, idx) => (
                  <div key={idx} className="horario-item">
                    <div className="horario-dia">
                      <span className="dia-icono">📅</span>
                      {h.horario.dia_semana}
                    </div>
                    <div className="horario-detalles">
                      <div className="horario-horas">
                        ⏰ {formatearHora(h.horario.hora_inicio)} - {formatearHora(h.horario.hora_fin)}
                      </div>
                      {h.horario.descanso_inicio && h.horario.descanso_fin && (
                        <div className="horario-desc-small">
                          Descanso: {formatearHora(h.horario.descanso_inicio)} - {formatearHora(h.horario.descanso_fin)}
                        </div>
                      )}
                    </div>
                    <div className="horario-badges">
                      {h.horario.es_emergencia && (
                        <span className="badge badge-emergencia">🚨 Emergencia</span>
                      )}
                      <span className={`badge badge-${h.horario.disponibilidad ? 'disponible' : 'ocupado'}`}>
                        {h.horario.disponibilidad ? '✓ Disponible' : '✗ Ocupado'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default MisHorarios;
