// Repetição espaçada: o que você erra volta logo, o que acerta volta cada vez mais tarde.
// As datas são contadas em dias locais para a revisão não depender da hora do estudo.

const START_EASE = 2.3;
const MIN_EASE = 1.3;
const MAX_EASE = 3;
const MAX_INTERVAL = 365;

export function dayNumber(date = new Date()) {
  return Math.floor((date.getTime() - date.getTimezoneOffset() * 60000) / 86400000);
}

export function grade(state, ok, today, { firstAttempt = true } = {}) {
  const prev = state ?? { reps: 0, interval: 0, ease: START_EASE, lapses: 0, due: today };
  if (!ok) {
    return {
      ...prev,
      reps: 0,
      interval: 0,
      due: today,
      ease: firstAttempt ? Math.max(MIN_EASE, prev.ease - 0.2) : prev.ease,
      lapses: prev.lapses + (firstAttempt ? 1 : 0),
    };
  }
  const reps = prev.reps + 1;
  const interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.min(MAX_INTERVAL, Math.round(prev.interval * prev.ease));
  return {
    ...prev,
    reps,
    interval,
    due: today + interval,
    ease: firstAttempt ? Math.min(MAX_EASE, prev.ease + 0.05) : prev.ease,
  };
}

export const isDue = (state, today) => Boolean(state) && state.due <= today;
export const isLearned = (state) => Boolean(state) && state.reps >= 1;
