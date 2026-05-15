import { HeroVisual } from '@/components/HeroVisual';
import { Reveal } from '@/components/Reveal';
import { FeatureShowcase } from '@/components/FeatureShowcase';
import { InteractiveLogoGridSection } from '@/components/InteractiveLogoGridSection';
import { WaitlistSection } from '@/components/WaitlistSection';
import { Footer } from '@/components/Footer';

export default function Page() {
  return (
    <>
      <main>

        {/* ============ HERO ============ */}
        <section className="relative flex min-h-screen items-center overflow-hidden pb-16 pt-32">

          {/* Content grid */}
          <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">

            {/* Left — text */}
            <Reveal>
              <div className="mb-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.38em] text-gold">
                <span className="gold-line h-px w-10" />
                AI portfolio intelligence
              </div>
              <h1 className="max-w-4xl font-serifDisplay text-[clamp(3.8rem,10vw,8.5rem)] leading-[0.9] tracking-[-0.04em] text-text">
                defy
                <br />
                market
                <br />
                gravity.
              </h1>
              <p className="mt-8 max-w-xl text-base leading-8 text-muted sm:text-lg">
                A luxury AI investing interface engineered for conviction, composure, and asymmetrical advantage.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#experience"
                  className="inline-flex items-center justify-center rounded-full border border-[rgba(207,171,103,0.35)] bg-[rgba(207,171,103,0.10)] px-7 py-4 text-sm uppercase tracking-[0.24em] text-text transition hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(207,171,103,0.12)]"
                >
                  See the experience
                </a>
                <a
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 px-7 py-4 text-sm uppercase tracking-[0.24em] text-muted transition hover:-translate-y-0.5 hover:border-gold/20 hover:text-text"
                >
                  Access System →
                </a>
              </div>
            </Reveal>

            {/* Right — phone */}
            <Reveal delay={0.15}>
              <HeroVisual />
              <p className="mt-10 text-center font-serifDisplay text-2xl tracking-[-0.02em] text-text sm:text-3xl">
                all that you deserve, and some more.
              </p>
            </Reveal>

          </div>
        </section>

        {/* ============ EXPERIENCE — Scroll-synced showcase ============ */}
        <section id="experience" className="px-5 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <FeatureShowcase />
          </div>
        </section>

        {/* ============ INTELLIGENCE ============ */}
        <section id="intelligence" className="px-5 py-24 sm:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="section-divider" />
            <div className="grid gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">

              <Reveal>
                <div className="mb-4 text-[11px] uppercase tracking-[0.34em] text-gold">
                  Living intelligence
                </div>
                <h2 className="font-serifDisplay text-5xl leading-none tracking-[-0.04em] text-text sm:text-6xl">
                  Built to feel
                  <br />
                  inevitable.
                </h2>
                <p className="mt-8 max-w-lg text-base leading-8 text-muted">
                  The interface behaves like a premium campaign site, but every panel hints at a serious financial operating system beneath the surface.
                </p>
              </Reveal>

              <Reveal delay={0.1} className="grid gap-5 sm:grid-cols-2">
                <div className="glass-panel rounded-[30px] p-7">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-faint">
                    Signal posture
                  </div>
                  <div className="mt-5 font-serifDisplay text-4xl text-text">
                    Aggressive quality
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted">
                    Bias toward resilient compounders with upside asymmetry and low emotional drag.
                  </p>
                </div>

                <div className="glass-panel rounded-[30px] p-7">
                  <div className="text-[11px] uppercase tracking-[0.28em] text-faint">
                    Reallocation window
                  </div>
                  <div className="mt-5 font-serifDisplay text-4xl text-text">
                    48 hours
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted">
                    Smart timing bands keep portfolio shifts elegant, discreet, and conviction-led.
                  </p>
                </div>

                <div className="glass-panel rounded-[30px] p-7 sm:col-span-2">
                  <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.28em] text-faint">
                        Model verdict
                      </div>
                      <div className="mt-4 font-serifDisplay text-4xl text-text sm:text-5xl">
                        Institutional calm.
                        <br />
                        Retail simplicity.
                      </div>
                    </div>
                    <div className="w-full max-w-xs">
                      <div className="mb-3 flex items-center justify-between text-xs text-muted">
                        <span>conviction score</span>
                        <span>91</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <div className="h-full w-[91%] rounded-full bg-[linear-gradient(90deg,#7f6330,#cfab67,#f1ddb5)]" />
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

            </div>
            <div className="section-divider" />
          </div>
        </section>

        {/* ============ INTEGRATIONS — Interactive Logo Grid ============ */}
        <InteractiveLogoGridSection>
          <Reveal>
            <div className="flex flex-col items-center">
              <h2 className="font-serifDisplay text-4xl sm:text-5xl text-text mb-6">
                Integrated with global markets
              </h2>
              <p className="text-muted max-w-lg mx-auto mb-8 text-lg">
                Seamlessly connect your existing brokerage accounts and monitor intelligence across thousands of global equities in real-time.
              </p>
              <button className="px-6 py-3 bg-[rgba(207,171,103,0.1)] border border-gold/30 text-gold rounded-full hover:bg-[rgba(207,171,103,0.2)] transition-colors">
                View Supported Integrations →
              </button>
            </div>
          </Reveal>
        </InteractiveLogoGridSection>


        {/* ============ WAITLIST ============ */}
        <WaitlistSection />

        {/* ============ MOBILE APP QR ============ */}
        <section className="px-5 py-24 sm:px-8 bg-[#070707]">
          <div className="mx-auto max-w-7xl">
            <Reveal>
              <div className="glass-panel rounded-[40px] p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 border border-gold/10">
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-4 text-[11px] uppercase tracking-[0.34em] text-gold">
                    On the move
                  </div>
                  <h2 className="font-serifDisplay text-5xl sm:text-6xl text-text mb-6">
                    Take the intelligence everywhere.
                  </h2>
                  <p className="text-muted max-w-lg mb-8 text-lg leading-relaxed">
                    Scan the QR code to experience Fintech on your mobile device. All features, signals, and portfolio intelligence in the palm of your hand.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                      <span className="text-gold text-xl"></span>
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">App Store</span>
                    </div>
                    <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 flex items-center gap-3">
                      <span className="text-gold text-xl">▶</span>
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-widest">Play Store</span>
                    </div>
                  </div>
                </div>
                
                <div className="relative group">
                  <div className="absolute -inset-4 bg-gold/5 blur-2xl rounded-full group-hover:bg-gold/10 transition-all duration-700" />
                  <div className="relative glass-panel p-6 rounded-[2rem] border border-gold/20 shadow-[0_0_50px_rgba(207,171,103,0.05)]">
                    <img 
                      src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=exp://192.168.0.4:8081&color=cfab67&bgcolor=000000" 
                      alt="Mobile App QR Code"
                      className="w-48 h-48 sm:w-56 sm:h-56 rounded-xl grayscale hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="mt-4 text-center">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-gold">Scan to launch</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}