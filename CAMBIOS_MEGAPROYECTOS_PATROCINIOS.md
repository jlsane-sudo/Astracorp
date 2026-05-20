# Cambios: Megaproyectos y patrocinios publicitarios

## Por que se anade

El loop necesitaba una respuesta clara a "para que produzco creditos y recursos".
Ahora la produccion alimenta objetivos largos y los anuncios pueden formar parte de contratos de patrocinio.

## Nueva pestana Proyectos

- Se anade "Proyectos" dentro del grupo Base.
- Incluye tres megaproyectos:
  - Ascensor orbital.
  - Red de terraformacion.
  - Estacion comercial.
- Cada megaproyecto tiene fases con requisitos de:
  - creditos,
  - recursos,
  - anuncios.
- Completar fases da XP, porcentaje de reparto o creditos.

## Aportes de recursos

- Boton "Aportar maximo".
- Aporta automaticamente los creditos y recursos disponibles hasta cubrir la fase.
- Si la fase cumple todos los requisitos, avanza a la siguiente.
- Si se completa el megaproyecto, queda registrado como terminado.

## Patrocinios publicitarios

- Se anaden contratos diarios de anuncios:
  - Inversor orbital: aporta progreso directo al megaproyecto activo.
  - Patrocinador logistico: activa produccion acelerada durante 10 minutos.
  - Campana mediatica: reduce presion territorial en sectores propios.
- Cada patrocinio pide varios anuncios y se cierra al completarlo.
- Los patrocinios se reinician a diario.

## Ads conectados a gameplay

- La vista Ads ahora tiene acceso directo a Patrocinios.
- Los anuncios dejan de ser solo "+energia/+creditos" y tambien pueden empujar metas largas.

## Cambios tecnicos

- Nuevo archivo de datos: `src/data/megaprojects.js`.
- Nueva vista: `src/components/views/ProjectsView.jsx`.
- Nuevo estado persistente:
  - `megaprojects`,
  - `sponsorships`.
- Nuevas acciones:
  - `setActiveMegaproject`,
  - `contributeMegaprojectPhase`,
  - `claimSponsorshipAd`.

## Resultado esperado

- Mas sentido para producir recursos avanzados.
- Mas razones para volver cada dia.
- Mas motivos narrativos para ver publicidad.
- Un objetivo de medio/largo plazo mas claro que solo acumular creditos.
