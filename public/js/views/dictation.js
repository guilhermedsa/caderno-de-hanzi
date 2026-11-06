// Ditado: aparece o significado e o pinyin, e você desenha o hanzi de memória, com correção.
import { createSession } from '../session.js';
import * as store from '../store.js';
import { createPad, glyph, h } from '../ui.js';
import { hanChars } from '../vocab.js';
import { sessionHead, summary, wordDetails, wordPinyin } from './common.js';

// Traços rejeitados por imprecisão são comuns com o dedo; até dois por hanzi ainda contam como acerto.
const TOLERATED_MISSES_PER_CHAR = 2;

export const dictationPassed = (misses, charCount, helped) => !helped && misses <= charCount * TOLERATED_MISSES_PER_CHAR;

export function DictationView({ cards, closeHref, closeLabel, emptyText }) {
  const root = h('div', { class: 'session dictation' });
  const head = sessionHead(closeHref, 'Progresso da sessão');
  const body = h('div', { class: 'session-body' });
  root.append(head.el, body);

  let session;
  let writer = null;
  let run = 0;
  let padSize = 0;

  const clue = h('div', { class: 'dict-clue' });
  const slots = h('div', { class: 'dict-slots', 'aria-label': 'Hanzi da palavra' });
  const padWrap = h('div', { class: 'pad-wrap' });
  const status = h('p', { class: 'draw-status', role: 'status' });
  const actions = h('div', { class: 'draw-actions' });
  const layout = h('div', { class: 'draw-layout' }, h('div', { class: 'draw-side' }, clue, slots, status, actions), padWrap);

  let attempt = null;

  function clearWriter() {
    run += 1;
    try {
      writer?.cancelQuiz();
    } catch {
      /* não havia quiz em andamento */
    }
    writer = null;
  }

  function start(list) {
    session = createSession(list, { shuffle: store.settings().shuffle });
    nextCard();
  }

  function nextCard() {
    if (session.done) {
      showSummary();
      return;
    }
    head.update(session.finished, session.total);
    const card = session.current;
    attempt = { card, chars: hanChars(card.word.h), at: 0, misses: 0, helped: false };
    if (!body.contains(layout)) body.replaceChildren(layout);
    clue.replaceChildren(
      h('p', { class: 'card-lesson' }, `Lição ${card.lesson}`),
      h('p', { class: 'dict-m' }, card.word.m),
      h('p', { class: 'dict-py' }, wordPinyin(card.word)),
    );
    startChar();
  }

  function renderSlots() {
    slots.replaceChildren(
      ...attempt.chars.map((ch, i) =>
        h('span', { class: `slot ${i === attempt.at ? 'current' : ''} ${i < attempt.at ? 'done' : ''}` }, i < attempt.at ? glyph(ch) : ''),
      ),
    );
  }

  function statusText() {
    const { misses, chars, at } = attempt;
    const errors = misses === 1 ? '1 erro' : `${misses} erros`;
    return chars.length > 1 ? `Hanzi ${at + 1} de ${chars.length} · ${errors}` : errors;
  }

  function startChar({ traced = false } = {}) {
    clearWriter();
    const thisRun = run;
    renderSlots();
    const ch = attempt.chars[attempt.at];
    const leniency = store.LENIENCY[store.settings().leniency];
    padSize = Math.min(padWrap.clientWidth, padWrap.clientHeight);
    writer = createPad(padWrap, ch, { showOutline: traced, leniency });
    status.textContent = traced ? 'Trace o hanzi para fixar a forma.' : statusText();
    let missesBefore = attempt.misses;
    actions.replaceChildren(
      traced
        ? null
        : h(
            'button',
            {
              class: 'btn',
              type: 'button',
              onclick: () => {
                attempt.helped = true;
                startChar({ traced: true });
              },
            },
            'Não lembro',
          ),
    );
    writer.quiz({
      leniency,
      showHintAfterMisses: traced ? 1 : 3,
      onMistake: (data) => {
        if (run !== thisRun) return;
        attempt.misses = missesBefore + data.totalMistakes;
        if (!traced) status.textContent = statusText();
      },
      onCorrectStroke: (data) => {
        if (run !== thisRun) return;
        attempt.misses = missesBefore + data.totalMistakes;
        if (!traced) status.textContent = statusText();
      },
      onComplete: (data) => {
        if (run !== thisRun) return;
        attempt.misses = missesBefore + data.totalMistakes;
        missesBefore = attempt.misses;
        attempt.at += 1;
        if (attempt.at < attempt.chars.length) {
          setTimeout(() => {
            if (run === thisRun) startChar();
          }, 450);
        } else {
          setTimeout(() => {
            if (run === thisRun) finishCard();
          }, 500);
        }
      },
    });
  }

  function finishCard() {
    clearWriter();
    const { card, misses, helped, chars } = attempt;
    const ok = dictationPassed(misses, chars.length, helped);
    const { firstAttempt } = session.answer(ok);
    store.answerCard('write', card.id, ok, firstAttempt);
    const verdict = helped
      ? 'Com ajuda. Esta palavra volta mais adiante.'
      : ok
        ? misses === 0
          ? 'Certo, sem nenhum erro.'
          : misses === 1
            ? 'Certo, com 1 erro de traço.'
            : `Certo, com ${misses} erros de traço.`
        : `${misses} erros de traço. Esta palavra volta mais adiante.`;
    body.replaceChildren(
      h(
        'div',
        { class: 'card-back' },
        h(
          'div',
          { class: 'card-scroll' },
          h('p', { class: `verdict ${ok ? 'good' : 'bad'}`, role: 'status' }, verdict),
          h('div', { class: 'card-word' }, chars.map((ch) => glyph(ch))),
          h('p', { class: 'card-py' }, wordPinyin(card.word)),
          h('p', { class: 'card-m' }, card.word.m),
          wordDetails(card),
        ),
        h('div', { class: 'answer-row' }, h('button', { class: 'btn primary', type: 'button', onclick: nextCard }, 'Continuar')),
      ),
    );
  }

  function showSummary() {
    clearWriter();
    head.update(session.total, session.total);
    const { missed, rightFirstTry, total } = session;
    body.replaceChildren(
      summary({
        title: 'Ditado concluído',
        lines: [`Você acertou ${rightFirstTry} de ${total} de primeira.`],
        missed: missed.map((card) => card.word.h),
        retry: missed.length ? { label: 'Treinar as que errei', run: () => start(missed) } : null,
        backHref: closeHref,
        backLabel: closeLabel,
      }),
    );
  }

  let resizeTimer = null;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!body.contains(layout) || !attempt) return;
      const size = Math.min(padWrap.clientWidth, padWrap.clientHeight);
      if (Math.abs(size - padSize) > 8) startChar();
    }, 200);
  };

  return {
    el: root,
    mount() {
      window.addEventListener('resize', onResize);
      if (cards.length) start(cards);
      else body.replaceChildren(summary({ title: 'Nada para escrever aqui', lines: [emptyText], backHref: closeHref, backLabel: closeLabel }));
    },
    destroy() {
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
      clearWriter();
    },
  };
}
