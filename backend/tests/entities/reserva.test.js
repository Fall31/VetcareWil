const Reserva = require('../../src/entities/reserva')

test('Reserva validate success', () => {
  const r = new Reserva({ ci_mascota: 'm1', id_servicio: 's1', fecha_reserva: '2025-10-25' })
  expect(r.validate()).toEqual([])
})

test('Reserva validate missing fields', () => {
  const r = new Reserva({})
  const errs = r.validate()
  expect(errs).toContain('ci_mascota es requerido')
  expect(errs).toContain('id_servicio es requerido')
  expect(errs).toContain('fecha_reserva es requerido')
})
