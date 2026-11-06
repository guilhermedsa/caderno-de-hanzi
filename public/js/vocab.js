// Consultas sobre o vocabulário: cartões, sentidos por lição e informações de cada hanzi.
import { CHAR_EXTRA, LESSONS } from './lessons-data.js';

export { LESSONS };

export const isHan = (ch) => /\p{Script=Han}/u.test(ch);
export const hanChars = (text) => [...text].filter(isHan);
export const lessonByN = (n) => LESSONS.find((lesson) => lesson.n === n);

const makeCard = (lesson, word) => ({ id: `${lesson.n}:${word.h}`, lesson: lesson.n, word });
const ALL_CARDS = LESSONS.flatMap((lesson) => lesson.words.map((word) => makeCard(lesson, word)));
const CARD_BY_ID = new Map(ALL_CARDS.map((card) => [card.id, card]));

export const cardById = (id) => CARD_BY_ID.get(id);

const includeCard = (card, { names = true } = {}) => names || !card.word.name;

export const lessonCards = (n, options) => ALL_CARDS.filter((card) => card.lesson === n && includeCard(card, options));
export const allCards = (options) => ALL_CARDS.filter((card) => includeCard(card, options));

// Os hanzi a treinar em uma lição: a lista de escrita do livro ou todos os das palavras.
export function lessonChars(n, scope = 'book') {
  const lesson = lessonByN(n);
  const list = [...lesson.write];
  if (scope === 'all') {
    for (const word of lesson.words) {
      for (const ch of hanChars(word.h)) if (!list.includes(ch)) list.push(ch);
    }
  }
  return list;
}

// Mesma palavra em outra lição com outro sentido, como 找: dar o troco x procurar.
export function otherSenses(card) {
  return ALL_CARDS.filter((other) => other.word.h === card.word.h && other.id !== card.id && other.word.m !== card.word.m).map(
    (other) => ({ lesson: other.lesson, p: other.word.pShow ?? other.word.p, m: other.word.m }),
  );
}

const STOP_WORDS = new Set(['de', 'da', 'do', 'em', 'a', 'o', 'e', 'com', 'no', 'na', 'para', 'por']);
const tokens = (text) =>
  text
    .toLowerCase()
    .replace(/[()“”]/g, ' ')
    .split(/[\s;,]+/)
    .filter((token) => token && !STOP_WORDS.has(token) && !isHan(token[0]));

// O sentido do hanzi sozinho, quando é diferente do sentido dele dentro da palavra.
export function soloSense(part, lessonN) {
  const candidates = ALL_CARDS.filter((card) => card.word.h === part.h && !card.word.name);
  if (!candidates.length) return null;
  const nearest = [...candidates].sort((a, b) => Math.abs(a.lesson - lessonN) - Math.abs(b.lesson - lessonN))[0];
  const own = new Set(tokens(part.m));
  const overlaps = candidates.some((card) => tokens(card.word.m).some((token) => own.has(token)));
  return overlaps ? null : { m: nearest.word.m, lesson: nearest.lesson };
}

// Palavras de até esta lição que contêm o hanzi, para mostrar como ele se combina.
export function compoundsWith(ch, maxLesson, excludeId) {
  return ALL_CARDS.filter(
    (card) =>
      card.lesson <= maxLesson &&
      card.id !== excludeId &&
      !card.word.name &&
      hanChars(card.word.h).length > 1 &&
      card.word.h.includes(ch),
  );
}

function senseInLesson(n, ch) {
  const cards = ALL_CARDS.filter((card) => card.lesson === n);
  const solo = cards.find((card) => card.word.h === ch);
  if (solo) return { p: solo.word.p, m: solo.word.m, lesson: n };
  for (const card of cards) {
    const part = card.word.parts.find((item) => item.h === ch);
    if (part) return { p: part.p, m: part.m, lesson: n, in: card.word };
  }
  const variant = CHAR_EXTRA[ch] && cards.find((card) => card.word.show?.includes(ch));
  if (variant) return { ...CHAR_EXTRA[ch], lesson: n, in: variant.word };
  return null;
}

// O sentido de um hanzi conforme a lição; se ela não o usa, a lição mais próxima, anterior primeiro.
export function charInfo(lessonN, ch) {
  const order = LESSONS.map((lesson) => lesson.n).sort((a, b) => {
    const rank = (n) => (n === lessonN ? -1 : n < lessonN ? lessonN - n : 100 + n);
    return rank(a) - rank(b);
  });
  for (const n of order) {
    const sense = senseInLesson(n, ch);
    if (sense) return sense;
  }
  const extra = CHAR_EXTRA[ch];
  return extra ? { ...extra, lesson: lessonN } : { p: '', m: '', lesson: lessonN };
}

// Palavras da lição em que o hanzi aparece.
export const wordsInLesson = (lessonN, ch) =>
  ALL_CARDS.filter((card) => card.lesson === lessonN && (card.word.show ?? card.word.h).includes(ch)).map((card) => card.word);
