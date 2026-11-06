// Partes de tela usadas por mais de um modo: cabeçalho de sessão, detalhes da palavra e resumo.
import { compoundsWith, hanChars, otherSenses, soloSense } from '../vocab.js';
import { h, icon, zh } from '../ui.js';

const NUMERALS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五'];
export const seal = (n) => h('span', { class: 'seal', lang: 'zh-CN', 'aria-hidden': 'true' }, NUMERALS[n]);

export const wordPinyin = (word) => word.pShow ?? word.p;

export function sessionHead(closeHref, label) {
  const bar = h('span', { class: 'progress-fill' });
  const count = h('span', { class: 'session-count' });
  const el = h(
    'header',
    { class: 'session-head' },
    h('a', { class: 'icon-btn', href: closeHref, 'aria-label': 'Sair' }, icon('close')),
    h('div', { class: 'progress', role: 'progressbar', 'aria-label': label }, bar),
    count,
  );
  return {
    el,
    update(done, total, text) {
      bar.style.width = `${total ? Math.round((done / total) * 100) : 0}%`;
      count.textContent = text ?? `${done}/${total}`;
    },
  };
}

function partRows(card) {
  const { word, lesson } = card;
  return word.parts.map((part) => {
    const solo = soloSense(part, lesson);
    return h(
      'li',
      { class: 'part' },
      zh(part.h, 'part-hz'),
      h('span', { class: 'part-py', lang: 'zh-Latn' }, part.p),
      h(
        'span',
        { class: 'part-m' },
        part.m,
        solo && h('small', { class: 'part-solo' }, `sozinho: ${solo.m}`),
      ),
    );
  });
}

// O verso do cartão: pinyin e sentido da lição, e como cada hanzi funciona na palavra.
export function wordDetails(card) {
  const { word, lesson } = card;
  const senses = otherSenses(card);
  const isCompound = hanChars(word.h).length > 1;
  const compounds = isCompound ? [] : compoundsWith(word.h, lesson, card.id).slice(0, 4);
  return [
    word.parts.length > 0 &&
      h(
        'section',
        { class: 'detail-block' },
        h('h3', {}, 'Cada hanzi nesta palavra'),
        h('ul', { class: 'parts' }, partRows(card)),
      ),
    word.note && h('p', { class: 'note' }, word.note),
    senses.length > 0 &&
      h(
        'section',
        { class: 'detail-block' },
        h('h3', {}, 'Em outras lições'),
        h(
          'ul',
          { class: 'senses' },
          senses.map((sense) => h('li', {}, h('b', {}, `Lição ${sense.lesson}: `), sense.m)),
        ),
      ),
    compounds.length > 0 &&
      h(
        'section',
        { class: 'detail-block' },
        h('h3', {}, 'Também aparece em'),
        h(
          'ul',
          { class: 'compounds' },
          compounds.map((other) =>
            h('li', {}, zh(other.word.h), ' ', h('span', { class: 'muted' }, other.word.m), h('small', {}, ` L${other.lesson}`)),
          ),
        ),
      ),
    word.src === 'glossario' && h('p', { class: 'source' }, 'Consta no glossário do livro, fora da lista de palavras desta lição.'),
    word.src === 'texto' && h('p', { class: 'source' }, 'Aparece no texto desta lição, fora da lista de palavras.'),
  ];
}

export function summary({ title, lines, missed = [], retry, backHref, backLabel }) {
  return h(
    'div',
    { class: 'summary' },
    h('p', { class: 'summary-mark', 'aria-hidden': 'true', lang: 'zh-CN' }, '好'),
    h('h2', {}, title),
    lines.map((line) => h('p', { class: 'muted' }, line)),
    missed.length > 0 && h('div', { class: 'missed' }, missed.map((text) => zh(text, 'chip'))),
    h(
      'div',
      { class: 'summary-actions' },
      retry && h('button', { class: 'btn primary', type: 'button', onclick: retry.run }, retry.label),
      h('a', { class: `btn ${retry ? '' : 'primary'}`, href: backHref }, backLabel),
    ),
  );
}
