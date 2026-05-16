"use client";
import { HeroVisual } from '@/components/HeroVisual';
import { Reveal } from '@/components/Reveal';
import { FeatureShowcase } from '@/components/FeatureShowcase';
import { InteractiveLogoGridSection } from '@/components/InteractiveLogoGridSection';
import { WaitlistSection } from '@/components/WaitlistSection';
import { Footer } from '@/components/Footer';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import Link from 'next/link';

export default function Page() {
  const accessToken = useAuth();

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
                {accessToken ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-full border border-[rgba(207,171,103,0.35)] bg-[rgba(207,171,103,0.10)] px-7 py-4 text-sm uppercase tracking-[0.24em] text-text transition hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(207,171,103,0.12)]"
                  >
                    Open App <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/auth/register"
                      className="inline-flex items-center justify-center rounded-full border border-[rgba(207,171,103,0.35)] bg-[rgba(207,171,103,0.10)] px-7 py-4 text-sm uppercase tracking-[0.24em] text-text transition hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(207,171,103,0.12)]"
                    >
                      Get Started
                    </Link>
                    <Link
                      href="/auth/login"
                      className="inline-flex items-center justify-center rounded-full border border-white/10 px-7 py-4 text-sm uppercase tracking-[0.24em] text-muted transition hover:-translate-y-0.5 hover:border-gold/20 hover:text-text"
                    >
                      Sign In <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </>
                )}
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
              <h2 className="font-serifDisplay text-4xl sm:text-5xl text-text mb-6 text-center">
                Integrated with Indian markets
              </h2>
              <p className="text-muted max-w-lg mx-auto mb-8 text-lg text-center">
                Seamlessly monitor intelligence and real-time signals across the Nifty 50.
              </p>
              <button className="px-6 py-3 bg-[rgba(207,171,103,0.1)] border border-gold/30 text-gold rounded-full hover:bg-[rgba(207,171,103,0.2)] transition-colors">
                View Supported Integrations <ArrowRight className="inline-block ml-2 w-4 h-4" />
              </button>
            </div>
          </Reveal>
        </InteractiveLogoGridSection>


        {/* ============ WAITLIST ============ */}
        {!accessToken && <WaitlistSection />}

      </main>
      <Footer />
    </>
  );
}