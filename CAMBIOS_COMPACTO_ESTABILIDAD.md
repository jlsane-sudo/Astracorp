# Cambios de estabilidad y modo compacto

## Resumen

Esta tanda se centra en hacer AstraCorp mas comodo en ventanas pequenas, reducir interrupciones y dar mas confianza sobre el guardado.

## Cambios aplicados

- La pantalla de retorno ya no aparece al cambiar de ventana o al recargar dentro de la misma sesion.
- La pantalla de retorno solo se muestra cuando se concede una recompensa diaria nueva.
- Se guarda en `sessionStorage` que el retorno del dia ya fue mostrado para evitar repeticiones.
- La cabecera muestra estado de guardado:
  - Guardado local.
  - Sincronizando nube.
  - Nube al dia.
  - Guardado con aviso.
- El panel lateral arranca plegado por defecto en pantallas bajas o estrechas si el usuario no habia elegido una preferencia.
- En ventanas con poca altura, la interfaz entra en modo compacto:
  - Cabecera no fija.
  - Tabs en una sola fila horizontal.
  - Guia inicial grande oculta.
  - Banda de prioridad reducida.
  - Menos padding superior.
- La prioridad operativa ahora es mas util:
  - Avisa si falta energia.
  - Recomienda cobrar empresas con almacenamiento alto.
  - Prioriza contratos cerca de expirar.
  - Mantiene recomendaciones de empresa, mercado y misiones segun progreso.

## Archivos tocados

- `src/App.jsx`
- `src/components/Header.jsx`
- `src/hooks/useAstraCorpGame.js`
- `src/hooks/engine/useGamePersistence.js`
- `src/styles/global.css`

## Verificacion

- `npm run lint`
- `npm run build`

