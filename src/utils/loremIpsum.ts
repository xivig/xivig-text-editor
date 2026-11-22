const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
  'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
  'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
  'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla', 'pariatur',
  'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'in', 'culpa',
  'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'sed', 'ut',
  'perspiciatis', 'unde', 'omnis', 'iste', 'natus', 'error', 'sit', 'voluptatem', 'accusantium',
  'doloremque', 'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae', 'ab',
  'illo', 'inventore', 'veritatis', 'et', 'quasi', 'architecto', 'beatae', 'vitae', 'dicta',
  'sunt', 'explicabo'
];

export type LoremType = 'paragraphs' | 'html-paragraphs' | 'sentences' | 'words' | 'list-items';

export interface LoremOptions {
  count?: number;
  type?: LoremType;
  startWithLorem?: boolean;
}

function getRandomWord(): string {
  return LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)];
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate N words
export function generateWords(count: number, startWithLorem = true): string {
  if (count <= 0) return '';
  const words: string[] = [];

  if (startWithLorem) {
    const prefix = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit'];
    for (let i = 0; i < Math.min(count, prefix.length); i++) {
      words.push(prefix[i]);
    }
  }

  while (words.length < count) {
    words.push(getRandomWord());
  }

  return capitalize(words.join(' '));
}

// Generate N sentences
export function generateSentences(count: number, startWithLorem = true): string {
  if (count <= 0) return '';
  const sentences: string[] = [];

  for (let i = 0; i < count; i++) {
    const isFirst = i === 0 && startWithLorem;
    const wordCount = Math.floor(Math.random() * 10) + 8; // 8-18 words
    let sentenceText = generateWords(wordCount, isFirst);
    // Occasionally add a comma
    if (wordCount > 10) {
      const parts = sentenceText.split(' ');
      const commaPos = Math.floor(parts.length / 2);
      parts[commaPos] = parts[commaPos] + ',';
      sentenceText = parts.join(' ');
    }
    sentences.push(`${sentenceText}.`);
  }

  return sentences.join(' ');
}

// Generate N paragraphs
export function generateParagraphs(count: number, startWithLorem = true, htmlWrap = false): string {
  if (count <= 0) return '';
  const paragraphs: string[] = [];

  for (let i = 0; i < count; i++) {
    const isFirst = i === 0 && startWithLorem;
    const sentenceCount = Math.floor(Math.random() * 3) + 4; // 4-6 sentences
    const text = generateSentences(sentenceCount, isFirst);

    if (htmlWrap) {
      paragraphs.push(`<p>${text}</p>`);
    } else {
      paragraphs.push(text);
    }
  }

  return paragraphs.join('\n\n');
}

// Generate N list items
export function generateListItems(count: number): string {
  if (count <= 0) return '';
  const items: string[] = [];

  for (let i = 0; i < count; i++) {
    const wordCount = Math.floor(Math.random() * 6) + 4; // 4-10 words
    items.push(`<li>${generateWords(wordCount, false)}</li>`);
  }

  return items.join('\n');
}

// Master generator function
export function generateLorem(options: LoremOptions = {}): string {
  const { count = 1, type = 'paragraphs', startWithLorem = true } = options;

  switch (type) {
    case 'html-paragraphs':
      return generateParagraphs(count, startWithLorem, true);
    case 'sentences':
      return generateSentences(count, startWithLorem);
    case 'words':
      return generateWords(count, startWithLorem);
    case 'list-items':
      return generateListItems(count);
    case 'paragraphs':
    default:
      return generateParagraphs(count, startWithLorem, false);
  }
}
