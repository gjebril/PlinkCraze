/** Decorative menu preview: a slider with win/loss zones and a result marker. */
export default function DiceThumbnail() {
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      <rect x="20" y="63" width="90" height="14" rx="7" fill="#F2256E" />
      <rect x="110" y="63" width="70" height="14" rx="7" fill="#00E701" />
      <rect x="106" y="52" width="8" height="36" rx="3" fill="#FFFFFF" />
      <circle cx="150" cy="70" r="9" fill="#FFD400" />
    </svg>
  );
}
