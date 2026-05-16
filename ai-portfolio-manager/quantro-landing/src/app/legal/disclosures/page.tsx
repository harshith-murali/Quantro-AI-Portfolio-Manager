import { Reveal } from "@/components/Reveal";

export default function Disclosures() {
  return (
    <Reveal>
      <div className="prose prose-invert max-w-none">
        <h1 className="font-serifDisplay text-5xl mb-8 text-text">Disclosures</h1>
        <p className="text-muted mb-8 italic">Last Updated: May 16, 2026</p>

        <section className="mb-12 border-l-2 border-gold pl-6 py-2 bg-gold/5">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4 font-bold">Important Investment Warning</h2>
          <p className="text-text leading-relaxed font-medium">
            Investment in securities market are subject to market risks. Read all the related documents carefully before investing.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">1. No Investment Advice</h2>
          <p className="text-muted leading-relaxed">
            The content on Quantro is for informational purposes only and does not constitute financial, investment, legal, or tax advice. You should not treat any information on this site as a call to make a particular investment or follow a particular strategy.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">2. Performance Disclosures</h2>
          <p className="text-muted leading-relaxed">
            Past performance is not indicative of future results. Any historical returns, expected returns, or probability projections may not reflect actual future performance. All investments involve risk and may result in partial or total loss.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">3. AI & Algorithm Disclosure</h2>
          <p className="text-muted leading-relaxed">
            Quantro utilizes artificial intelligence and quantitative algorithms to generate signals and insights. These models are based on historical data and mathematical assumptions that may fail under certain market conditions. Users should understand that automated signals are tools for analysis and not guaranteed predictors of market movement.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">4. Brokerage & Execution</h2>
          <p className="text-muted leading-relaxed">
            Quantro is a portfolio intelligence platform and does not execute trades directly. Any execution of trades based on Quantro signals must be done through your registered broker. Quantro is not responsible for any execution errors or brokerage-related issues.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">5. SEBI Registration</h2>
          <p className="text-muted leading-relaxed">
            Quantro is a technology platform. Users should verify the registration status of any investment advisors or research analysts they choose to follow through the platform.
          </p>
        </section>
      </div>
    </Reveal>
  );
}
