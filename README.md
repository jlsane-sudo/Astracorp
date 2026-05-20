# AstraCorp

AstraCorp es un juego incremental/estrategico en React y Vite con persistencia local y capas online mediante Supabase.

## Que incluye
- Estructura por carpetas para datos, vistas, componentes, servicios y motor de juego.
- Persistencia local con `localStorage` y sincronizacion remota con Supabase.
- Modulos online para empresas, territorios, mercado, misiones, ranking, sede, trabajos, investigacion y elecciones.
- Build de produccion con Vite y separacion de chunks para React y Supabase.

## Desarrollo
```bash
npm install
npm run dev
npm run build
```

## Configuracion
Crea un archivo `.env.local` a partir de `.env.example` y configura tus credenciales publicas de Supabase:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Siguiente paso recomendado
1. Ejecutar las migraciones de Supabase que falten en el proyecto remoto.
2. Conectar la vista de politica con la lista global de elecciones activas.
3. Seguir extrayendo logica de `useGameActions.js` por dominios.
4. Anadir scripts de lint/test cuando las dependencias de ESLint esten instaladas.
