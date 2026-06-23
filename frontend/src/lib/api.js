/**
 * API legacy (mantenido para compatibilidad con páginas no migradas)
 * NOTA: Las nuevas páginas deberían importar desde ../services directamente
 * Este archivo re-exporta los servicios refactorizados para mantener compatibilidad
 */

import { productosService, serviciosService, carritoService, mascotasService, reservasService, clientesService } from '../services'

const API_BASE = 'http://localhost:5000/api'

// Utilidad para hacer fetch con manejo de errores (legacy - usar httpService en nuevos componentes)
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return await response.json()
  } catch (error) {
    console.error('API call error:', error)
    throw error
  }
}

// --- API para PRODUCTOS (migrado a servicios) ---
export const productosAPI = {
  getAll: () => productosService.getAll(),
}

// --- API para SERVICIOS (migrado) ---
export const serviciosAPI = {
  getAll: () => serviciosService.getAll(),
}

// --- API para CARRITO (migrado) ---
export const carritoAPI = {
  get: (ci_cliente) => carritoService.get(ci_cliente),
  agregar: (ci_cliente, id_producto, cantidad) => carritoService.agregarProducto(ci_cliente, id_producto, cantidad),
}

// --- API para DOCTORES (legacy - no migrado aún) ---
export const doctoresAPI = {
  getAll: () => apiCall('/doctores'),
}

// --- API para RESERVAS (migrado) ---
export const reservasAPI = {
  get: (ci_cliente) => reservasService.getByCliente(ci_cliente),
  crear: (reservaData) => reservasService.create(reservaData),
}

// --- API para HISTORIAL (legacy - no migrado aún) ---
export const historialAPI = {
  get: (ci_cliente) => apiCall(`/historial/${ci_cliente}`),
}

// --- API para CHATBOT (legacy - no migrado aún) ---
export const chatbotAPI = {
  getIntents: () => apiCall('/chatbot/intents'),
  enviarMensaje: (ci_cliente, texto_mensaje) =>
    apiCall('/chatbot/mensaje', {
      method: 'POST',
      body: JSON.stringify({ ci_cliente, texto_mensaje }),
    }),
}

// --- API para CLIENTES (migrado) ---
export const clientesAPI = {
  getAll: () => clientesService.getAll(),
  crear: (clienteData) => clientesService.create(clienteData),
}