class Producto {
  constructor({ id_producto, nombre_producto, precio, imagen, descripcion } = {}) {
    this.id_producto = id_producto || null
    this.nombre_producto = nombre_producto || ''
    // dejar precio undefined/null si no está provisto para que la validación lo detecte
    this.precio = (precio === undefined) ? null : precio
    this.imagen = imagen || ''
    this.descripcion = descripcion || ''
  }

  validate() {
    const errors = []
    if (!this.nombre_producto) errors.push('nombre_producto es requerido')
    if (this.precio == null || isNaN(this.precio)) errors.push('precio inválido')
    return errors
  }
}

module.exports = Producto
