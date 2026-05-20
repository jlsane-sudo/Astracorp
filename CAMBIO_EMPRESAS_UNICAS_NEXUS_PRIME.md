# Cambio: empresas unicas en Nexus Prime

## Objetivo

Durante la primera etapa del juego, Nexus Prime debe ser facil de leer y de balancear. Para evitar que el jugador nuevo se pierda comprando muchas copias de la misma empresa, se limita la fase inicial a una empresa por tipo.

## Regla aplicada

En Nexus Prime, hasta nivel 10 incluido:

- 1 Captador de rocio
- 1 Panel solar
- 1 Mina de superficie
- No se pueden comprar duplicados del mismo tipo

La regla se aplica aunque las empresas pudieran estar en territorios distintos.

## Motivo de diseno

El bucle inicial debe ser:

1. Trabajar.
2. Conseguir agua, electricidad y mineral.
3. Vender productos al mercado.
4. Ahorrar creditos.
5. Comprar el pasaje al siguiente planeta.

Permitir muchas empresas iguales demasiado pronto convierte una decision simple en una pregunta confusa: cuantas copias necesito. En esta fase es mejor que el jugador entienda que cada empresa representa una fuente clara de un producto.

## Implementacion

Se ha aplicado en dos capas:

- `useGameActions.buildCompany`: bloqueo real de compra si ya existe una empresa del mismo tipo en Nexus Prime hasta nivel 10.
- `BusinessView` y `CompaniesShopView`: botones deshabilitados y texto de licencia unica para que la interfaz no prometa una compra imposible.

## Futuro recomendado

Mas adelante se puede abrir la profundidad mediante:

- Mejoras de la empresa existente.
- Aumento de almacenamiento.
- Bonificaciones por territorio.
- Investigaciones de eficiencia.
- Licencias adicionales tras viajar a otros planetas.
- Duplicados desbloqueados despues de nivel 10 o por tecnologia.

La idea es que el crecimiento temprano venga de entender y optimizar, no de apilar copias.
