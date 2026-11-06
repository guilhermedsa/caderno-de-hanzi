// Modo de significado e pinyin: aparece o hanzi, você toca para conferir e marca se acertou.
import { createSession } from '../session.js';
import * as store from '../store.js';
import { h, wordGlyphs } from '../ui.js';
import { sessionHead, summary, wordDetails, wordPinyin } from './common.js';

export function FlashView({ cards, closeHref, closeLabel, emptyText }) {
  const root = h('div', { class: 'session flash' });
  const head = sessionHead(closeHref, 'Progresso da sessão');
  const body = h('div', { class: 'session-body' });
  root.append(head.el, body);

  let session;
  let keyHandler = null;

  function setKeys(handler) {
    keyHandler = handler;
  }

  function showEmpty() {
    body.replaceChildren(summary({ title: 'Nada para estudar aqui', lines: [emptyText], backHref: closeHref, backLabel: closeLabel }));
  }

  function start(list) {
    session = createSession(list, { shuffle: store.settings().shuffle });
    showFront();
  }

  function showFront() {
    if (session.done) {
      showSummary();
      return;
    }
    head.update(session.finished, session.total);
    const card = session.current;
    const reveal = () => showBack(card);
    const face = h(
      'button',
      { class: 'card-face', type: 'button', onclick: reveal, 'aria-label': 'Mostrar pinyin e significado' },
      h('span', { class: 'card-lesson' }, `Lição ${card.lesson}`),
      wordGlyphs(card.word),
      h('span', { class: 'card-tap' }, 'Toque para conferir'),
    );
    body.replaceChildren(face);
    body.scrollTop = 0;
    setKeys((event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        reveal();
      }
    });
  }

  function showBack(card) {
    const { word } = card;
    const answer = (ok) => {
      const { firstAttempt } = session.answer(ok);
      store.answerCard('read', card.id, ok, firstAttempt);
      showFront();
    };
    body.replaceChildren(
      h(
        'div',
        { class: 'card-back' },
        h(
          'div',
          { class: 'card-scroll' },
          h('div', { class: 'card-word' }, wordGlyphs(word)),
          h('p', { class: 'card-py' }, wordPinyin(word)),
          h('p', { class: 'card-m' }, word.m),
          h('p', { class: 'card-meta' }, [word.c, `sentido da Lição ${card.lesson}`].filter(Boolean).join(' · ')),
          wordDetails(card),
        ),
        h(
          'div',
          { class: 'answer-row' },
          h('button', { class: 'btn wrong', type: 'button', onclick: () => answer(false) }, 'Errei'),
          h('button', { class: 'btn right', type: 'button', onclick: () => answer(true) }, 'Acertei'),
        ),
      ),
    );
    setKeys((event) => {
      if (event.key === 'ArrowLeft' || event.key === '1') answer(false);
      if (event.key === 'ArrowRight' || event.key === '2') answer(true);
    });
  }

  function showSummary() {
    head.update(session.total, session.total);
    setKeys(null);
    const { missed, rightFirstTry, total } = session;
    body.replaceChildren(
      summary({
        title: 'Sessão concluída',
        lines: [`Você acertou ${rightFirstTry} de ${total} de primeira.`],
        missed: missed.map((card) => card.word.show ?? card.word.h),
        retry: missed.length ? { label: 'Treinar as que errei', run: () => start(missed) } : null,
        backHref: closeHref,
        backLabel: closeLabel,
      }),
    );
  }

  const onKey = (event) => keyHandler?.(event);

  return {
    el: root,
    mount() {
      document.addEventListener('keydown', onKey);
      if (cards.length) start(cards);
      else showEmpty();
    },
    destroy() {
      document.removeEventListener('keydown', onKey);
    },
  };
}
