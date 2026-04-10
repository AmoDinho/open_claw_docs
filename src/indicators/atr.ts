import type { Candle } from "../data/types.js";

function trueRange(current: Candle, previous: Candle): number {
  return Math.max(
    current.high - current.low,
    Math.abs(current.high - previous.close),
    Math.abs(current.low - previous.close),
  );
}

export function computeAtr(candles: Candle[], period = 14): number | null {
  if (candles.length < period + 1) {
    return null;
  }

  const ranges: number[] = [];

  for (let index = 1; index < candles.length; index += 1) {
    ranges.push(trueRange(candles[index], candles[index - 1]));
  }

  if (ranges.length < period) {
    return null;
  }

  const latestRanges = ranges.slice(-period);
  const total = latestRanges.reduce((sum, value) => sum + value, 0);

  return total / latestRanges.length;
}
