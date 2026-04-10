import { access, appendFile, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { OUTPUT_CONFIG } from "../config/output.js";
import type { AnalysisResult, BacktestLogRecord } from "../data/types.js";

interface OutputArtifacts {
  outputDirectory: string;
  latestJsonPath: string;
  jsonlPath: string;
  csvPath: string;
}

function createBacktestLogRecord(result: AnalysisResult): BacktestLogRecord {
  const h4Poi = result.timeframeAnalyses["4h"].pointOfInterest;
  const h1Poi = result.timeframeAnalyses["1h"].pointOfInterest;
  const sweep = result.timeframeAnalyses["15min"].latestSweep;

  return {
    logVersion: OUTPUT_CONFIG.backtestLogVersion,
    timestamp: result.timestamp,
    instrument: result.instrument,
    signal: result.signal,
    bias: result.dailyBias,
    confidence: result.confidence,
    currentPrice: result.currentPrice,
    sessionValid: result.session.isValid,
    activeSessions: result.session.activeSessionNames.join("|"),
    dailyStructure: result.timeframeAnalyses["1day"].structure.direction,
    h4Structure: result.timeframeAnalyses["4h"].structure.direction,
    h1Structure: result.timeframeAnalyses["1h"].structure.direction,
    m15Structure: result.timeframeAnalyses["15min"].structure.direction,
    dailyRangePosition: result.timeframeAnalyses["1day"].dealingRange?.rangePosition ?? null,
    h4RangePosition: result.timeframeAnalyses["4h"].dealingRange?.rangePosition ?? null,
    h1RangePosition: result.timeframeAnalyses["1h"].dealingRange?.rangePosition ?? null,
    m15RangePosition: result.timeframeAnalyses["15min"].dealingRange?.rangePosition ?? null,
    h4PoiType: h4Poi?.type ?? "",
    h4PoiLow: h4Poi?.low ?? null,
    h4PoiHigh: h4Poi?.high ?? null,
    h4PoiValid: h4Poi?.valid ?? false,
    h1PoiType: h1Poi?.type ?? "",
    h1PoiLow: h1Poi?.low ?? null,
    h1PoiHigh: h1Poi?.high ?? null,
    h1PoiValid: h1Poi?.valid ?? false,
    m15SweepDirection: sweep?.direction ?? "",
    m15SweepType: sweep?.liquidityType ?? "",
    m15SweepLevel: sweep?.level ?? null,
    chochConfirmed: result.confirmation.chochConfirmed,
    bosConfirmed: result.confirmation.bosConfirmed,
    fvgPresent: result.confirmation.fvgPresent,
    entry: result.tradePlan?.entry ?? null,
    stopLoss: result.tradePlan?.stopLoss ?? null,
    takeProfit: result.tradePlan?.takeProfit ?? null,
    partialAt: result.tradePlan?.partialAt ?? null,
    riskReward: result.tradePlan?.riskReward ?? null,
    reasons: result.reasons.join(" | "),
  };
}

function escapeCsvCell(value: string | number | boolean | null): string {
  if (value === null) {
    return "";
  }

  const text = String(value);

  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }

  return text;
}

function toCsvRow(record: BacktestLogRecord): string {
  const fields = Object.values(record).map((value) => escapeCsvCell(value));
  return `${fields.join(",")}\n`;
}

async function ensureCsvWithHeader(csvPath: string, record: BacktestLogRecord): Promise<void> {
  try {
    await access(csvPath);
  } catch {
    const header = `${Object.keys(record).join(",")}\n`;
    await writeFile(csvPath, header);
  }
}

export async function writeAnalysisArtifacts(result: AnalysisResult): Promise<OutputArtifacts> {
  const outputDirectory = join(process.cwd(), OUTPUT_CONFIG.directory);
  const latestJsonPath = join(outputDirectory, OUTPUT_CONFIG.latestJsonFilename);
  const jsonlPath = join(outputDirectory, OUTPUT_CONFIG.jsonlFilename);
  const csvPath = join(outputDirectory, OUTPUT_CONFIG.csvFilename);
  const record = createBacktestLogRecord(result);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(latestJsonPath, `${JSON.stringify(result, null, 2)}\n`);
  await appendFile(jsonlPath, `${JSON.stringify(record)}\n`);
  await ensureCsvWithHeader(csvPath, record);
  await appendFile(csvPath, toCsvRow(record));

  return {
    outputDirectory,
    latestJsonPath,
    jsonlPath,
    csvPath,
  };
}
