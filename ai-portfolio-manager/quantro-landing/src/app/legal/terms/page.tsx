import { Reveal } from "@/components/Reveal";

export default function TermsOfService() {
  return (
    <Reveal>
      <div className="prose prose-invert max-w-none">
        <h1 className="font-serifDisplay text-5xl mb-8 text-text">Terms of Service</h1>
        <p className="text-muted mb-8 italic">Last Updated: May 16, 2026</p>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">1. Acceptance of Terms</h2>
          <p className="text-muted leading-relaxed">
            By accessing or using Quantro, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">2. Use License</h2>
          <p className="text-muted leading-relaxed">
            Permission is granted to temporarily download one copy of the materials (information or software) on Quantro&apos;s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul className="list-disc pl-5 text-muted space-y-2 mt-4">
            <li>Modify or copy the materials;</li>
            <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial);</li>
            <li>Attempt to decompile or reverse engineer any software contained on Quantro&apos;s website;</li>
            <li>Remove any copyright or other proprietary notations from the materials; or</li>
            <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">3. Disclaimer</h2>
          <p className="text-muted leading-relaxed">
            The materials on Quantro&apos;s website are provided on an &apos;as is&apos; basis. Quantro makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">4. Limitations</h2>
          <p className="text-muted leading-relaxed">
            In no event shall Quantro or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Quantro&apos;s website, even if Quantro or a Quantro authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">5. Governing Law</h2>
          <p className="text-muted leading-relaxed">
            These terms and conditions are governed by and construed in accordance with the laws of India and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
          </p>
        </section>
      </div>
    </Reveal>
  );
}
