import type { Timeframe } from '../data/types.js';

export interface InstrumentConfig {
  id: string;
  symbol: string;
  name: string;
  aliases: string[];
  timeframes: Timeframe[];
}

export const DEFAULT_TIMEFRAMES: Timeframe[] = ['1day', '4h', '1h', '15min'];

export const XAUUSD_CONFIG: InstrumentConfig = {
  id: 'gold',
  symbol: 'XAU/USD',
  name: 'Gold',
  aliases: ['gold', 'xau', 'xauusd', 'xau/usd'],
  timeframes: DEFAULT_TIMEFRAMES,
};

export const NASDAQ100_CONFIG: InstrumentConfig = {
  id: 'nasdaq100',
  symbol: process.env.NASDAQ100_SYMBOL ?? 'NDX',
  name: 'NASDAQ 100',
  aliases: ['nasdaq', 'nasdaq100', 'ndx', 'us100', 'nas100'],
  timeframes: DEFAULT_TIMEFRAMES,
};

export const INSTRUMENTS: InstrumentConfig[] = [
  XAUUSD_CONFIG,
  NASDAQ100_CONFIG,
];

export function findInstrumentConfig(
  input: string,
): InstrumentConfig | undefined {
  const normalized = input.trim().toLowerCase();

  return INSTRUMENTS.find(
    (instrument) =>
      instrument.id === normalized ||
      instrument.symbol.toLowerCase() === normalized ||
      instrument.aliases.includes(normalized),
  );
}
