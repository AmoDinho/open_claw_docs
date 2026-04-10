export const OUTPUT_CONFIG = {
  directory: process.env.ANALYSIS_OUTPUT_DIR ?? "logs",
  latestJsonFilename: "latest-analysis.json",
  jsonlFilename: "analysis-log.jsonl",
  csvFilename: "analysis-log.csv",
  backtestLogVersion: 1,
};
