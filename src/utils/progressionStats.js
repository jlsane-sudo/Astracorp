import { getHqEffects } from '../data/hqUpgrades';
import { getResearchEffects } from '../data/researchData';

const pct = (value) => `${Math.round(Number(value || 0) * 100)}%`;
const plusPct = (value) => `+${pct(value)}`;
const minusPct = (value) => `-${pct(value)}`;

export const getProgressionStats = (research = {}, hq = {}) => {
  const researchEffects = getResearchEffects(research);
  const hqEffects = getHqEffects(hq);
  const combinedStorageMult =
    Number(researchEffects.companyStorageMult ?? 1) *
    Number(hqEffects.companyStorageMult ?? 1);
  const combinedConquestMult =
    Number(researchEffects.conquestPowerMult ?? 1) *
    Number(hqEffects.conquestPowerMult ?? 1);
  const combinedThreatMult =
    Number(researchEffects.territoryThreatMult ?? 1) *
    Number(hqEffects.territoryThreatMult ?? 1);
  const combinedEnergyDiscount = Math.min(
    0.55,
    Number(researchEffects.actionEnergyDiscount ?? 0) +
      Number(hqEffects.actionEnergyDiscount ?? 0)
  );

  return {
    researchEffects,
    hqEffects,
    commonRows: [
      {
        key: 'storage',
        label: 'Almacen',
        detail: 'Capacidad de empresas',
        research: plusPct(Number(researchEffects.companyStorageMult ?? 1) - 1),
        hq: plusPct(Number(hqEffects.companyStorageMult ?? 1) - 1),
        total: plusPct(combinedStorageMult - 1),
      },
      {
        key: 'energy',
        label: 'Energia',
        detail: 'Ahorro en acciones',
        research: minusPct(Number(researchEffects.actionEnergyDiscount ?? 0)),
        hq: minusPct(Number(hqEffects.actionEnergyDiscount ?? 0)),
        total: minusPct(combinedEnergyDiscount),
      },
      {
        key: 'conquest',
        label: 'Conquista',
        detail: 'Potencia territorial',
        research: plusPct(Number(researchEffects.conquestPowerMult ?? 1) - 1),
        hq: plusPct(Number(hqEffects.conquestPowerMult ?? 1) - 1),
        total: plusPct(combinedConquestMult - 1),
      },
      {
        key: 'pressure',
        label: 'Presion',
        detail: 'Amenaza territorial',
        research: minusPct(1 - Number(researchEffects.territoryThreatMult ?? 1)),
        hq: minusPct(1 - Number(hqEffects.territoryThreatMult ?? 1)),
        total: minusPct(1 - combinedThreatMult),
      },
    ],
    researchOnlyRows: [
      {
        key: 'work',
        label: 'Trabajos',
        value: minusPct(1 - Number(researchEffects.workDurationMult ?? 1)),
      },
      {
        key: 'production',
        label: 'Produccion',
        value: plusPct(Number(researchEffects.companyRateMult ?? 1) - 1),
      },
      {
        key: 'battery',
        label: 'Energia max.',
        value: `+${Number(researchEffects.maxEnergyBonus ?? 0)}`,
      },
    ],
    hqOnlyRows: [
      {
        key: 'market',
        label: 'Venta',
        value: plusPct(Number(hqEffects.marketSellMult ?? 1) - 1),
      },
    ],
  };
};
