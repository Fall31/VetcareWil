const Producto = require('../../src/entities/producto')

test('Producto validate success', () => {
  const p = new Producto({ nombre_producto: 'Juguete', precio: 10 })
  expect(p.validate()).toEqual([])
})

test('Producto validate missing fields', () => {
  const p = new Producto({})
  const errs = p.validate()
  expect(errs).toContain('nombre_producto es requerido')
  expect(errs).toContain('precio inválido')
})
