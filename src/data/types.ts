export type Timeframe = "15min" | "1h" | "4h" | "1day";
export type Direction = "BULLISH" | "BEARISH" | "NEUTRAL";
export type TradeSignal = "BUY" | "SELL" | "NO_TRADE";

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

export interface FairValueGap {
  direction: Exclude<Direction, "NEUTRAL">;
  low: number;
  high: number;
  startIndex: number;
  endIndex: number;
  createdAt: string;
  mitigated: boolean;
  gapSize: number;
}

export interface PointOfInterest {
  type: "SUPPLY" | "DEMAND";
  timeframe: Timeframe;
  low: number;
  high: number;
  originIndex: number;
  originDatetime: string;
  breakIndex: number;
  breakDatetime: string;
  valid: boolean;
  reason: string;
}

export interface SweepEvent {
  direction: Exclude<Direction, "NEUTRAL">;
  liquidityType: "EXTERNAL" | "INTERNAL";
  level: number;
  candleIndex: number;
  candleDatetime: string;
  rejectionClose: number;
}

export interface SessionValidation {
  isValid: boolean;
  activeSessionNames: string[];
  timestamp: string;
  timezone: string;
}

export interface ConfirmationState {
  sessionValid: boolean;
  sweepConfirmed: boolean;
  chochConfirmed: boolean;
  bosConfirmed: boolean;
  fvgPresent: boolean;
}

export interface TradePlan {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  riskReward: number;
  partialAt: number;
  breakEvenRule: string;
}

export interface TimeframeAnalysis {
  timeframe: Timeframe;
  atr: number | null;
  structure: StructureState;
  dealingRange?: DealingRange;
  liquidity: LiquidityMap;
  fairValueGaps: FairValueGap[];
  activeFvgs: FairValueGap[];
  pointOfInterest?: PointOfInterest;
  latestSweep?: SweepEvent;
}

export interface AnalysisResult {
  instrument: "XAU/USD" | string;
  timestamp: string;
  currentPrice: number;
  dailyBias: Direction;
  signal: TradeSignal;
  confidence: number;
  timeframeAnalyses: Record<Timeframe, TimeframeAnalysis>;
  session: SessionValidation;
  confirmation: ConfirmationState;
  tradePlan?: TradePlan;
  reasons: string[];
}
