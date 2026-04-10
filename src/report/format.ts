import type { AnalysisResult, Timeframe, TimeframeAnalysis } from "../data/types.js";

function formatRange(analysis: TimeframeAnalysis): string {
  if (!analysis.dealingRange) {
    return "n/a";
  }

  const { low, high, rangePosition } = analysis.dealingRange;
  const position = rangePosition === null ? "n/a" : rangePosition.toFixed(2);

  return `${low.toFixed(2)} -> ${high.toFixed(2)} (pos ${position})`;
}

function formatLevels(levels: number[]): string {
  return levels.length > 0 ? levels.slice(0, 4).map((value) => value.toFixed(2)).join(", ") : "none";
}

function formatTimeframe(timeframe: Timeframe, analysis: TimeframeAnalysis): string {
  const lines = [
    `${timeframe}: ${analysis.structure.direction}`,
    `  ATR: ${analysis.atr?.toFixed(2) ?? "n/a"}`,
    `  Range: ${formatRange(analysis)}`,
    `  Breaks: ${analysis.structure.breaks.length}`,
    `  Latest ChoCh: ${analysis.structure.latestChoch?.direction ?? "none"}`,
    `  Active FVGs: ${analysis.activeFvgs.length}`,
    `  POI: ${analysis.pointOfInterest ? `${analysis.pointOfInterest.type} ${analysis.pointOfInterest.low.toFixed(2)}-${analysis.pointOfInterest.high.toFixed(2)} valid=${analysis.pointOfInterest.valid}` : "none"}`,
    `  Latest Sweep: ${analysis.latestSweep ? `${analysis.latestSweep.direction} ${analysis.latestSweep.liquidityType} ${analysis.latestSweep.level.toFixed(2)}` : "none"}`,
    `  External Above: ${formatLevels(analysis.liquidity.externalAbove)}`,
    `  External Below: ${formatLevels(analysis.liquidity.externalBelow)}`,
    `  Internal Above: ${formatLevels(analysis.liquidity.internalAbove)}`,
    `  Internal Below: ${formatLevels(analysis.liquidity.internalBelow)}`,
  ];

  return lines.join("\n");
}

export function formatAnalysisReport(result: AnalysisResult): string {
  const sections: string[] = [
    `Instrument: ${result.instrument}`,
    `Timestamp: ${result.timestamp}`,
    `Current Price: ${result.currentPrice.toFixed(2)}`,
    `Daily Bias: ${result.dailyBias}`,
    `Signal: ${result.signal}`,
    `Confidence: ${result.confidence}`,
    `Session: ${result.session.isValid ? result.session.activeSessionNames.join(", ") : "inactive"} (${result.session.timezone})`,
    `Confirmation: session=${result.confirmation.sessionValid} sweep=${result.confirmation.sweepConfirmed} choch=${result.confirmation.chochConfirmed} bos=${result.confirmation.bosConfirmed} fvg=${result.confirmation.fvgPresent}`,
    result.tradePlan
      ? `Trade Plan: entry=${result.tradePlan.entry.toFixed(2)} stop=${result.tradePlan.stopLoss.toFixed(2)} target=${result.tradePlan.takeProfit.toFixed(2)} rr=${result.tradePlan.riskReward.toFixed(2)} partial=${result.tradePlan.partialAt.toFixed(2)}`
      : "Trade Plan: none",
    "",
    ...(["1day", "4h", "1h", "15min"] as Timeframe[]).map((timeframe) =>
      formatTimeframe(timeframe, result.timeframeAnalyses[timeframe]),
    ),
    "",
    "Bias Reasons:",
    ...result.reasons.map((reason) => `- ${reason}`),
  ];

  return sections.join("\n");
}
