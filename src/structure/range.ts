import type { Candle, DealingRange, StructureBreak, SwingPoint } from "../data/types.js";

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function findProtectedSwing(swings: SwingPoint[], breakEvent: StructureBreak): SwingPoint | undefined {
  const targetType = breakEvent.direction === "BULLISH" ? "LOW" : "HIGH";

  return [...swings]
    .reverse()
    .find((swing) => swing.type === targetType && swing.index < breakEvent.breakIndex);
}

export function deriveDealingRange(
  candles: Candle[],
  swings: SwingPoint[],
  latestBos: StructureBreak | undefined,
  currentPrice: number,
): DealingRange | undefined {
  if (!latestBos) {
    return undefined;
  }

  const protectedSwing = findProtectedSwing(swings, latestBos);

  if (!protectedSwing) {
    return undefined;
  }

  const leg = candles.slice(latestBos.breakIndex);

  if (leg.length === 0) {
    return undefined;
  }

  if (latestBos.direction === "BULLISH") {
    const high = Math.max(...leg.map((candle) => candle.high));
    const low = protectedSwing.price;
    const denominator = high - low;
    const rangePosition = denominator > 0 ? clamp((currentPrice - low) / denominator, 0, 1) : null;

    return {
      high,
      low,
      sourceDirection: "BULLISH",
      rangePosition,
    };
  }

  const high = protectedSwing.price;
  const low = Math.min(...leg.map((candle) => candle.low));
  const denominator = high - low;
  const rangePosition = denominator > 0 ? clamp((currentPrice - low) / denominator, 0, 1) : null;

  return {
    high,
    low,
    sourceDirection: "BEARISH",
    rangePosition,
  };
}
