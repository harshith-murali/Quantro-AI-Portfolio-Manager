export function FeatureCard({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <article className="glass-panel group rounded-[30px] p-7 transition duration-500 hover:-translate-y-1.5 hover:border-[rgba(207,171,103,0.25)] hover:shadow-[0_24px_60px_rgba(0,0,0,0.45),0_0_40px_rgba(207,171,103,0.08)]">
      <div className="mb-8 flex items-center justify-between">
        <div className="gold-line h-px w-14" />
        <div className="text-lg text-gold/70 transition group-hover:text-gold">{icon}</div>
      </div>
      <h3 className="font-serifDisplay text-3xl tracking-[-0.03em] text-text">{title}</h3>
      <p className="mt-4 text-sm leading-7 text-muted">{description}</p>
    </article>
  );
}