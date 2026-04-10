export type Timeframe = "15min" | "1h" | "4h" | "1day";
export type Direction = "BULLISH" | "BEARISH" | "NEUTRAL";

export interface Candle {
  datetime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TwelveDataValue {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

export interface TwelveDataTimeSeriesResponse {
  status?: "ok" | "error";
  code?: number;
  message?: string;
  values?: TwelveDataValue[];
}

export interface TwelveDataQuoteResponse {
  status?: "ok" | "error";
  code?: number;
  message?: string;
  close?: string;
}

export interface MarketDataSnapshot {
  symbol: string;
  currentPrice: number;
  candlesByTimeframe: Record<Timeframe, Candle[]>;
}

export interface SwingPoint {
  type: "HIGH" | "LOW";
  index: number;
  price: number;
  datetime: string;
  strength: number;
}

export interface StructureBreak {
  direction: Exclude<Direction, "NEUTRAL">;
  brokenSwing: SwingPoint;
  breakIndex: number;
  breakDatetime: string;
  breakPrice: number;
  displacement: number;
}

export interface ChangeOfCharacter {
  direction: Exclude<Direction, "NEUTRAL">;
  brokenSwing: SwingPoint;
  breakIndex: number;
  breakDatetime: string;
  breakPrice: number;
  priorDirection: Exclude<Direction, "NEUTRAL">;
}

export interface StructureState {
  timeframe: Timeframe;
  direction: Direction;
  swings: SwingPoint[];
  breaks: StructureBreak[];
  recentHighs: SwingPoint[];
  recentLows: SwingPoint[];
  latestBos?: StructureBreak;
  latestBullishBos?: StructureBreak;
  latestBearishBos?: StructureBreak;
  latestChoch?: ChangeOfCharacter;
}

export interface DealingRange {
  high: number;
  low: number;
  sourceDirection: Exclude<Direction, "NEUTRAL">;
  rangePosition: number | null;
}

export interface LiquidityMap {
  externalAbove: number[];
  externalBelow: number[];
  internalAbove: number[];
  internalBelow: number[];
  equalHighs: number[];
  equalLows: number[];
}

export interface TimeframeAnalysis {
  timeframe: Timeframe;
  atr: number | null;
  structure: StructureState;
  dealingRange?: DealingRange;
  liquidity: LiquidityMap;
}

export interface PhaseOneAnalysisResult {
  instrument: string;
  timestamp: string;
  currentPrice: number;
  dailyBias: Direction;
  timeframeAnalyses: Record<Timeframe, TimeframeAnalysis>;
  reasons: string[];
}
