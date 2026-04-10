import type { AnalysisResult, Timeframe, TimeframeAnalysis } from "../data/types.js";

function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "n/a";
  }

  return value.toFixed(2);
}

function formatTimeframeLine(timeframe: Timeframe, analysis: TimeframeAnalysis): string {
  const poi = analysis.pointOfInterest;
  const sweep = analysis.latestSweep;
  const rangePosition =
    analysis.dealingRange?.rangePosition === null || analysis.dealingRange?.rangePosition === undefined
      ? "n/a"
      : analysis.dealingRange.rangePosition.toFixed(2);

  return [
    `- ${timeframe}: ${analysis.structure.direction}`,
    `ATR ${formatPrice(analysis.atr)}`,
    `range-pos ${rangePosition}`,
    `POI ${poi ? `${poi.type} ${formatPrice(poi.low)}-${formatPrice(poi.high)} valid=${poi.valid}` : "none"}`,
    `sweep ${sweep ? `${sweep.direction} ${sweep.liquidityType} ${formatPrice(sweep.level)}` : "none"}`,
    `active-fvg ${analysis.activeFvgs.length}`,
  ].join(" | ");
}

export function formatOpenClawReport(result: AnalysisResult): string {
  const activeSessions = result.session.isValid ? result.session.activeSessionNames.join(", ") : "None";
  const lines: string[] = [
    "# Gold Signal Report",
    "",
    `Instrument: ${result.instrument}`,
    `Timestamp: ${result.timestamp}`,
    `Signal: ${result.signal}`,
    `Bias: ${result.dailyBias}`,
    `Confidence: ${result.confidence}/100`,
    `Current Price: ${result.currentPrice.toFixed(2)}`,
    `Session: ${activeSessions} (${result.session.timezone})`,
    "",
    "## Confirmation",
    `- Session valid: ${result.confirmation.sessionValid}`,
    `- Sweep confirmed: ${result.confirmation.sweepConfirmed}`,
    `- ChoCh confirmed: ${result.confirmation.chochConfirmed}`,
    `- BOS confirmed: ${result.confirmation.bosConfirmed}`,
    `- Directional FVG present: ${result.confirmation.fvgPresent}`,
    "",
    "## Trade Plan",
    result.tradePlan
      ? `- Entry ${result.tradePlan.entry.toFixed(2)} | Stop ${result.tradePlan.stopLoss.toFixed(2)} | Target ${result.tradePlan.takeProfit.toFixed(2)} | RR ${result.tradePlan.riskReward.toFixed(2)} | Partial ${result.tradePlan.partialAt.toFixed(2)}`
      : "- No executable trade plan",
    result.tradePlan ? `- Management: ${result.tradePlan.breakEvenRule}` : "",
    "",
    "## Timeframe State",
    ...(["1day", "4h", "1h", "15min"] as Timeframe[]).map((timeframe) =>
      formatTimeframeLine(timeframe, result.timeframeAnalyses[timeframe]),
    ),
    "",
    "## Reasons",
    ...result.reasons.map((reason) => `- ${reason}`),
  ].filter((line) => line !== "");

  return lines.join("\n");
}
