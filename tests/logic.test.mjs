import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSession } from '../public/js/session.js';
import { dayNumber, grade, isDue, isLearned } from '../public/js/srs.js';
import { charInfo, compoundsWith, lessonChars, lessonCards, otherSenses, soloSense, cardById } from '../public/js/vocab.js';

const TODAY = 20000;

test('acertos seguidos afastam a próxima revisão', () => {
  const first = grade(undefined, true, TODAY);
  assert.equal(first.interval, 1);
  assert.equal(first.due, TODAY + 1);
  const second = grade(first, true, TODAY + 1);
  assert.equal(second.interval, 3);
  const third = grade(second, true, TODAY + 4);
  assert.ok(third.interval > 3);
  assert.equal(third.due, TODAY + 4 + third.interval);
});

test('um erro traz o cartão de volta para hoje e reduz a facilidade uma vez por sessão', () => {
  const learned = grade(grade(undefined, true, TODAY), true, TODAY + 1);
  const wrong = grade(learned, false, TODAY + 4, { firstAttempt: true });
  assert.equal(wrong.reps, 0);
  assert.equal(wrong.due, TODAY + 4);
  assert.equal(wrong.lapses, 1);
  const again = grade(wrong, false, TODAY + 4, { firstAttempt: false });
  assert.equal(again.ease, wrong.ease);
  assert.equal(again.lapses, 1);
  const fixed = grade(again, true, TODAY + 4, { firstAttempt: false });
  assert.equal(fixed.interval, 1);
  assert.equal(fixed.ease, wrong.ease);
  assert.equal(fixed.due, TODAY + 5);
});

test('isDue e isLearned tratam cartões nunca estudados', () => {
  assert.equal(isDue(undefined, TODAY), false);
  assert.equal(isLearned(undefined), false);
  assert.equal(isDue({ due: TODAY }, TODAY), true);
  assert.equal(isDue({ due: TODAY + 1 }, TODAY), false);
});

test('dayNumber muda à meia-noite local', () => {
  const before = new Date(2026, 10, 6, 23, 59);
  const after = new Date(2026, 10, 7, 0, 1);
  assert.equal(dayNumber(after) - dayNumber(before), 1);
});

test('sessão: cartão errado volta depois e só a primeira resposta conta', () => {
  const session = createSession(['a', 'b', 'c'], { gap: 1 });
  assert.equal(session.current, 'a');
  assert.deepEqual(session.answer(false), { card: 'a', firstAttempt: true });
  assert.equal(session.current, 'b');
  session.answer(true);
  assert.equal(session.current, 'a');
  assert.deepEqual(session.answer(true), { card: 'a', firstAttempt: false });
  session.answer(true);
  assert.equal(session.done, true);
  assert.equal(session.finished, 3);
  assert.equal(session.rightFirstTry, 2);
  assert.deepEqual(session.missed, ['a']);
});

test('sessão com um só cartão errado continua até acertar', () => {
  const session = createSession(['a']);
  session.answer(false);
  assert.equal(session.done, false);
  assert.equal(session.current, 'a');
  session.answer(true);
  assert.equal(session.done, true);
});

test('o sentido acompanha a lição', () => {
  const l8 = cardById('8:找');
  const l10 = cardById('10:找');
  assert.equal(l8.word.m, 'dar o troco');
  assert.equal(l10.word.m, 'procurar');
  assert.deepEqual(otherSenses(l8).map((sense) => sense.lesson), [10]);
  assert.equal(charInfo(8, '找').m, 'dar o troco');
  assert.equal(charInfo(10, '找').m, 'procurar');
  assert.equal(charInfo(12, '给').m, 'para; a (alguém)');
  assert.equal(charInfo(8, '给').m, 'dar');
});

test('dentro de uma palavra, o hanzi mostra o sentido daquele uso', () => {
  const guixing = cardById('6:贵姓');
  const gui = guixing.word.parts[0];
  assert.equal(gui.h, '贵');
  assert.equal(soloSense(gui, 6)?.m, 'caro');
  const haojiu = cardById('14:好久').word.parts[0];
  assert.equal(soloSense(haojiu, 14)?.m, 'bom; bem');
  const nihao = cardById('1:你好').word.parts[0];
  assert.equal(soloSense(nihao, 1), null);
  const daifu = cardById('15:大夫').word.parts[0];
  assert.equal(daifu.p, 'dài');
  assert.equal(soloSense(daifu, 15)?.m, 'grande');
});

test('hanzi só de lista de escrita buscam o sentido em outra lição', () => {
  const ge = charInfo(15, '哥');
  assert.equal(ge.lesson, 2);
  assert.equal(ge.p, 'gē');
  const yuan = charInfo(8, '元');
  assert.equal(yuan.p, 'yuán');
  assert.equal(yuan.lesson, 8);
  assert.equal(charInfo(9, '元').m, 'unidade de moeda');
});

test('lista do livro e lista completa de hanzi', () => {
  const book = lessonChars(8, 'book');
  const all = lessonChars(8, 'all');
  assert.equal(book.length, 14);
  assert.deepEqual(all.slice(0, 14), book);
  assert.ok(all.includes('苹'));
  assert.equal(new Set(all).size, all.length);
});

test('nomes próprios podem ser retirados', () => {
  assert.ok(lessonCards(3, { names: true }).some((card) => card.word.h === '北京'));
  assert.ok(!lessonCards(3, { names: false }).some((card) => card.word.h === '北京'));
});

test('palavras relacionadas respeitam a lição atual', () => {
  const compounds = compoundsWith('好', 1).map((card) => card.word.h);
  assert.deepEqual(compounds, ['你好']);
  assert.ok(compoundsWith('好', 14).some((card) => card.word.h === '好久'));
});
