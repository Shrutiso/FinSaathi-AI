// India FY 2025-26 (AY 2026-27) New Tax Regime slabs
// 0–4L: 0%, 4–8L: 5%, 8–12L: 10%, 12–16L: 15%, 16–20L: 20%, 20–24L: 25%, >24L: 30%
// Standard deduction (salaried): ₹75,000. Rebate u/s 87A: full rebate if taxable <= ₹12,00,000.
// Surcharge: 10% (>50L), 15% (>1Cr), 25% (>2Cr). Cess: 4% on (tax + surcharge).

export type Occupation = "student" | "private" | "govt" | "self_employed" | "unemployed";

export interface TaxBreakdown {
  grossIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  slabTax: number;
  rebate: number;
  taxAfterRebate: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  effectiveRate: number;
  monthlyTax: number;
  takeHomeAnnual: number;
  takeHomeMonthly: number;
  slabBreakup: { from: number; to: number | null; rate: number; tax: number }[];
}

const SLABS: { upto: number | null; rate: number }[] = [
  { upto: 400000, rate: 0 },
  { upto: 800000, rate: 5 },
  { upto: 1200000, rate: 10 },
  { upto: 1600000, rate: 15 },
  { upto: 2000000, rate: 20 },
  { upto: 2400000, rate: 25 },
  { upto: null, rate: 30 },
];

export function calculateTax(grossIncome: number, occupation: Occupation): TaxBreakdown {
  const gross = Math.max(0, grossIncome || 0);
  const stdDed = ["private", "govt"].includes(occupation) ? 75000 : 0;
  const taxable = Math.max(0, gross - stdDed);

  let remaining = taxable;
  let prev = 0;
  let slabTax = 0;
  const slabBreakup: TaxBreakdown["slabBreakup"] = [];

  for (const slab of SLABS) {
    const top = slab.upto ?? Infinity;
    const slice = Math.max(0, Math.min(taxable, top) - prev);
    const tax = (slice * slab.rate) / 100;
    if (slice > 0) {
      slabBreakup.push({ from: prev, to: slab.upto, rate: slab.rate, tax });
      slabTax += tax;
    }
    prev = top;
    if (taxable <= top) break;
  }

  // Section 87A rebate (new regime FY25-26): full rebate if taxable income <= 12L
  const rebate = taxable <= 1200000 ? slabTax : 0;
  const taxAfterRebate = Math.max(0, slabTax - rebate);

  // Surcharge
  let surchargeRate = 0;
  if (taxable > 20000000) surchargeRate = 25;
  else if (taxable > 10000000) surchargeRate = 15;
  else if (taxable > 5000000) surchargeRate = 10;
  const surcharge = (taxAfterRebate * surchargeRate) / 100;

  // Health & Education Cess 4%
  const cess = (taxAfterRebate + surcharge) * 0.04;
  const totalTax = Math.round(taxAfterRebate + surcharge + cess);

  const effectiveRate = gross > 0 ? (totalTax / gross) * 100 : 0;
  const monthlyTax = totalTax / 12;
  const takeHomeAnnual = Math.max(0, gross - totalTax);
  const takeHomeMonthly = takeHomeAnnual / 12;

  return {
    grossIncome: gross,
    standardDeduction: stdDed,
    taxableIncome: taxable,
    slabTax: Math.round(slabTax),
    rebate: Math.round(rebate),
    taxAfterRebate: Math.round(taxAfterRebate),
    surcharge: Math.round(surcharge),
    cess: Math.round(cess),
    totalTax,
    effectiveRate,
    monthlyTax,
    takeHomeAnnual,
    takeHomeMonthly,
    slabBreakup,
  };
}

export function formatINR(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
