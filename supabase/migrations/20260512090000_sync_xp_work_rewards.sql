-- Sync server-side work rewards and XP curve with the frontend constants.
-- The online RPC path was still using the old 4/6/8 XP work rewards, while
-- the UI shows the current 30/36/44 XP values.

create or replace function public._astracorp_work_xp_needed(p_level integer)
returns numeric
language plpgsql
immutable
as $fn$
declare
  v_level integer := greatest(1, coalesce(p_level, 1));
  v_xp numeric;
begin
  if v_level = 1 then return 60; end if;
  if v_level = 2 then return 90; end if;
  if v_level = 3 then return 130; end if;
  if v_level = 4 then return 180; end if;
  if v_level = 5 then return 250; end if;
  if v_level = 6 then return 330; end if;
  if v_level = 7 then return 430; end if;
  if v_level = 8 then return 540; end if;
  if v_level = 9 then return 670; end if;
  if v_level = 10 then return 820; end if;

  v_xp := 820 * power(1.17::numeric, (v_level - 10)::numeric);
  return greatest(820, round(v_xp / 5) * 5);
end;
$fn$;

create or replace function public._astracorp_mc_xp_needed(p_level integer)
returns numeric
language plpgsql
immutable
as $fn$
declare
  v_level integer := greatest(1, coalesce(p_level, 1));
  v_xp numeric;
begin
  if v_level = 1 then return 60; end if;
  if v_level = 2 then return 90; end if;
  if v_level = 3 then return 130; end if;
  if v_level = 4 then return 180; end if;
  if v_level = 5 then return 250; end if;
  if v_level = 6 then return 330; end if;
  if v_level = 7 then return 430; end if;
  if v_level = 8 then return 540; end if;
  if v_level = 9 then return 670; end if;
  if v_level = 10 then return 820; end if;

  v_xp := 820 * power(1.17::numeric, (v_level - 10)::numeric);
  return greatest(820, round(v_xp / 5) * 5);
end;
$fn$;

create or replace function public._astracorp_work_job_by_label(p_label text)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_label text := trim(coalesce(p_label, ''));
begin
  return case v_label
    when 'Escaneo de rocio' then jsonb_build_object('label','Escaneo de rocio','icon','H2O','credits',5.5,'xp',30,'cost',2,'item','water','unlockLevel',1,'durationSec',180,'hd',1)
    when 'Mantenimiento solar' then jsonb_build_object('label','Mantenimiento solar','icon','ELE','credits',8,'xp',36,'cost',3,'item','energy_cells','unlockLevel',2,'durationSec',240,'hd',2)
    when 'Extraccion superficial' then jsonb_build_object('label','Extraccion superficial','icon','MIN','credits',11,'xp',44,'cost',4,'item','mineral','unlockLevel',3,'durationSec',300,'hd',-2)
    when 'Control de purificacion' then jsonb_build_object('label','Control de purificacion','icon','PUR','credits',12.5,'xp',50,'cost',6,'item','purified_water','unlockLevel',11,'durationSec',780,'hd',2)
    when 'Mecanizado basico' then jsonb_build_object('label','Mecanizado basico','icon','CMP','credits',15.5,'xp',58,'cost',7,'item','metal_components','unlockLevel',12,'durationSec',840,'hd',-2)
    when 'Sintesis de oxigeno' then jsonb_build_object('label','Sintesis de oxigeno','icon','O2','credits',19.5,'xp',68,'cost',9,'item','oxygen_tanks','unlockLevel',13,'durationSec',900,'hd',4)
    when 'Forja estructural' then jsonb_build_object('label','Forja estructural','icon','ALY','credits',24,'xp',78,'cost',11,'item','alloy_frames','unlockLevel',14,'durationSec',960,'hd',-4)
    when 'Montaje de habitat' then jsonb_build_object('label','Montaje de habitat','icon','HAB','credits',32,'xp',96,'cost',14,'item','habitat_modules','unlockLevel',15,'durationSec',1080,'hd',-2)
    else null
  end;
end;
$fn$;
