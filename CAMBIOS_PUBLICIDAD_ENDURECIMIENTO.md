# Cambios: publicidad patrocinada y pool estimado

## Objetivo

Ordenar el sistema de publicidad para que el juego no confunda impresiones reales del proveedor con acciones patrocinadas internas, y cerrar los agujeros mas evidentes del pool diario online.

## Resumen

- La publicidad del juego pasa a tratarse como **acciones patrocinadas estimadas**.
- Las impresiones reales siguen dependiendo del proveedor externo y deben confirmarse en su panel, API o postback.
- El flujo de anuncio se centraliza para evitar que cada vista abra publicidad y conceda recompensa de forma distinta.
- El pool de Supabase se endurece para no aceptar valores economicos arbitrarios desde cliente.

## Frontend

### Servicio comun

Se añade `src/services/sponsoredAds.js`.

Centraliza:

- URL patrocinada.
- Limite diario.
- Cooldown.
- Apertura del anuncio.
- Calculo de disponibilidad.

### Acciones patrocinadas

Las acciones publicitarias pasan por el motor de acciones antes de abrir el anuncio:

- anuncio con recompensa;
- acelerar trabajo;
- acelerar investigacion;
- acelerar sede;
- boost de empresas;
- recoger toda la produccion con anuncio;
- entregar contratos con patrocinio;
- patrocinios de megaproyectos;
- blindaje territorial.

Esto evita el caso malo de abrir un anuncio y luego descubrir que la accion estaba bloqueada por cooldown o falta de requisitos.

### AdsView

Se rehizo `src/components/views/AdsView.jsx`.

Cambios:

- Eliminado el segundo `return` muerto.
- Eliminado codigo inalcanzable en `openRewardAd`.
- Textos rotos corregidos.
- La UI habla de estimaciones y acciones patrocinadas, no de impresiones reales confirmadas.
- El historial y el display quedan en un bloque plegable compacto.

### Slots display

`src/components/ads/AdSlot.jsx` mantiene soporte para Media.net, Adsterra y house slot, pero deja de mostrar mensajes tecnicos de variables de entorno al jugador.

## Backend Supabase

Se añade `supabase/migrations/20260515_harden_adpool.sql`.

La migracion reemplaza las RPC principales del pool:

- `rpc_flush_ad_views`
- `rpc_close_ad_pool_day`

### Protecciones aplicadas

- El servidor calcula el ingreso por vista con `0.00054`.
- El cliente ya no puede inflar `p_revenue_eur`.
- El cliente ya no puede imponer `player_pct`; se lee desde `game_saves`.
- No hay limite diario de acciones patrocinadas; solo se limita el tamano de cada flush para evitar paquetes absurdos.
- Se bloquean dias futuros.
- Se bloquean acumulados demasiado antiguos.
- No se puede hacer flush sobre un dia cerrado.
- El cierre diario queda reservado a `service_role` o usuario con `app_role = admin`.
- El cliente normal ya no cierra automaticamente el pool de ayer.

## Nota Sobre El Script De Index

El script:

```html
<script>(function(s){s.dataset.zone='11007198',s.src='https://n6wxm.com/vignette.min.js'})([document.documentElement, document.body].filter(Boolean).pop().appendChild(document.createElement('script')))</script>
```

puede servir publicidad real, pero el juego no puede saber de forma fiable cuantas impresiones reales se han mostrado solo observando el navegador.

Por eso no se usa como fuente de verdad para pagos. El juego registra acciones patrocinadas estimadas; las impresiones reales deben validarse en el proveedor.

## Archivos Principales

- `src/services/sponsoredAds.js`
- `src/hooks/engine/useGameActions.js`
- `src/hooks/engine/useGamePersistence.js`
- `src/components/views/AdsView.jsx`
- `src/components/ads/AdSlot.jsx`
- `supabase/migrations/20260515_harden_adpool.sql`

## Verificacion

Se ejecuto:

```bash
npm run build
```

Resultado: build correcto.

## Pendiente Recomendado

- Crear un cron o job administrativo que ejecute `rpc_close_ad_pool_day` con `service_role`.
- Si el proveedor ofrece postback/API, integrarlo para sustituir estimaciones por impresiones confirmadas.
- Decidir si el porcentaje inferior al 100% debe quemar parte del pool o si el sobrante debe redistribuirse.
