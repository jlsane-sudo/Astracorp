# Cambio aplicado: Asistente de colonia

Archivo modificado:

- `src/components/views/BusinessView.jsx`

## Qué corrige

El asistente ya no recomienda automáticamente construir más transformadores, como `Fundicion`, cuando sus insumos están en déficit fuerte.

Ahora calcula una puntuación para cada empresa según:

- si produce el recurso con déficit principal;
- si alimenta el cuello de botella actual;
- si consume recursos que ya están en negativo;
- cuántas empresas iguales tienes ya;
- si el jugador tiene el nivel necesario para desbloquearla.

## Resultado esperado

Si tienes muchas fundiciones y mineral negativo, debería recomendar `Mina de superficie` en vez de otra `Fundicion`.

También cambia el botón secundario del asistente para construir exactamente la empresa recomendada por la nueva lógica.
