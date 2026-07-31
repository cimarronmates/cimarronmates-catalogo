# Cimarrón Mates

Sitio de catálogo para Cimarrón Mates (accesorios para mate artesanales), hecho con Next.js, Tailwind y Supabase.

## Desarrollo local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Setup de Supabase (manual, una sola vez)

Seguí estos pasos en orden:

1. Crear proyecto en https://supabase.com/dashboard
2. SQL Editor → pegar y correr `supabase/migrations/001_productos.sql` (crea la tabla `productos`, las políticas de RLS y la política de Storage para subir imágenes).
3. Storage → crear bucket `productos-img`, marcarlo público en lectura.
4. **Deshabilitar el registro público de usuarios** (paso crítico de seguridad): Authentication → Providers → Email → apagar la opción de permitir que usuarios nuevos se registren (el texto exacto puede variar según la versión del dashboard de Supabase, pero es la opción que controla el alta pública de cuentas). Si no se deshabilita, cualquier persona podría crear una cuenta por la API pública de Supabase y obtener acceso de escritura completo al catálogo, sin pasar por el login de `/admin`.
5. Authentication → Users → crear manualmente el usuario admin (email + password).
6. Project Settings → API → copiar `Project URL` y `anon public` key a `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

El panel de administración está en `/admin/login`.

## Tests y build

```bash
npm run test
npm run build
```

## Deploy

1. Crear repo en GitHub y pushear esta carpeta.
2. Conectar el repo en Vercel (Hobby plan requiere que el repo sea personal o público si es de una organización).
3. Agregar env vars en Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Después del primer deploy, agregar la URL de Vercel en Supabase → Authentication → URL Configuration (Site URL + Redirect URLs).
