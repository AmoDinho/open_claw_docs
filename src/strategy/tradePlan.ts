import type { Direction, SweepEvent, TimeframeAnalysis, TradePlan } from "../data/types.js";

function calculateRiskReward(entry: number, stopLoss: number, takeProfit: number): number {
  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit - entry);

  if (risk === 0) {
    return 0;
  }

  return reward / risk;
}

export function buildTradePlan(params: {
  bias: Exclude<Direction, "NEUTRAL">;
  currentPrice: number;
  sweep?: SweepEvent;
  m15: TimeframeAnalysis;
  h4: TimeframeAnalysis;
}): TradePlan | undefined {
  const { bias, currentPrice, sweep, m15, h4 } = params;
  const stopBuffer = (m15.atr ?? 0) * 0.05;

  if (bias === "BULLISH") {
    const target = h4.liquidity.externalAbove[0];
    const stopAnchor =
      sweep?.level ?? m15.structure.recentLows.at(-1)?.price ?? h4.dealingRange?.low;

    if (target === undefined || stopAnchor === undefined) {
      return undefined;
    }

    const stopLoss = stopAnchor - stopBuffer;
    const riskReward = calculateRiskReward(currentPrice, stopLoss, target);

    if (stopLoss >= currentPrice || target <= currentPrice) {
      return undefined;
    }

    return {
      entry: currentPrice,
      stopLoss,
      takeProfit: target,
      riskReward,
      partialAt: currentPrice + (currentPrice - stopLoss) * 3,
      breakEvenRule: "Take 50% at 1:3 and move stop to breakeven after secondary bullish BOS.",
    };
  }

  const target = h4.liquidity.externalBelow[0];
  const stopAnchor =
    sweep?.level ?? m15.structure.recentHighs.at(-1)?.price ?? h4.dealingRange?.high;

  if (target === undefined || stopAnchor === undefined) {
    return undefined;
  }

  const stopLoss = stopAnchor + stopBuffer;
  const riskReward = calculateRiskReward(currentPrice, stopLoss, target);

  if (stopLoss <= currentPrice || target >= currentPrice) {
    return undefined;
  }

  return {
    entry: currentPrice,
    stopLoss,
    takeProfit: target,
    riskReward,
    partialAt: currentPrice - (stopLoss - currentPrice) * 3,
    breakEvenRule: "Take 50% at 1:3 and move stop to breakeven after secondary bearish BOS.",
  };
}
