import { STRATEGY_CONFIG } from "../config/strategy.js";
import type {
  Candle,
  Timeframe,
  TwelveDataQuoteResponse,
  TwelveDataTimeSeriesResponse,
} from "./types.js";

const API_KEY = process.env.TWELVE_DATA_API_KEY;

function assertApiKey(): string {
  if (!API_KEY) {
    throw new Error(
      "Missing TWELVE_DATA_API_KEY. Add it to your environment before running the analyzer.",
    );
  }

  return API_KEY;
}

async function fetchJson<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(path, STRATEGY_CONFIG.api.baseUrl);

  Object.entries({
    ...params,
    apikey: assertApiKey(),
  }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Twelve Data request failed with HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

function parseCandle(value: {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}): Candle {
  return {
    datetime: value.datetime,
    open: Number.parseFloat(value.open),
    high: Number.parseFloat(value.high),
    low: Number.parseFloat(value.low),
    close: Number.parseFloat(value.close),
    volume: value.volume ? Number.parseFloat(value.volume) : undefined,
  };
}

export async function fetchQuote(symbol: string): Promise<number> {
  const response = await fetchJson<TwelveDataQuoteResponse>("/quote", { symbol });

  if (response.status === "error" || !response.close) {
    throw new Error(response.message ?? `Quote request failed for ${symbol}`);
  }

  return Number.parseFloat(response.close);
}

export async function fetchCandles(symbol: string, timeframe: Timeframe): Promise<Candle[]> {
  const outputsize = STRATEGY_CONFIG.api.outputSizeByTimeframe[timeframe];
  const response = await fetchJson<TwelveDataTimeSeriesResponse>("/time_series", {
    symbol,
    interval: timeframe,
    outputsize: String(outputsize),
    timezone: "UTC",
  });

  if (response.status === "error" || !response.values?.length) {
    throw new Error(
      response.message ?? `Time series request returned no candles for ${symbol} ${timeframe}`,
    );
  }

  return response.values.map(parseCandle).reverse();
}
