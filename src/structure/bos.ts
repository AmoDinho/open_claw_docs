import type { Candle, StructureBreak, StructureState, SwingPoint, Timeframe } from "../data/types.js";

function findBreakForSwing(
  candles: Candle[],
  swing: SwingPoint,
  minimumDisplacement: number,
): StructureBreak | undefined {
  for (let index = swing.index + 1; index < candles.length; index += 1) {
    const candle = candles[index];

    if (swing.type === "HIGH" && candle.close > swing.price + minimumDisplacement) {
      return {
        direction: "BULLISH",
        brokenSwing: swing,
        breakIndex: index,
        breakDatetime: candle.datetime,
        breakPrice: candle.close,
        displacement: candle.close - swing.price,
      };
    }

    if (swing.type === "LOW" && candle.close < swing.price - minimumDisplacement) {
      return {
        direction: "BEARISH",
        brokenSwing: swing,
        breakIndex: index,
        breakDatetime: candle.datetime,
        breakPrice: candle.close,
        displacement: swing.price - candle.close,
      };
    }
  }

  return undefined;
}

export function collectStructureBreaks(
  candles: Candle[],
  swings: SwingPoint[],
  minimumDisplacement: number,
): StructureBreak[] {
  const breaks = swings
    .map((swing) => findBreakForSwing(candles, swing, minimumDisplacement))
    .filter((value): value is StructureBreak => value !== undefined)
    .sort((left, right) => left.breakIndex - right.breakIndex);

  const deduped: StructureBreak[] = [];
  const seen = new Set<string>();

  for (const item of breaks) {
    const key = `${item.direction}:${item.brokenSwing.index}`;

    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  return deduped;
}

export function buildStructureState(
  timeframe: Timeframe,
  swings: SwingPoint[],
  breaks: StructureBreak[],
): StructureState {
  const recentHighs = swings.filter((swing) => swing.type === "HIGH").slice(-5);
  const recentLows = swings.filter((swing) => swing.type === "LOW").slice(-5);
  const latestBullishBos = [...breaks].reverse().find((item) => item.direction === "BULLISH");
  const latestBearishBos = [...breaks].reverse().find((item) => item.direction === "BEARISH");
  const latestBos = breaks.at(-1);

  return {
    timeframe,
    direction: latestBos?.direction ?? "NEUTRAL",
    swings,
    breaks,
    recentHighs,
    recentLows,
    latestBos,
    latestBullishBos,
    latestBearishBos,
  };
}
