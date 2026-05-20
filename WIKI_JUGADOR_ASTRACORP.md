# Wiki de jugador de AstraCorp

Esta guia explica que ocurre en el frontend del juego, para que sirve cada pestana y que decisiones puede tomar un jugador. Esta pensada como manual de partida y como referencia para seguir mejorando el diseno.

## Idea general

AstraCorp es un juego de gestion economica y expansion territorial. Empiezas con trabajos manuales y pequenas empresas basicas, generas recursos, vendes o entregas contratos, mejoras tu base, investigas tecnologias, conquistas sectores y preparas viajes a otros planetas.

El progreso se apoya en cinco pilares:

- Creditos: moneda principal para construir, mejorar, viajar y mantener la operacion.
- XP y nivel: desbloquean pestanas, empresas, sistemas y nuevas metas.
- Recursos: agua, electricidad, mineral y productos avanzados fabricados por empresas.
- Sectores territoriales: dan pequenos bonus a recursos si los controlas.
- Base, investigacion y proyectos: convierten la economia simple en progresion a largo plazo.

## Desbloqueo de pestanas

Las pestanas aparecen poco a poco para no saturar al jugador.

- Inicio, Operar y Mercado aparecen al principio.
- Empresas aparece cuando ya hay actividad industrial o nivel suficiente.
- Contratos/Misiones se abre pronto para convertir recursos en objetivos.
- Base, Mejoras, Proyectos y Balance aparecen cuando la colonia ya tiene estructura.
- Territorio y Politica llegan mas adelante, cuando los sectores tienen sentido.
- Social, Ads, Jugadores y Chat aparecen en la fase social/publicitaria.

## Inicio

Inicio es el panel de direccion rapida. Resume la situacion actual y propone una prioridad: trabajar, construir, entregar contratos, recoger empresas, mirar mapa o revisar balance.

Sirve para:

- Ver que accion conviene ahora.
- Entrar rapido a la pestana relevante.
- Detectar alertas: empresas llenas, sectores en riesgo, contratos listos o deuda operativa.

Objetivo de jugador:

- Usarlo como tablero de mando, especialmente cuando no sabes que hacer despues.

Mejoras posibles:

- Convertirlo en una lista mas clara de "Siguiente paso recomendado".
- Separar alertas graves de sugerencias suaves.
- Mostrar un mini resumen de progreso al siguiente planeta.

## Operar: Trabajos

Trabajos son acciones manuales con tiempo. Dan recursos, creditos y XP. Al principio son la forma principal de progresar antes de tener empresas suficientes.

Cada trabajo muestra:

- Recompensa principal.
- Creditos y XP.
- Duracion.
- Energia necesaria.
- Bonus territorial si controlas un sector compatible con ese recurso.

Regla actual de bonus:

- Si controlas un sector que beneficia el recurso del trabajo, se aplica el mejor bonus disponible.
- Si no controlas ningun sector compatible, aparece "Sector: sin bonus".
- El trabajo no depende de donde este situada una empresa.
- Si pierdes el sector, pierdes solo el bonus. No pierdes produccion base.

Objetivo de jugador:

- Usar trabajos para subir nivel, conseguir recursos concretos y desbloquear la economia automatizada.

Mejoras posibles:

- Mostrar claramente "Base + bonus" en la recompensa.
- Agrupar trabajos por recurso.
- Anadir filtros: XP, creditos, recurso, duracion.

## Operar: Empresas

Empresas producen recursos automaticamente con el paso del tiempo. Son el corazon de la economia estable.

Tipos principales:

- Captador de rocio: produce Agua.
- Panel solar: produce Electricidad.
- Mina de superficie: produce Mineral.
- Planta de purificacion: convierte Agua + Electricidad en Agua purificada.
- Fundicion: convierte Mineral + Electricidad en Componentes metalicos.
- Planta de electrolisis: convierte Agua purificada + Electricidad en Tanques de oxigeno.
- Forja industrial: convierte Componentes metalicos + Mineral + Electricidad en Estructuras de aleacion.
- Fabrica de habitats: convierte productos avanzados en Modulos de habitat.
- Laboratorio orbital: no produce recurso comercial; acelera investigaciones.

Cada empresa puede mostrar:

- Unidades listas.
- Produccion por hora.
- Mantenimiento por hora.
- Capacidad de almacen.
- Estado de inputs.
- Bonus sectorial aplicado.

Regla actual de sectores y empresas:

- Las empresas ya no se colocan en sectores concretos.
- La produccion base no se corta si un rival ocupa un sector.
- El bonus viene de los sectores que controlas, no de la ubicacion de la empresa.
- Si pierdes el sector que daba el bonus, pierdes el bonus y la empresa sigue funcionando.

Objetivo de jugador:

- Crear una cadena estable: primero Agua, Electricidad y Mineral; despues productos procesados.
- Recoger recursos antes de llenar almacenes.
- No comprar empresas avanzadas si no tienes inputs suficientes.

Mejoras posibles:

- Mejora cara de empresa: subir nivel individual de una empresa pagando muchos creditos y materiales.
- Automatizacion de recogida por tipo.
- Cola de construccion.
- Avisos de "esta empresa esta parada por falta de input".
- Vista de cadena productiva para ver que recurso bloquea a cual.

## Mercado

Mercado permite comprar y vender recursos. Los precios cambian y el jugador puede decidir si le conviene producir, comprar, vender o reservar.

Sirve para:

- Conseguir recursos que faltan para contratos, mejoras o viajes.
- Vender excedentes.
- Ver tendencias de precio.

Objetivo de jugador:

- No vender todo automaticamente: algunos recursos son necesarios para investigar, mejorar base, fabricar productos avanzados o viajar.

Mejoras posibles:

- Marcar recursos reservados para viaje/proyectos.
- Comparar "valor de mercado" contra "valor de contrato".
- Alertar cuando comprar un recurso desbloquea una mejora importante.

## Contratos y Misiones

La pestana Contratos agrupa misiones, pedidos y objetivos. Los contratos piden recursos concretos y pagan creditos + XP. Algunos pueden estar ligados a eventos o territorios.

Cada contrato muestra:

- Recurso pedido y cantidad.
- Tiempo restante.
- Recompensa en creditos y XP.
- Si ya puedes entregarlo.
- Comparacion aproximada frente a vender en mercado.

Misiones:

- Son objetivos de progreso: producir, subir nivel, conquistar, mejorar, etc.
- Dan recompensas cuando se completan.

Objetivo de jugador:

- Entregar contratos listos antes de que expiren.
- Usar contratos para transformar produccion en XP y desbloqueos.
- Priorizar contratos con buen margen o con evento activo.

Mejoras posibles:

- Separar visualmente "contratos economicos" y "misiones de progreso".
- Mostrar una lista de recursos faltantes agregada.
- Anadir boton para ir directamente a producir o comprar lo que falta.

## Territorio: Mapa

Mapa muestra sectores del planeta. Cada sector puede estar libre, controlado por el jugador o controlado/presionado por rivales.

Cada sector tiene:

- Controlador.
- Estabilidad.
- Amenaza.
- Fortificacion.
- Bonus economico.
- Recurso afectado por ese bonus.

Regla actual de bonus territorial:

- Cada sector tiene un bonus pequeno entre 0% y 1%.
- No todos tienen 1%; cada sector tiene su propio valor.
- El bonus se aplica solo si controlas el sector.
- Si varios sectores ayudan al mismo recurso, se usa el mejor bonus controlado para ese recurso.
- Si un rival te quita el sector, pierdes ese bonus.
- No genera deuda.
- No bloquea empresas.
- No mueve ni ocupa empresas.

Acciones del mapa:

- Atacar/conquistar sectores.
- Reforzar sectores propios.
- Sabotear sectores enemigos.
- Construir fortificacion.
- Resolver eventos o focos territoriales cuando existan.

Objetivo de jugador:

- Controlar sectores utiles para tus recursos principales.
- Mantener estabilidad alta y amenaza baja.
- Fortificar sectores que no quieres perder.

Mejoras posibles:

- Mapa mas simple por "bonus util" en vez de demasiados numeros.
- Leyenda clara de colores.
- Panel "mejores sectores para mi economia".
- Aviso cuando pierdes un bonus que afectaba trabajos o empresas.

## Territorio: Politica

Politica representa decisiones sociales/electorales del mundo. Puede incluir elecciones, votos o acciones que modifiquen la presion territorial y la economia.

Objetivo de jugador:

- Influir en el entorno cuando ya tienes economia suficiente.

Mejoras posibles:

- Hacer que cada decision politica tenga un coste y consecuencia visible.
- Mostrar "quien gana con esto" antes de votar.
- Conectar politica con eventos temporales de contratos o territorios.

## Base: Sede

Sede concentra mejoras permanentes de la colonia. Tiene nivel total, integridad, estado del planeta actual y acceso a ruta orbital.

Puede mejorar:

- Almacenamiento.
- Venta/mercado.
- Energia.
- Fuerza de conquista.
- Otras ventajas globales segun mejora.

Integridad:

- Si baja, puede requerir reparacion.
- Reparar cuesta creditos y recursos.

Ruta orbital:

- Muestra progreso hacia el siguiente planeta.
- Cuando todo esta listo, puedes abrir la pantalla de viaje.

Objetivo de jugador:

- Convertir creditos y materiales en ventajas permanentes.
- Preparar el viaje planetario.

Mejoras posibles:

- Mostrar una cola de mejora mas clara.
- Separar reparacion, mejoras y viaje en bloques distintos.
- Explicar mejor que "Ruta orbital" es el billete/viaje.

## Base: Mejoras / Investigacion

Investigacion desbloquea ventajas permanentes. Cuesta creditos, tiempo y recursos.

Lineas actuales:

- Herramientas de campo: trabajos mas rapidos.
- Baterias auxiliares: mas energia maxima.
- Logistica orbital: mas almacenamiento de empresas.
- Automatizacion basal: mas produccion por hora.
- Protocolos de eficiencia: menos gasto de energia.
- Optimizacion publicitaria: mejores acciones de anuncios/reparto.
- Doctrina de frontera: conquistas mas fuertes y sectores mas estables.
- Malla defensiva: menos amenaza y mejores refuerzos.
- Gobernanza territorial: mejora el bonus economico de sectores bien mantenidos.

Objetivo de jugador:

- Investigar lo que desbloquea el cuello de botella actual.
- No investigar todo sin mirar recursos: algunas mejoras compiten por materiales avanzados.

Mejoras posibles:

- Arbol visual con ramas.
- Recomendacion segun problema actual: energia, produccion, territorio, anuncios.
- Comparar efecto antes/despues.

## Base: Proyectos

Proyectos son metas grandes, como el Ascensor orbital. Convierten creditos, recursos y anuncios en progreso de largo plazo.

Pantalla actual:

- Proyecto activo.
- Fase actual.
- Progreso global.
- Requisitos por fase.
- Boton de aportar maximo.
- Patrocinios publicitarios.
- Lista para elegir objetivo.

Ejemplo: Ascensor orbital

- Convierte la colonia en puerto planetario.
- Requiere cimientos, anuncios y materiales.
- Sirve para dar una meta grande a la produccion avanzada.

Patrocinios:

- Inversor orbital: aporta creditos mientras el megaproyecto esta activo.
- Patrocinador logistico: acelera produccion temporalmente.
- Campana mediatica: reduce presion territorial.

Objetivo de jugador:

- Elegir un megaproyecto y alimentarlo poco a poco.
- Usar excedentes y anuncios para avanzar sin romper la economia.

Mejoras posibles:

- Explicar mejor "fase 1/3" con una linea de objetivos.
- Hacer que cada fase desbloquee algo visible.
- Separar "aportar recursos" y "ver anuncio" con mas claridad.

## Base: Balance

Balance resume la salud economica. Sirve para entender ingresos, costes, mantenimiento, autonomia y cuellos de botella.

Muestra:

- Produccion por hora.
- Mantenimiento.
- Deuda operativa si existe.
- Recursos con excedente o escasez.
- Empresas bloqueadas o pausadas.
- Recomendaciones economicas.

Sobre la deuda:

- La deuda no viene de los sectores.
- La deuda aparece cuando la operacion tiene costes pendientes, sobre todo mantenimiento.
- Se cobra/regulariza en ciclos de economia y al interactuar con acciones de produccion o balance segun la logica de partida.

Objetivo de jugador:

- Revisar si puedes sostener lo que has construido.
- Detectar empresas caras antes de comprar mas.

Mejoras posibles:

- Mostrar "cuando se cobra" con contador.
- Separar deuda de mantenimiento, deuda de acciones y costes futuros.
- Boton de pagar deuda si conviene hacerlo manual.

## Social: Ads

Ads permite ver anuncios patrocinados y participar en el reparto publicitario.

Hay dos conceptos distintos:

- Recompensa inmediata: al ver anuncio puedes ganar creditos, energia o acelerar acciones.
- Reparto publicitario: tu porcentaje reparte una parte del pool diario de EUR.

Importante sobre el porcentaje:

- "Reparto 4.0%" no significa que ganes 4% extra de produccion.
- Significa que recibes el 4% de tu parte calculada del pool publicitario.
- Si el pool es pequeno, el resultado en EUR sera pequeno aunque el porcentaje parezca alto.
- Por eso puedes ver "Reparto 4.0%" y aun asi "EUR 0,00011".

Objetivo de jugador:

- Usar anuncios para acelerar trabajos, contratos, proyectos o energia.
- Subir reparto si quieres empujar la capa publicitaria.

Mejoras posibles:

- Mostrar formula simplificada: pool / jugadores activos * reparto.
- Separar "EUR real" de "recompensa de juego".
- Hacer historial mas legible.

## Social: Jugadores

Jugadores muestra otros competidores, su reparto, nivel, creditos, territorios y posible comportamiento.

Sirve para:

- Ver rivales fuertes.
- Entender quien puede presionar territorios.
- Comparar tu progreso social/publicitario.

Mejoras posibles:

- Ranking por economia, territorio, publicidad y contratos.
- Ficha de rival con historial.
- Acciones diplomaticas o comerciales.

## Social: Chat

Chat es el espacio social. Puede usarse para comunicacion, sistema, avisos o mensajes entre jugadores.

Mejoras posibles:

- Canal global y canal de corporacion.
- Mensajes automaticos de eventos importantes.
- Filtro de sistema/jugadores.

## Viaje planetario

Viajar a otro planeta es un hito. No basta con tener creditos: tambien hacen falta requisitos de progreso y productos de viaje.

La pantalla de planeta muestra:

- Estado: bloqueado, listo o planeta actual.
- Coste de viaje.
- Tus creditos.
- Requisitos de nivel, contratos, territorios, empresas, sede e investigacion.
- Productos de viaje.
- Boton de comprar billete y viajar.

Billete orbital:

- El billete es el coste de viaje: creditos + productos pedidos.
- Al pulsar "Comprar billete y viajar", se descuentan esos creditos y recursos.
- Despues cambia el planeta actual y se refrescan contratos/ruta.

Ejemplo Veyron:

- Requiere nivel alto, empresas, contratos, territorios, sede e investigacion.
- Pide productos de viaje como Agua, Electricidad, Mineral y Agua purificada.
- Tiene agua escasa y mejora la venta de agua, pero puede bajar produccion base de algunas cosas.

Mejoras posibles:

- Mostrar una frase tipo "Esto es tu billete orbital".
- Previsualizar que recursos se gastaran.
- Mostrar que cambia al llegar al planeta.

## Objetivo recomendado de partida

1. Subir nivel con trabajos.
2. Construir Captador de rocio.
3. Desbloquear Electricidad y Mineral.
4. Construir empresas basicas.
5. Vender excedentes o completar contratos.
6. Mejorar Sede e Investigacion.
7. Crear cadenas avanzadas: purificacion, fundicion, oxigeno, aleaciones.
8. Controlar sectores que beneficien tus recursos principales.
9. Empujar proyectos y patrocinios.
10. Preparar productos de viaje y comprar el billete orbital.

## Reglas actuales de sectores, resumidas

- Los sectores ya no alojan empresas.
- Controlar un sector solo da bonus.
- Perder un sector solo quita bonus.
- Bonus territorial: entre 0% y 1% por sector.
- Se aplica el mejor bonus controlado compatible con el recurso.
- No hay deuda territorial por ocupacion.
- No hay tasas de ocupacion activas.
- Trabajos y empresas muestran si tienen bonus o no.

## Glosario rapido

- Bonus sectorial: pequeno aumento de produccion/recompensa por controlar un sector compatible.
- Pool publicitario: bolsa de EUR generada por anuncios.
- Reparto ads: porcentaje que se usa para calcular tu parte del pool.
- Mantenimiento: coste recurrente de sostener empresas/operacion.
- Deuda operativa: coste acumulado pendiente, no relacionado con sectores.
- Inputs: recursos que una empresa avanzada consume para fabricar otro recurso.
- Billete orbital: coste total de viaje a planeta, en creditos y productos.
- Fortificacion: defensa de un sector.
- Amenaza: riesgo o presion sobre un sector.
- Estabilidad: salud/control interno de un sector.

