create or replace function public._astracorp_hq_planet_meta(p_id text)
returns jsonb
language plpgsql
immutable
as $fn$
declare
  v_id text := trim(coalesce(p_id, ''));
begin
  return case v_id
    when 'nexus-prime' then jsonb_build_object('id','nexus-prime','name','Nexus Prime','travelCost',0,'travelResources','[]'::jsonb,'unlock',jsonb_build_object('level',1,'credits',0,'companies',0,'contracts',0,'territoryContracts',0,'territories',0,'hqLevel',0,'researchTotal',0))
    when 'veyron' then jsonb_build_object('id','veyron','name','Veyron','travelCost',900,'travelResources',jsonb_build_array(jsonb_build_object('key','metal_components','amount',55),jsonb_build_object('key','oxygen_tanks','amount',12)),'unlock',jsonb_build_object('level',11,'credits',900,'companies',8,'contracts',8,'territoryContracts',4,'territories',9,'hqLevel',6,'researchTotal',7))
    when 'solara' then jsonb_build_object('id','solara','name','Solara','travelCost',1800,'travelResources',jsonb_build_array(jsonb_build_object('key','purified_water','amount',90),jsonb_build_object('key','oxygen_tanks','amount',20)),'unlock',jsonb_build_object('level',12,'credits',1800,'companies',10,'contracts',12,'territoryContracts',5,'territories',10,'hqLevel',8,'researchTotal',9))
    when 'kryos' then jsonb_build_object('id','kryos','name','Kryos','travelCost',3200,'travelResources',jsonb_build_array(jsonb_build_object('key','energy_cells','amount',180),jsonb_build_object('key','metal_components','amount',90),jsonb_build_object('key','alloy_frames','amount',18)),'unlock',jsonb_build_object('level',13,'credits',3200,'companies',12,'contracts',16,'territoryContracts',7,'territories',11,'hqLevel',10,'researchTotal',12))
    when 'aethon' then jsonb_build_object('id','aethon','name','Aethon','travelCost',5600,'travelResources',jsonb_build_array(jsonb_build_object('key','mineral','amount',360),jsonb_build_object('key','alloy_frames','amount',36)),'unlock',jsonb_build_object('level',14,'credits',5600,'companies',14,'contracts',22,'territoryContracts',9,'territories',12,'hqLevel',13,'researchTotal',15))
    when 'noctis' then jsonb_build_object('id','noctis','name','Noctis','travelCost',9600,'travelResources',jsonb_build_array(jsonb_build_object('key','metal_components','amount',180),jsonb_build_object('key','habitat_modules','amount',20)),'unlock',jsonb_build_object('level',15,'credits',9600,'companies',16,'contracts',30,'territoryContracts',12,'territories',13,'hqLevel',16,'researchTotal',18))
    when 'thalassa' then jsonb_build_object('id','thalassa','name','Thalassa','travelCost',15200,'travelResources',jsonb_build_array(jsonb_build_object('key','purified_water','amount',280),jsonb_build_object('key','oxygen_tanks','amount',70),jsonb_build_object('key','habitat_modules','amount',28)),'unlock',jsonb_build_object('level',16,'credits',15200,'companies',18,'contracts',40,'territoryContracts',15,'territories',14,'hqLevel',20,'researchTotal',22))
    when 'duskara' then jsonb_build_object('id','duskara','name','Duskara','travelCost',24000,'travelResources',jsonb_build_array(jsonb_build_object('key','alloy_frames','amount',110),jsonb_build_object('key','habitat_modules','amount',48)),'unlock',jsonb_build_object('level',18,'credits',24000,'companies',22,'contracts',55,'territoryContracts',20,'territories',16,'hqLevel',26,'researchTotal',28))
    else null
  end;
end;
$fn$;
