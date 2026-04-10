import "dotenv/config";
import { XAUUSD_CONFIG } from "./config/instruments.js";
import { STRATEGY_CONFIG } from "./config/strategy.js";
import { fetchCandles, fetchQuote } from "./data/twelvedata.js";
import type { AnalysisResult, Timeframe, TimeframeAnalysis } from "./data/types.js";
import { computeAtr } from "./indicators/atr.js";
import { findFairValueGaps } from "./indicators/fvg.js";
import { findSwingPoints } from "./indicators/swings.js";
import { writeAnalysisArtifacts } from "./logging/backtest.js";
import { formatAnalysisReport } from "./report/format.js";
import { formatOpenClawReport } from "./report/openclaw.js";
import { assessDailyBias } from "./strategy/bias.js";
import { validateSession } from "./strategy/session.js";
import { generateSignal } from "./strategy/signal.js";
import { buildStructureState, collectStructureBreaks } from "./structure/bos.js";
import { detectLatestChoch } from "./structure/choch.js";
import { buildLiquidityMap } from "./structure/liquidity.js";
import { findPointOfInterest } from "./structure/poi.js";
import { deriveDealingRange } from "./structure/range.js";

function getSymbolFromCli(): string {
  return process.argv[2] ?? XAUUSD_CONFIG.symbol;
}

function shouldPrintJson(): boolean {
  return process.argv.includes("--json");
}

function detectLatestSweep(params: {
  currentPrice: number;
  candles: Awaited<ReturnType<typeof fetchCandles>>;
  analysis: Omit<TimeframeAnalysis, "latestSweep">;
}): TimeframeAnalysis["latestSweep"] {
  const { currentPrice, candles, analysis } = params;
  const latestCandle = candles.at(-1);

  if (!latestCandle) {
    return undefined;
  }

  for (const level of analysis.liquidity.externalBelow) {
    if (latestCandle.low < level && latestCandle.close > level) {
      return {
        direction: "BULLISH",
        liquidityType: "EXTERNAL",
        level,
        candleIndex: candles.length - 1,
        candleDatetime: latestCandle.datetime,
        rejectionClose: latestCandle.close,
      };
    }
  }

  for (const level of analysis.liquidity.internalBelow) {
    if (latestCandle.low < level && latestCandle.close > level) {
      return {
        direction: "BULLISH",
        liquidityType: "INTERNAL",
        level,
        candleIndex: candles.length - 1,
        candleDatetime: latestCandle.datetime,
        rejectionClose: latestCandle.close,
      };
    }
  }

  for (const level of analysis.liquidity.externalAbove) {
    if (latestCandle.high > level && latestCandle.close < level) {
      return {
        direction: "BEARISH",
        liquidityType: "EXTERNAL",
        level,
        candleIndex: candles.length - 1,
        candleDatetime: latestCandle.datetime,
        rejectionClose: latestCandle.close,
      };
    }
  }

  for (const level of analysis.liquidity.internalAbove) {
    if (latestCandle.high > level && latestCandle.close < level) {
      return {
        direction: "BEARISH",
        liquidityType: "INTERNAL",
        level,
        candleIndex: candles.length - 1,
        candleDatetime: latestCandle.datetime,
        rejectionClose: latestCandle.close,
      };
    }
  }

  if (analysis.pointOfInterest) {
    if (
      analysis.pointOfInterest.type === "DEMAND" &&
      latestCandle.low <= analysis.pointOfInterest.low &&
      currentPrice >= analysis.pointOfInterest.low
    ) {
      return {
        direction: "BULLISH",
        liquidityType: "INTERNAL",
        level: analysis.pointOfInterest.low,
        candleIndex: candles.length - 1,
        candleDatetime: latestCandle.datetime,
        rejectionClose: latestCandle.close,
      };
    }

    if (
      analysis.pointOfInterest.type === "SUPPLY" &&
      latestCandle.high >= analysis.pointOfInterest.high &&
      currentPrice <= analysis.pointOfInterest.high
    ) {
      return {
        direction: "BEARISH",
        liquidityType: "INTERNAL",
        level: analysis.pointOfInterest.high,
        candleIndex: candles.length - 1,
        candleDatetime: latestCandle.datetime,
        rejectionClose: latestCandle.close,
      };
    }
  }

  return undefined;
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
  const minimumGapSize = (atr ?? 0) * STRATEGY_CONFIG.imbalance.minimumFvgAtrMultiple;
  const breaks = collectStructureBreaks(candles, swings, minimumDisplacement);
  const structure = buildStructureState(timeframe, swings, breaks);
  structure.latestChoch = detectLatestChoch(breaks);

  const fairValueGaps = findFairValueGaps(candles, minimumGapSize);
  const activeFvgs = fairValueGaps.filter((gap) => !gap.mitigated);
  const dealingRange = deriveDealingRange(candles, swings, structure.latestBos, currentPrice);
  const liquidity = buildLiquidityMap({
    candles,
    swings,
    currentPrice,
    atr,
    dealingRange,
  });
  const pointOfInterest = findPointOfInterest({
    timeframe,
    candles,
    latestBos: structure.latestBos,
    activeFvgs,
  });

  const analysisWithoutSweep = {
    timeframe,
    atr,
    structure,
    dealingRange,
    liquidity,
    fairValueGaps,
    activeFvgs,
    pointOfInterest,
  };

  const latestSweep = detectLatestSweep({
    currentPrice,
    candles,
    analysis: analysisWithoutSweep,
  });

  return {
    ...analysisWithoutSweep,
    latestSweep,
  };
}

async function runAnalysis(symbol: string): Promise<AnalysisResult> {
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
  const session = validateSession(new Date());

  return generateSignal({
    instrument: symbol,
    timestamp: new Date().toISOString(),
    currentPrice,
    dailyBias: biasAssessment.bias,
    timeframeAnalyses: timeframeAnalyses as Record<"1day" | "4h" | "1h" | "15min", TimeframeAnalysis>,
    session,
    reasons: biasAssessment.reasons,
  });
}

async function main(): Promise<void> {
  const symbol = getSymbolFromCli();
  const result = await runAnalysis(symbol);
  const artifacts = await writeAnalysisArtifacts(result);

  console.log(formatOpenClawReport(result));
  console.log("");
  console.log("Artifacts:");
  console.log(`- Latest snapshot: ${artifacts.latestJsonPath}`);
  console.log(`- JSONL log: ${artifacts.jsonlPath}`);
  console.log(`- CSV log: ${artifacts.csvPath}`);

  if (shouldPrintJson()) {
    console.log("");
    console.log(formatAnalysisReport(result));
    console.log("");
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Analysis failed: ${message}`);
});
