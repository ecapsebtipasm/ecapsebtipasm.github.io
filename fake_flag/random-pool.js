// Shuffle once, consume every flag, then shuffle a new round.
export function createFlagPool(names, random = Math.random) {
  const unique = [...new Set(names)];
  let remaining = [];
  function refill(currentBatch) {
    const shuffled = [...unique];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    // At a round boundary, postpone flags already on this same screen.
    const shown = new Set(currentBatch);
    remaining = [
      ...shuffled.filter(name => shown.has(name)),
      ...shuffled.filter(name => !shown.has(name)),
    ];
  }
  return {
    take(count) {
      if (!unique.length) return [];
      const result = [];
      while (result.length < count) {
        if (!remaining.length) refill(result);
        result.push(remaining.pop());
      }
      return result;
    },
  };
}
