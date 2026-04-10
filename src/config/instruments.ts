import type { Timeframe } from "../data/types.js";

export interface InstrumentConfig {
  symbol: string;
  name: string;
  timeframes: Timeframe[];
}

export const XAUUSD_CONFIG: InstrumentConfig = {
  symbol: "XAU/USD",
  name: "Gold",
  timeframes: ["1day", "4h", "1h", "15min"],
};
