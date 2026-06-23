const Mascota = require('../../src/entities/mascota')

test('Mascota validate success', () => {
  const m = new Mascota({ nombre_mascota: 'Firulais', especie: 'perro', ci_cliente: 'abc123' })
  expect(m.validate()).toEqual([])
})

test('Mascota validate missing fields', () => {
  const m = new Mascota({})
  const errs = m.validate()
  expect(errs).toContain('nombre_mascota es requerido')
  expect(errs).toContain('especie es requerido')
  expect(errs).toContain('ci_cliente es requerido')
})
