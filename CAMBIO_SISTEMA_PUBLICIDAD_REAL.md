# Cambio: valor realista por impresion publicitaria

## Motivo
Dato observado: 76 impresiones generan 0,041 EUR.

Calculo:

```text
0,041 / 76 = 0,000539 EUR por impresion
0,000539 * 1000 = 0,539 EUR CPM
```

El juego tenia valores internos demasiado altos para el pool economico:

- `AD_POOL_REVENUE_PER_VIEW = 0.04`
- fallback `DEFAULT_REVENUE_PER_VIEW = 0.004`

Eso no encajaba con el rendimiento real observado.

## Cambio aplicado
Se ajusta el valor usado por el pool de publicidad a:

```js
0.00054
```

Esto equivale aproximadamente a:

```text
0,54 EUR CPM
```

## Archivos modificados
- `src/hooks/engine/gameConstants.js`
- `src/services/adpool.js`

## Nota
Este valor deberia tratarse como configurable en el futuro, porque el CPM real cambia segun red publicitaria, pais, temporada, dispositivo y calidad del trafico. Para ahora queda alineado con el dato real que tenemos.
