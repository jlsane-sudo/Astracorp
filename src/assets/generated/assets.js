import nexusPrimeSector from './backgrounds/nexus-prime-sector.svg';
import credits from './icons/credits.svg';
import water from './icons/water.svg';
import energy from './icons/energy.svg';
import mineral from './icons/mineral.svg';
import dewCollector from './companies/dew-collector.svg';
import solarPanel from './companies/solar-panel.svg';
import surfaceMine from './companies/surface-mine.svg';
import waterPurifier from './companies/water-purifier.svg';
import smelter from './companies/smelter.svg';
import dewCollectorCard from './companies/dew-collector-card.jpg';
import solarPanelCard from './companies/solar-panel-card.jpg';
import surfaceMineCard from './companies/surface-mine-card.jpg';
import waterPurifierCard from './companies/water-purifier-card.jpg';
import smelterCard from './companies/smelter-card.jpg';
import electrolysisPlantCard from './companies/electrolysis-plant-card.jpg';
import industrialForgeCard from './companies/industrial-forge-card.jpg';
import habitatFactoryCard from './companies/habitat-factory-card.jpg';
import researchLabCard from './companies/research-lab-card.jpg';
import operatorAvatar from './characters/operator-avatar.svg';
import marketAlert from './events/market-alert.svg';
import nexusPrimePlanet from './planets/nexus-prime.svg';
import veyronPlanet from './planets/veyron.svg';
import solaraPlanet from './planets/solara.svg';
import kryosPlanet from './planets/kryos.svg';
import aethonPlanet from './planets/aethon.svg';
import noctisPlanet from './planets/noctis.svg';
import thalassaPlanet from './planets/thalassa.svg';
import duskaraPlanet from './planets/duskara.svg';

export const sectorAssets = {
  nexusPrime: nexusPrimeSector,
};

export const planetAssets = {
  'nexus-prime': nexusPrimePlanet,
  veyron: veyronPlanet,
  solara: solaraPlanet,
  kryos: kryosPlanet,
  aethon: aethonPlanet,
  noctis: noctisPlanet,
  thalassa: thalassaPlanet,
  duskara: duskaraPlanet,
};

export const resourceAssets = {
  credits,
  water,
  energy_cells: energy,
  mineral,
  purified_water: water,
  metal_components: mineral,
  oxygen_tanks: energy,
  alloy_frames: mineral,
  habitat_modules: credits,
};

export const companyAssets = {
  dew_collector: dewCollectorCard,
  solar_panel: solarPanelCard,
  surface_mine: surfaceMineCard,
  water_purifier: waterPurifierCard,
  smelter: smelterCard,
  electrolysis_plant: electrolysisPlantCard,
  industrial_forge: industrialForgeCard,
  habitat_factory: habitatFactoryCard,
  research_lab: researchLabCard,
};

export const companyFallbackAssets = {
  dew_collector: dewCollector,
  solar_panel: solarPanel,
  surface_mine: surfaceMine,
  water_purifier: waterPurifier,
  smelter,
};

export const characterAssets = {
  operator: operatorAvatar,
};

export const eventAssets = {
  marketAlert,
};
