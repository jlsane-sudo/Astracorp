# Cambio: rebalance de costes de empresas

Se han subido los costes de construccion para que las empresas no se compren tan rapido al inicio.

## Cambios aplicados

- Costes base actualizados en `src/data/companyTypes.js`.
- Escalado por copias aumentado de `1.18` a `1.35`.
- Nueva migracion Supabase:

```text
supabase/migrations/20260503_company_cost_rebalance.sql
```

## Nuevos costes base

- Captador de rocio: 28
- Panel solar: 54
- Mina de superficie: 86
- Planta de purificacion: 152
- Fundicion: 210
- Planta de electrolisis: 420
- Forja industrial: 520
- Laboratorio orbital: 620
- Fabrica de habitats: 760

## Efecto esperado

- El jugador puede comprar la primera empresa, pero ya no encadena varias tan facilmente.
- Las empresas de tier 2 y tier 3 requieren mas preparacion.
- Comprar muchas copias del mismo tipo se vuelve bastante mas caro.

Ejemplo de escalado con una empresa base de 28 creditos:

- 1a copia: 28
- 2a copia: 38
- 3a copia: 51
- 4a copia: 69
- 5a copia: 93
