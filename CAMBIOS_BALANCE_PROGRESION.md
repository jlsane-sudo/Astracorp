# Cambios de balance y progresion

Fecha: 2026-05-03

## Contratos

- Los contratos ya tienen rareza real: estable, urgente, premium y masivo.
- Los masivos aparecen en niveles avanzados y funcionan como sumidero de stock.
- La vista muestra rareza y demanda baja/media/alta/extrema.

## Empresas

- Las empresas productivas generan coste de mantenimiento por hora.
- El mantenimiento se descuenta durante el tick de produccion.
- La vista de empresas muestra mantenimiento por hora y mantenimiento acumulado por grupo.
- Los laboratorios no pagan mantenimiento productivo porque no generan stock comercial.

## Mercado

- Las operaciones tienen un limite de 250 unidades por accion.
- Comprar mucho encarece la operacion por impacto de liquidez.
- Vender mucho baja el precio efectivo por penalizacion de volumen.
- La UI muestra el maximo por operacion y el impacto total estimado de compra/venta.

## Planetas

- Subidos costes de viaje, recursos requeridos y requisitos de desbloqueo.
- La progresion planetaria ahora exige mas contratos, empresas, territorios, sede e investigacion.
- Anadida migracion SQL para que Supabase use los mismos requisitos en `rpc_select_planet_secure`.

## Objetivo

Evitar que la economia se dispare demasiado pronto. La partida deberia pedir mas gestion de stock,
mas preparacion industrial y decisiones de mercado menos automaticas.
