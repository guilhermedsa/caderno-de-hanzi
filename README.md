# Caderno de Hanzi

Web app instalável (PWA) para estudar o vocabulário de 汉语教程 第一册(上), lição por lição, no iPhone e no iPad.

- **Desenhar:** ver a ordem dos traços, traçar sobre o modelo e escrever de memória, com correção.
- **Significado e pinyin:** flashcards com o sentido usado em cada lição.
- **Ditado:** ver o sentido e o pinyin e escrever o hanzi.
- **Revisar:** repetição espaçada dos dois treinos.

## Comandos

```bash
npm install
npm run check   # confere o vocabulário com o glossário do livro e um dicionário de pinyin
npm test        # testa a lógica de revisão, sessões e sentidos por lição
npm run build   # gera traços, ícones e o service worker em public/
npm run serve   # abre em http://localhost:5199
```

## Publicação

O app está em <https://guilhermedsa.github.io/caderno-de-hanzi/>. Cada envio para `main` que altera `public/` publica o site.

Rode `npm run build` antes de enviar: é o que faz os aparelhos receberem a nova versão.

## Dados

O vocabulário fica em `public/js/lessons-data.js`. O livro em si não faz parte do projeto: não há páginas nem textos de lição, só as listas de palavras, com significados em português escritos para este app.

## Licenças

Traços de [Hanzi Writer](https://hanziwriter.org) (MIT) e Make Me a Hanzi (Arphic Public License). As licenças ficam em `public/vendor/`.
