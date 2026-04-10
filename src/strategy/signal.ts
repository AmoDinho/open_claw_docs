import { STRATEGY_CONFIG } from "../config/strategy.js";
import type {
  AnalysisResult,
  ConfirmationState,
  Direction,
  SessionValidation,
  TimeframeAnalysis,
  TradePlan,
  TradeSignal,
} from "../data/types.js";
import { validateSetup } from "./confirm.js";
import { buildTradePlan } from "./tradePlan.js";

function getConfidenceScore(params: {
  bias: Direction;
  session: SessionValidation;
  setup: ReturnType<typeof validateSetup>;
  tradePlan?: TradePlan;
}): number {
  const { bias, session, setup, tradePlan } = params;
  let score = 0;

  if (bias !== "NEUTRAL") score += 25;
  if (setup.poi?.valid) score += 20;
  if (setup.sweep) score += 20;
  if (session.isValid) score += 10;
  if (setup.chochConfirmed) score += 15;
  if (setup.bosConfirmed) score += 10;
  if (tradePlan && tradePlan.riskReward >= STRATEGY_CONFIG.execution.minimumRiskReward) score += 10;

  return Math.min(score, 100);
}

function getConfirmation(session: SessionValidation, setup: ReturnType<typeof validateSetup>): ConfirmationState {
  return {
    sessionValid: session.isValid,
    sweepConfirmed: Boolean(setup.sweep),
    chochConfirmed: setup.chochConfirmed,
    bosConfirmed: setup.bosConfirmed,
    fvgPresent: setup.fvgPresent,
  };
}

function getReasons(params: {
  bias: Direction;
  session: SessionValidation;
  setup: ReturnType<typeof validateSetup>;
  tradePlan?: TradePlan;
  inheritedReasons: string[];
}): string[] {
  const { bias, session, setup, tradePlan, inheritedReasons } = params;
  const reasons = [...inheritedReasons];

  reasons.push(`Session valid: ${session.isValid ? session.activeSessionNames.join(", ") : "no active session"}.`);
  reasons.push(`Higher-timeframe POI selected: ${setup.poi ? `${setup.poi.type} on ${setup.poi.timeframe}` : "none"}.`);
  reasons.push(`POI touched: ${setup.poiTouched}.`);
  reasons.push(`Sweep confirmed: ${Boolean(setup.sweep)}.`);
  reasons.push(`15m ChoCh confirmed: ${setup.chochConfirmed}.`);
  reasons.push(`15m BOS confirmed: ${setup.bosConfirmed}.`);
  reasons.push(`Directional FVG present: ${setup.fvgPresent}.`);

  if (tradePlan) {
    reasons.push(`Projected RR: ${tradePlan.riskReward.toFixed(2)}.`);
  } else {
    reasons.push("Trade plan unavailable from current structure.");
  }

  if (bias === "NEUTRAL") {
    reasons.push("Signal downgraded because higher-timeframe bias is neutral.");
  }

  return reasons;
}

export function generateSignal(params: {
  instrument: string;
  timestamp: string;
  currentPrice: number;
  dailyBias: Direction;
  timeframeAnalyses: Record<"1day" | "4h" | "1h" | "15min", TimeframeAnalysis>;
  session: SessionValidation;
  reasons: string[];
}): AnalysisResult {
  const { instrument, timestamp, currentPrice, dailyBias, timeframeAnalyses, session, reasons } = params;
  const h4 = timeframeAnalyses["4h"];
  const h1 = timeframeAnalyses["1h"];
  const m15 = timeframeAnalyses["15min"];
  const setup = validateSetup({
    bias: dailyBias,
    currentPrice,
    h4,
    h1,
    m15,
  });

  const directionalBias = dailyBias === "NEUTRAL" ? undefined : dailyBias;
  const tradePlan = directionalBias
    ? buildTradePlan({
        bias: directionalBias,
        currentPrice,
        sweep: setup.sweep,
        m15,
        h4,
      })
    : undefined;

  const confirmation = getConfirmation(session, setup);
  const confidence = getConfidenceScore({
    bias: dailyBias,
    session,
    setup,
    tradePlan,
  });

  let signal: TradeSignal = "NO_TRADE";

  if (
    dailyBias === "BULLISH" &&
    setup.poi?.type === "DEMAND" &&
    setup.poi.valid &&
    setup.poiTouched &&
    setup.sweep?.direction === "BULLISH" &&
    session.isValid &&
    (setup.chochConfirmed || setup.bosConfirmed) &&
    tradePlan &&
    tradePlan.riskReward >= STRATEGY_CONFIG.execution.minimumRiskReward &&
    confidence >= STRATEGY_CONFIG.execution.minimumSignalConfidence
  ) {
    signal = "BUY";
  }

  if (
    dailyBias === "BEARISH" &&
    setup.poi?.type === "SUPPLY" &&
    setup.poi.valid &&
    setup.poiTouched &&
    setup.sweep?.direction === "BEARISH" &&
    session.isValid &&
    (setup.chochConfirmed || setup.bosConfirmed) &&
    tradePlan &&
    tradePlan.riskReward >= STRATEGY_CONFIG.execution.minimumRiskReward &&
    confidence >= STRATEGY_CONFIG.execution.minimumSignalConfidence
  ) {
    signal = "SELL";
  }

  return {
    instrument,
    timestamp,
    currentPrice,
    dailyBias,
    signal,
    confidence,
    timeframeAnalyses,
    session,
    confirmation,
    tradePlan: signal === "NO_TRADE" ? undefined : tradePlan,
    reasons: getReasons({
      bias: dailyBias,
      session,
      setup,
      tradePlan,
      inheritedReasons: reasons,
    }),
  };
}
