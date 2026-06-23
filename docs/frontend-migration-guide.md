# Guía de Migración - Frontend a Clean Architecture

## Ejemplo: CatalogoProductos.jsx

### Antes (Arquitectura tradicional)
```jsx
import React, { useEffect, useState } from 'react'
import { productosAPI, carritoAPI } from '../lib/api'
import { supabase } from '../lib/supabaseClient'

const CatalogoProductos = () => {
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const loadProductos = async () => {
      try {
        const data = await productosAPI.getAll()
        setProductos(data.productos || [])
      } catch (error) {
        console.error('Error:', error)
        // Fallback manual
        setProductos([...])
      } finally {
        setLoading(false)
      }
    }
    loadProductos()
  }, [])

  // ... lógica de carrito mezclada con presentación
}
```

**Problemas:**
- ❌ Lógica de negocio mezclada con UI
- ❌ Manejo de estado duplicado
- ❌ Difícil de testear
- ❌ No reutilizable

### Después (Clean Architecture)
```jsx
import React, { useState } from 'react'
import { useProductos, useCarrito } from '@/hooks'
import { Producto } from '@/domain'

const CatalogoProductos = () => {
  const { productos, loading, error } = useProductos()
  const { agregarProducto } = useCarrito()
  const [feedbackBtn, setFeedbackBtn] = useState(null)

  const handleAgregarAlCarrito = async (producto, event) => {
    const result = await agregarProducto(producto, 1)
    if (result.success) {
      setFeedbackBtn(producto.id_producto)
      setTimeout(() => setFeedbackBtn(null), 1500)
    }
  }

  if (loading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return (
    <div className="catalogo-page">
      {productos.map(p => {
        const producto = Producto.fromAPI(p)
        return (
          <ProductCard 
            key={producto.id_producto}
            producto={producto}
            onAgregar={handleAgregarAlCarrito}
            isFeedback={feedbackBtn === producto.id_producto}
          />
        )
      })}
    </div>
  )
}
```

**Beneficios:**
- ✅ Separación clara de responsabilidades
- ✅ Hooks reutilizables en otras páginas
- ✅ Modelo de dominio con lógica compartida
- ✅ Fácil de testear
- ✅ Código más limpio y mantenible

## Pasos para Migrar una Página

### 1. Identificar servicios necesarios
¿Qué endpoints consume la página?
- Productos → `productosService`
- Carrito → `carritoService`
- Mascotas → `mascotasService`
- etc.

### 2. Usar hooks existentes o crear nuevos
```jsx
// Si existe el hook, úsalo:
import { useProductos } from '@/hooks'
const { productos, loading, error } = useProductos()

// Si NO existe, créalo en src/hooks/useNombre.js:
export function useNombre() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const result = await nombreService.getAll()
        setData(result)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { data, loading, error }
}
```

### 3. Usar modelos de dominio
```jsx
import { Producto } from '@/domain'

// Transformar datos de API a modelo:
const producto = Producto.fromAPI(apiData)

// Usar propiedades computed:
<span className="price">{producto.precioFormateado}</span>
```

### 4. Eliminar lógica de negocio del componente
**Antes:**
```jsx
const agregarAlCarrito = async (producto) => {
  const carrito = JSON.parse(localStorage.getItem('carrito') || '[]')
  const existingIndex = carrito.findIndex(...)
  if (existingIndex >= 0) {
    carrito[existingIndex].cantidad += 1
  } else {
    carrito.push(...)
  }
  localStorage.setItem('carrito', JSON.stringify(carrito))
  
  if (user) {
    await carritoAPI.agregar(...)
  }
}
```

**Después:**
```jsx
const { agregarProducto } = useCarrito()

const handleAgregar = async (producto) => {
  const result = await agregarProducto(producto, 1)
  if (result.success) {
    // UI feedback
  }
}
```

### 5. Actualizar importaciones
```jsx
// ❌ Antes:
import { productosAPI } from '../lib/api'
import { supabase } from '../lib/supabaseClient'

// ✅ Después:
import { useProductos, useCarrito } from '@/hooks'
import { Producto } from '@/domain'
```

## Hooks Disponibles

### useProductos()
```jsx
const { productos, loading, error, refetch } = useProductos()
```

### useMascotas()
```jsx
const { mascotas, loading, error, refetch } = useMascotas()
```

### useCarrito()
```jsx
const { 
  agregarProducto, 
  obtenerCarritoLocal, 
  limpiarCarrito,
  loading, 
  error 
} = useCarrito()
```

## Servicios Disponibles

Si necesitas usar servicios directamente (sin hook):
```jsx
import { productosService, mascotasService, carritoService } from '@/services'

// Llamada directa:
const productos = await productosService.getAll()
const producto = await productosService.getById(id)
await productosService.create(data)
```

## Modelos de Dominio Disponibles

### Producto
```jsx
import { Producto } from '@/domain'

const producto = Producto.fromAPI(apiData)
producto.precioFormateado // "$19.99"
producto.nombre_producto
producto.id_producto
```

### Mascota
```jsx
import { Mascota } from '@/domain'

const mascota = Mascota.fromAPI(apiData)
mascota.edad
mascota.esAdulta() // true/false
```

### Servicio
```jsx
import { Servicio } from '@/domain'

const servicio = Servicio.fromAPI(apiData)
servicio.estaDisponible() // true/false
```

## Checklist de Migración

Para cada página que migres:

- [ ] Reemplazar llamadas API directas por hooks
- [ ] Extraer lógica de negocio a hooks personalizados
- [ ] Usar modelos de dominio cuando aplique
- [ ] Manejar estados de loading y error consistentemente
- [ ] Eliminar dependencias directas a Supabase del componente
- [ ] Actualizar imports a usar alias `@`
- [ ] Verificar que la página funciona igual que antes
- [ ] Commit con mensaje descriptivo

## Páginas Pendientes de Migrar

1. **CatalogoServicios.jsx** - Similar a CatalogoProductos (usar `useServicios`)
2. **Mascotas.jsx** - Ya tiene `useMascotas` disponible
3. **Carrito.jsx** - Usar `useCarrito` y `Producto`
4. **Reservas.jsx** - Crear `useReservas` hook
5. **Dashboard.jsx** - Puede usar múltiples hooks
6. **Perfil.jsx** - Crear `usePerfil` o `useCliente` hook

## Ejemplo: Crear un nuevo hook

```jsx
// src/hooks/useServicios.js
import { useState, useEffect } from 'react'
import { serviciosService } from '@/services'

export function useServicios() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchServicios = async () => {
    setLoading(true)
    try {
      const data = await serviciosService.getAll()
      setServicios(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServicios()
  }, [])

  return {
    servicios,
    loading,
    error,
    refetch: fetchServicios
  }
}
```

## Preguntas Frecuentes

### ¿Debo migrar todas las páginas de una vez?
No. Migra página por página y haz commit de cada una. Las capas nuevas son compatibles con el código legacy gracias a `lib/api.js`.

### ¿Qué hago si necesito Supabase Auth?
Importa directamente desde `@/lib/supabaseClient` solo para autenticación. La lógica de datos debe estar en servicios.

### ¿Cómo testeo los hooks?
Usa `@testing-library/react-hooks` o testea el componente que los usa.

### ¿Puedo mezclar hooks con llamadas API directas?
Sí, pero no es recomendable. Mejor crea un hook para mantener consistencia.
