# XAU/USD SMC Quant Strategy Specification

## Objective

Build a TypeScript signal engine for Open Claw that uses Twelve Data market data to analyze `XAU/USD` and return a structured `BUY`, `SELL`, or `NO_TRADE` decision.

The engine must convert a discretionary Smart Money Concepts workflow into explicit, testable rules based on OHLC candle data.

## Scope

The first version should support:

- Instrument: `XAU/USD`
- Timeframes: `1day`, `4h` or `3h`, `1h`, `15min`, optionally `1min`
- Data source: Twelve Data
- Output: signal, bias, entry zone, stop loss, take profit, risk/reward, and explanation
- Session filter: London and New York windows only

The first version should not depend on image analysis or manual chart markup.

## Core Quant Problem

The discretionary strategy relies on visual interpretation of:

- Break of Structure
- Change of Character
- inducement
- liquidity sweeps
- fair value gaps
- supply and demand points of interest
- session timing

To automate the strategy, each of these must be expressed as a deterministic rule operating on candles.

## Strategy Translation

### 1. Higher-Timeframe Context

Use `1day` and `4h` as the main context layers.

The engine should determine:

- dominant directional order flow
- current dealing range
- external liquidity levels
- internal liquidity levels
- active higher-timeframe POIs

### 2. Range Definition

Define the active range from the latest confirmed higher-timeframe structural break.

Bullish range:

- identify the last confirmed swing low
- identify the swing high whose break confirmed bullish continuation
- range low = protected swing low before bullish BOS
- range high = latest external high created by the BOS leg

Bearish range:

- identify the last confirmed swing high
- identify the swing low whose break confirmed bearish continuation
- range high = protected swing high before bearish BOS
- range low = latest external low created by the BOS leg

### 3. Swing Detection

Use fractal pivots to avoid subjective structure labeling.

A swing high is confirmed when:

- high of candle `i` is greater than highs of `n` candles on both sides

A swing low is confirmed when:

- low of candle `i` is lower than lows of `n` candles on both sides

Suggested default:

- `n = 2` on `15min`
- `n = 3` on `1h`
- `n = 3` or `4` on `4h` and `1day`

This makes BOS and ChoCh measurable.

### 4. Break of Structure

Bullish BOS:

- a confirmed swing high is closed above by a later candle close
- the break must exceed the level by at least a minimum displacement threshold

Bearish BOS:

- a confirmed swing low is closed below by a later candle close
- the break must exceed the level by at least a minimum displacement threshold

Suggested displacement filter:

- break distance >= `0.10 * ATR(14)` of the same timeframe

This prevents classifying tiny marginal breaks as meaningful structure.

### 5. Change of Character

Bullish ChoCh:

- in a short-term bearish sequence, price closes above the most recent lower high

Bearish ChoCh:

- in a short-term bullish sequence, price closes below the most recent higher low

Use this only on lower timeframes (`15min` and optional `1min`) after a sweep into a POI.

### 6. Inducement

Inducement is the internal liquidity used to attract positioning before price runs toward external liquidity.

Quant proxy:

- the most recent internal swing level that is taken before the larger external objective is attacked
- usually a short-term swing high or swing low inside the current higher-timeframe range

For automation, define inducement as:

- the latest internal swing level inside the active range that has not yet been swept
- and is closer to current price than the external range boundary

This is a proxy, not a perfect semantic recreation of discretionary inducement.

### 7. Liquidity Mapping

#### External Liquidity

External liquidity levels should include:

- previous day high
- previous day low
- current week high
- current week low
- active higher-timeframe range high
- active higher-timeframe range low
- London session high and low
- New York session high and low

#### Internal Liquidity

Internal liquidity levels should include:

- equal highs
- equal lows
- internal swing highs and lows
- unfilled fair value gaps
- local trendline-style compression proxies using clustered pivot sequences

Equal highs or lows can be defined using a tolerance:

- absolute price difference <= `0.05 * ATR(14)` of that timeframe

### 8. Fair Value Gaps

Bullish FVG:

- candle `i-1` high < candle `i+1` low

Bearish FVG:

- candle `i-1` low > candle `i+1` high

Add a minimum gap-size filter:

- gap size >= `0.08 * ATR(14)`

An unmitigated FVG remains valid until price trades back into it.

### 9. Point of Interest Detection

A POI should only be considered valid if it caused displacement and structure shift.

#### Demand POI

- bearish candle or small base before impulsive bullish move
- that bullish move creates a BOS
- zone spans from candle open to low, or body-to-wick depending on chosen convention

#### Supply POI

- bullish candle or small base before impulsive bearish move
- that bearish move creates a BOS
- zone spans from candle open to high, or body-to-wick depending on chosen convention

Recommended first implementation:

- zone = last opposing candle before displacement
- valid only if resulting move created BOS and left an FVG

This ties POIs to measurable imbalance instead of visual discretion.

### 10. Daily Bias

Daily bias should be generated from the higher-timeframe model, not manually stated.

Bullish bias when:

- `1day` structure is bullish
- `4h` structure is bullish or in bullish pullback
- current price is discount or mid-range relative to bullish dealing range

Bearish bias when:

- `1day` structure is bearish
- `4h` structure is bearish or in bearish pullback
- current price is premium or mid-range relative to bearish dealing range

Neutral when:

- `1day` and `4h` conflict
- or price is in the middle of range with no clean POI interaction

Dealing range location can be measured as:

- `rangePosition = (currentPrice - rangeLow) / (rangeHigh - rangeLow)`

Interpretation:

- bullish preference when `rangePosition < 0.50`
- bearish preference when `rangePosition > 0.50`

More aggressive versions can use `0.33` and `0.67` as discount and premium bands.

## Execution Protocol

## Entry Preconditions

No entry should be issued unless all of the following are true:

- higher-timeframe bias is clear
- price is interacting with a valid higher-timeframe POI
- a liquidity pool has been swept into that POI
- current time falls inside an approved session window
- lower timeframe confirms ChoCh or BOS in the intended direction
- projected trade offers at least `1:3` reward to risk

## Sweep Definition

A bullish setup requires downside sweep:

- current candle low trades below an identified liquidity level
- and candle closes back above that level or above the POI midpoint

A bearish setup requires upside sweep:

- current candle high trades above an identified liquidity level
- and candle closes back below that level or below the POI midpoint

This helps distinguish sweep-and-reject from simple continuation.

## Session Windows

Use explicit timezone handling in code.

Base timezone:

- `Africa/Johannesburg` if you want local consistency
- alternatively use UTC internally and map windows from exchange/session definitions

Recommended first pass:

- Frankfurt open window
- London first hour
- New York open window

These windows should be configurable.

Example configuration:

- Frankfurt: `07:00-09:00` SAST
- London: `09:00-11:00` SAST
- New York: `14:30-17:00` SAST

These values should be validated against your preferred operational clock and daylight saving behavior.

## Lower-Timeframe Confirmation

Bullish confirmation:

- downside sweep into demand POI
- `15min` or `1min` bullish ChoCh
- optional bullish FVG left behind during reversal

Bearish confirmation:

- upside sweep into supply POI
- `15min` or `1min` bearish ChoCh
- optional bearish FVG left behind during reversal

For the first implementation, `15min` is enough. `1min` can be added later once the logic is stable.

## Trade Construction

### Long Setup

1. Higher-timeframe bias = bullish
2. Price reaches demand POI in discount or lower half of range
3. Price sweeps internal or external sell-side liquidity
4. Sweep occurs during London or New York window
5. `15min` prints bullish ChoCh or bullish BOS
6. Entry at market after confirmation close, or on retrace into reversal FVG
7. Stop below sweep low or protected swing low
8. Target opposing external liquidity
9. Reject trade if reward/risk < `3.0`

### Short Setup

1. Higher-timeframe bias = bearish
2. Price reaches supply POI in premium or upper half of range
3. Price sweeps internal or external buy-side liquidity
4. Sweep occurs during London or New York window
5. `15min` prints bearish ChoCh or bearish BOS
6. Entry at market after confirmation close, or on retrace into reversal FVG
7. Stop above sweep high or protected swing high
8. Target opposing external liquidity
9. Reject trade if reward/risk < `3.0`

## Trade Management

### Stop Loss

Default stop logic:

- long stop below protected low that initiated the reversal
- short stop above protected high that initiated the reversal

If using market entry on confirmation candle, add a small volatility buffer:

- `stopBuffer = 0.05 * ATR(14)` on entry timeframe

### Take Profit

Primary target:

- opposing external liquidity

Examples:

- previous day high or low
- range high or low
- weekly high or low

### Partialing Logic

At `1:3` reward/risk:

- close `50%`
- move stop loss to breakeven

After a secondary BOS in trade direction:

- trail remainder below new protected low for longs
- trail remainder above new protected high for shorts

## Output Contract

The engine should not return plain text only. It should return a structured object that can also be formatted for human reading.

```ts
type TradeSignal = "BUY" | "SELL" | "NO_TRADE";

interface AnalysisResult {
  instrument: "XAU/USD";
  timestamp: string;
  bias: "BULLISH" | "BEARISH" | "NEUTRAL";
  signal: TradeSignal;
  confidence: number;
  currentPrice: number;
  timeframeContext: {
    dailyStructure: "BULLISH" | "BEARISH" | "NEUTRAL";
    h4Structure: "BULLISH" | "BEARISH" | "NEUTRAL";
    dealingRangeHigh: number;
    dealingRangeLow: number;
    rangePosition: number;
  };
  liquidity: {
    externalAbove: number[];
    externalBelow: number[];
    internalAbove: number[];
    internalBelow: number[];
    sweptLevel?: number;
    sweptType?: "EXTERNAL" | "INTERNAL";
  };
  poi: {
    type?: "SUPPLY" | "DEMAND";
    timeframe?: "1day" | "4h" | "1h" | "15min";
    low?: number;
    high?: number;
    valid: boolean;
  };
  confirmation: {
    sessionValid: boolean;
    sweepConfirmed: boolean;
    chochConfirmed: boolean;
    bosConfirmed: boolean;
    fvgPresent: boolean;
  };
  tradePlan?: {
    entry: number;
    stopLoss: number;
    takeProfit: number;
    riskReward: number;
    partialAt: number;
    breakEvenRule: string;
  };
  reasons: string[];
}
```

## Signal Rules

### BUY

Return `BUY` only if:

- higher-timeframe bias is bullish
- demand POI is valid
- sell-side liquidity has been swept
- session window is valid
- lower-timeframe ChoCh or BOS confirms
- reward/risk >= `3.0`

### SELL

Return `SELL` only if:

- higher-timeframe bias is bearish
- supply POI is valid
- buy-side liquidity has been swept
- session window is valid
- lower-timeframe ChoCh or BOS confirms
- reward/risk >= `3.0`

### NO_TRADE

Return `NO_TRADE` if any required condition is missing.

This is important. The strategy should prefer silence over forcing weak signals.

## Confidence Model

Do not begin with machine learning. Use a transparent scoring model first.

Example:

- higher-timeframe alignment: `+25`
- valid POI with FVG: `+20`
- liquidity sweep confirmed: `+20`
- session window valid: `+10`
- ChoCh confirmed: `+15`
- BOS confirmed: `+10`

Interpretation:

- `80-100`: high conviction
- `60-79`: moderate conviction
- `<60`: no signal, downgrade to `NO_TRADE`

## TypeScript Architecture

Suggested structure:

```text
src/
  config/
    instruments.ts
    sessions.ts
    strategy.ts
  data/
    twelvedata.ts
    types.ts
  indicators/
    atr.ts
    swings.ts
    fvg.ts
  structure/
    bos.ts
    choch.ts
    range.ts
    liquidity.ts
    poi.ts
  strategy/
    bias.ts
    confirm.ts
    signal.ts
    tradePlan.ts
  report/
    format.ts
  main.ts
```

## Twelve Data Requirements

The engine will likely need:

- quote endpoint for latest price
- time_series endpoint for OHLC candles across all required timeframes

Indicator endpoints are optional.

This strategy is primarily market-structure based, so raw candles matter more than precomputed RSI or MACD.

For this project, Twelve Data should be used mainly for:

- OHLC retrieval
- current quote
- possibly ATR if you prefer local computation to start from candles anyway

## Important Design Decision

Do not use RSI or MACD as primary drivers of the signal if the strategy is truly SMC-based.

If you keep them at all, treat them as secondary filters or diagnostics, not as core decision variables.

## Assumptions

This quant translation makes several practical assumptions:

- structure can be approximated with fractal pivots
- inducement can be represented by internal unswept swing liquidity
- POIs can be modeled from last opposing candle before displacement
- liquidity sweeps can be inferred from wick penetration and close rejection
- session windows are configurable rather than fixed forever

These assumptions are reasonable for version one, but they should be tested and refined.

## Known Risks

- SMC concepts are semantically rich and may lose nuance when reduced to rules
- poor swing definitions will create noisy BOS and ChoCh detection
- too many filters may produce very few signals
- too few filters may produce many low-quality signals
- Twelve Data historical granularity and rate limits may constrain lower-timeframe analysis

## Implementation Order

### Phase 1

- fetch candles for `1day`, `4h`, `1h`, `15min`
- implement swing detection
- implement BOS and ChoCh
- build higher-timeframe bias
- map basic external and internal liquidity

### Phase 2

- implement FVG detection
- implement POI tagging
- implement sweep detection
- add session filter
- generate `BUY`, `SELL`, `NO_TRADE`

### Phase 3

- add trade plan logic
- add confidence scoring
- add report formatting for Open Claw
- add backtest-ready logging output

### Phase 4

- optimize thresholds
- add `1min` refinement
- add event logging and performance tracking
- build backtest harness

## Final Quant Interpretation

Your discretionary strategy becomes:

- a higher-timeframe directional filter
- a liquidity-targeting setup detector
- a session-constrained reversal or continuation trigger
- a lower-timeframe structural confirmation engine
- a strict risk/reward and management model

That is a proper quant foundation. It is still SMC in logic, but now it is explicit enough to code, test, and improve.
