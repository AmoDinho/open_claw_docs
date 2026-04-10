import type { Candle, SwingPoint } from "../data/types.js";

export function findSwingPoints(candles: Candle[], strength: number): SwingPoint[] {
  const swings: SwingPoint[] = [];

  for (let index = strength; index < candles.length - strength; index += 1) {
    const current = candles[index];
    let isSwingHigh = true;
    let isSwingLow = true;

    for (let offset = 1; offset <= strength; offset += 1) {
      const left = candles[index - offset];
      const right = candles[index + offset];

      if (current.high <= left.high || current.high <= right.high) {
        isSwingHigh = false;
      }

      if (current.low >= left.low || current.low >= right.low) {
        isSwingLow = false;
      }

      if (!isSwingHigh && !isSwingLow) {
        break;
      }
    }

    if (isSwingHigh) {
      swings.push({
        type: "HIGH",
        index,
        price: current.high,
        datetime: current.datetime,
        strength,
      });
    }

    if (isSwingLow) {
      swings.push({
        type: "LOW",
        index,
        price: current.low,
        datetime: current.datetime,
        strength,
      });
    }
  }

  return swings.sort((left, right) => left.index - right.index);
}
