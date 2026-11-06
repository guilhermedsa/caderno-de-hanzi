// Fila de uma sessão de estudo: um cartão errado volta alguns cartões depois,
// até ser acertado. Só a primeira resposta conta para o resultado.

export function shuffled(items, random = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createSession(cards, { shuffle = false, random = Math.random, gap = 4 } = {}) {
  const queue = shuffle ? shuffled(cards, random) : [...cards];
  const firstResult = new Map();
  const total = cards.length;
  let finished = 0;

  return {
    get total() {
      return total;
    },
    get finished() {
      return finished;
    },
    get done() {
      return queue.length === 0;
    },
    get current() {
      return queue[0] ?? null;
    },
    get rightFirstTry() {
      return [...firstResult.values()].filter(Boolean).length;
    },
    get missed() {
      return cards.filter((card) => firstResult.get(card) === false);
    },
    answer(ok) {
      const card = queue.shift();
      const firstAttempt = !firstResult.has(card);
      if (firstAttempt) firstResult.set(card, ok);
      if (ok) finished += 1;
      else queue.splice(Math.min(gap, queue.length), 0, card);
      return { card, firstAttempt };
    },
  };
}
