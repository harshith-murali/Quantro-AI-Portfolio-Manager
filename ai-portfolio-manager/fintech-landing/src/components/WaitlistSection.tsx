"use client";
import { useState } from "react";
import { Reveal } from "./Reveal";

export function WaitlistSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setStatus("loading");

    // Simulate API call (replace with real endpoint)
    await new Promise((r) => setTimeout(r, 900));
    setStatus("success");
    setEmail("");
  };

  return (
    <section id="waitlist" className="relative px-5 py-28 sm:px-8 bg-[#060606] border-y border-white/5 overflow-hidden">
      {/* Background Grid Pattern */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: '120px 120px'
        }}
      />
      
      {/* Edge Vignette */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ background: 'radial-gradient(circle at center, transparent 15%, #060606 95%)' }}
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <Reveal>
          <div className="text-center mb-12">
            <div className="mb-4 text-[11px] uppercase tracking-[0.34em] text-gold">
              Early Access
            </div>
            <h2 className="font-serifDisplay text-5xl sm:text-6xl text-text mb-4 leading-tight">
              Be first.
              <br />
              <span className="text-gold">Get the edge.</span>
            </h2>
            <p className="text-muted text-lg max-w-md mx-auto">
              Join the waitlist and get early access to AI-powered signals, backtesting, and portfolio intelligence before anyone else.
            </p>
          </div>

          {status === "success" ? (
            <div className="glass-panel rounded-3xl p-10 text-center border border-gold/20">
              <div className="text-5xl mb-4">✓</div>
              <p className="text-gold font-semibold text-xl mb-2">You&apos;re on the list.</p>
              <p className="text-muted text-sm">We&apos;ll reach out when early access opens. Watch your inbox.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-8 border border-white/5">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="flex-1 rounded-full bg-white/5 border border-white/10 px-6 py-3.5 text-sm text-text placeholder-white/20 focus:outline-none focus:border-gold/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-full bg-gold px-8 py-3.5 text-sm font-bold text-[#060606] transition hover:bg-[#e8c97a] hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(207,171,103,0.4)] disabled:opacity-50"
                >
                  {status === "loading" ? "Joining..." : "Join Waitlist →"}
                </button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 text-xs text-white/30">
                <span>✓ No spam, ever</span>
                <span>✓ Early access priority</span>
                <span>✓ Free forever tier</span>
              </div>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
