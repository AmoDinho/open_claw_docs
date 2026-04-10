import type { Timeframe } from "../data/types.js";

export const STRATEGY_CONFIG = {
  api: {
    baseUrl: "https://api.twelvedata.com",
    outputSizeByTimeframe: {
      "15min": 300,
      "1h": 300,
      "4h": 250,
      "1day": 250,
    } satisfies Record<Timeframe, number>,
  },
  indicators: {
    atrPeriod: 14,
  },
  structure: {
    bosDisplacementAtrMultiple: 0.1,
    equalLevelAtrTolerance: 0.05,
    swingStrengthByTimeframe: {
      "15min": 2,
      "1h": 3,
      "4h": 3,
      "1day": 4,
    } satisfies Record<Timeframe, number>,
  },
  bias: {
    bullishRangeCeiling: 0.6,
    bearishRangeFloor: 0.4,
  },
};
