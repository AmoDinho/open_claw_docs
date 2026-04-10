import type { Candle, FairValueGap, PointOfInterest, StructureBreak, Timeframe } from "../data/types.js";

function isBullishCandle(candle: Candle): boolean {
  return candle.close > candle.open;
}

function isBearishCandle(candle: Candle): boolean {
  return candle.close < candle.open;
}

export function findPointOfInterest(params: {
  timeframe: Timeframe;
  candles: Candle[];
  latestBos?: StructureBreak;
  activeFvgs: FairValueGap[];
}): PointOfInterest | undefined {
  const { timeframe, candles, latestBos, activeFvgs } = params;

  if (!latestBos || latestBos.breakIndex <= 0) {
    return undefined;
  }

  const linkedFvg = [...activeFvgs]
    .reverse()
    .find((gap) => gap.direction === latestBos.direction && gap.startIndex <= latestBos.breakIndex);

  for (let index = latestBos.breakIndex - 1; index >= 0; index -= 1) {
    const candle = candles[index];

    if (latestBos.direction === "BULLISH" && isBearishCandle(candle)) {
      return {
        type: "DEMAND",
        timeframe,
        low: candle.low,
        high: candle.open,
        originIndex: index,
        originDatetime: candle.datetime,
        breakIndex: latestBos.breakIndex,
        breakDatetime: latestBos.breakDatetime,
        valid: Boolean(linkedFvg),
        reason: linkedFvg
          ? "Last opposing candle before bullish displacement with linked FVG."
          : "Opposing candle found, but linked displacement FVG is missing.",
      };
    }

    if (latestBos.direction === "BEARISH" && isBullishCandle(candle)) {
      return {
        type: "SUPPLY",
        timeframe,
        low: candle.open,
        high: candle.high,
        originIndex: index,
        originDatetime: candle.datetime,
        breakIndex: latestBos.breakIndex,
        breakDatetime: latestBos.breakDatetime,
        valid: Boolean(linkedFvg),
        reason: linkedFvg
          ? "Last opposing candle before bearish displacement with linked FVG."
          : "Opposing candle found, but linked displacement FVG is missing.",
      };
    }
  }

  return undefined;
}
