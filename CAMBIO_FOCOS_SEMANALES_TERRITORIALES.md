# Cambio: focos semanales territoriales

## Objetivo

El mapa ya tenia conquista, fortines, presion NPC, contratos territoriales y tasas. Este cambio crea un foco semanal para que cada ciclo tenga una zona protagonista y el jugador tenga una direccion clara.

## Como funciona

- A partir del nivel 4 se genera un foco territorial activo.
- El foco elige un territorio del mapa y pide controlarlo con estabilidad minima de 70.
- Si el jugador controla y estabiliza el territorio, recibe creditos, XP y recursos ligados al bonus del sector.
- Si se ignora durante el ciclo diario, el territorio objetivo gana amenaza y pierde estabilidad.
- Al caducar o completarse, el siguiente ciclo crea otro foco territorial.

## Interfaz

El mapa muestra una tarjeta de `Foco semanal territorial` con:

- territorio objetivo;
- estado actual del controlador o estabilidad;
- recompensa;
- dia de cierre;
- acceso rapido para seleccionar el sector.

El territorio objetivo tambien se marca en el SVG del mapa con borde ambar.

## Resultado de juego

El mapa deja de ser solo un tablero pasivo: cada semana hay una region que empuja decisiones de expansion, defensa o estabilizacion. La recompensa es util, pero la presion evita que el evento sea gratis.
