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

export const USDJPY_CONFIG: InstrumentConfig = {
  id: 'usdjpy',
  symbol: 'USD/JPY',
  name: 'USDJPY',
  aliases: ['usdjpy', 'usd/jpy'],
  timeframes: DEFAULT_TIMEFRAMES,
};

export const EURJPY_CONFIG: InstrumentConfig = {
  id: 'eurjpy',
  symbol: 'EUR/JPY',
  name: 'EURJPY',
  aliases: ['eurjpy', 'eur/jpy'],
  timeframes: DEFAULT_TIMEFRAMES,
};

export const EURGBP_CONFIG: InstrumentConfig = {
  id: 'eurgbp',
  symbol: 'EUR/GBP',
  name: 'EURGBP',
  aliases: ['eurgbp', 'eur/gbp'],
  timeframes: DEFAULT_TIMEFRAMES,
};

export const GBPUSD_CONFIG: InstrumentConfig = {
  id: 'gbpusd',
  symbol: 'GBP/USD',
  name: 'GBPUSD',
  aliases: ['gbpusd', 'gbp/usd'],
  timeframes: DEFAULT_TIMEFRAMES,
};

export const EURUSD_CONFIG: InstrumentConfig = {
  id: 'eurusd',
  symbol: 'EUR/USD',
  name: 'EURUSD',
  aliases: ['eurusd', 'eur/usd'],
  timeframes: DEFAULT_TIMEFRAMES,
};

export const INSTRUMENTS: InstrumentConfig[] = [
  XAUUSD_CONFIG,
  USDJPY_CONFIG,
  EURJPY_CONFIG,
  EURGBP_CONFIG,
  GBPUSD_CONFIG,
  EURUSD_CONFIG,
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
