import type { Candle, FairValueGap } from "../data/types.js";

export function findFairValueGaps(
  candles: Candle[],
  minimumGapSize: number,
): FairValueGap[] {
  const gaps: FairValueGap[] = [];

  for (let index = 1; index < candles.length - 1; index += 1) {
    const previous = candles[index - 1];
    const next = candles[index + 1];

    if (previous.high < next.low) {
      const low = previous.high;
      const high = next.low;
      const gapSize = high - low;

      if (gapSize >= minimumGapSize) {
        gaps.push({
          direction: "BULLISH",
          low,
          high,
          startIndex: index - 1,
          endIndex: index + 1,
          createdAt: candles[index].datetime,
          mitigated: candles.slice(index + 2).some((candle) => candle.low <= high && candle.high >= low),
          gapSize,
        });
      }
    }

    if (previous.low > next.high) {
      const low = next.high;
      const high = previous.low;
      const gapSize = high - low;

      if (gapSize >= minimumGapSize) {
        gaps.push({
          direction: "BEARISH",
          low,
          high,
          startIndex: index - 1,
          endIndex: index + 1,
          createdAt: candles[index].datetime,
          mitigated: candles.slice(index + 2).some((candle) => candle.low <= high && candle.high >= low),
          gapSize,
        });
      }
    }
  }

  return gaps;
}
