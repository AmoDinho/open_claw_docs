import type {
  Direction,
  PointOfInterest,
  SweepEvent,
  TimeframeAnalysis,
} from "../data/types.js";

export interface SetupValidation {
  poi?: PointOfInterest;
  sweep?: SweepEvent;
  poiTouched: boolean;
  chochConfirmed: boolean;
  bosConfirmed: boolean;
  fvgPresent: boolean;
}

function candleTouchesPoi(
  currentPrice: number,
  poi: PointOfInterest | undefined,
  atr: number | null,
): boolean {
  if (!poi) {
    return false;
  }

  const buffer = (atr ?? 0) * 0.05;
  return currentPrice >= poi.low - buffer && currentPrice <= poi.high + buffer;
}

function pickHigherTimeframePoi(
  bias: Direction,
  h4: TimeframeAnalysis,
  h1: TimeframeAnalysis,
): PointOfInterest | undefined {
  const candidates = [h4.pointOfInterest, h1.pointOfInterest].filter(
    (poi): poi is PointOfInterest => poi !== undefined && poi.valid,
  );

  if (bias === "BULLISH") {
    return candidates.find((poi) => poi.type === "DEMAND");
  }

  if (bias === "BEARISH") {
    return candidates.find((poi) => poi.type === "SUPPLY");
  }

  return undefined;
}

export function validateSetup(params: {
  bias: Direction;
  currentPrice: number;
  h4: TimeframeAnalysis;
  h1: TimeframeAnalysis;
  m15: TimeframeAnalysis;
}): SetupValidation {
  const { bias, currentPrice, h4, h1, m15 } = params;
  const poi = pickHigherTimeframePoi(bias, h4, h1);
  const poiTouched = candleTouchesPoi(currentPrice, poi, m15.atr);
  const sweep = m15.latestSweep;
  const chochConfirmed = m15.structure.latestChoch?.direction === bias;
  const bosConfirmed = m15.structure.latestBos?.direction === bias;
  const fvgPresent =
    bias === "BULLISH"
      ? m15.activeFvgs.some((gap) => gap.direction === "BULLISH")
      : bias === "BEARISH"
        ? m15.activeFvgs.some((gap) => gap.direction === "BEARISH")
        : false;

  return {
    poi,
    sweep,
    poiTouched,
    chochConfirmed,
    bosConfirmed,
    fvgPresent,
  };
}
