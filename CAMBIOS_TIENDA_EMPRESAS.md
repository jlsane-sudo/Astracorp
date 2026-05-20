# Cambios: tienda integrada en Empresas

## Objetivo
La pestaña Tienda se elimina como sección independiente. La compra de empresas pasa a estar dentro de la pestaña Empresas para que la gestión empresarial sea un único flujo: comprar, revisar producción, recoger y vender si hace falta.

## Cambios implementados
- Se retira la pestaña `Tienda` del menú principal.
- La pestaña `Empresas` muestra ahora un panel `Comprar empresas` aunque el jugador no tenga ninguna empresa todavía.
- Cada empresa muestra coste de la siguiente unidad, nivel requerido, recurso producido y cadena de insumos.
- Se añade accion `sellCompany` para vender una unidad de empresa.
- La venta devuelve el 45% del coste estimado de la ultima unidad comprada de ese tipo.
- La venta tiene llamada RPC `rpc_sell_company_secure` para modo online; si la RPC no existe todavia, el juego usa fallback local temporal como el resto de acciones multijugador.
- Las partidas que estuvieran guardadas en la antigua pestaña `company-shop` se redirigen a `business` al cargar.

## Nota de balance
El reembolso parcial evita que comprar y vender empresas se convierta en una forma de generar creditos. Sirve para corregir una mala expansion o liquidar una linea productiva, no para especular.
