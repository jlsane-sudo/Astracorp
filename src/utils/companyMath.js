export const COMPANY_DECREASING_STEP = 0.9;

export const round2 = (n) => parseFloat(Number(n || 0).toFixed(2));

export const getCompanyGroupMultiplier = (count) =>
  1 + Math.max(0, Number(count || 1) - 1) * COMPANY_DECREASING_STEP;
