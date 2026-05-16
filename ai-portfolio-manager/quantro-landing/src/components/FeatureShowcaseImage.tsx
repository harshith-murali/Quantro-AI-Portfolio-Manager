import Image from "next/image";

type FeatureShowcaseImageProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

export default function FeatureShowcaseImage({
  src,
  alt,
  className = "",
  priority = false,
}: FeatureShowcaseImageProps) {
  return (
    <div
      className={`relative w-[92vw] max-w-[720px] aspect-[1.2/1] md:aspect-[1.35/1] ${className}`}
    >
      <div className="absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(201,168,76,0.14),transparent_65%)] blur-3xl scale-110" />

      <div
        className="
          relative h-full w-full overflow-hidden rounded-[2rem]
          border border-white/4 bg-black/20
          shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_100px_rgba(0,0,0,0.55)]
        "
        style={{
          WebkitMaskImage:
            "radial-gradient(circle at center, black 52%, rgba(0,0,0,0.88) 68%, rgba(0,0,0,0.28) 82%, transparent 100%)",
          maskImage:
            "radial-gradient(circle at center, black 52%, rgba(0,0,0,0.88) 68%, rgba(0,0,0,0.28) 82%, transparent 100%)",
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover object-top scale-[1.05]"
          priority={priority}
        />
      </div>
    </div>
  );
}
