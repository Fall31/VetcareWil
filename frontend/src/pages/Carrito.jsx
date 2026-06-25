import React, { useEffect, useState } from 'react'
import { useCarrito } from '@/hooks'
import './Carrito.css'

const Carrito = () => {
  const { obtenerCarritoLocal, obtenerCarritoBackend, limpiarCarrito } = useCarrito()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadItems = async () => {
      setLoading(true)
      try {
        const carrito = await obtenerCarritoBackend()
        if (carrito && carrito.detalle_carrito) {
          const mappedItems = carrito.detalle_carrito.map((detail) => {
            const precio = detail.precio_unitario ?? detail.producto?.precio ?? 0
            return {
              id: detail.id_detalle_carrito,
              nombre: detail.producto?.nombre_producto || detail.nombre || 'Producto',
              precio,
              cantidad: detail.cantidad,
              subtotal: precio * detail.cantidad
            }
          })

          setItems(mappedItems)
          setTotal(carrito.total ?? mappedItems.reduce((sum, item) => sum + item.subtotal, 0))
          setLoading(false)
          return
        }
      } catch (err) {
        console.warn('No se pudo cargar carrito desde backend, usando localStorage:', err)
      }

      const carritoLocal = obtenerCarritoLocal()
      setItems(carritoLocal)
      setTotal(carritoLocal.reduce((sum, item) => sum + item.precio * item.cantidad, 0))
      setLoading(false)
    }

    loadItems()
  }, [obtenerCarritoBackend, obtenerCarritoLocal])

  const handleVaciar = async () => {
    await limpiarCarrito()
    setItems([])
    setTotal(0)
  }

  const handlePagar = () => {
    alert(`Total a pagar: $${total.toFixed(2)}`)
  }

  if (loading) {
    return (
      <div className="carrito-page">
        <h1>Carrito</h1>
        <p>Cargando carrito...</p>
      </div>
    )
  }

  return (
    <div className="carrito-page">
      <h1>Carrito</h1>
      {items.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <div className="carrito-list">
          <table className="carrito-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>{it.nombre}</td>
                  <td>{it.cantidad}</td>
                  <td>${it.precio.toFixed(2)}</td>
                  <td>${it.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="total-label">Total</td>
                <td className="total-value">${total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <div className="carrito-actions">
            <button className="btn-primary" onClick={handlePagar}>Pagar</button>
            <button className="btn-muted" onClick={handleVaciar}>Vaciar</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Carrito
