import { STRATEGY_CONFIG } from "../config/strategy.js";
import type { Direction, TimeframeAnalysis } from "../data/types.js";

export interface BiasAssessment {
  bias: Direction;
  reasons: string[];
}

function describeRangePosition(label: string, analysis: TimeframeAnalysis): string | undefined {
  const rangePosition = analysis.dealingRange?.rangePosition;

  if (rangePosition === null || rangePosition === undefined) {
    return undefined;
  }

  return `${label} range position=${rangePosition.toFixed(2)}`;
}

export function assessDailyBias(
  daily: TimeframeAnalysis,
  h4: TimeframeAnalysis,
): BiasAssessment {
  const reasons: string[] = [];
  const dailyDirection = daily.structure.direction;
  const h4Direction = h4.structure.direction;
  const dailyRange = daily.dealingRange?.rangePosition;
  const bullishThreshold = STRATEGY_CONFIG.bias.bullishRangeCeiling;
  const bearishThreshold = STRATEGY_CONFIG.bias.bearishRangeFloor;

  const dailyRangeReason = describeRangePosition("Daily", daily);

  if (dailyRangeReason) {
    reasons.push(dailyRangeReason);
  }

  const h4RangeReason = describeRangePosition("H4", h4);

  if (h4RangeReason) {
    reasons.push(h4RangeReason);
  }

  if (dailyDirection === "BULLISH" && h4Direction === "BULLISH") {
    if (dailyRange === undefined || dailyRange === null || dailyRange <= bullishThreshold) {
      reasons.push("Daily and H4 structure are aligned bullish.");
      return { bias: "BULLISH", reasons };
    }

    reasons.push("Bullish structure exists, but price is stretched high in the daily range.");
    return { bias: "NEUTRAL", reasons };
  }

  if (dailyDirection === "BEARISH" && h4Direction === "BEARISH") {
    if (dailyRange === undefined || dailyRange === null || dailyRange >= bearishThreshold) {
      reasons.push("Daily and H4 structure are aligned bearish.");
      return { bias: "BEARISH", reasons };
    }

    reasons.push("Bearish structure exists, but price is too low in the daily range to press shorts.");
    return { bias: "NEUTRAL", reasons };
  }

  if (dailyDirection === h4Direction && dailyDirection !== "NEUTRAL") {
    reasons.push("Higher-timeframe structure is directional but range position is unclear.");
    return { bias: dailyDirection, reasons };
  }

  if (dailyDirection !== "NEUTRAL" && h4Direction === "NEUTRAL") {
    reasons.push("Daily structure is directional while H4 is still consolidating.");
    return { bias: dailyDirection, reasons };
  }

  reasons.push("Daily and H4 structure conflict, so bias remains neutral.");
  return { bias: "NEUTRAL", reasons };
}
