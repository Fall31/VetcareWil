const Carrito = require('../../src/entities/carrito')

test('Carrito validate success', () => {
  const c = new Carrito({ ci_cliente: 'abc123' })
  expect(c.validate()).toEqual([])
})

test('Carrito validate missing ci_cliente', () => {
  const c = new Carrito({})
  const errs = c.validate()
  expect(errs).toContain('ci_cliente es requerido')
})
