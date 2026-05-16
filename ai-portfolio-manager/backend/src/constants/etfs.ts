export const ETF_SYMBOLS = [
  'NIFTYBEES',
  'JUNIORBEES',
  'GOLDBEES',
  'BANKBEES',
  'LIQUIDBEES',
  'ITBEES',
  'PSUBNKBEES',
  'CONSUMBEES',
  'SHARIABEES',
  'CPSEETF'
] as const;

export type EtfSymbol = typeof ETF_SYMBOLS[number];
export const ETF_SET = new Set<string>(ETF_SYMBOLS);
