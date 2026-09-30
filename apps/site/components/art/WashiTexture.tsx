/**
 * Paper grain over the whole page. Kept at 4% so it reads as texture rather
 * than noise, and it never sits above interactive content.
 */
export function WashiTexture() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]">
      <svg className="h-full w-full" focusable="false" role="presentation">
        <filter id="washi-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={3} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#washi-grain)" />
      </svg>
    </div>
  );
}
