import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Registrar from "./pages/Registrar";
import IniciarSesion from "./pages/IniciarSesion";
import AgregarProducto from "./pages/AgregarProducto";
import Dashboard from "./pages/Dashboard";
import Doctores from "./pages/Doctores";
import Reservas from "./pages/Reservas";
import Historial from "./pages/Historial";
import CatalogoProductos from "./pages/CatalogoProductos";
import CatalogoServicios from "./pages/CatalogoServicios";
import Carrito from "./pages/Carrito";
import ChatbotWidget from './components/ChatbotWidget'
import SupabaseDebug from './components/SupabaseDebug'
import { supabase } from './lib/supabaseClient'
import "./App.css";
import "./styles/datepicker.css";
import CatalogoVacunas from './pages/CatalogoVacunas';
import ArticulosBlog from './pages/ArticulosBlog';
import Perfil from './pages/Perfil';
import PerfilAdmin from './pages/PerfilAdmin';
import AsignarPersonal from './pages/AsignarPersonal';
import Mascotas from './pages/Mascotas';
import Inventario from './pages/Inventario';
import Proveedores from './pages/Proveedores';
import Horarios from './pages/Horarios';
import DashboardPersonal from './pages/DashboardPersonal';
import PerfilPersonal from './pages/PerfilPersonal';
import MisReservas from './pages/MisReservas';
import HistorialMedicoPersonal from './pages/HistorialMedicoPersonal';
import RecetasTratamientos from './pages/RecetasTratamientos';
import GestionBlog from './pages/GestionBlog';
import ChatPersonal from './pages/ChatPersonal';
import MisHorarios from './pages/MisHorarios';
import Servicios from './pages/Servicios';
import DashboardAdmin from './pages/DashboardAdmin';
import ReportesAdmin from './pages/ReportesAdmin';
import Cargo from './pages/Cargo';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    let isMounted = true;

    // Obtener usuario actual y mantenerlo sincronizado con Supabase
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (isMounted) {
          setUser(user)
        }
      } catch (e) {
        console.error('Error fetching user', e)
      }
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, []);

  useEffect(() => {
    let isMounted = true

    const resolveUserRole = async () => {
      if (!user?.id) {
        if (isMounted) {
          setUserRole(null)
        }
        return
      }

      try {
            const email = user.email
            let administradorResult = await supabase.from('administrador').select('ci_administrador').eq('user_id', user.id).maybeSingle()
            if (!administradorResult.error && !administradorResult.data && email) {
              administradorResult = await supabase.from('administrador').select('ci_administrador').ilike('correo_administrador', email).maybeSingle()
            }

            let personalResult = await supabase.from('personal').select('ci_personal').eq('user_id', user.id).maybeSingle()
            if (!personalResult.error && !personalResult.data && email) {
              personalResult = await supabase.from('personal').select('ci_personal').ilike('correo_personal', email).maybeSingle()
            }

            let clienteResult = await supabase.from('cliente').select('ci_cliente').eq('user_id', user.id).maybeSingle()
            if (!clienteResult.error && !clienteResult.data && email) {
              clienteResult = await supabase.from('cliente').select('ci_cliente').ilike('correo_cliente', email).maybeSingle()
            }

            if (!isMounted) return

            if (administradorResult.data) {
              setUserRole('administrador')
              return
            }

            if (personalResult.data) {
              setUserRole('personal')
              return
            }

            // Priorizar admin por email conocido incluso si existe fila en cliente
            if (email?.toLowerCase() === 'admin@gmail.com') {
              setUserRole('administrador')
              return
            }

            if (clienteResult.data) {
              setUserRole('cliente')
              return
            }

            setUserRole(null)
      } catch (error) {
        console.error('Error resolving user role', error)
        if (isMounted) {
          setUserRole(null)
        }
      }
    }

    resolveUserRole()

    return () => {
      isMounted = false
    }
  }, [user])

  return (
    <Router>
      <AppContent user={user} userRole={userRole} />
    </Router>
  );
}

function AppContent({ user, userRole }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthPage = ["/", "/iniciar-sesion", "/registrar"].includes(location.pathname);
  const normalizedRole = userRole?.toLowerCase().trim();
  const isStaffUser = normalizedRole === 'personal';
  const isAdminUser = normalizedRole === 'administrador';
  const clientNavItems = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/mascotas', label: 'Mascotas' },
    { to: '/perfil', label: 'Perfil' },
    { to: '/catalogo-servicios', label: 'Servicios' },
    { to: '/catalogo-productos', label: 'Tienda' },
    { to: '/catalogo-vacunas', label: 'Vacunas' },
    { to: '/doctores', label: 'Doctores' },
    { to: '/proveedores', label: 'Proveedores' },
    { to: '/articulos-blog', label: 'Blog' },
  ];
  const personalNavItems = [
    { to: '/dashboard-personal', label: 'Dashboard Personal' },
    { to: '/perfil-personal', label: 'Perfil Personal' },
    { to: '/historial-medico-personal', label: 'Historial Médico' },
    { to: '/chat-personal', label: 'Chat Personal' },
    { to: '/agregar-producto', label: 'Agregar Producto' },
    { to: '/proveedores', label: 'Proveedores' },
    { to: '/catalogo-servicios', label: 'Servicios' },
  ];
  const adminNavItems = [
    { to: '/dashboard-admin', label: 'Dashboard' },
    { to: '/perfil-admin', label: 'Perfil' },
    { to: '/cargos', label: 'Cargos' },
    { to: '/asignar-personal', label: 'Asignar Personal' },
  ];
  const visibleNavItems = !user ? [] : isAdminUser ? adminNavItems : isStaffUser ? personalNavItems : clientNavItems;

  useEffect(() => {
    if (!user || !normalizedRole) return;

    if (normalizedRole === 'administrador') {
      const adminPaths = ['/dashboard-admin', '/perfil-admin', '/asignar-personal', '/reportes-admin', '/cargos'];
      if (!adminPaths.some((path) => location.pathname.startsWith(path))) {
        navigate('/dashboard-admin');
      }
    }

    if (normalizedRole === 'personal') {
      const personalPaths = ['/dashboard-personal', '/perfil-personal', '/historial-medico-personal', '/chat-personal', '/agregar-producto', '/proveedores', '/catalogo-servicios'];
      if (!personalPaths.some((path) => location.pathname.startsWith(path))) {
        navigate('/dashboard-personal');
      }
    }
  }, [user, normalizedRole, location.pathname, navigate]);

  return (
    <div className="app-container">
      <nav className="sidebar">
        <h2>🐾 VetCare</h2>

        {!isAuthPage && (
          <ul>
            {visibleNavItems
              .filter((item) => item.show !== false)
              .map((item) => (
                <li key={item.to}><Link to={item.to}>{item.label}</Link></li>
              ))}
          </ul>
        )}

        {!user && !isAuthPage && (
          <div className="header">
            <Link to="/iniciar-sesion" className="login-btn">Iniciar sesión</Link>
            <Link to="/registrar" className="register-btn">Registrar</Link>
          </div>
        )}
      </nav>

      {/* Contenido scrolleable */}
      <main className="content">
        <div className="content-wrapper">

        <Routes>
          <Route path="/" element={<Navigate to="/iniciar-sesion" replace />} />
            <Route path="/dashboard" element={<Dashboard user={user} />} />
            <Route path="/dashboard-admin" element={<DashboardAdmin />} />
            <Route path="/asignar-personal" element={<AsignarPersonal />} />
            <Route path="/reportes-admin" element={<ReportesAdmin />} />
            <Route path="/cargos" element={<Cargo />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/perfil-admin" element={<PerfilAdmin />} />
            <Route path="/mascotas" element={<Mascotas />} />
            <Route path="/catalogo-productos" element={<CatalogoProductos />} />
            <Route path="/catalogo-servicios" element={<CatalogoServicios />} />
            <Route path="/carrito" element={<Carrito />} />
            <Route path="/doctores" element={<Doctores />} />
            <Route path="/reservas" element={<Reservas />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/historial/:ci_mascota" element={<Historial />} />
            <Route path="/registrar" element={<Registrar />} />
            <Route path="/iniciar-sesion" element={<IniciarSesion />} />
            <Route path="/agregar-producto" element={<AgregarProducto />} />
            <Route path="/catalogo-vacunas" element={<CatalogoVacunas />} />
            <Route path="/articulos-blog" element={<ArticulosBlog />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/horarios" element={<Horarios />} />
            <Route path="/dashboard-personal" element={<DashboardPersonal />} />
            <Route path="/perfil-personal" element={<PerfilPersonal />} />
            <Route path="/mis-reservas" element={<MisReservas />} />
            <Route path="/historial-medico-personal" element={<HistorialMedicoPersonal />} />
            <Route path="/recetas-tratamientos" element={<RecetasTratamientos />} />
            <Route path="/gestion-blog" element={<GestionBlog />} />
            <Route path="/chat-personal" element={<ChatPersonal />} />
            <Route path="/mis-horarios" element={<MisHorarios />} />
          </Routes>
          </div>
        </main>
        <ChatbotWidget />
        <SupabaseDebug />
      </div>
    );
}
export default App;
