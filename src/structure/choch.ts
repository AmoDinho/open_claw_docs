import type { ChangeOfCharacter, StructureBreak } from "../data/types.js";

export function detectLatestChoch(breaks: StructureBreak[]): ChangeOfCharacter | undefined {
  if (breaks.length < 2) {
    return undefined;
  }

  for (let index = breaks.length - 1; index > 0; index -= 1) {
    const current = breaks[index];
    const previous = breaks[index - 1];

    if (current.direction !== previous.direction) {
      return {
        direction: current.direction,
        brokenSwing: current.brokenSwing,
        breakIndex: current.breakIndex,
        breakDatetime: current.breakDatetime,
        breakPrice: current.breakPrice,
        priorDirection: previous.direction,
      };
    }
  }

  return undefined;
}
