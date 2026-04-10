import type { PhaseOneAnalysisResult, Timeframe, TimeframeAnalysis } from "../data/types.js";

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
    `  External Above: ${formatLevels(analysis.liquidity.externalAbove)}`,
    `  External Below: ${formatLevels(analysis.liquidity.externalBelow)}`,
    `  Internal Above: ${formatLevels(analysis.liquidity.internalAbove)}`,
    `  Internal Below: ${formatLevels(analysis.liquidity.internalBelow)}`,
  ];

  return lines.join("\n");
}

export function formatPhaseOneReport(result: PhaseOneAnalysisResult): string {
  const sections: string[] = [
    `Instrument: ${result.instrument}`,
    `Timestamp: ${result.timestamp}`,
    `Current Price: ${result.currentPrice.toFixed(2)}`,
    `Daily Bias: ${result.dailyBias}`,
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
