"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/useAuth";
import { api } from "@/lib/api";

export function Navbar() {
  const { logout, user, setUser } = useStore();
  const accessToken = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  const isAuthPage = pathname.startsWith("/auth");

  // Fetch user profile into store if not already loaded
  useEffect(() => {
    if (!accessToken || user?.name) return;
    api.auth.me(accessToken).then((d: any) => {
      setUser((prev: any) => ({ ...prev, ...d.user }));
    }).catch(() => {});
  }, [accessToken, user?.name]);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isAuthPage) return null;

  // First letter of first name + first letter of last name
  const initials = (() => {
    if (!user?.name) return "I"; // Fallback to "I" for Investor
    const parts = user.name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  })();


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
                {/* Search Bar */}
                <div className="relative flex items-center mr-4">
                  <div className="absolute left-3 pointer-events-none">
                    <svg className="w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && search.trim()) {
                        router.push(`/signals?search=${search}`);
                        setSearch("");
                      }
                    }}
                    placeholder="Search stocks..."
                    className="h-9 w-48 bg-white/[0.03] border border-white/10 rounded-xl pl-9 pr-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-gold/30 focus:w-64 transition-all duration-300"
                  />
                </div>

                <Link href="/dashboard" className={`transition hover:text-white ${pathname === '/dashboard' ? 'text-gold' : ''}`}>Dashboard</Link>
                <Link href="/ai"        className={`transition hover:text-white ${pathname === '/ai'        ? 'text-gold' : ''}`}>AI Advisor</Link>
                <Link href="/signals"   className={`transition hover:text-white ${pathname.startsWith('/signals') ? 'text-gold' : ''}`}>Signals</Link>
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
                  <svg
                    className={`w-3 h-3 text-white/30 transition-transform duration-200 group-hover:text-white/60 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown panel */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-52 glass-panel rounded-2xl py-2 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-1 duration-150">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-white/[0.06]">
                      <p className="text-white text-sm font-semibold truncate">{user?.name ?? "Investor"}</p>
                      <p className="text-white/35 text-xs truncate mt-0.5">{user?.email ?? ""}</p>
                    </div>
                    {/* Menu items */}
                    <div className="py-1.5">
                      {[
                        { href: "/ai",        label: "AI Advisor",    icon: "🤖" },
                        { href: "/profile",   label: "Your Profile",   icon: "👤" },
                        { href: "/wallet",    label: "Wallet",          icon: "💳" },
                        { href: "/portfolio", label: "Portfolio",       icon: "📊" },
                      ].map(({ href, label, icon }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:bg-white/[0.04] transition-colors"
                        >
                          <span className="text-base leading-none">{icon}</span>
                          {label}
                        </Link>
                      ))}
                    </div>
                    {/* Sign out */}
                    <div className="border-t border-white/[0.06] py-1.5">
                      <button
                        onClick={() => { logout(); setDropdownOpen(false); router.push("/"); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-400/[0.04] transition-colors"
                      >
                        <span className="text-base leading-none">→</span>
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