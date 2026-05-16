// Comprehensive Indian stock database used by search dropdowns across the app

export interface StockInfo {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePct: number;
}

export const STOCK_DATABASE: StockInfo[] = [
  // IT
  { symbol: "TCS",        name: "Tata Consultancy Services",  sector: "IT",       price: 3920.00, changePct: 0.50 },
  { symbol: "INFY",       name: "Infosys Limited",            sector: "IT",       price: 1425.30, changePct: -2.10 },
  { symbol: "WIPRO",      name: "Wipro Limited",              sector: "IT",       price: 468.50,  changePct: -1.80 },
  { symbol: "HCLTECH",    name: "HCL Technologies",           sector: "IT",       price: 1645.00, changePct: 0.35 },
  { symbol: "TECHM",      name: "Tech Mahindra",              sector: "IT",       price: 1380.00, changePct: 1.20 },
  { symbol: "LTIM",       name: "LTIMindtree Limited",        sector: "IT",       price: 5120.00, changePct: -0.45 },

  // Banking
  { symbol: "HDFCBANK",   name: "HDFC Bank Limited",          sector: "Banking",  price: 1680.75, changePct: 1.80 },
  { symbol: "ICICIBANK",  name: "ICICI Bank Limited",         sector: "Banking",  price: 1245.50, changePct: 0.95 },
  { symbol: "AXISBANK",   name: "Axis Bank Limited",          sector: "Banking",  price: 1102.00, changePct: -0.60 },
  { symbol: "SBIN",       name: "State Bank of India",        sector: "Banking",  price: 812.40,  changePct: 0.90 },
  { symbol: "KOTAKBANK",  name: "Kotak Mahindra Bank",        sector: "Banking",  price: 1820.00, changePct: 0.30 },
  { symbol: "INDUSINDBK", name: "IndusInd Bank",              sector: "Banking",  price: 1450.00, changePct: -1.20 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Limited",      sector: "Banking",  price: 6890.00, changePct: 0.77 },

  // Energy
  { symbol: "RELIANCE",   name: "Reliance Industries",        sector: "Energy",   price: 2845.50, changePct: -1.40 },
  { symbol: "ONGC",       name: "Oil & Natural Gas Corp",     sector: "Energy",   price: 245.80,  changePct: 0.65 },
  { symbol: "BPCL",       name: "Bharat Petroleum Corp",      sector: "Energy",   price: 612.00,  changePct: -0.30 },
  { symbol: "IOC",        name: "Indian Oil Corporation",     sector: "Energy",   price: 168.50,  changePct: 0.42 },
  { symbol: "ADANIGREEN", name: "Adani Green Energy",         sector: "Energy",   price: 1780.00, changePct: 2.10 },
  { symbol: "NTPC",       name: "NTPC Limited",               sector: "Energy",   price: 365.00,  changePct: 0.55 },
  { symbol: "POWERGRID",  name: "Power Grid Corporation",     sector: "Energy",   price: 312.00,  changePct: 0.28 },

  // FMCG
  { symbol: "HINDUNILVR", name: "Hindustan Unilever",         sector: "FMCG",     price: 2520.00, changePct: -0.38 },
  { symbol: "ITC",        name: "ITC Limited",                sector: "FMCG",     price: 445.60,  changePct: 0.22 },
  { symbol: "NESTLEIND",  name: "Nestle India Limited",       sector: "FMCG",     price: 2340.00, changePct: -0.15 },
  { symbol: "BRITANNIA",  name: "Britannia Industries",       sector: "FMCG",     price: 5100.00, changePct: 0.80 },
  { symbol: "DABUR",      name: "Dabur India Limited",        sector: "FMCG",     price: 548.00,  changePct: -0.50 },

  // Pharma
  { symbol: "SUNPHARMA",  name: "Sun Pharmaceutical",         sector: "Pharma",   price: 1598.00, changePct: 0.30 },
  { symbol: "DRREDDY",    name: "Dr. Reddy's Laboratories",   sector: "Pharma",   price: 5680.00, changePct: 1.15 },
  { symbol: "CIPLA",      name: "Cipla Limited",              sector: "Pharma",   price: 1490.00, changePct: -0.72 },
  { symbol: "DIVISLAB",   name: "Divi's Laboratories",        sector: "Pharma",   price: 3820.00, changePct: 0.45 },

  // Auto
  { symbol: "TATAMOTORS", name: "Tata Motors Limited",        sector: "Auto",     price: 945.00,  changePct: 1.60 },
  { symbol: "MARUTI",     name: "Maruti Suzuki India",        sector: "Auto",     price: 12400.00,changePct: 0.35 },
  { symbol: "M&M",        name: "Mahindra & Mahindra",        sector: "Auto",     price: 2680.00, changePct: -0.90 },
  { symbol: "BAJAJ-AUTO", name: "Bajaj Auto Limited",         sector: "Auto",     price: 8920.00, changePct: 0.48 },
  { symbol: "EICHERMOT",  name: "Eicher Motors",              sector: "Auto",     price: 4560.00, changePct: -0.25 },

  // Metals & Mining
  { symbol: "TATASTEEL",  name: "Tata Steel Limited",         sector: "Metals",   price: 148.50,  changePct: -2.30 },
  { symbol: "HINDALCO",   name: "Hindalco Industries",        sector: "Metals",   price: 620.00,  changePct: 1.40 },
  { symbol: "JSWSTEEL",   name: "JSW Steel Limited",          sector: "Metals",   price: 890.00,  changePct: -0.65 },

  // Consumer Tech
  { symbol: "ZOMATO",     name: "Zomato Limited",             sector: "Consumer", price: 154.20,  changePct: 3.20 },
  { symbol: "PAYTM",      name: "One97 Communications",      sector: "Consumer", price: 845.00,  changePct: -1.50 },
  { symbol: "NYKAA",      name: "FSN E-Commerce (Nykaa)",     sector: "Consumer", price: 175.00,  changePct: 0.85 },
  { symbol: "DMART",      name: "Avenue Supermarts (DMart)",   sector: "Consumer", price: 3850.00, changePct: 0.60 },

  // Telecom
  { symbol: "BHARTIARTL", name: "Bharti Airtel Limited",      sector: "Telecom",  price: 1905.40, changePct: -0.19 },
  { symbol: "IDEA",       name: "Vodafone Idea Limited",      sector: "Telecom",  price: 14.50,   changePct: -3.00 },

  // Infra & Cement
  { symbol: "LT",         name: "Larsen & Toubro",            sector: "Infra",    price: 3480.00, changePct: 0.72 },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement",           sector: "Infra",    price: 10200.00,changePct: -0.38 },
  { symbol: "ADANIENT",   name: "Adani Enterprises",          sector: "Infra",    price: 2950.00, changePct: 1.90 },
  { symbol: "ADANIPORTS",name: "Adani Ports & SEZ",          sector: "Infra",    price: 1320.00, changePct: 0.55 },
];

// Group by sector for the dropdown
export const SECTORS_GROUPED = STOCK_DATABASE.reduce<Record<string, StockInfo[]>>((acc, stock) => {
  (acc[stock.sector] ??= []).push(stock);
  return acc;
}, {});

// Trending stocks (hand-picked popular ones)
export const TRENDING_STOCKS = STOCK_DATABASE.filter(s =>
  ["RELIANCE", "TCS", "HDFCBANK", "INFY", "TATAMOTORS", "ZOMATO"].includes(s.symbol)
);

// Large-cap popular ETFs / Indices for the "Trending" section
export const TRENDING_INDICES = [
  { symbol: "NIFTY50",    name: "NIFTY 50 Index",           changePct: 0.45 },
  { symbol: "BANKNIFTY",  name: "Bank NIFTY Index",         changePct: 0.82 },
  { symbol: "NIFTYMID",   name: "NIFTY Midcap 50",         changePct: -0.35 },
];

// Search helper — matches symbol or name
export function searchStocks(query: string): StockInfo[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return STOCK_DATABASE.filter(
    s => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  ).slice(0, 8); // cap at 8 results
}
