-- AstraCorp - catalogo unico de empresas para cliente y servidor.
-- Conserva el rebalance economico y alinea los desbloqueos con la UI actual.

create or replace function public._astracorp_company_meta(p_type text)
returns jsonb
as $fn$
begin
  return case p_type
    when 'dew_collector' then jsonb_build_object('key','dew_collector','name','Captador de rocio','buildCost',28,'resourceKey','water','resourceLabel','Agua','ratePerHour',10.8,'maxStorage',64,'unlockLevel',1,'inputs','[]'::jsonb)
    when 'solar_panel' then jsonb_build_object('key','solar_panel','name','Panel solar','buildCost',54,'resourceKey','energy_cells','resourceLabel','Electricidad','ratePerHour',8.55,'maxStorage',56,'unlockLevel',2,'inputs','[]'::jsonb)
    when 'surface_mine' then jsonb_build_object('key','surface_mine','name','Mina de superficie','buildCost',86,'resourceKey','mineral','resourceLabel','Mineral','ratePerHour',6.48,'maxStorage',46,'unlockLevel',3,'inputs','[]'::jsonb)
    when 'water_purifier' then jsonb_build_object('key','water_purifier','name','Planta de purificacion','buildCost',152,'resourceKey','purified_water','resourceLabel','Agua purificada','ratePerHour',5.22,'maxStorage',40,'unlockLevel',11,'inputs',jsonb_build_array(jsonb_build_object('key','water','amount',2),jsonb_build_object('key','energy_cells','amount',1)))
    when 'smelter' then jsonb_build_object('key','smelter','name','Fundicion','buildCost',210,'resourceKey','metal_components','resourceLabel','Componentes metalicos','ratePerHour',4.32,'maxStorage',36,'unlockLevel',12,'inputs',jsonb_build_array(jsonb_build_object('key','mineral','amount',2),jsonb_build_object('key','energy_cells','amount',1)))
    when 'electrolysis_plant' then jsonb_build_object('key','electrolysis_plant','name','Planta de electrolisis','buildCost',420,'resourceKey','oxygen_tanks','resourceLabel','Tanques de oxigeno','ratePerHour',2.52,'maxStorage',24,'unlockLevel',13,'inputs',jsonb_build_array(jsonb_build_object('key','purified_water','amount',2),jsonb_build_object('key','energy_cells','amount',2)))
    when 'industrial_forge' then jsonb_build_object('key','industrial_forge','name','Forja industrial','buildCost',520,'resourceKey','alloy_frames','resourceLabel','Estructuras de aleacion','ratePerHour',2.16,'maxStorage',22,'unlockLevel',14,'inputs',jsonb_build_array(jsonb_build_object('key','metal_components','amount',2),jsonb_build_object('key','mineral','amount',1),jsonb_build_object('key','energy_cells','amount',2)))
    when 'habitat_factory' then jsonb_build_object('key','habitat_factory','name','Fabrica de habitats','buildCost',760,'resourceKey','habitat_modules','resourceLabel','Modulos de habitat','ratePerHour',1.26,'maxStorage',14,'unlockLevel',15,'inputs',jsonb_build_array(jsonb_build_object('key','oxygen_tanks','amount',1),jsonb_build_object('key','alloy_frames','amount',1),jsonb_build_object('key','purified_water','amount',1)))
    when 'research_lab' then jsonb_build_object('key','research_lab','name','Laboratorio orbital','buildCost',620,'resourceKey','research_support','resourceLabel','Soporte cientifico','ratePerHour',0,'maxStorage',0,'unlockLevel',12,'inputs','[]'::jsonb)
    else null
  end;
end;
$fn$
language plpgsql
immutable;
