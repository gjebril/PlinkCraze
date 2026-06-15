/** Decorative menu preview: peg pyramid, a pink ball, and colored bins. */
export default function PlinkoThumbnail() {
  const pegs = [];
  const rows = 5;
  for (let r = 0; r < rows; r++) {
    const count = r + 3;
    const y = 18 + r * 20;
    for (let c = 0; c < count; c++) {
      const x = 100 - (count - 1) * 11 + c * 22;
      pegs.push(<circle key={`${r}-${c}`} cx={x} cy={y} r={3} fill="#9CA3AB" />);
    }
  }
  const bins = ['#A50D3F', '#F2256E', '#FFAA3C', '#FAFFC8', '#FFAA3C', '#F2256E', '#A50D3F'];
  return (
    <svg viewBox="0 0 200 140" className="h-full w-full">
      {pegs}
      <circle cx="111" cy="38" r="5" fill="#FF2D7E" />
      {bins.map((c, i) => (
        <rect key={i} x={14 + i * 26} y={120} width={22} height={14} rx={3} fill={c} />
      ))}
    </svg>
  );
}
