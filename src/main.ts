import { XAUUSD_CONFIG } from "./config/instruments.js";
import { STRATEGY_CONFIG } from "./config/strategy.js";
import { fetchCandles, fetchQuote } from "./data/twelvedata.js";
import type {
  PhaseOneAnalysisResult,
  Timeframe,
  TimeframeAnalysis,
} from "./data/types.js";
import { computeAtr } from "./indicators/atr.js";
import { findSwingPoints } from "./indicators/swings.js";
import { formatPhaseOneReport } from "./report/format.js";
import { assessDailyBias } from "./strategy/bias.js";
import { collectStructureBreaks, buildStructureState } from "./structure/bos.js";
import { detectLatestChoch } from "./structure/choch.js";
import { buildLiquidityMap } from "./structure/liquidity.js";
import { deriveDealingRange } from "./structure/range.js";

function getSymbolFromCli(): string {
  return process.argv[2] ?? XAUUSD_CONFIG.symbol;
}

function analyzeTimeframe(
  timeframe: Timeframe,
  candles: Awaited<ReturnType<typeof fetchCandles>>,
  currentPrice: number,
): TimeframeAnalysis {
  const atr = computeAtr(candles, STRATEGY_CONFIG.indicators.atrPeriod);
  const swingStrength = STRATEGY_CONFIG.structure.swingStrengthByTimeframe[timeframe];
  const swings = findSwingPoints(candles, swingStrength);
  const minimumDisplacement = (atr ?? 0) * STRATEGY_CONFIG.structure.bosDisplacementAtrMultiple;
  const breaks = collectStructureBreaks(candles, swings, minimumDisplacement);
  const structure = buildStructureState(timeframe, swings, breaks);
  structure.latestChoch = detectLatestChoch(breaks);

  const dealingRange = deriveDealingRange(candles, swings, structure.latestBos, currentPrice);
  const liquidity = buildLiquidityMap({
    candles,
    swings,
    currentPrice,
    atr,
    dealingRange,
  });

  return {
    timeframe,
    atr,
    structure,
    dealingRange,
    liquidity,
  };
}

async function runPhaseOneAnalysis(symbol: string): Promise<PhaseOneAnalysisResult> {
  const timeframes = XAUUSD_CONFIG.timeframes;
  const [currentPrice, ...candlesByTimeframe] = await Promise.all([
    fetchQuote(symbol),
    ...timeframes.map((timeframe) => fetchCandles(symbol, timeframe)),
  ]);

  const timeframeAnalyses = Object.fromEntries(
    timeframes.map((timeframe, index) => [
      timeframe,
      analyzeTimeframe(timeframe, candlesByTimeframe[index], currentPrice),
    ]),
  ) as Record<Timeframe, TimeframeAnalysis>;

  const biasAssessment = assessDailyBias(timeframeAnalyses["1day"], timeframeAnalyses["4h"]);

  return {
    instrument: symbol,
    timestamp: new Date().toISOString(),
    currentPrice,
    dailyBias: biasAssessment.bias,
    timeframeAnalyses,
    reasons: biasAssessment.reasons,
  };
}

async function main(): Promise<void> {
  const symbol = getSymbolFromCli();
  const result = await runPhaseOneAnalysis(symbol);
  console.log(formatPhaseOneReport(result));
  console.log("");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Phase 1 analysis failed: ${message}`);
});
