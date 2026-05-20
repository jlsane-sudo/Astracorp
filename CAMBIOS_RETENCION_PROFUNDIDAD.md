# Cambios de retencion y profundidad

## Opinion sobre el analisis

Estoy de acuerdo con el diagnostico: AstraCorp ya tiene sistemas suficientes. Lo que faltaba no era otro tab, sino mas tension viva dentro de los sistemas existentes. La mejor direccion es hacer que el jugador vuelva por apego, anticipacion y pequenas sorpresas, no solo por recoger produccion.

## Implementado

- Eventos activos de sesion:
  - Tras varios minutos de sesion pueden aparecer eventos temporales.
  - Afectan mercado, contratos y pool publicitario.
  - Se registran en el log y se muestran como evento activo.

- NPCs con personalidad:
  - Cada NPC tiene estrategia y motivo visible.
  - Viktor, Maria, Juan y el resto ya no son solo numeros.
  - Durante la sesion pueden mover mercado, publicar presion visible o dejar mensajes en chat/log.

- Sectores con mas apego:
  - Los sectores propios pueden renombrarse desde el mapa.
  - El detalle del mapa muestra cuantas empresas estan vinculadas al sector.
  - Al perder un sector, el log indica empresas afectadas y fortificacion perdida.

- Eventos de sector:
  - Un sector propio puede pedir recursos concretos.
  - Si respondes a tiempo, sube estabilidad y recibes creditos.
  - El evento aparece en el mapa con acciones: ver sector, enviar recursos o ignorar.

- Proximo desbloqueo:
  - Nuevo panel permanente en sidebar con el siguiente nivel.
  - Muestra XP actual, progreso y que se desbloquea.

- Momento de subida de nivel:
  - Al subir de nivel aparece un modal breve con los desbloqueos concretos.

- Ads mas integrados:
  - El pool publicitario ahora puede aparecer como patrocinio orbital de sesion.
  - Yuki Tanaka tiene estrategia publicitaria visible en jugadores/NPCs.

## Archivos principales

- `src/App.jsx`
- `src/styles/global.css`
- `src/data/gameData.js`
- `src/hooks/engine/gamePureLogic.js`
- `src/hooks/engine/useGameTicks.js`
- `src/hooks/engine/useGameActions.js`
- `src/components/views/MapView.jsx`
- `src/components/views/PlayersView.jsx`

## Validacion

- `npm run lint`: correcto.
- `npm run build`: correcto.
