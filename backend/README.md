# Backend (Clean Architecture)

Este backend sigue una estructura inspirada en Clean Architecture:

- src/entities: entidades del dominio (puras)
- src/usecases: casos de uso / lógica de negocio (puros)
- src/repositories: implementaciones concretas (Supabase)
- src/frameworks: adaptadores de infraestructura (mock, supabase clients)
- src/controllers: adaptadores de entrada (Express controllers)
- src/container.js: wiring ligero para inyección de dependencias

Modo mock (sin necesidad de credenciales Supabase):

```powershell
cd Proyecto_Int/backend
pnpm install
pnpm run start:mock
```

Tests:

```powershell
cd Proyecto_Int/backend
pnpm test
```
