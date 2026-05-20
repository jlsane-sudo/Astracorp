# Cambios mapa, sectores y balance

## Sectores nuevos

- Se han anadido 6 sectores al mapa:
  - Neon Flats
  - Iron Narrows
  - Oasis Belt
  - Pylon Reach
  - Ashen Gate
  - Harbor Nine
- Cada sector tiene region economica propia, bonus, descripcion y posicion en el mapa.
- El mapa SVG se ha ampliado y compactado para que quepan 18 sectores sin romper la lectura.
- Se han anadido overrides por planeta para que algunos sectores cambien de valor segun el planeta activo.

## Conquista mas lenta y exigente

- La ofensiva directa ahora cuesta mas:
  - 32 energia.
  - 4 creditos.
- La probabilidad de conquista baja contra sectores estables, fortificados o controlados por rivales.
- Los sectores hostiles tienen una defensa base mas alta.
- El ataque escala menos por nivel, mineral acumulado y cantidad de sectores ya controlados.
- La conquista ahora funciona por campanas acumuladas, no por victoria instantanea:
  - Reconocimiento: 0-25%.
  - Sabotaje: 26-50%.
  - Asalto: 51-75%.
  - Consolidacion: 76-100%.
- Una victoria de ofensiva suma progreso de campana.
- Una derrota conserva una pequena cantidad de inteligencia parcial.
- El sector solo cambia de controlador cuando la campana llega al 100%.
- Al conquistar un sector, empieza menos consolidado:
  - 58 estabilidad base.
  - 38 amenaza base.
  - Fortificacion inicial mas baja.
- La victoria da algo mas de XP y recompensa porque ahora cuesta mas preparar una ofensiva.

## Perdida de sectores mas lenta

- La presion territorial pasa de 90 segundos a 180 segundos por pulso.
- El asedio necesario antes de perder un sector pasa de 3 a 6 pulsos.
- La amenaza organica sube bastante menos.
- La presion de NPCs rivales se ha reducido.
- La fortificacion reduce mejor la amenaza y se degrada mas despacio.
- Un sector solo entra en fase critica con amenaza muy alta o estabilidad realmente baja.
- Los rivales ahora pueden abrir frentes visibles contra tus sectores.
- Los frentes rivales avanzan por fases como las campanas territoriales.
- Si un frente rival llega al 100%, el sector pasa al atacante.
- El mapa incluye un panel de "Frentes activos" con campanas tuyas y rivales.
- Se puede usar contrainteligencia para cortar suministros y reducir el progreso rival.
- Reforzar un sector tambien reduce el frente rival; el blindaje publicitario lo elimina.

## Defensa y fortines

- Reforzar ahora cuesta 10 creditos y 6 energia.
- Sabotear ahora cuesta 8 creditos y 5 energia.
- Construir fortines cuesta mas mineral/componentes y, a partir de fortificacion alta, mas aleaciones.
- Cada fortin sube menos de golpe, para que defender sea una inversion progresiva.
- Se ha anadido el boton "Ver anuncio y blindar" en el mapa:
  - Refuerza todos tus sectores propios al maximo.
  - Estabilidad 100%.
  - Amenaza 0%.
  - Fortificacion 100%.
  - Limpia asedios activos.
  - Consume una emision diaria de publicidad y respeta el cooldown de anuncios.

## Balance mas util

- El tab Balance ahora incluye un diagnostico operativo:
  - Recurso bloqueante.
  - Tiempo estimado hasta atasco.
  - Siguiente empresa recomendada.
  - Mejor accion economica inmediata.
- El diagnostico usa produccion, consumos, stock, nivel, creditos y costes reales de empresa.

## Verificacion

- `npm run lint` completado sin errores.
- `npm run build` completado sin errores.
