# Cambio: mas sectores en el mapa

## Resumen

- El mapa territorial pasa de 7 a 12 sectores.
- Se agregan cinco zonas nuevas: Ion Fields, Glass Dunes, Frost Quarries, Bio Vaults y Relay Crown.
- Cada sector nuevo tiene poblacion, PIB, controlador inicial, color y bonus productivo.
- El SVG del mapa usa hexagonos mas pequenos para que los 12 sectores entren sin solaparse.
- Las partidas existentes ahora incorporan automaticamente sectores nuevos al normalizar el guardado.

## Sectores nuevos

| Sector | Recurso principal | Control inicial | Rol de juego |
| --- | --- | --- | --- |
| Ion Fields | Energia | Viktor Sokolov | Zona energetica disputada |
| Glass Dunes | Componentes metalicos | Libre | Expansion industrial media |
| Frost Quarries | Mineral | Viktor Sokolov | Extraccion y presion NPC |
| Bio Vaults | Tanques de oxigeno | Libre | Soporte vital y recuperacion economica |
| Relay Crown | Modulos de habitat | Maria Chen | Sector avanzado de logistica |

## Archivos tocados

- `src/data/gameData.js`
- `src/data/regions.js`
- `src/components/views/MapView.jsx`
- `src/hooks/engine/gamePureLogic.js`
