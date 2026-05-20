# Corrección: aviso falso al construir

## Problema
Aparecía el mensaje:

> No se puede construir ahora mismo: revisa créditos, energía o nivel.

pero la empresa sí se construía, restaba créditos y funcionaba.

## Causa
En `src/hooks/engine/useGameActions.js`, la función `buildCompany` usaba una variable externa `applied` que se cambiaba dentro de `setSave((prev) => ...)`.

En React 18, ese actualizador de estado puede ejecutarse de forma diferida. Por eso el código comprobaba `if (!applied)` antes de que React hubiera ejecutado el actualizador, mostrando un aviso falso aunque después la construcción se aplicara.

## Cambio realizado
La validación de construcción ahora se hace antes de llamar a `setSave`, usando el estado económico actualizado. Si puede construir, se aplica el nuevo estado y solo se muestra el mensaje de éxito.

Archivo tocado:

- `src/hooks/engine/useGameActions.js`
