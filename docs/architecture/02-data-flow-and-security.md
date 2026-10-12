# Flujo de Datos y Estrategia de Seguridad

## 1. Flujo de Datos

```
[Usuario / Navegador]
       |
       v
[Componente UI / Formulario (React Hook Form + Zod)]
       |  (Validación síncrona en cliente)
       v
[Feature Hook / Service (TanStack Query Mutation/Query)]
       |  (Gestión de caché y estados: pending, success, error)
       v
[Supabase Client SDK (lib/supabase)]
       |  (Headers de autenticación con JWT)
       v
[Supabase PostgREST Gateway]
       |  (Evaluación de Políticas RLS por usuario y rol)
       v
[PostgreSQL Database (Tablas, Vistas, Funciones RPC)]
```

## 2. Principios de Seguridad

1. **Nunca exponer claves maestras o de servicio**:
   El cliente web únicamente opera con `VITE_SUPABASE_ANON_KEY`. La clave de servicio (`service_role`) jamás debe incluirse en el bundle de frontend ni en variables con prefijo `VITE_`.

2. **Row Level Security (RLS) Mandatorio**:
   Toda tabla en PostgreSQL debe contar con RLS habilitado. La visibilidad de datos sensibles (ventas, costos, ajustes de inventario) está restringida por el rol del usuario autenticado y su asignación de sucursal.

3. **Autenticación y Sesión**:
   Las sesiones se gestionan mediante tokens JWT almacenados en almacenamiento local seguro a través de `@supabase/supabase-js`, con refresco automático de token.

4. **Operaciones Transaccionales Críticas**:
   Operaciones que involucren modificación de inventario simultánea a una venta deben ejecutarse mediante procedimientos almacenados (`RPC`) en PostgreSQL con control transaccional (`BEGIN / COMMIT / ROLLBACK`), evitando inconsistencias por fallos de red.
