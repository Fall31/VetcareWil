const Servicio = require('../../src/entities/servicio')

test('Servicio validate success', () => {
  const s = new Servicio({ nombre_servicio: 'Consulta', precio_base: 20 })
  expect(s.validate()).toEqual([])
})

test('Servicio validate missing fields', () => {
  const s = new Servicio({})
  const errs = s.validate()
  expect(errs).toContain('nombre_servicio es requerido')
  expect(errs).toContain('precio_base inválido')
})
