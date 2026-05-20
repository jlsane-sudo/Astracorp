# Cambios: registro permanente, anuncios en mapa y recogida total

## Objetivo
Mejorar la comodidad de juego sin crear nuevas fuentes de economia abusables. El jugador debe poder ver actividad del mundo mientras juega, acceder a publicidad desde el mapa y recoger la produccion empresarial de forma rapida cuando acepta ver un anuncio.

## Registro visible en todo momento
- La pestaña `Registro` se elimino del menu principal.
- El registro ahora aparece como panel lateral derecho permanente.
- En pantallas medianas o pequenas el panel baja debajo del contenido para no comprimir el mapa ni las vistas principales.
- `LogView` ahora soporta modo compacto con scroll y muestra los ultimos eventos.
- Si una partida guardada estaba abierta en `log`, se redirige automaticamente a `map` al cargar.

Archivos principales:
- `src/App.jsx`
- `src/components/views/LogView.jsx`
- `src/components/Tabs.jsx`
- `src/styles/global.css`
- `src/hooks/engine/gamePureLogic.js`

## Publicidad desde el mapa
- El mapa incluye un boton `Ver anuncio` junto a `Ir a trabajo`.
- Usa el mismo sistema de anuncio recompensado que la pestaña Ads.
- Respeta limite diario y cooldown ya existentes.
- Evita crear una recompensa paralela distinta para no desbalancear el online.

Archivos principales:
- `src/components/views/MapView.jsx`
- `src/App.jsx`

## Empresas: Recoger todo con publicidad
- En la pestaña `Empresas` se añade el boton `Recoger todo` dentro del bloque de publicidad comun.
- El boton solo se activa si hay produccion acumulada.
- Al pulsarlo abre publicidad y recoge toda la produccion almacenada de todas las empresas.
- No gasta energia, porque el coste de oportunidad es ver el anuncio.
- La accion escribe un resumen en el registro y actualiza inventario.
- Se añade stub RPC `rpc_collect_all_companies_ad_secure` para que la accion pueda ser server-first en multijugador online.
- Si la RPC aun no esta instalada, se mantiene fallback local temporal como en otras acciones multijugador.

Archivos principales:
- `src/components/views/BusinessView.jsx`
- `src/hooks/engine/useGameActions.js`
- `src/services/multiplayerActions.js`

## Nota de balance online
Estos cambios son principalmente de ergonomia. No aumentan directamente el valor de produccion ni el precio de venta. El punto delicado es `Recoger todo`: debe validarse en servidor cuando la RPC este instalada para evitar que un cliente manipulado recoja recursos no generados realmente.

## Verificacion
Se ejecuto `npm run build` despues de los cambios y la compilacion fue correcta.
