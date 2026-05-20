# QA Supabase / multiplayer

Checklist para probar AstraCorp despues de aplicar las migraciones de Supabase.

## Preparacion

- [ ] Confirmar que `.env.local` tiene:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Ejecutar `npm install` si faltan dependencias.
- [ ] Ejecutar `npm run lint`.
- [ ] Ejecutar `npm run build`.
- [ ] Arrancar la app con `npm run dev`.
- [ ] Abrir la consola del navegador antes de probar.

## Migraciones

Ejecutar en Supabase SQL Editor siguiendo este orden:

- [ ] `20260429_company_multiplayer.sql`
- [ ] `20260429_territory_multiplayer.sql`
- [ ] `20260429_market_multiplayer.sql`
- [ ] `20260429_missions_contracts_online.sql`
- [ ] `20260429_work_online.sql`
- [ ] `20260429_research_online.sql`
- [ ] `20260429_hq_online.sql`
- [ ] `20260429_player_rankings.sql`
- [ ] `20260429_elections_online.sql`
- [ ] `20260430_profiles_adpool.sql`
- [ ] `20260503_company_cost_rebalance.sql`

Si Supabase corta alguna funcion larga, usar el archivo `_BLOCKS.sql` equivalente.

## Auth y perfil

- [ ] Registrar usuario nuevo.
  - Esperado: login correcto y fila creada en `profiles`.
- [ ] Revisar tabla `profiles`.
  - Esperado: `id` igual al usuario de `auth.users`, `username` no vacio.
- [ ] Cerrar sesion.
  - Esperado: vuelve a pantalla de auth.
- [ ] Iniciar sesion.
  - Esperado: recupera sesion y perfil sin errores en consola.

## Guardado de partida

- [ ] Crear/iniciar partida.
  - Esperado: fila en `game_saves`.
- [ ] Cambiar algun dato simple: nombre, creditos por trabajo o progreso.
  - Esperado: `game_saves.save_data` se actualiza tras unos segundos.
- [ ] Recargar la pagina.
  - Esperado: la partida se restaura.
- [ ] Probar con otro usuario.
  - Esperado: no lee ni modifica la partida del primer usuario.

## Ranking

- [ ] Abrir vista de jugadores.
  - Esperado: llama a `rpc_get_player_rankings`.
- [ ] Verificar que aparece el jugador actual.
  - Esperado: nombre, nivel, creditos y empresas coherentes.
- [ ] Probar con dos usuarios.
  - Esperado: ambos aparecen ordenados por score.

## Empresas online

- [ ] Construir una empresa.
  - Esperado: usa `rpc_build_company_secure` y actualiza `game_saves`.
  - Esperado: el coste coincide con el frontend y escala con fuerza por cada copia.
- [ ] Recoger produccion de una empresa.
  - Esperado: usa `rpc_collect_company_secure`.
- [ ] Recoger por grupo.
  - Esperado: usa `rpc_collect_company_group_secure`.
- [ ] Vender empresa.
  - Esperado: usa `rpc_sell_company_secure` y devuelve creditos.
- [ ] Revisar `astracorp_company_events`.
  - Esperado: eventos del usuario autenticado.

## Mercado online

- [ ] Abrir mercado con usuario autenticado.
  - Esperado: sincroniza `rpc_get_global_market`.
- [ ] Comprar recurso.
  - Esperado: usa `rpc_buy_market_item_secure`.
- [ ] Vender recurso.
  - Esperado: usa `rpc_sell_market_item_secure`.
- [ ] Revisar `astracorp_global_market`.
  - Esperado: cambia estado global del recurso.
- [ ] Probar con dos usuarios.
  - Esperado: ambos ven cambios del mercado global.

## Territorios online

- [ ] Abrir mapa.
  - Esperado: sincroniza `rpc_get_global_territories`.
- [ ] Atacar territorio.
  - Esperado: usa `rpc_attack_territory_secure`.
- [ ] Reforzar territorio propio.
  - Esperado: usa `rpc_reinforce_territory_secure`.
- [ ] Sabotear territorio.
  - Esperado: usa `rpc_sabotage_territory_secure`.
- [ ] Construir fortin.
  - Esperado: usa `rpc_build_territory_fort_secure`.
- [ ] Cobrar tasas de ocupacion.
  - Esperado: usa `rpc_collect_occupation_taxes_secure`.
- [ ] Revisar `astracorp_global_territories`.
  - Esperado: estado global actualizado.

## Trabajos online

- [ ] Iniciar trabajo.
  - Esperado: usa `rpc_start_work_secure`.
- [ ] Ver anuncio/boost de trabajo si aplica.
  - Esperado: usa `rpc_boost_work_secure`.
- [ ] Completar trabajo.
  - Esperado: usa `rpc_complete_work_secure`, suma creditos/XP y actualiza misiones.
- [ ] Revisar `astracorp_work_events`.

## Investigacion online

- [ ] Iniciar investigacion.
  - Esperado: usa `rpc_start_research_secure`.
- [ ] Aplicar boost.
  - Esperado: usa `rpc_boost_research_secure`.
- [ ] Completar investigacion.
  - Esperado: usa `rpc_complete_research_secure`.
- [ ] Revisar `astracorp_research_events`.

## Sede / integridad / planeta

- [ ] Comprar mejora de sede.
  - Esperado: usa `rpc_upgrade_hq_secure`.
- [ ] Reparar integridad.
  - Esperado: usa `rpc_repair_integrity_secure`.
- [ ] Cambiar planeta si se cumplen requisitos.
  - Esperado: usa `rpc_select_planet_secure`.
- [ ] Revisar `astracorp_hq_events`.

## Misiones y contratos

- [ ] Entregar contrato.
  - Esperado: usa `rpc_deliver_contract_secure`.
- [ ] Reclamar recompensa de mision.
  - Esperado: usa `rpc_claim_mission_reward_secure`.
- [ ] Revisar `astracorp_mission_contract_events`.

## Elecciones online

- [ ] Convocar protocolo/eleccion.
  - Esperado: usa `rpc_start_election_secure` y crea fila en `astracorp_elections`.
- [ ] Ver lista de protocolos online activos.
  - Esperado: lee `astracorp_elections`.
- [ ] Votar.
  - Esperado: usa `rpc_vote_election_secure`.
- [ ] Esperar fin del protocolo y resolver.
  - Esperado: usa `rpc_resolve_election_secure`, marca eleccion como inactiva y aplica ganador.
- [ ] Probar con dos usuarios.
  - Esperado: ambos ven el protocolo activo.

## Anuncios e ingresos

- [ ] Ver anuncio recompensado.
  - Esperado: acumula vista local.
- [ ] Llegar al umbral de flush o ocultar/cerrar pagina.
  - Esperado: usa `rpc_flush_ad_views`.
- [ ] Revisar `astracorp_ad_pool_daily`.
  - Esperado: aumenta `total_views` y `total_revenue_eur`.
- [ ] Revisar `astracorp_ad_player_daily`.
  - Esperado: aumenta `views`, `revenue_eur` y `player_pct`.
- [ ] Cambiar de dia o ejecutar cierre manual.
  - Esperado: `rpc_close_ad_pool_day` marca el dia cerrado y calcula `final_payout`.
- [ ] Abrir vista de anuncios.
  - Esperado: `rpc_get_my_ad_income_summary` y `rpc_get_my_ad_income_history` devuelven datos.

## Errores comunes

- `Could not find the function`: falta ejecutar la migracion de esa RPC.
- `No hay partida guardada`: el usuario no tiene fila en `game_saves` todavia.
- `permission denied for table`: falta policy RLS o se esta accediendo sin sesion.
- `schema cache`: esperar unos segundos o refrescar proyecto Supabase tras crear funciones.
- Valores no actualizan: revisar consola y pestaña Network para ver si hubo fallback local.

## Criterio de OK

- [ ] Registro/login funciona.
- [ ] Guardado remoto funciona.
- [ ] Ranking funciona.
- [ ] Al menos una accion online funciona por modulo.
- [ ] Dos usuarios ven mercado/territorios/elecciones compartidos.
- [ ] Anuncios registran vistas y resumen diario.
- [ ] No hay errores rojos en consola durante el flujo principal.
