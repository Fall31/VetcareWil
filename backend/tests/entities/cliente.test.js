const Cliente = require('../../src/entities/cliente')

test('Cliente validate success', () => {
  const c = new Cliente({ nombre: 'Ana', email: 'ana@ejemplo.com' })
  expect(c.validate()).toEqual([])
})

test('Cliente validate missing fields', () => {
  const c = new Cliente({})
  const errs = c.validate()
  expect(errs).toContain('nombre es requerido')
  expect(errs).toContain('email es requerido')
})
