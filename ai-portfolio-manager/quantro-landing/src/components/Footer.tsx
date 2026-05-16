import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-[#060606] px-5 py-16 sm:px-8 lg:py-24 z-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(207,171,103,0.5)] bg-[rgba(207,171,103,0.1)] text-[10px] uppercase tracking-[0.3em] text-gold shadow-[0_0_15px_rgba(207,171,103,0.15)]">
                Q
              </div>
              <span className="text-sm uppercase tracking-[0.3em] text-white">Quantro</span>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-7 text-muted">
              Defy market gravity. A premium AI-driven hedge fund fantasy translated into an elegant retail operating system.
            </p>
          </div>

          <div>
            <div className="mb-6 text-[11px] uppercase tracking-[0.2em] text-gold">Platform</div>
            <ul className="space-y-4 text-sm text-muted">
              <li><Link href="/portfolio" className="transition hover:text-white">Portfolio</Link></li>
              <li><Link href="/signals" className="transition hover:text-white">Signals</Link></li>
              <li><Link href="/watchlist" className="transition hover:text-white">Watchlist</Link></li>
              <li><Link href="/backtest" className="transition hover:text-white">Backtest</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-6 text-[11px] uppercase tracking-[0.2em] text-gold">Legal</div>
            <ul className="space-y-4 text-sm text-muted">
              <li><Link href="/legal/privacy" className="transition hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/legal/terms" className="transition hover:text-white">Terms of Service</Link></li>
              <li><Link href="/legal/disclosures" className="transition hover:text-white">Disclosures</Link></li>
            </ul>
          </div>

          <div>
            <div className="mb-6 text-[11px] uppercase tracking-[0.2em] text-gold">Contact</div>
            <ul className="space-y-4 text-sm text-muted">
              <li>
                <a href="mailto:mharshith200@gmail.com" className="transition hover:text-white break-all">
                  mharshith200@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+917204621805" className="transition hover:text-white">
                  +91 72046 21805
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-20 flex flex-col items-center justify-between border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-[11px] uppercase tracking-[0.1em] text-faint">
            © {new Date().getFullYear()} QUANTRO. ALL RIGHTS RESERVED.
          </p>
          <div className="mt-4 flex gap-6 sm:mt-0">
            <a href="https://github.com/harshith-murali/ai-portfolio-manager.git" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-faint transition hover:text-gold">
              <svg height="14" width="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
              </svg>
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
