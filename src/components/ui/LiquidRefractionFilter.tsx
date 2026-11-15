export function LiquidRefractionFilter() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none fixed h-0 w-0 opacity-0"
      width="0"
      height="0"
    >
      <defs>
        <filter id="ideonix-liquid-refraction" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012 0.018"
            numOctaves="2"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
