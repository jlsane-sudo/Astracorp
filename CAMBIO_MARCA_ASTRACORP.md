# Cambio de marca: AstraCorp

Este paquete sustituye la marca anterior por **AstraCorp**.

## Cambios aplicados

- Nombre visible del juego: `NEBULA INC` → `ASTRACORP`.
- Título y metadescripción de `index.html` actualizados.
- `package.json` corregido:
  - `name`: `astracorp`.
  - Se elimina el nombre inválido anterior con punto final.
- Claves de guardado local/session:
  - `nebula-save-v1` → `astracorp-save-v1`.
  - `nebula-pending-account-save-v1` → `astracorp-pending-account-save-v1`.
  - `nebula-adpool-pending-v1` → `astracorp-adpool-pending-v1`.
- Hook principal renombrado:
  - `useProfitWorldGame.js` → `useAstraCorpGame.js`.
  - `useProfitWorldGame` → `useAstraCorpGame`.
- Identificadores internos de estilo/SVG que contenían `nebula` renombrados a `astra`.
- Texto inicial del log cambiado a AstraCorp.

## Nota importante

Al cambiar las claves de guardado, los jugadores pueden empezar con una partida limpia en localStorage.
Si quieres migrar partidas antiguas, habría que añadir una función de migración que lea la clave anterior y la copie a la nueva.
