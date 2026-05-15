import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-[#060606] px-5 py-16 sm:px-8 lg:py-24 z-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(207,171,103,0.5)] bg-[rgba(207,171,103,0.1)] text-[10px] uppercase tracking-[0.3em] text-gold shadow-[0_0_15px_rgba(207,171,103,0.15)]">
                F
              </div>
              <span className="text-sm uppercase tracking-[0.3em] text-white">Fintech</span>
            </div>
            <p className="mt-6 max-w-sm text-sm leading-7 text-muted">
              Defy market gravity. A premium AI-driven hedge fund fantasy translated into an elegant retail operating system.
            </p>
          </div>

          <div>
            <div className="mb-6 text-[11px] uppercase tracking-[0.2em] text-gold">Platform</div>
            <ul className="space-y-4 text-sm text-muted">
              <li><a href="#experience" className="transition hover:text-white">Experience</a></li>
              <li><a href="#watchlist" className="transition hover:text-white">Watchlist</a></li>
              <li><a href="#heatmap" className="transition hover:text-white">Heatmap</a></li>
              <li><a href="#compare" className="transition hover:text-white">Compare</a></li>
              <li><a href="#journal" className="transition hover:text-white">Journal</a></li>
              <li><a href="#intelligence" className="transition hover:text-white">Intelligence</a></li>
            </ul>
          </div>

          <div>
            <div className="mb-6 text-[11px] uppercase tracking-[0.2em] text-gold">Legal</div>
            <ul className="space-y-4 text-sm text-muted">
              <li><a href="#" className="transition hover:text-white">Privacy Policy</a></li>
              <li><a href="#" className="transition hover:text-white">Terms of Service</a></li>
              <li><a href="#" className="transition hover:text-white">Disclosures</a></li>
            </ul>
          </div>

          <div>
            <div className="mb-6 text-[11px] uppercase tracking-[0.2em] text-gold">Contact</div>
            <ul className="space-y-4 text-sm text-muted">
              <li>
                <a href="mailto:hanishsadhi@gmail.com" className="transition hover:text-white break-all">
                  hanishsadhi@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+919019697197" className="transition hover:text-white">
                  +91 90196 97197
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-20 flex flex-col items-center justify-between border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-[11px] uppercase tracking-[0.1em] text-faint">
            © {new Date().getFullYear()} FINTECH. ALL RIGHTS RESERVED.
          </p>
          <div className="mt-4 flex gap-6 sm:mt-0">
            {['Twitter', 'LinkedIn', 'GitHub'].map((social) => (
              <a key={social} href="#" className="text-[11px] uppercase tracking-[0.1em] text-faint transition hover:text-gold">
                {social}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
