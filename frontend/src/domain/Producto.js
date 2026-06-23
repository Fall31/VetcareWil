/**
 * Modelo de dominio: Producto
 * Representa un producto en el sistema (capa de dominio)
 */

export class Producto {
  constructor({ id_producto, nombre_producto, precio, imagen, descripcion }) {
    this.id = id_producto
    this.nombre = nombre_producto || ''
    this.precio = precio || 0
    this.imagen = imagen || ''
    this.descripcion = descripcion || ''
  }

  get precioFormateado() {
    return `$${this.precio.toFixed(2)}`
  }

  static fromAPI(data) {
    return new Producto(data)
  }
}
