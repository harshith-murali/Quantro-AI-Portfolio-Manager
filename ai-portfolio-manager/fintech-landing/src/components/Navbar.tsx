"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Search, 
  ChevronDown, 
  Bot, 
  User as UserIcon, 
  Wallet, 
  BarChart3, 
  LogOut, 
  TrendingUp, 
  TrendingDown 
} from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { api } from "@/lib/api";
import { searchStocks, TRENDING_STOCKS, SECTORS_GROUPED, type StockInfo } from "@/lib/stockData";

const PLACEHOLDER_STOCKS = ["RELIANCE", "TCS", "INFY", "HDFCBANK", "WIPRO", "SBIN", "SUNPHARMA", "ITC", "ZOMATO"];

export function Navbar() {
  const { logout, user, setUser } = useStore();
  const accessToken = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [placeholderFade, setPlaceholderFade] = useState(true);

  // Cycle through stock names for animated placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderFade(false);
      setTimeout(() => {
        setPlaceholderIdx(prev => (prev + 1) % PLACEHOLDER_STOCKS.length);
        setPlaceholderFade(true);
      }, 300);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const isAuthPage = pathname.startsWith("/auth");

  // Fetch user profile into store if not already loaded
  useEffect(() => {
    if (!accessToken || user?.name) return;
    api.auth.me(accessToken).then((d: any) => {
      setUser({ ...user, ...d.user } as any);
    }).catch(() => {});
  }, [accessToken, user?.name]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Search results
  const searchResults = useMemo(() => searchStocks(search), [search]);

  // Pick a stock — navigate to its signal detail page
  const pickStock = (symbol: string) => {
    setSearch("");
    setSearchFocused(false);
    router.push(`/signals/${symbol}`);
  };

  if (isAuthPage) return null;

  // Initials
  const initials = (() => {
    if (!user?.name) return "I";
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();

  // Pick which sectors to show when no search query
  const trendingSectors = ["IT", "Banking", "Energy"].map(sec => ({
    label: sec,
    stocks: (SECTORS_GROUPED[sec] ?? []).slice(0, 3),
  }));

  return (
    <header className="fixed inset-x-0 top-[33px] z-50">
      <div className="mx-auto mt-4 max-w-7xl px-5 sm:px-8">
        <div className="glass-panel flex items-center justify-between rounded-2xl px-5 py-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-8 w-8 items-center justify-center bg-gold/10 border border-gold/30 rounded-lg overflow-hidden group-hover:border-gold/60 transition-all duration-300">
              <span className="text-gold text-sm font-black tracking-tight">F</span>
              <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="text-sm font-bold uppercase tracking-[0.3em] text-text/90 group-hover:text-text transition-colors">fintech</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            {pathname !== '/' ? (
              <>
                {/* ── Search Bar with Dropdown ── */}
                <div className="relative" ref={searchRef}>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 pointer-events-none z-10">
                      <Search className="w-4 h-4 text-white/20" />
                    </div>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && search.trim()) {
                          if (searchResults.length > 0) {
                            pickStock(searchResults[0].symbol);
                          } else {
                            router.push(`/signals?search=${search}`);
                            setSearch("");
                            setSearchFocused(false);
                          }
                        }
                        if (e.key === 'Escape') setSearchFocused(false);
                      }}
                      placeholder=""
                      className="h-9 w-48 bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 text-xs text-white focus:outline-none focus:border-gold/30 focus:w-64 transition-all duration-300"
                    />
                    {/* Animated placeholder overlay */}
                    {!search && !searchFocused && (
                      <div className="absolute left-9 top-1/2 -translate-y-1/2 pointer-events-none flex items-center gap-1 text-xs">
                        <span className="text-white/20">Search Stocks</span>
                        <span
                          className="text-gold/50 font-medium transition-all duration-300"
                          style={{ opacity: placeholderFade ? 1 : 0, transform: placeholderFade ? 'translateY(0)' : 'translateY(-4px)' }}
                        >
                          {PLACEHOLDER_STOCKS[placeholderIdx]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── Search Dropdown ── */}
                  {searchFocused && (
                    <div className="absolute left-0 top-full mt-2 w-[340px] max-h-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-[#0c0c0c]/95 backdrop-blur-xl shadow-2xl z-50 py-2">
                      {search.trim() ? (
                        /* ── Filtered results ── */
                        searchResults.length > 0 ? (
                          <div>
                            <div className="flex items-center justify-between px-4 pt-2 pb-3">
                              <p className="text-white/30 text-[10px] uppercase tracking-wider font-medium">Results</p>
                              <p className="text-white/20 text-[10px]">Day Change</p>
                            </div>
                            {searchResults.map((stock) => (
                              <button
                                key={stock.symbol}
                                onClick={() => pickStock(stock.symbol)}
                                className="flex items-center justify-between w-full px-4 py-2.5 hover:bg-white/[0.04] transition-colors group/item"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-[10px] font-bold text-gold/80 shrink-0">
                                    {stock.symbol.slice(0, 2)}
                                  </div>
                                  <div className="text-left">
                                    <p className="text-white text-xs font-medium group-hover/item:text-gold transition-colors">{stock.name}</p>
                                    <p className="text-white/30 text-[10px]">{stock.symbol} · {stock.sector}</p>
                                  </div>
                                </div>
                                <span className={`flex items-center gap-1 text-xs font-medium tabular-nums ${stock.changePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {stock.changePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(stock.changePct).toFixed(2)}%
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="px-4 py-8 text-center">
                            <p className="text-white/20 text-xs">No stocks found for &ldquo;{search}&rdquo;</p>
                          </div>
                        )
                      ) : (
                        /* ── Default: Trending stocks by sector ── */
                        <div>
                          {/* Trending */}
                          <div className="px-4 pt-2 pb-2">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wider">Trending Stocks</p>
                              <p className="text-white/20 text-[10px]">Day Change</p>
                            </div>
                            {TRENDING_STOCKS.map((stock) => (
                              <button
                                key={stock.symbol}
                                onClick={() => pickStock(stock.symbol)}
                                className="flex items-center justify-between w-full py-2.5 hover:bg-white/[0.04] rounded-lg px-2 transition-colors group/item"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-[10px] font-bold text-gold/80 shrink-0">
                                    {stock.symbol.slice(0, 2)}
                                  </div>
                                  <div className="text-left">
                                    <p className="text-white text-xs font-medium group-hover/item:text-gold transition-colors">{stock.name}</p>
                                    <p className="text-white/30 text-[10px]">{stock.symbol}</p>
                                  </div>
                                </div>
                                <span className={`flex items-center gap-1 text-xs font-medium tabular-nums ${stock.changePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {stock.changePct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />} {Math.abs(stock.changePct).toFixed(2)}%
                                </span>
                              </button>
                            ))}
                          </div>

                          <div className="mx-4 border-t border-white/[0.06]" />

                          {/* By sector */}
                          {trendingSectors.map(({ label, stocks }) => (
                            <div key={label} className="px-4 pt-3 pb-1">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-white/40 text-[10px] font-semibold uppercase tracking-wider">{label}</p>
                                <p className="text-white/15 text-[10px]">Day Change</p>
                              </div>
                              {stocks.map((stock) => (
                                <button
                                  key={stock.symbol}
                                  onClick={() => pickStock(stock.symbol)}
                                  className="flex items-center justify-between w-full py-2 hover:bg-white/[0.04] rounded-lg px-2 transition-colors group/item"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-md bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[9px] font-bold text-white/40 shrink-0">
                                      {stock.symbol.slice(0, 2)}
                                    </div>
                                    <p className="text-white/60 text-xs group-hover/item:text-white transition-colors">{stock.name}</p>
                                  </div>
                                  <span className={`flex items-center gap-1 text-[11px] font-medium tabular-nums ${stock.changePct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                    {stock.changePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {Math.abs(stock.changePct).toFixed(2)}%
                                  </span>
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <Link href="/dashboard" className={`transition hover:text-white ${pathname === '/dashboard' ? 'text-gold' : ''}`}>Dashboard</Link>
                <Link href="/ai"        className={`transition hover:text-white ${pathname === '/ai'        ? 'text-gold' : ''}`}>AI Advisor</Link>
                <Link href="/signals"   className={`transition hover:text-white ${pathname.startsWith('/signals') ? 'text-gold' : ''}`}>Signals</Link>
                <Link href="/watchlist" className={`transition hover:text-white ${pathname === '/watchlist' ? 'text-gold' : ''}`}>Watchlist</Link>
                <Link href="/portfolio" className={`transition hover:text-white ${pathname === '/portfolio' ? 'text-gold' : ''}`}>Portfolio</Link>
                <Link href="/wallet"    className={`transition hover:text-white ${pathname === '/wallet'    ? 'text-gold' : ''}`}>Wallet</Link>
                <Link href="/backtest"  className={`transition hover:text-white ${pathname === '/backtest'  ? 'text-gold' : ''}`}>Backtest</Link>
              </>
            ) : (
              <>
                <Link href="/#experience"   className="transition hover:text-white">Experience</Link>
                <Link href="/#watchlist"    className="transition hover:text-white">Watchlist</Link>
                <Link href="/#heatmap"      className="transition hover:text-white">Heatmap</Link>
                <Link href="/#compare"      className="transition hover:text-white">Compare</Link>
                <Link href="/#journal"      className="transition hover:text-white">Journal</Link>
                <Link href="/#intelligence" className="transition hover:text-white">Intelligence</Link>
              </>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {pathname !== '/' ? (
              /* ── Avatar dropdown ── */
              <div className="relative" ref={dropRef}>
                <button
                  onClick={() => setDropdownOpen(p => !p)}
                  className="flex items-center gap-2.5 group"
                  aria-label="Profile menu"
                >
                  {/* Avatar circle */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all duration-200 ${
                    pathname === '/profile'
                      ? 'bg-gold/20 border-gold text-gold'
                      : 'bg-white/8 border-white/15 text-white/70 group-hover:border-gold/50 group-hover:bg-gold/10 group-hover:text-gold'
                  }`}>
                    {initials}
                  </div>
                  {/* Chevron */}
                  <ChevronDown className={`w-3 h-3 text-white/30 transition-transform duration-200 group-hover:text-white/60 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-52 bg-[#0c0c0c]/95 backdrop-blur-xl rounded-2xl py-2 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-1 duration-150 z-50">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-white text-sm font-semibold truncate">{user?.name ?? "Investor"}</p>
                      <p className="text-white/35 text-xs truncate mt-0.5">{user?.email ?? ""}</p>
                    </div>
                    {/* Menu items */}
                    <div className="py-1.5">
                      {[
                        { href: "/ai",        label: "AI Advisor",    icon: <Bot size={16} /> },
                        { href: "/profile",   label: "Your Profile",   icon: <UserIcon size={16} /> },
                        { href: "/wallet",    label: "Wallet",          icon: <Wallet size={16} /> },
                        { href: "/portfolio", label: "Portfolio",       icon: <BarChart3 size={16} /> },
                      ].map(({ href, label, icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors group/item"
                        >
                          <span className="text-white/20 group-hover/item:text-gold transition-colors">{icon}</span>
                          {label}
                        </Link>
                      ))}
                    </div>
                    {/* Sign out */}
                    <div className="border-t border-white/[0.06] py-1.5">
                      <button
                        onClick={async () => { 
                          const state = useStore.getState();
                          if (state.accessToken) {
                            try { await api.auth.logout(state.accessToken, state.refreshToken ?? undefined); } catch {}
                          }
                          logout(); 
                          setDropdownOpen(false); 
                          router.push("/"); 
                        }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400/50 hover:text-red-400 hover:bg-red-400/[0.04] transition-colors"
                      >
                        <LogOut size={16} />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="group relative flex items-center gap-2 border border-gold/30 rounded-xl px-6 py-2.5 text-sm font-semibold text-gold bg-gold/[0.02] hover:border-gold/60 hover:bg-gold/[0.05] transition-all duration-300"
              >
                Enter
                <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}