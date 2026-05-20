# Graficos AstraCorp

Esta primera version deja un sistema de assets listo para crecer:

- `src/assets/generated/backgrounds/`: fondos 16:9 para sectores, planetas y escenas grandes.
- `src/assets/generated/icons/`: iconos cuadrados para recursos.
- `src/assets/generated/companies/`: arte de empresas e infraestructuras.
- `src/assets/generated/characters/`: retratos y operadores.
- `src/assets/generated/events/`: graficos de eventos.
- `src/assets/generated/assets.js`: manifiesto central para importar assets desde React.

## Estilo Base

Mantener siempre:

- corporativo sci-fi
- metal oscuro
- cyan, violeta, azul profundo
- luces holograficas
- sin texto dentro de la imagen
- fondos 16:9 para escenas
- iconos y empresas en formato cuadrado

## Prompts Para Sustituir Los SVG Por IA

Fondo sector:

```text
cyberpunk corporate space industrial district, dark metallic megacorp buildings, neon cyan and violet lights, holographic screens, sci-fi economy game background, 16:9, detailed, no text
```

Icono recurso:

```text
cyberpunk game UI icon, glowing resource object, cyan violet neon, isolated object, transparent background, no text
```

Empresa:

```text
sci-fi industrial machine, dark metal, cyan and violet neon, corporate space colony game asset, centered composition, transparent background, no text
```

Retrato:

```text
cyberpunk corporate space operator portrait, holographic visor, dark suit, cyan and violet lighting, game character portrait, no text
```

Cuando generes PNG/WEBP nuevos, reemplaza el archivo correspondiente y deja el mismo nombre o actualiza `assets.js`.
