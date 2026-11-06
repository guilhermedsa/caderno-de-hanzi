// Confere a transcrição: compara as listas por lição com o glossário do livro
// (uma segunda fonte, independente), com um dicionário de pinyin e com os dados de traços.
import { existsSync } from 'node:fs';
import { pinyin } from 'pinyin-pro';
import { LESSONS, CHAR_EXTRA } from '../public/js/lessons-data.js';

// Glossário do livro (páginas 152 a 157): hanzi, pinyin, lição.
const GLOSSARY = `
阿拉伯文 Ālābówén 6|阿拉伯语 Ālābóyǔ 3|啊 à 14|八 bā 1|爸爸 bàba 2|白 bái 1|百 bǎi 9|班 bān 12|办公 bàngōng 10|办公室 bàngōngshì 10|包子 bāozi 7|杯 bēi 14|本 běn 13|笔 bǐ 13|比较 bǐjiào 12|别的 biéde 8|不 bù 1|不客气 búkèqi 5|茶 chá 5|茶叶 cháyè 13|车 chē 14|吃 chī 7|出租车 chūzūchē 14|词典 cídiǎn 13|大 dà 1|大概 dàgài 15|大学 dàxué 12|大夫 dàifu 15|但是 dànshì 12|蛋 dàn 7|德国 Déguó 6|德文 Déwén 6|德语 Déyǔ 3|的 de 6|等 děng 9|弟弟 dìdi 2|点儿 diǎnr 14|电 diàn 10|电话 diànhuà 10|都 dōu 11|读 dú 12|对 duì 3|对不起 duìbuqǐ 4|多 duō 15|多 duō 8|多少 duōshao 8|俄国 Éguó 6|俄文 Éwén 6|俄语 Éyǔ 3|二 èr 4|发音 fāyīn 6|法国 Fǎguó 6|法文 Fǎwén 6|法语 Fǎyǔ 3|
饭 fàn 7|房间 fángjiān 10|分 fēn 8|刚 gāng 14|港币 gǎngbì 9|哥哥 gēge 2|个 gè 7|给 gěi 8|给 gěi 12|工作 gōngzuò 5|公斤 gōngjīn 8|公司 gōngsī 15|光盘 guāngpán 13|贵 guì 8|贵姓 guìxìng 6|国 guó 6|还 hái 8|还是 háishi 14|韩国 Hánguó 6|韩国语 Hánguóyǔ 3|韩文 Hánwén 6|汉语 Hànyǔ 2|好 hǎo 1|好久 hǎojiǔ 14|号 hào 10|号码 hàomǎ 10|喝 hē 5|和 hé 11|黑 hēi 13|很 hěn 2|红 hóng 13|话 huà 10|欢迎 huānyíng 11|换 huàn 9|回 huí 4|鸡 jī 7|鸡蛋 jīdàn 7|几 jǐ 4|寄 jì 3|家 jiā 10|见 jiàn 3|件 jiàn 13|角 jiǎo 8|饺子 jiǎozi 7|叫 jiào 6|教授 jiàoshòu 11|她 tā 2|姐姐 jiějie 15|介绍 jièshào 11|今天 jīntiān 4|斤 jīn 8|进 jìn 5|九 jiǔ 3|酒 jiǔ 7|旧 jiù 13|橘子 júzi 8|觉得 juéde 12|咖啡 kāfēi 14|开 kāi 14|开学 kāixué 14|看 kàn 15|客气 kèqi 5|口 kǒu 1|块 kuài 8|
来 lái 14|蓝 lán 14|老师 lǎoshī 5|里 lǐ 13|俩 liǎ 11|两 liǎng 8|辆 liàng 14|了 le 8|零 líng 10|留学 liúxué 11|留学生 liúxuéshēng 11|六 liù 3|楼 lóu 10|律师 lǜshī 15|妈妈 māma 2|马 mǎ 1|马马虎虎 mǎmahūhū 14|吗 ma 2|买 mǎi 8|卖 mài 8|馒头 mántou 7|忙 máng 2|没有 méiyǒu 13|没关系 méiguānxi 4|没什么 méishénme 11|美国 Měiguó 6|美元 měiyuán 9|妹妹 mèimei 2|门 mén 10|米 mǐ 7|米饭 mǐfàn 7|秘书 mìshū 11|面条 miàntiáo 7|名字 míngzi 6|明天 míngtiān 3|摩托车 mótuōchē 14|哪 nǎ 6|哪儿 nǎr 4|那 nà 6|那儿 nàr 4|那些 nàxiē 7|男 nán 2|难 nán 2|呢 ne 10|你 nǐ 1|你好 nǐhǎo 1|你们 nǐmen 11|您 nín 5|女 nǚ 1|欧元 ōuyuán 9|朋友 péngyou 6|啤酒 píjiǔ 7|苹果 píngguǒ 8|瓶 píng 13|七 qī 3|汽车 qìchē 14|千 qiān 9|钱 qián 3|轻 qīng 13|请 qǐng 5|请问 qǐngwèn 6|取 qǔ 3|去 qù 3|全 quán 15|
人 rén 6|人民 rénmín 9|人民币 rénmínbì 9|日 rì 5|日本 Rìběn 6|日文 Rìwén 6|日用品 rìyòngpǐn 13|日语 Rìyǔ 3|日元 rìyuán 9|容易 róngyì 12|三 sān 4|商店 shāngdiàn 15|上午 shàngwǔ 9|少 shǎo 8|身体 shēntǐ 5|十 shí 5|什么 shénme 6|食堂 shítáng 7|是 shì 5|手 shǒu 10|手机 shǒujī 10|书 shū 6|数 shǔ 9|谁 shéi 6|水 shuǐ 13|水果 shuǐguǒ 8|说 shuō 12|四 sì 4|他 tā 2|他们 tāmen 11|太 tài 2|汤 tāng 7|天 tiān 4|听 tīng 12|同屋 tóngwū 12|同学 tóngxué 12|图书馆 túshūguǎn 9|外国 wàiguó 15|外贸 wàimào 15|碗 wǎn 7|万 wàn 9|位 wèi 11|文 wén 6|问 wèn 6|我 wǒ 4|我们 wǒmen 11|五 wǔ 1|西班牙文 Xībānyáwén 6|西班牙语 Xībānyáyǔ 3|西药 xīyào 13|下午 xiàwǔ 9|先 xiān 11|先生 xiānsheng 9|香水 xiāngshuǐ 13|箱子 xiāngzi 13|小 xiǎo 15|小姐 xiǎojie 9|校长 xiàozhǎng 11|些 xiē 7|写 xiě 12|谢谢 xièxie 5|新 xīn 12|信 xìn 3|星期 xīngqī 4|
星期二 xīngqī'èr 4|星期六 xīngqīliù 4|星期三 xīngqīsān 4|星期四 xīngqīsì 4|星期天 xīngqītiān 4|星期五 xīngqīwǔ 4|星期一 xīngqīyī 4|姓 xìng 6|学 xué 3|学生 xuésheng 11|学习 xuéxí 6|学校 xuéxiào 4|颜色 yánsè 14|药 yào 13|要 yào 7|要 yào 9|也 yě 11|一 yī 1|一共 yígòng 8|一会儿 yíhuìr 9|一下儿 yíxiàr 11|一些 yìxiē 7|医院 yīyuàn 15|椅子 yǐzi 13|银行 yínháng 3|英国 Yīngguó 6|英文 Yīngwén 6|英语 Yīngyǔ 3|营业员 yíngyèyuán 9|邮包 yóubāo 6|邮局 yóujú 3|有 yǒu 13|有点儿 yǒudiǎnr 14|雨 yǔ 13|雨伞 yǔsǎn 13|语法 yǔfǎ 12|语言 yǔyán 12|杂志 zázhì 6|再见 zàijiàn 4|在 zài 10|怎么 zěnme 8|怎么样 zěnmeyàng 12|张 zhāng 13|找 zhǎo 8|找 zhǎo 10|照片 zhàopiàn 15|这 zhè 5|这儿 zhèr 13|这些 zhèxiē 7|支 zhī 13|知道 zhīdào 10|职员 zhíyuán 10|只 zhǐ 15|中国 Zhōngguó 6|中文 Zhōngwén 6|中午 zhōngwǔ 7|中药 zhōngyào 13|重 zhòng 13|住 zhù 10|自行车 zìxíngchē 14|最近 zuìjìn 14|昨天 zuótiān 4|坐 zuò 5|做 zuò 15|
爱德华 Àidéhuá 11|北京 Běijīng 3|北京语言大学 BěijīngYǔyánDàxué 12|关 Guān 14|李昌浩 LǐChānghào 10|林 Lín 12|罗兰 Luólán 11|马 Mǎ 11|玛丽 Mǎlì 7|麦克 Màikè 6|天安门 Tiān'ānmén 4|田芳 TiánFāng 11|王 Wáng 5|张东 ZhāngDōng 6
`
  .replace(/\n/g, '')
  .split('|')
  .filter(Boolean)
  .map((item) => {
    const [h, p, lesson] = item.trim().split(' ');
    return { h, p, lesson: Number(lesson) };
  });

const problems = [];
const warnings = [];
const norm = (s) => s.replace(/[\s']/g, '').toLowerCase();
const stripTones = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[\s']/g, '').toLowerCase();
const isHan = (ch) => /\p{Script=Han}/u.test(ch);

const allWords = LESSONS.flatMap((l) => l.words.map((word) => ({ ...word, lesson: l.n })));

// 1. Cada palavra do glossário existe na lição indicada, com o mesmo pinyin.
for (const g of GLOSSARY) {
  const match = allWords.find((word) => word.h === g.h && word.lesson === g.lesson);
  if (!match) {
    problems.push(`glossário sem par na lição: ${g.h} ${g.p} (L${g.lesson})`);
  } else if (norm(match.p) !== norm(g.p)) {
    problems.push(`pinyin difere do glossário: ${g.h} L${g.lesson}: lição "${match.p}", glossário "${g.p}"`);
  }
}

// 2. Palavras das lições que o glossário não traz.
const notInGlossary = allWords.filter((word) => !GLOSSARY.some((g) => g.h === word.h && g.lesson === word.lesson));

// 3. Unicidade por lição, partes completas e consistência das partes.
for (const lesson of LESSONS) {
  const seen = new Set();
  for (const word of lesson.words) {
    if (seen.has(word.h)) problems.push(`repetida na lição ${lesson.n}: ${word.h}`);
    seen.add(word.h);
    const chars = [...word.h].filter(isHan);
    if (chars.length > 1) {
      if (word.parts.length !== chars.length) {
        problems.push(`partes incompletas: ${word.h} L${lesson.n}: ${word.parts.length} de ${chars.length}`);
      } else {
        word.parts.forEach((part, i) => {
          if (part.h !== chars[i]) problems.push(`parte fora de ordem: ${word.h} L${lesson.n}: ${part.h}`);
          if (!part.p || !part.m) problems.push(`parte sem pinyin ou sentido: ${word.h} L${lesson.n}: ${part.h}`);
        });
        const joined = norm(word.parts.map((part) => part.p).join(''));
        if (joined !== norm(word.p)) {
          problems.push(`partes não formam o pinyin: ${word.h} L${lesson.n}: "${word.p}" x "${joined}"`);
        }
      }
    }
    if (!word.m) problems.push(`sem significado: ${word.h} L${lesson.n}`);
  }
}

// 4. Dicionário de pinyin: mesma sílaba, ignorando tons que mudam por regra.
const dictIssues = [];
for (const word of allWords) {
  const expected = stripTones(pinyin(word.h, { toneType: 'symbol', separator: '' }));
  if (expected !== stripTones(word.p).replace(/r$/, (m) => (word.h.endsWith('儿') ? m : m))) {
    const erhua = expected.replace(/er$/, 'r');
    if (erhua !== stripTones(word.p)) dictIssues.push(`${word.h} L${word.lesson}: livro "${word.p}", dicionário "${pinyin(word.h)}"`);
  }
}

// 5. Traços disponíveis e sentido de cada hanzi das listas de escrita.
const charsWithSense = new Set(Object.keys(CHAR_EXTRA));
for (const word of allWords) {
  if ([...word.h].filter(isHan).length === 1) charsWithSense.add(word.h);
  word.parts.forEach((part) => charsWithSense.add(part.h));
}
const everyChar = new Set();
for (const lesson of LESSONS) {
  for (const ch of lesson.write) {
    everyChar.add(ch);
    if (!charsWithSense.has(ch)) problems.push(`hanzi da lista de escrita sem sentido: ${ch} L${lesson.n}`);
  }
  for (const word of lesson.words) for (const ch of word.h) if (isHan(ch)) everyChar.add(ch);
}
for (const ch of everyChar) {
  if (!existsSync(new URL(`../node_modules/hanzi-writer-data/${ch}.json`, import.meta.url))) {
    problems.push(`sem dados de traços: ${ch}`);
  }
}

// 6. Palavras homógrafas: sentidos que mudam entre lições.
const byHanzi = new Map();
for (const word of allWords) byHanzi.set(word.h, [...(byHanzi.get(word.h) ?? []), word]);
const multi = [...byHanzi.entries()].filter(([, list]) => list.length > 1);

console.log(`Lições: ${LESSONS.length}`);
console.log(`Palavras: ${allWords.length} (${allWords.filter((word) => word.name).length} nomes próprios)`);
console.log(`Hanzi diferentes: ${everyChar.size}`);
console.log(`Glossário: ${GLOSSARY.length} entradas`);
console.log(`\nNas lições, fora do glossário (${notInGlossary.length}):`);
console.log(notInGlossary.map((word) => `${word.h} L${word.lesson}`).join('  '));
console.log(`\nDiferenças em relação ao dicionário (${dictIssues.length}):`);
console.log(dictIssues.join('\n'));
console.log(`\nMesmos hanzi em mais de uma lição (${multi.length}):`);
console.log(multi.map(([h, list]) => `${h}: ${list.map((word) => `L${word.lesson} ${word.m}`).join(' / ')}`).join('\n'));
if (warnings.length) console.log(`\nAvisos:\n${warnings.join('\n')}`);
if (problems.length) {
  console.error(`\nPROBLEMAS (${problems.length}):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log('\nSem problemas.');
