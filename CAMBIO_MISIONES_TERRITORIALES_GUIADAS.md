# Cambio: misiones territoriales guiadas

## Objetivo

La capa territorial ya tenia conquista, contratos exclusivos, fortines, presion NPC y tasas de ocupacion, pero faltaba una ruta clara para que el jugador entendiera por que tocar esos sistemas. Este cambio crea una cadena de misiones desde nivel 4 que convierte el territorio en una progresion guiada.

## Misiones nuevas

- `Primer dominio territorial`: controlar el primer territorio.
- `Blindaje de frontera`: construir un fortin territorial.
- `Mandato regional`: completar un contrato territorial exclusivo.
- `Derechos de ocupacion`: cobrar tasas de ocupacion una vez.

## Recompensas

Las nuevas misiones no solo dan creditos y XP. Tambien entregan recursos concretos como mineral, componentes metalicos y celdas de energia para empujar el siguiente paso territorial sin romper la economia.

## Cambios tecnicos

- Las partidas guardadas antiguas ahora reciben las misiones nuevas al normalizar el save.
- Reclamar una mision puede sumar recursos al inventario.
- Construir fortines, cobrar tasas y entregar contratos territoriales avanzan sus misiones correspondientes.
- La vista de misiones muestra las recompensas de recursos antes de reclamar.

## Resultado de juego

A partir del nivel 4 el jugador ya no descubre el mapa por accidente: el juego le marca una ruta corta y economica para entender el ciclo territorial completo: conquistar, defender, explotar contratos y cobrar rentas.
