# Guía: Clean Architecture (convenciones para este proyecto)

Objetivo: mantener el código organizado y testeable separando responsabilidades por capas.

Estructura recomendada (backend):

- src/entities/: objetos de dominio (sin dependencias externas)
- src/usecases/: casos de uso (lógica de negocio pura, reciben repositorios por parámetro)
- src/repositories/: implementaciones concretas que hablan con la DB / Supabase
- src/frameworks/: adaptadores auxiliares (mocks, clientes externos)
- src/controllers/: adaptadores de entrada (express) que convierten requests en llamadas a usecases
- src/container.js: wiring centralizado que decide qué implementaciones usar (mock vs real)

Reglas rápidas:
- Los usecases no deben importar `express` o `supabase`.
- Los controllers deben ser delgados: validan inputs mínimos y llaman a usecases.
- Los repositorios devuelven objetos `{ data, error }` para mantener compatibilidad con supabase-js.
- Añade tests por entidad y por usecase; mocks en `src/frameworks` ayudan a probar sin recursos.

Cómo añadir un nuevo CRUD:
1. Crear `src/entities/X.js` con validaciones.
2. Crear `src/usecases/xUsecases.js` exportando `makeCreateX`, `makeListX`, etc.
3. Añadir `src/frameworks/mockXAdapter.js` y `src/repositories/xRepository.js`.
4. Añadir `src/controllers/xController.js` que arme los usecases via `container`.
5. Actualizar `src/container.js` para inyectar los repositorios.
6. Añadir tests en `tests/entities` y `tests/usecases`.
7. Montar rutas en `server.js`.


