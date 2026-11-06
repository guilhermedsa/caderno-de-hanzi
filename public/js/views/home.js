// Telas principais: lista de lições, detalhe da lição, revisão e ajustes.
import { LESSONS, lessonByN, lessonCards } from '../vocab.js';
import * as store from '../store.js';
import { h, icon, toast, zh } from '../ui.js';
import { seal, wordDetails, wordPinyin } from './common.js';

const tabs = (active) => {
  const due = store.dueCards('read').length + store.dueCards('write').length;
  const tab = (href, name, iconName, label, badge) =>
    h(
      'a',
      { class: `tab ${active === name ? 'active' : ''}`, href, 'aria-current': active === name ? 'page' : null },
      icon(iconName, 24),
      h('span', {}, label),
      badge ? h('b', { class: 'badge' }, badge > 99 ? '99+' : String(badge)) : null,
    );
  return h(
    'nav',
    { class: 'tabs', 'aria-label': 'Navegação' },
    tab('#/', 'home', 'book', 'Lições'),
    tab('#/review', 'review', 'repeat', 'Revisar', due),
    tab('#/settings', 'settings', 'gear', 'Ajustes'),
  );
};

const screen = (active, ...content) => h('div', { class: 'screen' }, h('main', { class: 'screen-main' }, ...content), tabs(active));

const isIOS = () => /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const isInstalled = () => navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

function installHint() {
  let dismissed = false;
  try {
    dismissed = localStorage.getItem('caderno-hanzi.hint') === '1';
  } catch {
    /* sem armazenamento: o aviso apenas volta a aparecer */
  }
  if (dismissed || isInstalled() || !isIOS()) return null;
  const el = h(
    'aside',
    { class: 'install-hint' },
    h(
      'p',
      {},
      h('b', {}, 'Instale no aparelho. '),
      'No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”. Assim o app funciona sem internet e abre em tela cheia.',
    ),
    h(
      'button',
      {
        class: 'btn small',
        type: 'button',
        onclick: () => {
          try {
            localStorage.setItem('caderno-hanzi.hint', '1');
          } catch {
            /* sem armazenamento */
          }
          el.remove();
        },
      },
      'Entendi',
    ),
  );
  return el;
}

export function HomeView() {
  const due = store.dueCards('read').length + store.dueCards('write').length;
  return {
    el: screen(
      'home',
      h(
        'header',
        { class: 'page-head' },
        h('p', { class: 'eyebrow', lang: 'zh-CN' }, '汉语教程 · 第一册 上'),
        h('h1', {}, 'Caderno de Hanzi'),
      ),
      installHint(),
      due > 0 &&
        h(
          'a',
          { class: 'due-banner', href: '#/review' },
          h('span', {}, h('b', {}, String(due)), due === 1 ? ' revisão para hoje' : ' revisões para hoje'),
          icon('chevron', 20),
        ),
      h(
        'ol',
        { class: 'lesson-list' },
        LESSONS.map((lesson) => {
          const stats = store.lessonStats(lesson.n);
          return h(
            'li',
            {},
            h(
              'a',
              { class: 'lesson-row', href: `#/lesson/${lesson.n}`, 'aria-label': `Lição ${lesson.n}: ${lesson.pt}` },
              seal(lesson.n),
              h(
                'span',
                { class: 'lesson-text' },
                zh(lesson.hz, 'lesson-hz'),
                h('span', { class: 'lesson-pt' }, lesson.pt),
                h('span', { class: 'lesson-meter', 'aria-hidden': 'true' }, h('i', { style: `width:${Math.round(stats.ratio * 100)}%` })),
              ),
            ),
          );
        }),
      ),
    ),
  };
}

function modeCard(href, iconName, title, description, progress) {
  return h(
    'a',
    { class: 'mode-card', href },
    h('span', { class: 'mode-icon' }, icon(iconName, 26)),
    h('span', { class: 'mode-text' }, h('b', {}, title), h('small', {}, description)),
    h('span', { class: 'mode-progress' }, progress),
  );
}

export function LessonView({ n }) {
  const lesson = lessonByN(n);
  const stats = store.lessonStats(n);
  const cards = lessonCards(n, store.settings());
  const list = h(
    'ul',
    { class: 'word-list' },
    cards.map((card) => {
      const details = h('div', { class: 'word-more', hidden: true }, wordDetails(card));
      const button = h(
        'button',
        {
          class: 'word-row',
          type: 'button',
          'aria-expanded': 'false',
          onclick: () => {
            details.hidden = !details.hidden;
            button.setAttribute('aria-expanded', String(!details.hidden));
          },
        },
        zh(card.word.show ?? card.word.h, 'word-hz'),
        h('span', { class: 'word-py' }, wordPinyin(card.word)),
        h('span', { class: 'word-m' }, card.word.m),
      );
      return h('li', {}, button, details);
    }),
  );

  return {
    el: screen(
      'home',
      h(
        'header',
        { class: 'lesson-head' },
        h('a', { class: 'icon-btn', href: '#/', 'aria-label': 'Voltar às lições' }, icon('back')),
        seal(n),
        h(
          'div',
          {},
          h('p', { class: 'eyebrow' }, `Lição ${n} · ${lesson.py}`),
          h('h1', {}, zh(lesson.hz)),
          h('p', { class: 'muted' }, lesson.pt),
        ),
      ),
      h(
        'div',
        { class: 'mode-grid' },
        modeCard(`#/lesson/${n}/draw`, 'brush', 'Desenhar', 'Ver os traços, traçar e escrever de memória', `${stats.drawn}/${stats.chars}`),
        modeCard(`#/lesson/${n}/flash`, 'card', 'Significado e pinyin', 'Veja o hanzi e confira o sentido nesta lição', `${stats.read}/${stats.words}`),
        modeCard(`#/lesson/${n}/dictation`, 'pencil', 'Ditado', 'Veja o sentido e o pinyin e escreva o hanzi', `${stats.write}/${stats.words}`),
      ),
      h('h2', { class: 'section-title' }, `Palavras da lição (${cards.length})`),
      list,
    ),
  };
}

function deckPanel(deck, title, description, href) {
  const due = store.dueCards(deck).length;
  const stats = store.deckStats(deck);
  const next = store.nextDueDay(deck);
  const nextText = next === 1 ? 'Próxima revisão amanhã.' : next ? `Próxima revisão em ${next} dias.` : 'Estude uma lição para começar.';
  return h(
    'section',
    { class: 'deck' },
    h('h2', {}, title),
    h('p', { class: 'muted' }, description),
    h('p', { class: 'deck-due' }, h('b', {}, String(due)), ' para hoje'),
    due > 0 ? h('a', { class: 'btn primary', href }, 'Revisar agora') : h('p', { class: 'muted' }, nextText),
    h('p', { class: 'deck-stats' }, `${stats.learned} de ${stats.total} já estudadas · ${stats.firm} firmes`),
  );
}

export function ReviewView() {
  return {
    el: screen(
      'review',
      h(
        'header',
        { class: 'page-head' },
        h('h1', {}, 'Revisar'),
        h('p', { class: 'muted' }, 'As palavras entram aqui depois que você as estuda em uma lição. O que você erra volta logo; o que acerta volta cada vez mais tarde.'),
      ),
      h(
        'div',
        { class: 'deck-grid' },
        deckPanel('read', 'Significado e pinyin', 'Veja o hanzi e confira.', '#/review/flash'),
        deckPanel('write', 'Ditado', 'Veja o sentido e escreva o hanzi.', '#/review/dictation'),
      ),
    ),
  };
}

function segmented(name, label, options, value, onChange) {
  return h(
    'fieldset',
    { class: 'setting' },
    h('legend', {}, label),
    h(
      'div',
      { class: 'segmented' },
      options.map(([optionValue, text]) =>
        h(
          'label',
          {},
          h('input', {
            type: 'radio',
            name,
            value: optionValue,
            checked: value === optionValue,
            onchange: () => onChange(optionValue),
          }),
          h('span', {}, text),
        ),
      ),
    ),
  );
}

function toggle(label, hint, value, onChange) {
  return h(
    'label',
    { class: 'setting toggle' },
    h('span', {}, h('b', {}, label), hint && h('small', {}, hint)),
    h('input', { type: 'checkbox', role: 'switch', checked: value, onchange: (event) => onChange(event.target.checked) }),
  );
}

async function exportBackup() {
  const name = `caderno-hanzi-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([store.exportJson()], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Backup do Caderno de Hanzi' });
    } catch (err) {
      if (err.name !== 'AbortError') toast('Não foi possível compartilhar o backup.');
    }
    return;
  }
  const url = URL.createObjectURL(file);
  h('a', { href: url, download: name }).click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function SettingsView({ applyTheme, refresh }) {
  const current = store.settings();
  const fileInput = h('input', {
    type: 'file',
    accept: 'application/json,.json',
    hidden: true,
    onchange: async (event) => {
      const [file] = event.target.files;
      if (!file) return;
      try {
        store.importJson(await file.text());
        toast('Backup restaurado.');
        applyTheme();
        refresh();
      } catch (err) {
        toast(err instanceof SyntaxError ? 'Arquivo de backup inválido.' : err.message);
      }
      event.target.value = '';
    },
  });
  return {
    el: screen(
      'settings',
      h('header', { class: 'page-head' }, h('h1', {}, 'Ajustes')),
      h(
        'div',
        { class: 'settings' },
        segmented(
          'leniency',
          'Correção dos traços',
          [
            ['flexible', 'Flexível'],
            ['normal', 'Normal'],
            ['strict', 'Rigorosa'],
          ],
          current.leniency,
          (value) => store.setSetting('leniency', value),
        ),
        segmented(
          'theme',
          'Aparência',
          [
            ['auto', 'Automática'],
            ['light', 'Clara'],
            ['dark', 'Escura'],
          ],
          current.theme,
          (value) => {
            store.setSetting('theme', value);
            applyTheme();
          },
        ),
        toggle('Embaralhar cartões', 'Se desligado, segue a ordem do livro.', current.shuffle, (value) => store.setSetting('shuffle', value)),
        toggle('Incluir nomes próprios', 'Como 麦克 e 北京, nos cartões e no ditado.', current.names, (value) => store.setSetting('names', value)),
      ),
      h('h2', { class: 'section-title' }, 'Backup do progresso'),
      h('p', { class: 'muted block' }, 'O progresso fica guardado neste aparelho. Para levar ao iPhone ou ao iPad, exporte aqui e importe no outro. A importação substitui o progresso atual.'),
      h(
        'div',
        { class: 'button-row' },
        h('button', { class: 'btn', type: 'button', onclick: exportBackup }, 'Exportar'),
        h('button', { class: 'btn', type: 'button', onclick: () => fileInput.click() }, 'Importar'),
        fileInput,
      ),
      h('h2', { class: 'section-title' }, 'Recomeçar'),
      h(
        'div',
        { class: 'button-row' },
        h(
          'button',
          {
            class: 'btn danger',
            type: 'button',
            onclick: () => {
              if (window.confirm('Apagar todo o progresso neste aparelho? Exporte um backup antes se quiser guardar.')) {
                store.resetProgress();
                toast('Progresso apagado.');
                refresh();
              }
            },
          },
          'Apagar progresso',
        ),
      ),
      h('h2', { class: 'section-title' }, 'Sobre'),
      h(
        'p',
        { class: 'muted block small' },
        'Vocabulário organizado conforme ',
        zh('汉语教程 第一册(上)'),
        '. Significados em português escritos para este app. Traços: ',
        h('a', { href: 'vendor/hanzi-writer-LICENSE.txt' }, 'Hanzi Writer (MIT)'),
        ' e Make Me a Hanzi (',
        h('a', { href: 'vendor/ARPHICPL.txt' }, 'Arphic Public License'),
        ').',
      ),
    ),
  };
}
