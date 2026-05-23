-- AstraCorp - rebalance de costes de empresas
-- Sube el coste base y el escalado por copias para ralentizar la compra masiva.

create or replace function public._astracorp_company_meta(p_type text)
returns jsonb
as $fn$
begin
  return case p_type
    when 'dew_collector' then jsonb_build_object('key','dew_collector','name','Captador de rocio','buildCost',28,'resourceKey','water','resourceLabel','Agua','ratePerHour',12,'maxStorage',64,'unlockLevel',1,'inputs','[]'::jsonb)
    when 'solar_panel' then jsonb_build_object('key','solar_panel','name','Panel solar','buildCost',54,'resourceKey','energy_cells','resourceLabel','Energia','ratePerHour',9.5,'maxStorage',56,'unlockLevel',2,'inputs','[]'::jsonb)
    when 'surface_mine' then jsonb_build_object('key','surface_mine','name','Mina de superficie','buildCost',86,'resourceKey','mineral','resourceLabel','Mineral','ratePerHour',7.2,'maxStorage',46,'unlockLevel',3,'inputs','[]'::jsonb)
    when 'water_purifier' then jsonb_build_object('key','water_purifier','name','Planta de purificacion','buildCost',152,'resourceKey','purified_water','resourceLabel','Agua purificada','ratePerHour',5.8,'maxStorage',40,'unlockLevel',4,'inputs',jsonb_build_array(jsonb_build_object('key','water','amount',2),jsonb_build_object('key','energy_cells','amount',1)))
    when 'smelter' then jsonb_build_object('key','smelter','name','Fundicion','buildCost',210,'resourceKey','metal_components','resourceLabel','Componentes metalicos','ratePerHour',4.8,'maxStorage',36,'unlockLevel',5,'inputs',jsonb_build_array(jsonb_build_object('key','mineral','amount',2),jsonb_build_object('key','energy_cells','amount',1)))
    when 'electrolysis_plant' then jsonb_build_object('key','electrolysis_plant','name','Planta de electrolisis','buildCost',420,'resourceKey','oxygen_tanks','resourceLabel','Tanques de oxigeno','ratePerHour',2.8,'maxStorage',24,'unlockLevel',6,'inputs',jsonb_build_array(jsonb_build_object('key','purified_water','amount',2),jsonb_build_object('key','energy_cells','amount',2)))
    when 'industrial_forge' then jsonb_build_object('key','industrial_forge','name','Forja industrial','buildCost',520,'resourceKey','alloy_frames','resourceLabel','Estructuras de aleacion','ratePerHour',2.4,'maxStorage',22,'unlockLevel',7,'inputs',jsonb_build_array(jsonb_build_object('key','metal_components','amount',2),jsonb_build_object('key','mineral','amount',1),jsonb_build_object('key','energy_cells','amount',2)))
    when 'habitat_factory' then jsonb_build_object('key','habitat_factory','name','Fabrica de habitats','buildCost',760,'resourceKey','habitat_modules','resourceLabel','Modulos de habitat','ratePerHour',1.4,'maxStorage',14,'unlockLevel',9,'inputs',jsonb_build_array(jsonb_build_object('key','oxygen_tanks','amount',1),jsonb_build_object('key','alloy_frames','amount',1),jsonb_build_object('key','purified_water','amount',1)))
    when 'research_lab' then jsonb_build_object('key','research_lab','name','Laboratorio orbital','buildCost',620,'resourceKey','research_support','resourceLabel','Soporte cientifico','ratePerHour',0,'maxStorage',0,'unlockLevel',8,'inputs','[]'::jsonb)
    else null
  end;
end;
$fn$
language plpgsql
immutable;

create or replace function public._astracorp_company_build_cost(p_type text, p_owned integer)
returns numeric
as $fn$
declare
  v_meta jsonb := public._astracorp_company_meta(p_type);
  v_base numeric;
begin
  if v_meta is null then return 0; end if;
  v_base := coalesce((v_meta->>'buildCost')::numeric, 0);
  return greatest(v_base, round((v_base * power(1.35, greatest(0, coalesce(p_owned, 0))))::numeric, 0));
end;
$fn$
language plpgsql
immutable;
