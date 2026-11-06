// Início do app: tema, navegação por endereço (#/...) e instalação para uso offline.
import * as store from './store.js';
import { h, loadStrokes, toast } from './ui.js';
import { lessonByN, lessonCards } from './vocab.js';
import { DictationView } from './views/dictation.js';
import { DrawView } from './views/draw.js';
import { FlashView } from './views/flash.js';
import { HomeView, LessonView, ReviewView, SettingsView } from './views/home.js';

const app = document.getElementById('app');
let currentView = null;

function applyTheme() {
  const { theme } = store.settings();
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
}

function resolve(hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [first, second, third] = parts;

  if (first === 'lesson' && lessonByN(Number(second))) {
    const n = Number(second);
    const lessonHref = `#/lesson/${n}`;
    const cards = () => lessonCards(n, store.settings());
    if (third === 'draw') return DrawView({ lessonN: n });
    if (third === 'flash') {
      return FlashView({ cards: cards(), closeHref: lessonHref, closeLabel: 'Voltar à lição', emptyText: 'Esta lição não tem palavras com os ajustes atuais.' });
    }
    if (third === 'dictation') {
      return DictationView({ cards: cards(), closeHref: lessonHref, closeLabel: 'Voltar à lição', emptyText: 'Esta lição não tem palavras com os ajustes atuais.' });
    }
    return LessonView({ n });
  }
  if (first === 'review') {
    if (second === 'flash') {
      return FlashView({ cards: store.dueCards('read'), closeHref: '#/review', closeLabel: 'Voltar', emptyText: 'Não há revisões para hoje.' });
    }
    if (second === 'dictation') {
      return DictationView({ cards: store.dueCards('write'), closeHref: '#/review', closeLabel: 'Voltar', emptyText: 'Não há revisões para hoje.' });
    }
    return ReviewView();
  }
  if (first === 'settings') return SettingsView({ applyTheme, refresh: render });
  return HomeView();
}

function render() {
  currentView?.destroy?.();
  currentView = resolve(location.hash);
  app.replaceChildren(currentView.el);
  window.scrollTo(0, 0);
  currentView.mount?.();
}

function showLoadError() {
  app.replaceChildren(
    h(
      'div',
      { class: 'summary' },
      h('h2', {}, 'Não foi possível carregar o app'),
      h('p', { class: 'muted' }, 'Na primeira vez, é preciso estar conectado à internet para baixar os dados.'),
      h('div', { class: 'summary-actions' }, h('button', { class: 'btn primary', type: 'button', onclick: () => start() }, 'Tentar de novo')),
    ),
  );
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController) toast('App atualizado. A nova versão entra na próxima abertura.');
  });
  navigator.serviceWorker.register('sw.js').catch(() => {
    /* sem service worker o app funciona normalmente, apenas não fica offline */
  });
}

async function start() {
  applyTheme();
  app.replaceChildren(h('p', { class: 'loading', lang: 'zh-CN' }, '汉'));
  try {
    await loadStrokes();
  } catch {
    showLoadError();
    return;
  }
  render();
}

window.addEventListener('hashchange', render);
navigator.storage?.persist?.().catch(() => {});
registerServiceWorker();
start();
