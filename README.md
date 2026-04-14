# Open Claw Quant Analyzer

TypeScript signal engine for Open Claw that analyzes market structure and liquidity using Twelve Data and returns a structured `BUY`, `SELL`, or `NO_TRADE` decision.

The project currently supports:

- Gold via `XAU/USD`
- `USD/JPY`
- `EUR/JPY`
- `EUR/GBP`
- `GBP/USD`
- `EUR/USD`
- Multi-timeframe analysis on `1day`, `4h`, `1h`, and `15min`
- Open Claw-friendly terminal output
- JSON, JSONL, and CSV logging for replay and backtesting

## Requirements

- Node.js 20+
- npm
- A Twelve Data API key

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

3. Edit `.env` and set your API key:

```env
TWELVE_DATA_API_KEY=your_real_key
```

Notes:

- `TWELVE_DATA_API_KEY` is required.

## Build

```bash
npm run build
```

## Run

Default run:

```bash
npm start
```

That defaults to Gold.

Run Gold explicitly:

```bash
npm run start -- --instrument gold
```

Run USDJPY:

```bash
npm run start -- --instrument usdjpy
```

Run a raw Twelve Data symbol directly:

```bash
npm run start -- --symbol EUR/USD --name "EURUSD"
```

Print the verbose report and raw JSON in the terminal:

```bash
npm run start -- --instrument gold --json
```

Important:

- When using `npm run`, include the extra `--` before app flags like `--instrument` or `--symbol`.

## Supported Instrument Flags

Current aliases:

- `gold`
- `xau`
- `xauusd`
- `xau/usd`
- `usdjpy`
- `usd/jpy`
- `eurjpy`
- `eur/jpy`
- `eurgbp`
- `eur/gbp`
- `gbpusd`
- `gbp/usd`
- `eurusd`
- `eur/usd`

Examples:

```bash
npm run start -- --instrument gold
npm run start -- --instrument usdjpy
npm run start -- --instrument eurusd
```

## What The App Does

Each run:

1. Fetches the latest quote and candle data from Twelve Data.
2. Builds multi-timeframe structure using swings, BOS, and ChoCh.
3. Detects FVGs, POIs, liquidity context, and sweep conditions.
4. Applies session validation and signal rules.
5. Produces an analysis result with:
   - bias
   - signal
   - confidence
   - confirmation state
   - optional trade plan

## Output

By default, the console prints an Open Claw-friendly report.

Each run also writes artifacts into `logs/`:

- `logs/latest-analysis.json`
- `logs/analysis-log.jsonl`
- `logs/analysis-log.csv`

These are useful for:

- manual review
- replay analysis
- exporting signals for later backtesting

## Typecheck

```bash
npm run typecheck
```

## Open Claw Usage

Gold:

```bash
openclaw agent --local --deliver --message "Use the exec tool to run: cd ~/open_claw_docs && npm run start -- --instrument gold --json ; then synthesize the output and send the full analysis to me via Telegram" --agent main --to
```

USDJPY:

```bash
openclaw agent --local --deliver --message "Use the exec tool to run: cd ~/open_claw_docs && npm run start -- --instrument usdjpy --json ; then synthesize the output and send the full analysis to me via Telegram" --agent main --to
```

EURJPY:

```bash
openclaw agent --local --deliver --message "Use the exec tool to run: cd ~/open_claw_docs && npm run start -- --instrument eurjpy --json ; then synthesize the output and send the full analysis to me via Telegram" --agent main --to
```

EURGBP:

```bash
openclaw agent --local --deliver --message "Use the exec tool to run: cd ~/open_claw_docs && npm run start -- --instrument eurgbp --json ; then synthesize the output and send the full analysis to me via Telegram" --agent main --to
```

GBPUSD:

```bash
openclaw agent --local --deliver --message "Use the exec tool to run: cd ~/open_claw_docs && npm run start -- --instrument gbpusd --json ; then synthesize the output and send the full analysis to me via Telegram" --agent main --to
```

EURUSD:

```bash
openclaw agent --local --deliver --message "Use the exec tool to run: cd ~/open_claw_docs && npm run start -- --instrument eurusd --json ; then synthesize the output and send the full analysis to me via Telegram" --agent main --to
```

If you want full control over the symbol:

```bash
openclaw agent --local --deliver --message "Use the exec tool to run: cd ~/open_claw_docs && npm run start -- --symbol EUR/USD --name 'EURUSD' --json ; then synthesize the output and send the full analysis to me via Telegram" --agent main --to
```

## Project Structure

```text
src/
  config/      runtime configuration
  data/        Twelve Data client and shared types
  indicators/  ATR, swings, FVG detection
  structure/   BOS, ChoCh, range, liquidity, POI logic
  strategy/    bias, confirmation, session, signal, trade plan
  report/      terminal/open-claw formatting
  logging/     JSONL/CSV/latest snapshot artifacts
  main.ts      application entrypoint
```

## Current Strategy Scope

The analyzer is built around a rule-based Smart Money Concepts workflow:

- higher-timeframe bias from Daily and 4H
- liquidity-aware setup detection
- POI interaction
- session filtering
- lower-timeframe confirmation
- minimum reward-to-risk filter

It is intentionally conservative and will often return `NO_TRADE` when alignment is incomplete.

## Troubleshooting

If you get a missing API key error:

- make sure `.env` exists
- make sure `TWELVE_DATA_API_KEY` is set
- restart the command after updating `.env`

If a preset symbol does not resolve correctly with your Twelve Data account:

- run with `--symbol <your_symbol>`
- optionally add a new alias in [src/config/instruments.ts](/Users/amomoloko/github/open_claw_docs/src/config/instruments.ts)

If you change code:

```bash
npm run build
```

Then run again:

```bash
npm start
```
