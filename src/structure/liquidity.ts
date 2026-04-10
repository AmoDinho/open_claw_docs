import type { Candle, DealingRange, LiquidityMap, SwingPoint } from "../data/types.js";

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values.map((value) => Number(value.toFixed(4))))].sort((left, right) => left - right);
}

function splitLevels(values: number[], currentPrice: number): { above: number[]; below: number[] } {
  return {
    above: values.filter((value) => value > currentPrice).sort((left, right) => left - right),
    below: values.filter((value) => value < currentPrice).sort((left, right) => right - left),
  };
}

function findEqualLevels(
  swings: SwingPoint[],
  type: "HIGH" | "LOW",
  tolerance: number,
): number[] {
  const levels = swings.filter((swing) => swing.type === type).map((swing) => swing.price);
  const matches: number[] = [];

  for (let index = 1; index < levels.length; index += 1) {
    const current = levels[index];
    const previous = levels[index - 1];

    if (Math.abs(current - previous) <= tolerance) {
      matches.push((current + previous) / 2);
    }
  }

  return uniqueSorted(matches);
}

export function buildLiquidityMap(params: {
  candles: Candle[];
  swings: SwingPoint[];
  currentPrice: number;
  atr: number | null;
  dealingRange?: DealingRange;
}): LiquidityMap {
  const { candles, swings, currentPrice, atr, dealingRange } = params;
  const recentWindow = candles.slice(-20);
  const recentHigh = recentWindow.length > 0 ? Math.max(...recentWindow.map((candle) => candle.high)) : undefined;
  const recentLow = recentWindow.length > 0 ? Math.min(...recentWindow.map((candle) => candle.low)) : undefined;
  const tolerance = (atr ?? 0) * 0.05;

  const externalLevels = uniqueSorted(
    [
      dealingRange?.high,
      dealingRange?.low,
      recentHigh,
      recentLow,
    ].filter((value): value is number => value !== undefined),
  );

  const internalLevels = uniqueSorted(swings.slice(-10).map((swing) => swing.price));
  const equalHighs = findEqualLevels(swings.slice(-12), "HIGH", tolerance);
  const equalLows = findEqualLevels(swings.slice(-12), "LOW", tolerance);

  const externalSplit = splitLevels(externalLevels, currentPrice);
  const internalSplit = splitLevels([...internalLevels, ...equalHighs, ...equalLows], currentPrice);

  return {
    externalAbove: externalSplit.above,
    externalBelow: externalSplit.below,
    internalAbove: uniqueSorted(internalSplit.above),
    internalBelow: uniqueSorted(internalSplit.below),
    equalHighs,
    equalLows,
  };
}
