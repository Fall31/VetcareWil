import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import './ChatPersonal.css';

function ChatPersonal() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ci_personal, setCiPersonal] = useState(null);

  // Estados para chat
  const [conversaciones, setConversaciones] = useState([]);
  const [conversacionActiva, setConversacionActiva] = useState(null);
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [busquedaPersonal, setBusquedaPersonal] = useState('');
  const [personalDisponible, setPersonalDisponible] = useState([]);
  const [modalNuevoChat, setModalNuevoChat] = useState(false);

  // Verificar autenticación
  useEffect(() => {
    verificarAutenticacion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar mensajes automáticamente
  useEffect(() => {
    if (conversacionActiva) {
      const interval = setInterval(() => {
        cargarMensajes(conversacionActiva.id_conversacion);
      }, 3000); // Actualizar cada 3 segundos

      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversacionActiva]);

  // Scroll al final de mensajes
  useEffect(() => {
    scrollToBottom();
  }, [mensajes]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

      setCiPersonal(personalData.ci_personal);
      await cargarConversaciones(personalData.ci_personal);
      await cargarPersonalDisponible(personalData.ci_personal);
    } catch (err) {
      console.error('Error al verificar autenticación:', err);
      setError('Error al cargar los datos del usuario');
    } finally {
      setLoading(false);
    }
  };

  // Cargar conversaciones del usuario
  const cargarConversaciones = async (ci) => {
    try {
      // Buscar conversaciones donde el usuario es participante1 o participante2
      const { data, error } = await supabase
        .from('conversaciones_personal')
        .select(`
          *,
          participante1:personal!conversaciones_personal_ci_participante1_fkey(ci_personal, nombre, apellidos, cargo),
          participante2:personal!conversaciones_personal_ci_participante2_fkey(ci_personal, nombre, apellidos, cargo)
        `)
        .or(`ci_participante1.eq.${ci},ci_participante2.eq.${ci}`)
        .order('fecha_ultimo_mensaje', { ascending: false });

      if (error) throw error;

      // Procesar conversaciones para identificar al otro participante
      const conversacionesProcesadas = data.map(conv => {
        const esParticipante1 = conv.ci_participante1 === ci;
        const otroParticipante = esParticipante1 ? conv.participante2 : conv.participante1;
        
        return {
          ...conv,
          otroParticipante,
          mensajesNoLeidos: esParticipante1 ? conv.no_leidos_p1 : conv.no_leidos_p2
        };
      });

      setConversaciones(conversacionesProcesadas);
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
    }
  };

  // Cargar personal disponible para nuevo chat
  const cargarPersonalDisponible = async (ci) => {
    try {
      const { data, error } = await supabase
        .from('personal')
        .select('ci_personal, nombre, apellidos, cargo')
        .neq('ci_personal', ci)
        .order('nombre');

      if (error) throw error;
      setPersonalDisponible(data || []);
    } catch (err) {
      console.error('Error al cargar personal:', err);
    }
  };

  // Cargar mensajes de una conversación
  const cargarMensajes = async (idConversacion) => {
    try {
      const { data, error } = await supabase
        .from('mensajes_personal')
        .select(`
          *,
          remitente:personal!mensajes_personal_ci_remitente_fkey(ci_personal, nombre, apellidos)
        `)
        .eq('id_conversacion', idConversacion)
        .order('fecha_envio', { ascending: true });

      if (error) throw error;

      setMensajes(data || []);

      // Marcar como leídos los mensajes del otro usuario
      await marcarMensajesComoLeidos(idConversacion);
    } catch (err) {
      console.error('Error al cargar mensajes:', err);
    }
  };

  // Marcar mensajes como leídos
  const marcarMensajesComoLeidos = async (idConversacion) => {
    try {
      const conversacion = conversaciones.find(c => c.id_conversacion === idConversacion);
      if (!conversacion) return;

      const esParticipante1 = conversacion.ci_participante1 === ci_personal;
      const campoNoLeidos = esParticipante1 ? 'no_leidos_p1' : 'no_leidos_p2';

      await supabase
        .from('conversaciones_personal')
        .update({ [campoNoLeidos]: 0 })
        .eq('id_conversacion', idConversacion);

      // Actualizar estado local
      setConversaciones(prev => 
        prev.map(c => 
          c.id_conversacion === idConversacion 
            ? { ...c, mensajesNoLeidos: 0 }
            : c
        )
      );
    } catch (err) {
      console.error('Error al marcar mensajes como leídos:', err);
    }
  };

  // Seleccionar conversación
  const seleccionarConversacion = async (conversacion) => {
    setConversacionActiva(conversacion);
    await cargarMensajes(conversacion.id_conversacion);
  };

  // Enviar mensaje
  const enviarMensaje = async (e) => {
    e.preventDefault();
    
    if (!nuevoMensaje.trim() || !conversacionActiva) return;

    try {
      // Insertar mensaje
      const { error: msgError } = await supabase
        .from('mensajes_personal')
        .insert({
          id_conversacion: conversacionActiva.id_conversacion,
          ci_remitente: ci_personal,
          mensaje: nuevoMensaje.trim()
        });

      if (msgError) throw msgError;

      // Actualizar conversación
      const esParticipante1 = conversacionActiva.ci_participante1 === ci_personal;
      const campoNoLeidos = esParticipante1 ? 'no_leidos_p2' : 'no_leidos_p1';

      await supabase
        .from('conversaciones_personal')
        .update({
          fecha_ultimo_mensaje: new Date().toISOString(),
          [campoNoLeidos]: supabase.raw(`${campoNoLeidos} + 1`)
        })
        .eq('id_conversacion', conversacionActiva.id_conversacion);

      setNuevoMensaje('');
      await cargarMensajes(conversacionActiva.id_conversacion);
      await cargarConversaciones(ci_personal);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      alert('Error al enviar el mensaje');
    }
  };

  // Iniciar nueva conversación
  const iniciarConversacion = async (otroPersonal) => {
    try {
      // Verificar si ya existe una conversación
      const conversacionExistente = conversaciones.find(c => 
        c.otroParticipante.ci_personal === otroPersonal.ci_personal
      );

      if (conversacionExistente) {
        setModalNuevoChat(false);
        seleccionarConversacion(conversacionExistente);
        return;
      }

      // Crear nueva conversación
      const { data, error } = await supabase
        .from('conversaciones_personal')
        .insert({
          ci_participante1: ci_personal,
          ci_participante2: otroPersonal.ci_personal
        })
        .select()
        .single();

      if (error) throw error;

      setModalNuevoChat(false);
      await cargarConversaciones(ci_personal);

      // Seleccionar la nueva conversación
      const nuevaConv = {
        ...data,
        otroParticipante: otroPersonal,
        mensajesNoLeidos: 0
      };
      setConversacionActiva(nuevaConv);
      setMensajes([]);
    } catch (err) {
      console.error('Error al crear conversación:', err);
      alert('Error al iniciar la conversación');
    }
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    const date = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(hoy.getDate() - 1);

    const esHoy = date.toDateString() === hoy.toDateString();
    const esAyer = date.toDateString() === ayer.toDateString();

    if (esHoy) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (esAyer) {
      return 'Ayer';
    } else {
      return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    }
  };

  // Filtrar personal
  const personalFiltrado = personalDisponible.filter(p =>
    `${p.nombre} ${p.apellidos}`.toLowerCase().includes(busquedaPersonal.toLowerCase()) ||
    p.cargo.toLowerCase().includes(busquedaPersonal.toLowerCase())
  );

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="loader"></div>
        <p>Cargando chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-error">
        <p>❌ {error}</p>
        <button onClick={() => navigate('/dashboard-personal')} className="btn-volver">
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="chat-personal">
      <div className="chat-header-top">
        <div>
          <h1>💬 Chat Personal</h1>
          <p className="subtitle">Comunicación interna del equipo</p>
        </div>
        <button onClick={() => navigate('/dashboard-personal')} className="btn-volver">
          ← Volver
        </button>
      </div>

      <div className="chat-container">
        {/* SIDEBAR - Lista de conversaciones */}
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <h2>Conversaciones</h2>
            <button onClick={() => setModalNuevoChat(true)} className="btn-nuevo-chat">
              +
            </button>
          </div>

          <div className="conversaciones-lista">
            {conversaciones.length === 0 ? (
              <div className="no-conversaciones">
                <p>📭</p>
                <p>No hay conversaciones</p>
                <button onClick={() => setModalNuevoChat(true)} className="btn-iniciar-chat">
                  Iniciar chat
                </button>
              </div>
            ) : (
              conversaciones.map(conv => (
                <div
                  key={conv.id_conversacion}
                  className={`conversacion-item ${conversacionActiva?.id_conversacion === conv.id_conversacion ? 'activa' : ''}`}
                  onClick={() => seleccionarConversacion(conv)}
                >
                  <div className="avatar">
                    {conv.otroParticipante.nombre.charAt(0)}
                    {conv.otroParticipante.apellidos.charAt(0)}
                  </div>
                  <div className="conversacion-info">
                    <div className="conversacion-nombre">
                      {conv.otroParticipante.nombre} {conv.otroParticipante.apellidos}
                      {conv.mensajesNoLeidos > 0 && (
                        <span className="badge-no-leidos">{conv.mensajesNoLeidos}</span>
                      )}
                    </div>
                    <div className="conversacion-cargo">{conv.otroParticipante.cargo}</div>
                  </div>
                  <div className="conversacion-fecha">
                    {formatearFecha(conv.fecha_ultimo_mensaje)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AREA DE CHAT */}
        <div className="chat-area">
          {conversacionActiva ? (
            <>
              <div className="chat-header-conversacion">
                <div className="chat-destinatario">
                  <div className="avatar-grande">
                    {conversacionActiva.otroParticipante.nombre.charAt(0)}
                    {conversacionActiva.otroParticipante.apellidos.charAt(0)}
                  </div>
                  <div>
                    <h3>
                      {conversacionActiva.otroParticipante.nombre} {conversacionActiva.otroParticipante.apellidos}
                    </h3>
                    <p className="cargo-destinatario">{conversacionActiva.otroParticipante.cargo}</p>
                  </div>
                </div>
              </div>

              <div className="mensajes-container">
                {mensajes.length === 0 ? (
                  <div className="no-mensajes">
                    <p>💬</p>
                    <p>Inicia la conversación enviando un mensaje</p>
                  </div>
                ) : (
                  mensajes.map(mensaje => {
                    const esMio = mensaje.ci_remitente === ci_personal;
                    return (
                      <div key={mensaje.id_mensaje} className={`mensaje ${esMio ? 'mio' : 'otro'}`}>
                        <div className="mensaje-contenido">
                          <p>{mensaje.mensaje}</p>
                          <span className="mensaje-hora">
                            {new Date(mensaje.fecha_envio).toLocaleTimeString('es-ES', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={enviarMensaje} className="mensaje-input-container">
                <input
                  type="text"
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="mensaje-input"
                />
                <button type="submit" disabled={!nuevoMensaje.trim()} className="btn-enviar">
                  ➤
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversacion-seleccionada">
              <div className="icono-chat-grande">💬</div>
              <h2>Selecciona una conversación</h2>
              <p>Elige un contacto de la izquierda o inicia un nuevo chat</p>
              <button onClick={() => setModalNuevoChat(true)} className="btn-nuevo-chat-grande">
                + Nuevo Chat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL NUEVO CHAT */}
      {modalNuevoChat && (
        <div className="modal-overlay" onClick={() => setModalNuevoChat(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Chat</h2>
              <button onClick={() => setModalNuevoChat(false)} className="btn-cerrar">
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-grupo">
                <label>Buscar personal</label>
                <input
                  type="text"
                  value={busquedaPersonal}
                  onChange={(e) => setBusquedaPersonal(e.target.value)}
                  placeholder="Nombre o cargo..."
                  className="input-busqueda"
                />
              </div>

              <div className="personal-lista">
                {personalFiltrado.length === 0 ? (
                  <p className="no-resultados">No se encontró personal</p>
                ) : (
                  personalFiltrado.map(persona => (
                    <div
                      key={persona.ci_personal}
                      className="personal-item"
                      onClick={() => iniciarConversacion(persona)}
                    >
                      <div className="avatar">
                        {persona.nombre.charAt(0)}
                        {persona.apellidos.charAt(0)}
                      </div>
                      <div className="personal-info">
                        <div className="personal-nombre">
                          {persona.nombre} {persona.apellidos}
                        </div>
                        <div className="personal-cargo">{persona.cargo}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatPersonal;
