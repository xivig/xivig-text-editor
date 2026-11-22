import { generateWords } from '../../../utils/loremIpsum';

export interface EmmetNode {
  tag: string;
  id?: string;
  classes: string[];
  attributes: Record<string, string>;
  text?: string;
  count: number;
  children: EmmetNode[];
  parent?: EmmetNode;
  isLorem?: boolean;
  loremCount?: number;
}

export const selfClosingTags = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

export const htmlTagPresets: Record<string, { tag: string; attrs: Record<string, string>; selfClosing?: boolean; snippet?: string }> = {
  '!': {
    tag: 'html',
    attrs: {},
    snippet: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${1:Document}</title>
</head>
<body>
  \${2}
</body>
</html>`,
  },
  'html:5': {
    tag: 'html',
    attrs: {},
    snippet: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>\${1:Document}</title>
</head>
<body>
  \${2}
</body>
</html>`,
  },
  a: { tag: 'a', attrs: { href: '${1:#}' } },
  'a:link': { tag: 'a', attrs: { href: 'http://${1}' } },
  'a:mail': { tag: 'a', attrs: { href: 'mailto:${1}' } },
  'a:tel': { tag: 'a', attrs: { href: 'tel:${1}' } },
  img: { tag: 'img', attrs: { src: '${1}', alt: '${2}' }, selfClosing: true },
  'img:srcset': { tag: 'img', attrs: { src: '${1}', srcset: '${2}', alt: '${3}' }, selfClosing: true },
  link: { tag: 'link', attrs: { rel: 'stylesheet', href: '${1:style.css}' }, selfClosing: true },
  'link:css': { tag: 'link', attrs: { rel: 'stylesheet', href: '${1:style.css}' }, selfClosing: true },
  'link:favicon': { tag: 'link', attrs: { rel: 'shortcut icon', href: '${1:favicon.ico}', type: 'image/x-icon' }, selfClosing: true },
  script: { tag: 'script', attrs: {} },
  'script:src': { tag: 'script', attrs: { src: '${1}' } },
  input: { tag: 'input', attrs: { type: '${1:text}' }, selfClosing: true },
  'input:text': { tag: 'input', attrs: { type: 'text', name: '${1}', id: '${2}' }, selfClosing: true },
  'input:password': { tag: 'input', attrs: { type: 'password', name: '${1}', id: '${2}' }, selfClosing: true },
  'input:email': { tag: 'input', attrs: { type: 'email', name: '${1}', id: '${2}' }, selfClosing: true },
  'input:checkbox': { tag: 'input', attrs: { type: 'checkbox', name: '${1}', id: '${2}' }, selfClosing: true },
  'input:radio': { tag: 'input', attrs: { type: 'radio', name: '${1}', id: '${2}' }, selfClosing: true },
  'input:submit': { tag: 'input', attrs: { type: 'submit', value: '${1:Submit}' }, selfClosing: true },
  'input:button': { tag: 'input', attrs: { type: 'button', value: '${1:Button}' }, selfClosing: true },
  'input:number': { tag: 'input', attrs: { type: 'number', name: '${1}', id: '${2}' }, selfClosing: true },
  'input:date': { tag: 'input', attrs: { type: 'date', name: '${1}', id: '${2}' }, selfClosing: true },
  'input:file': { tag: 'input', attrs: { type: 'file', name: '${1}', id: '${2}' }, selfClosing: true },
  'input:hidden': { tag: 'input', attrs: { type: 'hidden', name: '${1}' }, selfClosing: true },
  form: { tag: 'form', attrs: { action: '${1}', method: 'get' } },
  'form:get': { tag: 'form', attrs: { action: '${1}', method: 'get' } },
  'form:post': { tag: 'form', attrs: { action: '${1}', method: 'post' } },
  select: { tag: 'select', attrs: { name: '${1}', id: '${2}' } },
  opt: { tag: 'option', attrs: { value: '${1}' } },
  option: { tag: 'option', attrs: { value: '${1}' } },
  textarea: { tag: 'textarea', attrs: { name: '${1}', id: '${2}', cols: '${3:30}', rows: '${4:10}' } },
  btn: { tag: 'button', attrs: { type: 'button' } },
  button: { tag: 'button', attrs: { type: 'button' } },
  'btn:s': { tag: 'button', attrs: { type: 'submit' } },
  'meta:utf': { tag: 'meta', attrs: { charset: 'UTF-8' }, selfClosing: true },
  'meta:vp': {
    tag: 'meta',
    attrs: { name: 'viewport', content: 'width=device-width, initial-scale=1.0' },
    selfClosing: true,
  },
  iframe: { tag: 'iframe', attrs: { src: '${1}', frameborder: '0' } },
  video: { tag: 'video', attrs: { src: '${1}', controls: '' } },
  audio: { tag: 'audio', attrs: { src: '${1}', controls: '' } },
};

/**
 * Tokenize and parse an Emmet HTML abbreviation into a tree structure.
 */
export function parseHtmlAbbreviation(abbr: string): EmmetNode[] {
  const trimmed = abbr.trim();
  if (!trimmed) return [];

  // Check preset boilerplates directly
  if (trimmed === '!' || trimmed === 'html:5') {
    return [
      {
        tag: 'html-boilerplate',
        classes: [],
        attributes: {},
        count: 1,
        children: [],
      },
    ];
  }

  let i = 0;
  const n = trimmed.length;

  function parseSingleNode(): EmmetNode {
    let tag = '';
    const classes: string[] = [];
    let id: string | undefined = undefined;
    const attributes: Record<string, string> = {};
    let text: string | undefined = undefined;
    let count = 1;

    // Read tag name (if starts with alphanumeric or preset)
    if (/[a-zA-Z0-9:_!-]/.test(trimmed[i] || '')) {
      const startTag = i;
      while (i < n && /[a-zA-Z0-9:_!-]/.test(trimmed[i])) {
        i++;
      }
      tag = trimmed.slice(startTag, i);
    }

    // Process classes, IDs, attributes, text, multipliers
    while (i < n) {
      const ch = trimmed[i];

      if (ch === '.') {
        i++;
        const startClass = i;
        while (i < n && /[a-zA-Z0-9_$-]/.test(trimmed[i])) {
          i++;
        }
        const cls = trimmed.slice(startClass, i);
        if (cls) classes.push(cls);
      } else if (ch === '#') {
        i++;
        const startId = i;
        while (i < n && /[a-zA-Z0-9_$-]/.test(trimmed[i])) {
          i++;
        }
        id = trimmed.slice(startId, i);
      } else if (ch === '[') {
        i++;
        while (i < n && trimmed[i] !== ']') {
          // Skip whitespace
          while (i < n && /\s/.test(trimmed[i])) i++;
          const startAttr = i;
          while (i < n && /[a-zA-Z0-9_$-]/.test(trimmed[i])) i++;
          const attrKey = trimmed.slice(startAttr, i);

          if (!attrKey) break;

          while (i < n && /\s/.test(trimmed[i])) i++;

          let attrVal = '';
          if (trimmed[i] === '=') {
            i++;
            while (i < n && /\s/.test(trimmed[i])) i++;

            if (trimmed[i] === '"' || trimmed[i] === "'") {
              const quote = trimmed[i];
              i++;
              const startVal = i;
              while (i < n && trimmed[i] !== quote) i++;
              attrVal = trimmed.slice(startVal, i);
              if (trimmed[i] === quote) i++;
            } else {
              const startVal = i;
              while (i < n && !/[\s\]]/.test(trimmed[i])) i++;
              attrVal = trimmed.slice(startVal, i);
            }
          }
          attributes[attrKey] = attrVal;
          while (i < n && /\s/.test(trimmed[i])) i++;
        }
        if (trimmed[i] === ']') i++;
      } else if (ch === '{') {
        i++;
        const startText = i;
        let depth = 1;
        while (i < n && depth > 0) {
          if (trimmed[i] === '{') depth++;
          else if (trimmed[i] === '}') depth--;
          if (depth > 0) i++;
        }
        text = trimmed.slice(startText, i);
        if (trimmed[i] === '}') i++;
      } else if (ch === '*') {
        i++;
        const startNum = i;
        while (i < n && /[0-9]/.test(trimmed[i])) i++;
        const parsedCount = parseInt(trimmed.slice(startNum, i), 10);
        if (!isNaN(parsedCount) && parsedCount > 0) {
          count = Math.min(parsedCount, 100); // capped at 100
        }
      } else {
        break; // Reached an operator like >, +, ^, )
      }
    }

    if (!tag && (classes.length > 0 || id || Object.keys(attributes).length > 0 || text)) {
      tag = 'div';
    }

    // Check if tag is lorem or lipsum
    const loremMatch = (tag || '').match(/^(?:lorem|lipsum)([0-9]+)?$/i);
    const isLorem = Boolean(loremMatch);
    const loremCount = loremMatch && loremMatch[1] ? parseInt(loremMatch[1], 10) : 30;

    return {
      tag: tag || 'div',
      id,
      classes,
      attributes,
      text,
      count,
      children: [],
      isLorem,
      loremCount,
    };
  }

  function parseExpression(): EmmetNode[] {
    const rootNodes: EmmetNode[] = [];
    let currentParent: EmmetNode | null = null;
    let lastNode: EmmetNode | null = null;

    while (i < n) {
      if (trimmed[i] === ')') {
        i++;
        break;
      }

      if (trimmed[i] === '(') {
        i++;
        const grouped = parseExpression();
        for (const g of grouped) {
          if (currentParent) {
            g.parent = currentParent;
            currentParent.children.push(g);
          } else {
            rootNodes.push(g);
          }
        }
        lastNode = grouped[grouped.length - 1] || null;
      } else {
        const node = parseSingleNode();

        if (currentParent) {
          node.parent = currentParent;
          currentParent.children.push(node);
        } else {
          rootNodes.push(node);
        }
        lastNode = node;
      }

      if (i >= n || trimmed[i] === ')') {
        if (trimmed[i] === ')') i++;
        break;
      }

      const op = trimmed[i];
      if (op === '>') {
        i++;
        currentParent = lastNode;
      } else if (op === '+') {
        i++;
        // Sibling keeps current parent
      } else if (op === '^') {
        i++;
        currentParent = (currentParent && (currentParent as EmmetNode).parent) ? (currentParent as EmmetNode).parent! : null;
      } else {
        break;
      }
    }

    return rootNodes;
  }

  return parseExpression();
}

/**
 * Render parsed Emmet tree into formatted HTML with snippet placeholders.
 */
export function renderHtmlTree(
  nodes: EmmetNode[],
  indentSpaces = 2,
  isJsx = false,
  tabStopCounter = { current: 1 }
): string {
  const indentStr = ' '.repeat(indentSpaces);

  function replaceDollarCounters(str: string, index: number): string {
    return str.replace(/\$\$+/g, () => String(index + 1).padStart(2, '0')).replace(/\$/g, () => String(index + 1));
  }

  function renderNode(node: EmmetNode, level: number, itemIndex = 0): string {
    const curIndent = indentStr.repeat(level);

    if (node.isLorem) {
      const count = node.loremCount || 30;
      const words = generateWords(count, true);
      const iterations = node.count || 1;
      const list: string[] = [];
      for (let rep = 0; rep < iterations; rep++) {
        list.push(`${curIndent}${words}`);
      }
      return list.join('\n');
    }

    if (node.tag === 'html-boilerplate') {
      return htmlTagPresets['!'].snippet!;
    }

    const preset = htmlTagPresets[node.tag];
    let tag = preset ? preset.tag : node.tag;
    const isSelfClosing = preset?.selfClosing || selfClosingTags.has(tag.toLowerCase());

    const results: string[] = [];
    const iterations = node.count || 1;

    for (let rep = 0; rep < iterations; rep++) {
      const idx = node.count > 1 ? rep : itemIndex;
      const appliedTag = replaceDollarCounters(tag, idx);

      const attrs: string[] = [];

      // ID
      if (node.id) {
        attrs.push(`id="${replaceDollarCounters(node.id, idx)}"`);
      }

      // Classes
      if (node.classes.length > 0) {
        const clsVal = node.classes.map((c) => replaceDollarCounters(c, idx)).join(' ');
        const classAttrName = isJsx ? 'className' : 'class';
        attrs.push(`${classAttrName}="${clsVal}"`);
      }

      // Preset default attributes
      if (preset?.attrs) {
        for (const [k, v] of Object.entries(preset.attrs)) {
          if (!node.attributes[k]) {
            attrs.push(`${k}="${v}"`);
          }
        }
      }

      // Custom attributes
      for (const [k, v] of Object.entries(node.attributes)) {
        const key = replaceDollarCounters(k, idx);
        const val = replaceDollarCounters(v, idx);
        if (val) {
          attrs.push(`${key}="${val}"`);
        } else {
          attrs.push(key);
        }
      }

      const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

      if (isSelfClosing) {
        const closing = isJsx ? ' />' : '>';
        results.push(`${curIndent}<${appliedTag}${attrStr}${closing}`);
        continue;
      }

      const textVal = node.text ? replaceDollarCounters(node.text, idx) : '';

      if (node.children.length === 0) {
        if (textVal) {
          results.push(`${curIndent}<${appliedTag}${attrStr}>${textVal}</${appliedTag}>`);
        } else {
          // If no content, add a tab stop placeholder inside the tag
          const placeholder = `\${${tabStopCounter.current++}}`;
          results.push(`${curIndent}<${appliedTag}${attrStr}>${placeholder}</${appliedTag}>`);
        }
      } else if (node.children.length === 1 && node.children[0].isLorem) {
        // Direct lorem child inside tag: e.g. p>lorem or p*3>lorem10
        const loremChild = node.children[0];
        const count = loremChild.loremCount || 30;
        const words = generateWords(count, true);
        results.push(`${curIndent}<${appliedTag}${attrStr}>${words}</${appliedTag}>`);
      } else {
        const childrenStr = node.children
          .map((child) => renderNode(child, level + 1, idx))
          .join('\n');

        if (textVal) {
          results.push(`${curIndent}<${appliedTag}${attrStr}>\n${curIndent}${indentStr}${textVal}\n${childrenStr}\n${curIndent}</${appliedTag}>`);
        } else {
          results.push(`${curIndent}<${appliedTag}${attrStr}>\n${childrenStr}\n${curIndent}</${appliedTag}>`);
        }
      }
    }

    return results.join('\n');
  }

  return nodes.map((node) => renderNode(node, 0)).join('\n');
}

/**
 * Expand HTML/XML/JSX Emmet abbreviation into snippet text.
 */
export function expandHtmlAbbreviation(abbr: string, indentSpaces = 2, isJsx = false): string | null {
  try {
    const nodes = parseHtmlAbbreviation(abbr);
    if (!nodes || nodes.length === 0) return null;
    return renderHtmlTree(nodes, indentSpaces, isJsx);
  } catch (err) {
    return null;
  }
}
