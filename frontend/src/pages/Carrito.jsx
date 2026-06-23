import React, { useEffect, useState } from 'react'
import { useCarrito } from '@/hooks'
import { Producto } from '@/domain'
import './Carrito.css'

const Carrito = () => {
  const { obtenerCarritoLocal, limpiarCarrito } = useCarrito()
  const [items, setItems] = useState([])

  useEffect(() => {
    const loadItems = () => {
      const carritoItems = obtenerCarritoLocal()
      setItems(carritoItems)
    }
    loadItems()
  }, [obtenerCarritoLocal])

  const total = items.reduce((s, it) => s + (it.precio * it.cantidad), 0)

  const handleVaciar = () => {
    limpiarCarrito()
    setItems([])
  }

  const handlePagar = () => {
    // TODO: Implementar proceso de pago
    alert(`Total a pagar: $${total.toFixed(2)}`)
  }

  return (
    <div className="carrito-page">
      <h1>Carrito</h1>
      {items.length === 0 ? (
        <p>Tu carrito está vacío.</p>
      ) : (
        <div className="carrito-list">
          {items.map((it, idx) => (
            <div key={idx} className="carrito-item">
              <div>{it.nombre}</div>
              <div>{it.cantidad} x ${it.precio.toFixed(2)}</div>
              <div className="subtotal">${(it.cantidad * it.precio).toFixed(2)}</div>
            </div>
          ))}
          <div className="carrito-total">Total: ${total.toFixed(2)}</div>
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
