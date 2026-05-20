# Cambio: operaciones territoriales lentas

## Idea

El sistema territorial deja de depender de botones instantaneos. La conquista y el sabotaje pasan a funcionar como operaciones largas, con preparacion, tiempo de resolucion, defensa oculta y resultados parciales.

El objetivo es evitar que un jugador pierda territorios por no estar conectado durante unas horas y hacer que atacar o defender sea una decision estrategica.

## Archivos modificados

- `src/hooks/engine/gameConstants.js`
- `src/hooks/engine/gamePureLogic.js`
- `src/hooks/engine/useGameActions.js`
- `src/components/views/MapView.jsx`

## Nuevas piezas de sistema

Se añadieron estructuras para:

- tipos de operacion territorial;
- progreso y ETA de operaciones;
- operaciones activas en territorios;
- activos defensivos ocultos;
- perfil defensivo por capas.

Tipos iniciales de operacion:

- `conquest`: conquista lenta;
- `sabotage`: sabotaje encubierto;
- `hack`: intrusion hacker;
- `spy`: espionaje.

## Conquista

Antes, lanzar una batalla resolvia inmediatamente el avance de campana.

Ahora:

- al pulsar conquista se crea una operacion;
- la operacion guarda `startedAt` y `resolvesAt`;
- durante la preparacion no se puede resolver todavia;
- al terminar el tiempo, el jugador puede resolver la operacion;
- el resultado avanza la campana, falla parcialmente o completa la conquista.

La conquista se mantiene acumulativa: un territorio no cae por un unico clic, sino por presion y fases.

## Sabotaje

El sabotaje deja de ser instantaneo.

Ahora:

- cuesta mas creditos y energia;
- crea una operacion encubierta;
- tarda tiempo en estar lista;
- al resolverse, su efecto depende de la defensa oculta del territorio objetivo;
- informantes, ciberseguridad y contrainteligencia pueden reducir su impacto.

Esto hace que sabotear sea potente, pero caro y comprometido.

## Espionaje

Se añade una operacion de espionaje contra territorios hostiles.

Ahora:

- cuesta creditos y energia;
- tarda tiempo en resolverse;
- al completarse genera un informe de inteligencia;
- el informe muestra defensas estimadas por capa;
- si la confianza es alta, revela activos defensivos con mas precision;
- si la defensa rival tiene contrainteligencia o red social fuerte, el informe puede ser parcial.

El informe caduca despues de un tiempo, para que la informacion territorial no sea perfecta para siempre.

## Hackeo

Se añade una operacion de hackeo contra territorios hostiles.

Ahora:

- cuesta creditos y energia;
- tarda tiempo en resolverse;
- su efecto depende de la defensa cyber y la contrainteligencia rival;
- al completarse puede bajar estabilidad, fortificacion y subir amenaza.

El hackeo sirve como via intermedia entre espiar y sabotear: no captura territorio, pero abre brechas antes de una conquista.

## Defensa oculta

Los territorios pueden tener activos defensivos:

- seguridad privada;
- red de informantes;
- firewall corporativo;
- oficina legal;
- medios locales;
- centro logistico.

Estos activos alimentan un perfil defensivo interno:

- fisica;
- hackers;
- espias;
- legal;
- social;
- economica.

El jugador que controla el territorio puede ver su red defensiva. Un atacante no deberia conocerla con precision salvo que futuras acciones de espionaje la revelen.

## Respuesta defensiva

Se añaden respuestas defensivas temporales para territorios propios:

- alerta fisica;
- contrainteligencia;
- ciberdefensa;
- contrapropaganda.

Cada respuesta:

- cuesta creditos y energia;
- dura 12 horas;
- aumenta defensas concretas mientras esta activa;
- reduce amenaza al activarse;
- queda visible en el panel del territorio.

Esto da al defensor una forma clara de reaccionar cuando sospecha que le van a atacar.

## Cambio de fortines

La accion de construir fortin ahora instala o mejora activos defensivos ocultos, ademas de seguir mejorando fortificacion, estabilidad y amenaza.

El boton visible pasa a comunicar mejor la nueva fantasia:

- antes: `Construir fortin`;
- ahora: `Instalar defensa`.

## Cambios visuales

En el mapa territorial se añadio:

- franja superior `Nuevo sistema territorial`;
- contador de operaciones lentas activas;
- contador de activos defensivos ocultos;
- caja `Siguiente accion`;
- caja `Accion disponible` en el sector seleccionado;
- cola `Operaciones en curso`;
- estado de conflicto por sector: seguro, sospechoso, infiltrado, disputado, en crisis, bajo ataque;
- botones directos en filas de operaciones abiertas;
- botones de espionaje, hackeo, sabotaje y defensa reactiva;
- panel de informe de inteligencia;
- panel de defensas ocultas para territorios propios;
- lista de activos instalados;
- valores de defensa por capa;
- panel de operacion territorial con progreso y ETA;
- panel de sabotaje encubierto con progreso y ETA;
- botones de preparar/resolver operacion.

La UI ya comunica que la guerra territorial es lenta, parcial y basada en informacion imperfecta.

## Balance

Se ajustaron costes para reducir spam:

- conquista: mas coste en creditos y menos consumo de energia inicial que antes;
- sabotaje: coste bastante mas alto;
- refuerzo: coste algo mayor.

La intencion es que iniciar operaciones sea una apuesta, no una rutina barata.

## Recursos operativos

Las operaciones ya no dependen solo de creditos y energia. Se añaden recursos operativos al inventario:

- `intel_data`: datos de inteligencia;
- `exploit_kits`: kits de intrusion;
- `security_teams`: equipos de seguridad;
- `influence_cells`: celulas de influencia.

Los trabajos producen pequeñas cantidades secundarias de estos recursos. Asi, trabajar y mantener la empresa alimenta la guerra territorial.

La pestaña `Operar` ahora los muestra directamente en cada trabajo:

- `INT`: sirve para espionaje y apoyo de conquista;
- `HK`: sirve para hackeo y sabotaje;
- `SEC`: sirve para defensa y conquista;
- `INF`: sirve para sabotaje encubierto.

Tambien hay una banda informativa y un contador de stock arriba de la lista de trabajos para que el jugador entienda que trabajar no solo da creditos y materiales, tambien prepara operaciones territoriales lentas.

Flujo de jugador para el paso 1:

1. Entrar en `Operar`.
2. Mirar el panel `INT / HK / SEC / INF`.
3. Elegir un trabajo que indique `Territorio: +X INT/HK/SEC/INF`.
4. Iniciarlo y esperar a que termine.
5. Volver a `Territorio` y gastar esos recursos en espiar, hackear, sabotear, defender o preparar conquista.

Costes iniciales:

- conquista: equipos de seguridad + datos de inteligencia;
- espionaje: datos de inteligencia;
- hackeo: kits de intrusion;
- sabotaje: celulas de influencia + kits de intrusion;
- defensa reactiva: equipos de seguridad + datos de inteligencia.

El mapa muestra una banda con el stock operativo disponible (`INT`, `HK`, `SEC`, `INF`) y los botones explican los costes.

## Limitacion actual

La nueva logica se implementa en la capa local del juego para poder probarla ya.

Las RPC online antiguas quedan desactivadas para ataque, sabotaje, refuerzo y fortificacion territorial en esta primera fase, porque aun resuelven con el modelo anterior. El siguiente paso seria migrar este mismo modelo a Supabase para que el multijugador sea autoritativo.

## Verificacion

Ejecutado correctamente:

```bash
npm run build
```

La compilacion de produccion finalizo sin errores.

## Ampliacion posterior

Se añadieron despues del primer MVP:

- `spyTerritory(territoryId)`;
- `hackTerritory(territoryId)`;
- `activateTerritoryDefense(territoryId, type)`;
- costes especificos para espionaje, hackeo y respuesta defensiva;
- normalizacion de `intelOperation`, `hackOperation`, `intelReport` y `defenseResponse`.
- cola visual de operaciones en curso;
- estados de conflicto territoriales legibles.
- recursos operativos conectados a trabajos y acciones territoriales.
- recompensas operativas visibles en `Operar` para que se entienda como preparar conquista, defensa, espionaje, hackeo y sabotaje.

## Sectores con valor estrategico

Cada territorio ahora tiene un rol estrategico visible en el mapa:

- soporte vital;
- energetico;
- industrial;
- logistico;
- tecnologico;
- politico.

Estos roles hacen que conquistar no sea solo sumar un contador. Un sector puede aportar:

- mas produccion del recurso asociado;
- mas creditos por trabajo;
- trabajos algo mas rapidos;
- mas recursos operativos (`INT`, `HK`, `SEC`, `INF`);
- contratos territoriales con mejor recompensa;
- defensa pasiva;
- reduccion de presion rival.

El mapa muestra el tipo de distrito y sus efectos en cada fila y en el panel del sector seleccionado. `Operar` tambien avisa cuando tus sectores controlados estan mejorando creditos o recursos operativos.

## Objetivo sugerido

El mapa calcula un objetivo recomendado entre los sectores no controlados. La recomendacion combina:

- valor estrategico del distrito;
- bonus economico del sector;
- defensa y estabilidad del objetivo;
- si esta libre o controlado por un rival.

El jugador puede pulsar el bloque `Objetivo sugerido` para seleccionar rapidamente el sector con mejor relacion valor/riesgo.

La ampliacion completa tambien fue verificada con:

```bash
npm run build
```

La compilacion finalizo sin errores.
