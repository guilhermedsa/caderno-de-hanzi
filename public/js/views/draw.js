// Modo de desenhar: ver a ordem dos traços, traçar sobre o modelo e escrever de memória.
import { charInfo, lessonChars, wordsInLesson } from '../vocab.js';
import * as store from '../store.js';
import { createPad, h, icon, strokeCount, zh } from '../ui.js';
import { sessionHead, summary, wordPinyin } from './common.js';

const STAGES = [
  { id: 1, label: 'Ver' },
  { id: 2, label: 'Traçar' },
  { id: 3, label: 'De memória' },
];

export function DrawView({ lessonN }) {
  const closeHref = `#/lesson/${lessonN}`;
  const root = h('div', { class: 'session draw' });
  const head = sessionHead(closeHref, 'Hanzi concluídos nesta sessão');
  const body = h('div', { class: 'session-body' });
  root.append(head.el, body);

  let chars = [];
  let index = 0;
  let stage = 1;
  let writer = null;
  let run = 0; // invalida animações e temporizadores de uma etapa anterior
  let timer = null;
  let misses = 0;
  let strokeNum = 0;
  let padSize = 0;
  const sessionMisses = new Map();

  const info = h('div', { class: 'draw-info' });
  const padWrap = h('div', { class: 'pad-wrap' });
  const stepper = h('div', { class: 'stepper', role: 'group', 'aria-label': 'Etapas' });
  const status = h('p', { class: 'draw-status', role: 'status' });
  const prevButton = h('button', { class: 'icon-btn nav-prev', type: 'button', 'aria-label': 'Hanzi anterior', onclick: () => move(-1) }, icon('back'));
  const nextButton = h('button', { class: 'icon-btn nav-next', type: 'button', 'aria-label': 'Próximo hanzi', onclick: () => move(1) }, icon('chevron'));
  const statusRow = h('div', { class: 'draw-status-row' }, prevButton, status, nextButton);
  const actions = h('div', { class: 'draw-actions' });
  const scopeSelect = h(
    'select',
    {
      class: 'scope-select',
      'aria-label': 'Quais hanzi treinar',
      onchange: (event) => {
        store.setSetting('drawScope', event.target.value);
        loadChars();
        index = 0;
        showChar();
      },
    },
    h('option', { value: 'book' }, 'Lista do livro'),
    h('option', { value: 'all' }, 'Todos da lição'),
  );
  const layout = h(
    'div',
    { class: 'draw-layout' },
    h('div', { class: 'draw-side' }, info, stepper, statusRow, actions),
    padWrap,
  );

  function loadChars() {
    chars = lessonChars(lessonN, store.settings().drawScope);
  }

  function clearStage() {
    run += 1;
    clearTimeout(timer);
    try {
      writer?.cancelQuiz();
    } catch {
      /* a etapa anterior pode não ter iniciado um quiz */
    }
    writer = null;
  }

  function renderInfo() {
    const ch = chars[index];
    const sense = charInfo(lessonN, ch);
    const words = wordsInLesson(lessonN, ch).filter((word) => word.h !== ch);
    const fromOther = sense.lesson !== lessonN;
    const content = [
      h(
        'div',
        { class: 'draw-title' },
        h('p', { class: 'draw-py' }, sense.p),
        scopeSelect,
      ),
      h('p', { class: 'draw-m' }, sense.m),
      fromOther && h('p', { class: 'draw-from' }, `Sentido visto na Lição ${sense.lesson}`),
      stage < 3 && words.length > 0 &&
        h(
          'ul',
          { class: 'draw-words' },
          words.slice(0, 3).map((word) => h('li', {}, zh(word.show ?? word.h), ' ', h('span', {}, `${wordPinyin(word)}: ${word.m}`))),
        ),
    ];
    info.replaceChildren(...content.filter(Boolean));
  }

  function renderStepper() {
    stepper.replaceChildren(
      ...STAGES.map((item) =>
        h(
          'button',
          {
            type: 'button',
            class: `step ${stage === item.id ? 'active' : ''}`,
            'aria-pressed': String(stage === item.id),
            onclick: () => startStage(item.id),
          },
          h('b', {}, String(item.id)),
          item.label,
        ),
      ),
    );
  }

  const actionButton = (label, onclick, className = '') => h('button', { type: 'button', class: `btn ${className}`, onclick }, label);

  function startStage(next) {
    clearStage();
    stage = next;
    misses = 0;
    strokeNum = 0;
    const thisRun = run;
    renderInfo();
    renderStepper();
    const ch = chars[index];
    const leniency = store.LENIENCY[store.settings().leniency];
    padSize = Math.min(padWrap.clientWidth, padWrap.clientHeight);

    if (stage === 1) {
      writer = createPad(padWrap, ch, { showOutline: true, showCharacter: false });
      status.textContent = `${strokeCount(ch)} ${strokeCount(ch) === 1 ? 'traço' : 'traços'}. Veja a ordem e a direção.`;
      const play = () => writer?.animateCharacter();
      actions.replaceChildren(
        actionButton('Repetir', () => {
          if (run === thisRun) play();
        }),
        actionButton('Começar a traçar', () => startStage(2), 'primary'),
      );
      timer = setTimeout(() => {
        if (run === thisRun) play();
      }, 250);
      return;
    }

    const fromMemory = stage === 3;
    writer = createPad(padWrap, ch, { showOutline: !fromMemory, leniency });
    const showProgress = () => {
      const total = strokeCount(ch);
      const errors = misses === 1 ? '1 erro' : `${misses} erros`;
      status.textContent = `Traço ${Math.min(strokeNum + 1, total)} de ${total} · ${errors}`;
    };
    showProgress();
    actions.replaceChildren(
      actionButton('Dica', () => {
        if (run === thisRun) writer?.highlightStroke(strokeNum);
      }),
      actionButton('Recomeçar', () => startStage(stage)),
    );
    writer.quiz({
      leniency,
      showHintAfterMisses: fromMemory ? 3 : 1,
      highlightOnComplete: true,
      onMistake: (data) => {
        if (run !== thisRun) return;
        misses = data.totalMistakes;
        strokeNum = data.strokeNum;
        showProgress();
      },
      onCorrectStroke: (data) => {
        if (run !== thisRun) return;
        misses = data.totalMistakes;
        strokeNum = data.strokeNum + 1;
        showProgress();
      },
      onComplete: (data) => {
        if (run !== thisRun) return;
        misses = data.totalMistakes;
        finishStage();
      },
    });
  }

  function finishStage() {
    const thisRun = run;
    if (stage === 2) {
      status.textContent = 'Muito bem. Agora de memória.';
      actions.replaceChildren();
      timer = setTimeout(() => {
        if (run === thisRun) startStage(3);
      }, 1000);
      return;
    }
    const ch = chars[index];
    store.recordChar(ch, misses);
    sessionMisses.set(ch, misses);
    status.textContent = misses === 0 ? 'Concluído, sem nenhum erro.' : misses === 1 ? 'Concluído, com 1 erro.' : `Concluído, com ${misses} erros.`;
    updateHead();
    actions.replaceChildren(
      actionButton('Repetir', () => startStage(3)),
      actionButton(index === chars.length - 1 ? 'Concluir' : 'Próximo hanzi', () => move(1), 'primary'),
    );
  }

  function updateHead() {
    head.update(sessionMisses.size, chars.length, `${index + 1}/${chars.length}`);
  }

  function move(delta) {
    const nextIndex = index + delta;
    if (nextIndex >= chars.length) {
      showSummary();
      return;
    }
    if (nextIndex < 0) return;
    index = nextIndex;
    showChar();
  }

  function showChar() {
    updateHead();
    if (!body.contains(layout)) body.replaceChildren(layout);
    scopeSelect.value = store.settings().drawScope;
    prevButton.style.visibility = index === 0 ? 'hidden' : 'visible';
    startStage(1);
  }

  function showSummary() {
    clearStage();
    const hard = [...sessionMisses.entries()].filter(([, count]) => count > 0).map(([ch]) => ch);
    const clean = sessionMisses.size - hard.length;
    body.replaceChildren(
      summary({
        title: 'Lição treinada',
        lines: [
          sessionMisses.size
            ? `Você escreveu de memória ${sessionMisses.size} de ${chars.length} hanzi, ${clean} sem erros.`
            : 'Nenhum hanzi foi escrito de memória nesta sessão.',
          hard.length ? 'Com erros de traço:' : '',
        ].filter(Boolean),
        missed: hard,
        retry: hard.length
          ? {
              label: 'Treinar os com erro',
              run: () => {
                chars = hard;
                index = 0;
                sessionMisses.clear();
                showChar();
              },
            }
          : null,
        backHref: closeHref,
        backLabel: 'Voltar à lição',
      }),
    );
  }

  let resizeTimer = null;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!body.contains(layout)) return;
      const size = Math.min(padWrap.clientWidth, padWrap.clientHeight);
      if (Math.abs(size - padSize) > 8) startStage(stage);
    }, 200);
  };

  return {
    el: root,
    mount() {
      window.addEventListener('resize', onResize);
      loadChars();
      showChar();
    },
    destroy() {
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
      clearStage();
    },
  };
}
