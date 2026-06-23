# Frontend - Estructura Clean Architecture

Este frontend React usa Vite y está organizado siguiendo principios de Clean Architecture adaptados para aplicaciones frontend.

## Estructura de carpetas

```
src/
├── services/        # Adaptadores de infraestructura (HTTP, API clients)
│   ├── httpService.js
│   ├── productosService.js
│   ├── mascotasService.js
│   └── index.js    # Barrel export
├── domain/          # Modelos de dominio (entidades, lógica de negocio pura)
│   ├── Producto.js
│   ├── Mascota.js
│   └── index.js
├── hooks/           # Custom hooks (casos de uso del frontend)
│   ├── useProductos.js
│   ├── useMascotas.js
│   └── index.js
├── pages/           # Componentes de página (presentación)
├── components/      # Componentes reutilizables (presentación)
├── lib/             # Utilidades y configuración externa (Supabase, etc.)
│   ├── api.js      # Legacy API (mantiene compatibilidad)
│   └── supabaseClient.js
└── assets/          # Recursos estáticos
```

## Capas y responsabilidades

### 1. **services/** - Capa de Infraestructura
Adaptadores que comunican con APIs externas (backend). Aíslan la lógica de red del resto de la app.

**Ejemplo:**
```javascript
import { productosService } from '@/services'
const productos = await productosService.getAll()
```

### 2. **domain/** - Capa de Dominio
Modelos/entidades que representan conceptos del negocio. Incluyen validaciones y lógica de transformación.

**Ejemplo:**
```javascript
import { Producto } from '@/domain'
const producto = Producto.fromAPI(data)
console.log(producto.precioFormateado) // "$19.99"
```

### 3. **hooks/** - Capa de Aplicación
Custom hooks que encapsulan casos de uso (lógica de negocio del frontend): fetching, estado, side effects.

**Ejemplo:**
```javascript
import { useProductos } from '@/hooks'
function MiComponente() {
  const { productos, loading, error } = useProductos()
}
```

### 4. **pages/** y **components/** - Capa de Presentación
Componentes React que renderizan UI. Delegan lógica a hooks y servicios.

## Migrando componentes existentes

1. **Reemplazar llamadas API** por servicios
2. **Extraer lógica de estado** a custom hooks
3. **Usar modelos de dominio** cuando añadan valor

## Variables de entorno

Crear `.env` en la raíz de `frontend/`:
```env
VITE_API_BASE=http://localhost:5000/api
```

## Comandos

```powershell
pnpm install
pnpm run dev       # Desarrollo
pnpm run build     # Build producción
pnpm run preview   # Preview build
```
