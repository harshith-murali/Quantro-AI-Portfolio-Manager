import { Reveal } from "@/components/Reveal";

export default function PrivacyPolicy() {
  return (
    <Reveal>
      <div className="prose prose-invert max-w-none">
        <h1 className="font-serifDisplay text-5xl mb-8 text-text">Privacy Policy</h1>
        <p className="text-muted mb-8 italic">Last Updated: May 16, 2026</p>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">1. Information We Collect</h2>
          <p className="text-muted leading-relaxed">
            Quantro collects information to provide better services to our users. We collect information in the following ways:
          </p>
          <ul className="list-disc pl-5 text-muted space-y-2 mt-4">
            <li><strong>Information you give us:</strong> When you register for an account, we ask for personal information like your name, email address, and financial preferences.</li>
            <li><strong>Information we get from your use of our services:</strong> We collect information about the services that you use and how you use them, like when you view signals or interact with your portfolio.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">2. How We Use Information</h2>
          <p className="text-muted leading-relaxed">
            We use the information we collect from all of our services to provide, maintain, protect and improve them, to develop new ones, and to protect Quantro and our users. We also use this information to offer you tailored content – like giving you more relevant investment signals.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">3. Information Security</h2>
          <p className="text-muted leading-relaxed">
            We work hard to protect Quantro and our users from unauthorized access to or unauthorized alteration, disclosure or destruction of information we hold. In particular:
          </p>
          <ul className="list-disc pl-5 text-muted space-y-2 mt-4">
            <li>We encrypt many of our services using SSL.</li>
            <li>We review our information collection, storage and processing practices, including physical security measures, to guard against unauthorized access to systems.</li>
            <li>We restrict access to personal information to Quantro employees, contractors and agents who need to know that information in order to process it for us.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-gold text-xl uppercase tracking-wider mb-4">4. Contact Us</h2>
          <p className="text-muted leading-relaxed">
            If you have any questions about this Privacy Policy, please contact us at:<br />
            <strong>Email:</strong> mharshith200@gmail.com<br />
            <strong>Phone:</strong> +91 72046 21805
          </p>
        </section>
      </div>
    </Reveal>
  );
}
