// Gera os arquivos derivados em public/: traços, biblioteca, licença, ícones e lista offline.
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { LESSONS } from '../public/js/lessons-data.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const pkg = (p) => join(root, 'node_modules', p);
for (const dir of ['data', 'vendor', 'icons']) mkdirSync(join(pub, dir), { recursive: true });

// Traços de todos os hanzi usados no app, em um único arquivo para funcionar offline.
const chars = new Set();
const addHan = (text = '') => {
  for (const ch of text) if (/\p{Script=Han}/u.test(ch)) chars.add(ch);
};
for (const lesson of LESSONS) {
  addHan(lesson.write);
  addHan(lesson.hz);
  for (const word of lesson.words) {
    addHan(word.h);
    addHan(word.show);
  }
}
addHan('汉');

const strokes = {};
const missing = [];
for (const ch of [...chars].sort()) {
  try {
    const { strokes: paths, medians } = JSON.parse(readFileSync(pkg(`hanzi-writer-data/${ch}.json`), 'utf8'));
    strokes[ch] = { strokes: paths, medians };
  } catch {
    missing.push(ch);
  }
}
if (missing.length) console.warn(`Sem traços (exibidos como texto): ${missing.join(' ')}`);
writeFileSync(join(pub, 'data/strokes.json'), JSON.stringify(strokes));

// Biblioteca e licenças.
const lib = readFileSync(pkg('hanzi-writer/dist/hanzi-writer.min.js'), 'utf8').replace(/\/\/# sourceMappingURL=.*$/m, '');
writeFileSync(join(pub, 'vendor/hanzi-writer.min.js'), lib);
copyFileSync(pkg('hanzi-writer-data/ARPHICPL.TXT'), join(pub, 'vendor/ARPHICPL.txt'));
copyFileSync(pkg('hanzi-writer/LICENSE'), join(pub, 'vendor/hanzi-writer-LICENSE.txt'));

// Ícone: selo vermelho com 汉, desenhado a partir dos próprios traços.
const glyph = strokes['汉'].strokes.map((d) => `<path d="${d}"/>`).join('');
const iconSvg = (size, scale) => {
  const k = (size / 1024) * scale;
  const offset = (size - 1024 * k) / 2;
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="#A8261D"/>
    <g fill="#FBF3E4" transform="translate(${offset} ${offset}) scale(${k}) scale(1 -1) translate(0 -900)">${glyph}</g>
  </svg>`);
};
for (const [file, size, scale] of [
  ['apple-touch-icon.png', 180, 0.8],
  ['icon-192.png', 192, 0.8],
  ['icon-512.png', 512, 0.8],
  ['icon-maskable-512.png', 512, 0.62],
]) {
  await sharp(iconSvg(size, scale)).png().toFile(join(pub, 'icons', file));
}

// Service worker com a lista de arquivos embutida; a versão muda quando qualquer arquivo muda.
const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
const files = walk(pub)
  .map((full) => relative(pub, full).split(sep).join('/'))
  .filter((file) => file !== 'sw.js')
  .sort();
const template = readFileSync(join(root, 'scripts/sw-template.js'), 'utf8');
const hash = createHash('sha256').update(template);
for (const file of files) hash.update(file).update(readFileSync(join(pub, file)));
const version = hash.digest('hex').slice(0, 12);
writeFileSync(
  join(pub, 'sw.js'),
  template.replace('__VERSION__', version).replace('__FILES__', JSON.stringify(['./', ...files])),
);

const kb = (file) => `${Math.round(statSync(join(pub, file)).size / 1024)} KB`;
console.log(`${Object.keys(strokes).length} hanzi em data/strokes.json (${kb('data/strokes.json')})`);
console.log(`${files.length} arquivos para uso offline, versão ${version}`);
