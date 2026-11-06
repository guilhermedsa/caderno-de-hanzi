// Progresso e ajustes, guardados no próprio aparelho, com backup por arquivo.
import { dayNumber, grade, isDue, isLearned } from './srs.js';
import { allCards, lessonCards, lessonChars } from './vocab.js';

const KEY = 'caderno-hanzi.v1';
const DEFAULT_SETTINGS = { names: true, shuffle: true, leniency: 'normal', theme: 'auto', drawScope: 'book' };
const empty = () => ({ settings: { ...DEFAULT_SETTINGS }, read: {}, write: {}, chars: {} });

export const LENIENCY = { flexible: 1.5, normal: 1.15, strict: 0.85 };

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return normalize(JSON.parse(raw));
  } catch {
    return empty();
  }
}

function normalize(data) {
  return {
    settings: { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) },
    read: data.read ?? {},
    write: data.write ?? {},
    chars: data.chars ?? {},
  };
}

let state = load();

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export const settings = () => state.settings;

export function setSetting(name, value) {
  state.settings[name] = value;
  save();
}

export function answerCard(deck, id, ok, firstAttempt) {
  state[deck][id] = grade(state[deck][id], ok, dayNumber(), { firstAttempt });
  save();
}

export function recordChar(ch, misses) {
  const prev = state.chars[ch] ?? { count: 0 };
  state.chars[ch] = { count: prev.count + 1, last: misses, day: dayNumber() };
  save();
}

export const charPracticed = (ch) => Boolean(state.chars[ch]?.count);
export const charRecord = (ch) => state.chars[ch] ?? null;

export function dueCards(deck) {
  const today = dayNumber();
  return allCards(state.settings).filter((card) => isDue(state[deck][card.id], today));
}

export function nextDueDay(deck) {
  const today = dayNumber();
  const days = allCards(state.settings)
    .map((card) => state[deck][card.id]?.due)
    .filter((due) => due !== undefined && due > today);
  return days.length ? Math.min(...days) - today : null;
}

export function deckStats(deck) {
  const cards = allCards(state.settings);
  const learned = cards.filter((card) => isLearned(state[deck][card.id])).length;
  const firm = cards.filter((card) => (state[deck][card.id]?.interval ?? 0) >= 21).length;
  return { total: cards.length, learned, firm };
}

export function lessonStats(n) {
  const cards = lessonCards(n, state.settings);
  const count = (deck) => cards.filter((card) => isLearned(state[deck][card.id])).length;
  const chars = lessonChars(n, 'book');
  const drawn = chars.filter(charPracticed).length;
  const read = count('read');
  const write = count('write');
  const parts = cards.length * 2 + chars.length;
  return {
    words: cards.length,
    chars: chars.length,
    read,
    write,
    drawn,
    ratio: parts ? (read + write + drawn) / parts : 0,
  };
}

export function exportJson() {
  return JSON.stringify({ app: 'caderno-de-hanzi', version: 1, exportedAt: new Date().toISOString(), ...state }, null, 1);
}

export function importJson(text) {
  const data = JSON.parse(text);
  if (data?.app !== 'caderno-de-hanzi') throw new Error('Este arquivo não é um backup do Caderno de Hanzi.');
  state = normalize(data);
  if (!save()) throw new Error('Não foi possível salvar neste aparelho.');
}

export function resetProgress() {
  state = { ...empty(), settings: state.settings };
  save();
}
