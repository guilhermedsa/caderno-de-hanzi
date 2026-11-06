// Pequenos utilitários de interface: criação de elementos, hanzi desenhado e painel de escrita.
import { isHan } from './vocab.js';

export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on')) el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (key === 'style') el.style.cssText = value;
    else el.setAttribute(key, value === true ? '' : value);
  }
  el.append(...children.flat(Infinity).filter((child) => child !== null && child !== undefined && child !== false));
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
export function svg(tag, attrs = {}, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  el.append(...children);
  return el;
}

// Texto em chinês: o atributo lang faz o iOS usar a forma simplificada de cada caractere.
export const zh = (text, className = '') => h('span', { lang: 'zh-CN', class: `zh ${className}`.trim() }, text);

const ICONS = {
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  repeat: '<path d="M4 12a8 8 0 0 1 13.7-5.6L20 9"/><path d="M20 4v5h-5"/><path d="M20 12a8 8 0 0 1-13.7 5.6L4 15"/><path d="M4 20v-5h5"/>',
  gear: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1"/>',
  brush: '<path d="M4 20c3 0 5-1 5-4a3 3 0 0 1 3-3l8-9-3-1-9 8a3 3 0 0 0-3 3c0 3-1 4-1 6z"/>',
  card: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 10h6M7 14h10"/>',
  pencil: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  chevron: '<path d="M9 5l7 7-7 7"/>',
};

export function icon(name, size = 24) {
  const el = svg('svg', {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 1.9,
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    'aria-hidden': 'true',
  });
  el.innerHTML = ICONS[name];
  return el;
}

let strokesPromise = null;
let strokes = null;

export function loadStrokes() {
  strokesPromise ??= fetch('data/strokes.json')
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data) => {
      strokes = data;
      return data;
    })
    .catch((err) => {
      strokesPromise = null;
      throw err;
    });
  return strokesPromise;
}

export const strokeCount = (ch) => strokes?.[ch]?.strokes.length ?? 0;

// Hanzi desenhado com os mesmos traços do treino de escrita, no estilo do livro.
export function glyph(ch) {
  const data = strokes?.[ch];
  if (!data) return zh(ch, 'glyph-text');
  const group = svg('g', { transform: 'scale(1 -1) translate(0 -900)', fill: 'currentColor' });
  for (const d of data.strokes) group.append(svg('path', { d }));
  return svg('svg', { class: 'glyph', viewBox: '0 0 1024 1024', role: 'img', 'aria-label': ch }, group);
}

// Palavra completa em hanzi desenhados, incluindo a grafia com parênteses do livro.
export function wordGlyphs(word) {
  const text = word.show ?? word.h;
  const count = [...text].filter(isHan).length;
  const size = count <= 1 ? 'one' : count === 2 ? 'two' : count === 3 ? 'three' : 'many';
  return h(
    'div',
    { class: `word-glyphs size-${size}`, lang: 'zh-CN', 'aria-label': text },
    [...text].map((ch) => (isHan(ch) ? glyph(ch) : ch.trim() ? h('span', { class: 'glyph-mark' }, ch) : null)),
  );
}

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

function gridLines(size) {
  const mid = size / 2;
  const dash = Math.max(4, size / 60);
  const line = (x1, y1, x2, y2, cls) => svg('line', { x1, y1, x2, y2, class: cls, 'stroke-dasharray': `${dash} ${dash}` });
  return svg(
    'g',
    { class: 'pad-grid' },
    svg('rect', { x: 0.5, y: 0.5, width: size - 1, height: size - 1, class: 'pad-border' }),
    line(0, mid, size, mid, 'pad-line'),
    line(mid, 0, mid, size, 'pad-line'),
    line(0, 0, size, size, 'pad-line faint'),
    line(size, 0, 0, size, 'pad-line faint'),
  );
}

// Grade de escrita com um hanzi, no maior tamanho que couber no espaço disponível.
export function createPad(container, ch, options = {}) {
  container.replaceChildren();
  const available = Math.min(container.clientWidth, container.clientHeight || container.clientWidth);
  const size = Math.max(180, Math.min(Math.floor(available), 760));
  const root = svg('svg', { class: 'pad', width: size, height: size, viewBox: `0 0 ${size} ${size}` });
  root.append(gridLines(size));
  container.append(root);
  const writer = window.HanziWriter.create(root, ch, {
    width: size,
    height: size,
    padding: Math.round(size * 0.05),
    showCharacter: false,
    showOutline: true,
    strokeColor: cssVar('--ink'),
    outlineColor: cssVar('--pad-outline'),
    drawingColor: cssVar('--seal'),
    highlightColor: cssVar('--seal'),
    drawingWidth: Math.max(5, Math.round(size / 42)),
    strokeAnimationSpeed: 1.1,
    delayBetweenStrokes: 280,
    charDataLoader: (char, onLoad, onError) => {
      if (strokes?.[char]) onLoad(strokes[char]);
      else onError(new Error(`Sem traços para ${char}`));
    },
    ...options,
  });
  return writer;
}

export function toast(message) {
  document.querySelector('.toast')?.remove();
  const el = h('div', { class: 'toast', role: 'status' }, message);
  document.body.append(el);
  setTimeout(() => el.remove(), 2800);
}
