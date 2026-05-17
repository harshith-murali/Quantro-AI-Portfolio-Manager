const G = 'cfab67';
const ic = (slug: string) => `https://cdn.simpleicons.org/${slug}/${G}`;

export const TICKERS = [
  { symbol: "RELIANCE", slug: "relianceindustries" },
  { symbol: "TCS", slug: "tata" },
  { symbol: "HDFCBANK", slug: "hdfcbank" },
  { symbol: "ICICIBANK", slug: "icicibank" },
  { symbol: "BHARTIARTL", slug: "airtel" },
  { symbol: "SBIN", slug: "statebankofindia" },
  { symbol: "INFY", slug: "infosys" },
  { symbol: "LICI", slug: "lic" },
  { symbol: "ITC", slug: "itc" },
  { symbol: "HINDUNILVR", slug: "unilever" },
  { symbol: "LT", slug: "larsentoubro" },
  { symbol: "AXISBANK", slug: "axisbank" },
  { symbol: "KOTAKBANK", slug: "kotakmahindrabank" },
  { symbol: "SUNPHARMA", slug: "sunpharma" },
  { symbol: "BAJFINANCE", slug: "bajaj" },
  { symbol: "MARUTI", slug: "suzuki" },
  { symbol: "TITAN", slug: "titan" },
  { symbol: "ADANIENT", slug: "adani" },
  { symbol: "NTPC", slug: "ntpc" },
  { symbol: "ULTRACEMCO", slug: "adityabirla" },
  { symbol: "ASIANPAINT", slug: "asianpaints" },
  { symbol: "COALINDIA", slug: "coalindia" },
  { symbol: "TATAMOTORS", slug: "tata" },
  { symbol: "ONGC", slug: "ongc" },
  { symbol: "BAJAJFINSV", slug: "bajaj" },
  { symbol: "JSWSTEEL", slug: "jsw" },
  { symbol: "NESTLEIND", slug: "nestle" },
  { symbol: "M&M", slug: "mahindra" },
  { symbol: "GRASIM", slug: "adityabirla" },
  { symbol: "HINDALCO", slug: "adityabirla" },
  { symbol: "TECHM", slug: "mahindra" },
  { symbol: "ADANIPORTS", slug: "adani" },
  { symbol: "TATASTEEL", slug: "tata" },
  { symbol: "SBILIFE", slug: "statebankofindia" },
  { symbol: "BPCL", slug: "bharatpetroleum" },
  { symbol: "DRREDDY", slug: "drreddys" },
  { symbol: "CIPLA", slug: "cipla" },
  { symbol: "APOLLOHOSP", slug: "apollohospitals" },
  { symbol: "BRITANNIA", slug: "britannia" },
  { symbol: "EICHERMOT", slug: "eichermotors" },
  { symbol: "INDUSINDBK", slug: "indusindbank" },
  { symbol: "HEROMOTOCO", slug: "heromotocorp" },
  { symbol: "DIVISLAB", slug: "divislaboratories" },
  { symbol: "BAJAJ-AUTO", slug: "bajaj" },
  { symbol: "TATACONSUM", slug: "tata" },
  { symbol: "HDFCLIFE", slug: "hdfc" },
  { symbol: "SHRIRAMFIN", slug: "shriram" },
  { symbol: "WIPRO", slug: "wipro" },
  { symbol: "HCLTECH", slug: "hcl" },
];

export const getIconUrl = (slug: string, symbol?: string) => {
  if (symbol) {
    const safeSymbol = symbol.replace(/&/g, '');
    return `/logos/${safeSymbol}.png`;
  }
  return ic(slug);
};
