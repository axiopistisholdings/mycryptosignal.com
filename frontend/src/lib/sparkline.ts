// Build-time sparkline renderer.
//
// Pure and deterministic: a chronological series of closes in, an inline SVG
// string out. Values are the real closes from the engine's candles endpoint —
// nothing is invented. If there are fewer than two points we emit nothing and
// the caller renders an empty cell of the same size (never a broken box).

export const SPARK_W = 72;
export const SPARK_H = 20;

/** Inline SVG polyline for a chronological series of closes, or '' if < 2 points. */
export function sparklineSvg(closes: number[]): string {
  const pts = closes.filter((n) => Number.isFinite(n));
  if (pts.length < 2) return '';

  let min = pts[0];
  let max = pts[0];
  let sum = 0;
  for (const v of pts) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const span = max - min;
  const mean = Math.abs(sum / pts.length) || 1;

  // A flat series must read as flat. Amplifying a stablecoin's sub-0.1% wobble to
  // full height produced a dramatic-looking square wave — visually wrong and
  // misleading. Below the threshold we draw an honest horizontal line instead.
  const FLAT = 0.002; // 0.2% of the mean
  if (span / mean < FLAT) {
    const y = SPARK_H / 2;
    return (
      `<svg class="spark spark-neutral" width="${SPARK_W}" height="${SPARK_H}" ` +
      `viewBox="0 0 ${SPARK_W} ${SPARK_H}" aria-hidden="true" focusable="false">` +
      `<polyline points="0,${y} ${SPARK_W},${y}" fill="none" stroke="currentColor" ` +
      `stroke-width="1.5" stroke-linecap="round" /></svg>`
    );
  }

  const stepX = SPARK_W / (pts.length - 1);
  const pad = 2;
  const usable = SPARK_H - pad * 2;
  const points = pts
    .map((v, i) => {
      const x = Math.round(i * stepX * 100) / 100;
      const y = Math.round((pad + (1 - (v - min) / span) * usable) * 100) / 100;
      return `${x},${y}`;
    })
    .join(' ');

  const first = pts[0];
  const last = pts[pts.length - 1];
  const tone = last > first ? 'rising' : last < first ? 'falling' : 'neutral';

  return (
    `<svg class="spark spark-${tone}" width="${SPARK_W}" height="${SPARK_H}" ` +
    `viewBox="0 0 ${SPARK_W} ${SPARK_H}" aria-hidden="true" focusable="false">` +
    `<polyline points="${points}" fill="none" stroke="currentColor" stroke-width="1.5" ` +
    `stroke-linejoin="round" stroke-linecap="round" /></svg>`
  );
}

/** A fixed-size slot holding either the sparkline SVG or nothing (graceful degradation). */
export function sparkSlot(closes: number[] | null | undefined): string {
  const svg = closes && closes.length ? sparklineSvg(closes) : '';
  return `<span class="spark-slot">${svg}</span>`;
}
