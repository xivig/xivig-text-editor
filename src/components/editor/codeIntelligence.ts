import { EditorView, hoverTooltip, Tooltip, keymap } from '@codemirror/view';
import { EditorState, EditorSelection } from '@codemirror/state';
import { syntaxTree } from '@codemirror/language';
import { useEditorStore } from '../../stores/editorStore';
import { PHP_DOCS } from '../../extensions/builtin/php-intelligence/docs/phpDocs';
import { LARAVEL_DOCS } from '../../extensions/builtin/laravel-all-in-one/completions/laravelDocs';

// ============================================================================
// 1. KNOWLEDGE BASE FOR HOVER DOCUMENTATION & PARAMETER HINTS
// ============================================================================

interface DocItem {
  name: string;
  kind: 'method' | 'function' | 'property' | 'class' | 'keyword' | 'tag' | 'hook' | 'type';
  signature: string;
  doc: string;
  returns?: string;
  parameters?: { name: string; type: string; doc?: string }[];
}

const JS_TS_DOCS: Record<string, DocItem> = {
  // Console
  'log': {
    name: 'console.log',
    kind: 'method',
    signature: 'console.log(...data: any[]): void',
    doc: 'Prints to stdout with newline. Multiple arguments are formatted and separated with spaces.',
    parameters: [{ name: '...data', type: 'any[]', doc: 'Values to print' }],
  },
  'error': {
    name: 'console.error',
    kind: 'method',
    signature: 'console.error(...data: any[]): void',
    doc: 'Prints to stderr with newline. Highlights error outputs in browser/Node consoles.',
    parameters: [{ name: '...data', type: 'any[]', doc: 'Error details or message' }],
  },
  'warn': {
    name: 'console.warn',
    kind: 'method',
    signature: 'console.warn(...data: any[]): void',
    doc: 'Prints warning message to console with yellow warning badge.',
    parameters: [{ name: '...data', type: 'any[]', doc: 'Warning details' }],
  },
  'table': {
    name: 'console.table',
    kind: 'method',
    signature: 'console.table(tabularData: any, properties?: string[]): void',
    doc: 'Displays tabular data as a formatted table.',
    parameters: [{ name: 'tabularData', type: 'any' }, { name: 'properties', type: 'string[]', doc: 'Optional column filter' }],
  },

  // Web & DOM
  'fetch': {
    name: 'fetch',
    kind: 'function',
    signature: 'fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>',
    doc: 'Starts the process of fetching a resource from the network. Returns a Promise that resolves to the Response object.',
    parameters: [
      { name: 'input', type: 'RequestInfo | URL', doc: 'Resource URL or Request object' },
      { name: 'init', type: 'RequestInit', doc: 'Optional configuration (method, headers, body, mode)' },
    ],
  },
  'addEventListener': {
    name: 'addEventListener',
    kind: 'method',
    signature: 'addEventListener(type: string, listener: (event: Event) => void, options?: boolean | AddEventListenerOptions): void',
    doc: 'Sets up a function that will be called whenever the specified event is delivered to the target.',
    parameters: [
      { name: 'type', type: 'string', doc: 'Event type (e.g. "click", "keydown", "submit")' },
      { name: 'listener', type: '(event: Event) => void', doc: 'Callback invoked when event triggers' },
      { name: 'options', type: 'boolean | AddEventListenerOptions', doc: 'Optional options or capture flag' },
    ],
  },
  'removeEventListener': {
    name: 'removeEventListener',
    kind: 'method',
    signature: 'removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void',
    doc: 'Removes the event listener previously registered with EventTarget.addEventListener().',
    parameters: [
      { name: 'type', type: 'string' },
      { name: 'listener', type: 'Function' },
      { name: 'options', type: 'boolean | EventListenerOptions' },
    ],
  },
  'querySelector': {
    name: 'querySelector',
    kind: 'method',
    signature: 'querySelector<E extends Element = Element>(selectors: string): E | null',
    doc: 'Returns the first Element within the document that matches the specified selector, or group of selectors.',
    parameters: [{ name: 'selectors', type: 'string', doc: 'CSS selector string' }],
  },
  'querySelectorAll': {
    name: 'querySelectorAll',
    kind: 'method',
    signature: 'querySelectorAll<E extends Element = Element>(selectors: string): NodeListOf<E>',
    doc: 'Returns a static NodeList representing a list of the document\'s elements that match the specified group of selectors.',
    parameters: [{ name: 'selectors', type: 'string', doc: 'CSS selector string' }],
  },
  'setTimeout': {
    name: 'setTimeout',
    kind: 'function',
    signature: 'setTimeout(handler: TimerHandler, timeout?: number, ...args: any[]): number',
    doc: 'Sets a timer which executes a function or specified piece of code once the timer expires.',
    parameters: [
      { name: 'handler', type: 'Function', doc: 'Function to execute' },
      { name: 'timeout', type: 'number', doc: 'Delay in milliseconds (default: 0)' },
      { name: '...args', type: 'any[]', doc: 'Additional arguments forwarded to handler' },
    ],
  },
  'setInterval': {
    name: 'setInterval',
    kind: 'function',
    signature: 'setInterval(handler: TimerHandler, timeout?: number, ...args: any[]): number',
    doc: 'Repeatedly calls a function or executes a code snippet, with a fixed time delay between each call.',
    parameters: [
      { name: 'handler', type: 'Function', doc: 'Function to repeat' },
      { name: 'timeout', type: 'number', doc: 'Interval in milliseconds' },
      { name: '...args', type: 'any[]' },
    ],
  },

  // Array methods
  'map': {
    name: 'Array.prototype.map',
    kind: 'method',
    signature: 'map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[]',
    doc: 'Calls a defined callback function on each element of an array, and returns an array that contains the results.',
    parameters: [
      { name: 'callbackfn', type: '(value: T, index: number, array: T[]) => U', doc: 'Function that accepts up to three arguments' },
      { name: 'thisArg', type: 'any', doc: 'Optional this context' },
    ],
  },
  'filter': {
    name: 'Array.prototype.filter',
    kind: 'method',
    signature: 'filter(predicate: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T[]',
    doc: 'Returns the elements of an array that meet the condition specified in a callback function.',
    parameters: [
      { name: 'predicate', type: '(value: T, index: number, array: T[]) => boolean', doc: 'Test function returning boolean' },
      { name: 'thisArg', type: 'any' },
    ],
  },
  'reduce': {
    name: 'Array.prototype.reduce',
    kind: 'method',
    signature: 'reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U',
    doc: 'Calls the specified callback function for all the elements in an array. The return value of the callback is accumulated.',
    parameters: [
      { name: 'callbackfn', type: 'Function', doc: 'Accumulator function' },
      { name: 'initialValue', type: 'U', doc: 'Initial accumulator seed value' },
    ],
  },
  'find': {
    name: 'Array.prototype.find',
    kind: 'method',
    signature: 'find(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg?: any): T | undefined',
    doc: 'Returns the value of the first element in the array where predicate is true, and undefined otherwise.',
    parameters: [{ name: 'predicate', type: 'Function' }, { name: 'thisArg', type: 'any' }],
  },
  'findIndex': {
    name: 'Array.prototype.findIndex',
    kind: 'method',
    signature: 'findIndex(predicate: (value: T, index: number, obj: T[]) => boolean, thisArg?: any): number',
    doc: 'Returns the index of the first element in the array where predicate is true, and -1 otherwise.',
    parameters: [{ name: 'predicate', type: 'Function' }, { name: 'thisArg', type: 'any' }],
  },
  'includes': {
    name: 'Array.prototype.includes',
    kind: 'method',
    signature: 'includes(searchElement: T, fromIndex?: number): boolean',
    doc: 'Determines whether an array includes a certain element, returning true or false as appropriate.',
    parameters: [{ name: 'searchElement', type: 'T' }, { name: 'fromIndex', type: 'number' }],
  },
  'slice': {
    name: 'Array.prototype.slice',
    kind: 'method',
    signature: 'slice(start?: number, end?: number): T[]',
    doc: 'Returns a shallow copy of a portion of an array into a new array object selected from start to end (end not included).',
    parameters: [{ name: 'start', type: 'number' }, { name: 'end', type: 'number' }],
  },

  // React Hooks
  'useState': {
    name: 'useState',
    kind: 'hook',
    signature: 'useState<S>(initialState: S | (() => S)): [S, Dispatch<SetStateAction<S>>]',
    doc: 'Returns a stateful value, and a function to update it.',
    parameters: [{ name: 'initialState', type: 'S | (() => S)', doc: 'Initial state value or lazy initializer' }],
  },
  'useEffect': {
    name: 'useEffect',
    kind: 'hook',
    signature: 'useEffect(effect: () => (void | (() => void)), deps?: ReadonlyArray<any>): void',
    doc: 'Accepts a function that contains imperative, possibly effectful code. Fires after paint or when dependency list values change.',
    parameters: [
      { name: 'effect', type: '() => (void | Destructor)', doc: 'Imperative function, optionally returning cleanup callback' },
      { name: 'deps', type: 'ReadonlyArray<any>', doc: 'Optional array of dependencies triggering rerun' },
    ],
  },
  'useMemo': {
    name: 'useMemo',
    kind: 'hook',
    signature: 'useMemo<T>(factory: () => T, deps: ReadonlyArray<any>): T',
    doc: 'Pass a "create" function and an array of dependencies. useMemo will only recompute the memoized value when one of the dependencies has changed.',
    parameters: [
      { name: 'factory', type: '() => T', doc: 'Calculation function' },
      { name: 'deps', type: 'ReadonlyArray<any>', doc: 'Dependencies array' },
    ],
  },
  'useCallback': {
    name: 'useCallback',
    kind: 'hook',
    signature: 'useCallback<T extends Function>(callback: T, deps: ReadonlyArray<any>): T',
    doc: 'Returns a memoized version of the callback that only changes if one of the inputs has changed.',
    parameters: [
      { name: 'callback', type: 'T', doc: 'Function callback' },
      { name: 'deps', type: 'ReadonlyArray<any>', doc: 'Dependencies array' },
    ],
  },
  'useRef': {
    name: 'useRef',
    kind: 'hook',
    signature: 'useRef<T>(initialValue: T): { current: T }',
    doc: 'Returns a mutable ref object whose .current property is initialized to the passed argument. Persists for full component lifetime.',
    parameters: [{ name: 'initialValue', type: 'T', doc: 'Initial ref current value' }],
  },
};

const CSS_DOCS: Record<string, DocItem> = {
  'display': {
    name: 'display',
    kind: 'property',
    signature: 'display: block | inline | inline-block | flex | inline-flex | grid | none;',
    doc: 'Sets whether an element is treated as a block or inline box and the layout used for its children, such as grid or flex.',
  },
  'flex': {
    name: 'flex',
    kind: 'property',
    signature: 'flex: <flex-grow> <flex-shrink> <flex-basis>;',
    doc: 'Shorthand property setting how a flex item will grow or shrink to fit the space available in its flex container.',
  },
  'grid': {
    name: 'grid',
    kind: 'property',
    signature: 'grid: <grid-template> | <grid-template-rows> / [ auto-flow && dense? ] <grid-auto-columns>?',
    doc: 'Shorthand property that sets all of the explicit and implicit grid properties.',
  },
  'position': {
    name: 'position',
    kind: 'property',
    signature: 'position: static | relative | absolute | fixed | sticky;',
    doc: 'Sets how an element is positioned in a document. The top, right, bottom, and left properties determine the final location.',
  },
  'justify-content': {
    name: 'justify-content',
    kind: 'property',
    signature: 'justify-content: flex-start | flex-end | center | space-between | space-around | space-evenly;',
    doc: 'Defines how the browser distributes space between and around content items along the main-axis of a flex container, or inline axis of a grid.',
  },
  'align-items': {
    name: 'align-items',
    kind: 'property',
    signature: 'align-items: stretch | flex-start | flex-end | center | baseline;',
    doc: 'Sets the align-self value on all direct children as a group. Controls the alignment of items on the cross-axis.',
  },
  'gap': {
    name: 'gap',
    kind: 'property',
    signature: 'gap: <row-gap> <column-gap>?;',
    doc: 'Sets the gutters (gutters) between rows and columns in flex and grid layouts.',
  },
  'background': {
    name: 'background',
    kind: 'property',
    signature: 'background: <bg-color> <bg-image> <bg-position>/<bg-size> <bg-repeat>;',
    doc: 'Shorthand property for setting all background style properties at once (color, image, origin, size, repeat).',
  },
  'border-radius': {
    name: 'border-radius',
    kind: 'property',
    signature: 'border-radius: <length-percentage>{1,4};',
    doc: 'Rounds the corners of an element\'s outer border edge.',
  },
  'box-shadow': {
    name: 'box-shadow',
    kind: 'property',
    signature: 'box-shadow: none | <shadow>#;',
    doc: 'Adds shadow effects around an element\'s frame. You can set multiple effects separated by commas.',
  },
};

const HTML_TAG_DOCS: Record<string, DocItem> = {
  'div': {
    name: '<div>',
    kind: 'tag',
    signature: 'HTMLDivElement',
    doc: 'The generic container for flow content. It has no effect on the content or layout until styled in some way using CSS.',
  },
  'span': {
    name: '<span>',
    kind: 'tag',
    signature: 'HTMLSpanElement',
    doc: 'A generic inline container for phrasing content, which does not inherently represent anything.',
  },
  'button': {
    name: '<button>',
    kind: 'tag',
    signature: 'HTMLButtonElement',
    doc: 'Interactive element activated by a user with a mouse, keyboard, finger, voice command, or other assistive technology.',
  },
  'input': {
    name: '<input>',
    kind: 'tag',
    signature: 'HTMLInputElement',
    doc: 'Used to create interactive controls for web-based forms in order to accept data from the user.',
  },
  'form': {
    name: '<form>',
    kind: 'tag',
    signature: 'HTMLFormElement',
    doc: 'Represents a document section containing interactive controls for submitting information.',
  },
  'a': {
    name: '<a>',
    kind: 'tag',
    signature: 'HTMLAnchorElement',
    doc: 'Produces a hyperlink to web pages, files, email addresses, locations in the same page, or anything else a URL can address.',
  },
  'img': {
    name: '<img>',
    kind: 'tag',
    signature: 'HTMLImageElement',
    doc: 'Embeds an image into the document.',
  },
  'table': {
    name: '<table>',
    kind: 'tag',
    signature: 'HTMLTableElement',
    doc: 'Represents tabular data — that is, information presented in a two-dimensional table comprised of rows and columns of cells containing data.',
  },
};

// ============================================================================
// 2. SYMBOL EXTRACTION (FOR GO TO SYMBOL & SYMBOL PALETTE)
// ============================================================================

export interface ExtractedSymbol {
  name: string;
  kind: 'function' | 'method' | 'class' | 'interface' | 'variable' | 'heading' | 'css-rule' | 'tag';
  line: number;
  col: number;
  detail?: string;
}

export function extractDocumentSymbols(docText: string, language: string): ExtractedSymbol[] {
  const lines = docText.split('\n');
  const symbols: ExtractedSymbol[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineText = lines[i];
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    const lineNum = i + 1;
    const colNum = lineText.indexOf(trimmed) + 1;

    // 1. Markdown Headings
    if (trimmed.startsWith('#')) {
      symbols.push({
        name: trimmed,
        kind: 'heading',
        line: lineNum,
        col: colNum,
        detail: `Level ${trimmed.match(/^#+/)?.[0].length || 1}`,
      });
      continue;
    }

    // 2. TypeScript / JavaScript Functions & Methods
    // export async function myFunc(...)
    const funcMatch = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s*([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
    if (funcMatch) {
      symbols.push({
        name: `${funcMatch[1]}()`,
        kind: 'function',
        line: lineNum,
        col: colNum,
        detail: `(${funcMatch[2].trim()})`,
      });
      continue;
    }

    // const myFunc = (...) => ...
    const arrowMatch = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/);
    if (arrowMatch) {
      symbols.push({
        name: `${arrowMatch[1]}()`,
        kind: 'function',
        line: lineNum,
        col: colNum,
        detail: `(${arrowMatch[2].trim()}) =>`,
      });
      continue;
    }

    // Class methods: methodName(...) {
    const methodMatch = trimmed.match(/^(?:public|private|protected|static|async)?\s*([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*[:{]/);
    if (methodMatch && !['if', 'for', 'while', 'switch', 'catch'].includes(methodMatch[1])) {
      symbols.push({
        name: `${methodMatch[1]}()`,
        kind: 'method',
        line: lineNum,
        col: colNum,
        detail: `(${methodMatch[2].trim()})`,
      });
      continue;
    }

    // 3. Classes, Interfaces, Types
    const classMatch = trimmed.match(/^(?:export\s+)?class\s+([a-zA-Z0-9_$]+)(?:\s+extends\s+([a-zA-Z0-9_$]+))?/);
    if (classMatch) {
      symbols.push({
        name: classMatch[1],
        kind: 'class',
        line: lineNum,
        col: colNum,
        detail: classMatch[2] ? `extends ${classMatch[2]}` : 'class',
      });
      continue;
    }

    const typeMatch = trimmed.match(/^(?:export\s+)?(?:interface|type)\s+([a-zA-Z0-9_$]+)/);
    if (typeMatch) {
      symbols.push({
        name: typeMatch[1],
        kind: 'interface',
        line: lineNum,
        col: colNum,
        detail: trimmed.startsWith('interface') ? 'interface' : 'type',
      });
      continue;
    }

    // 4. Variables / Constants
    const varMatch = trimmed.match(/^(?:export\s+)?(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*[:=]/);
    if (varMatch) {
      symbols.push({
        name: varMatch[1],
        kind: 'variable',
        line: lineNum,
        col: colNum,
        detail: 'variable',
      });
      continue;
    }

    // 5. Python def / class
    const pyDef = trimmed.match(/^def\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\):/);
    if (pyDef) {
      symbols.push({
        name: `${pyDef[1]}()`,
        kind: 'function',
        line: lineNum,
        col: colNum,
        detail: `(${pyDef[2].trim()})`,
      });
      continue;
    }
    const pyClass = trimmed.match(/^class\s+([a-zA-Z0-9_$]+)(?:\(([^)]*)\))?:/);
    if (pyClass) {
      symbols.push({
        name: pyClass[1],
        kind: 'class',
        line: lineNum,
        col: colNum,
        detail: pyClass[2] ? `(${pyClass[2]})` : 'class',
      });
      continue;
    }

    // 6. CSS Selectors
    if (language === 'css' && /^[.#a-zA-Z0-9_:[\]=\s>+~-]+\{/.test(trimmed)) {
      const selector = trimmed.split('{')[0].trim();
      symbols.push({
        name: selector,
        kind: 'css-rule',
        line: lineNum,
        col: colNum,
      });
      continue;
    }
  }

  return symbols;
}

// ============================================================================
// 3. HOVER DOCUMENTATION EXTENSION (CODEMIRROR 6)
// ============================================================================

export const hoverDocsExtension = hoverTooltip((view: EditorView, pos: number, side: -1 | 1): Tooltip | null => {
  const { from, to, text } = view.state.doc.lineAt(pos);
  const linePos = pos - from;

  // Extract word under cursor
  let wordStart = linePos;
  let wordEnd = linePos;
  while (wordStart > 0 && /[\w$]/.test(text[wordStart - 1])) wordStart--;
  while (wordEnd < text.length && /[\w$]/.test(text[wordEnd])) wordEnd++;

  if (wordStart === wordEnd) return null;
  const word = text.slice(wordStart, wordEnd);

  // Look up documentation
  let info: DocItem | undefined =
    JS_TS_DOCS[word] ||
    (PHP_DOCS as any)[word] ||
    (LARAVEL_DOCS as any)[word] ||
    CSS_DOCS[word] ||
    HTML_TAG_DOCS[word];

  // If not in standard library, search for local symbol definition in document
  if (!info) {
    const fullText = view.state.doc.toString();
    const symbols = extractDocumentSymbols(fullText, 'js');
    const local = symbols.find((s) => s.name.replace(/\(\)$/, '') === word);
    if (local) {
      info = {
        name: local.name,
        kind: local.kind as any,
        signature: `${local.kind} ${local.name}${local.detail ? ' ' + local.detail : ''}`,
        doc: `Defined at line ${local.line} in current document.`,
      };
    }
  }

  if (!info) return null;

  return {
    pos: from + wordStart,
    end: from + wordEnd,
    above: true,
    create() {
      const dom = document.createElement('div');
      dom.className = 'xivig-hover-tooltip';
      dom.style.cssText = `
        background: #252526;
        border: 1px solid #454545;
        border-radius: 4px;
        padding: 6px 10px;
        color: #cccccc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
        font-size: 12px;
        max-width: 420px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        z-index: 1000;
        pointer-events: auto;
      `;

      // Header: Kind & Signature
      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        align-items: baseline;
        gap: 6px;
        border-bottom: 1px solid #3c3c3c;
        padding-bottom: 4px;
        margin-bottom: 6px;
      `;

      const kindBadge = document.createElement('span');
      kindBadge.textContent = `(${info?.kind})`;
      kindBadge.style.cssText = `
        font-size: 10px;
        color: #9cdcfe;
        font-family: monospace;
      `;

      const signature = document.createElement('code');
      signature.textContent = info?.signature || '';
      signature.style.cssText = `
        font-family: Consolas, "Courier New", monospace;
        font-size: 11px;
        color: #4ec9b0;
        font-weight: 600;
        white-space: pre-wrap;
      `;

      header.appendChild(kindBadge);
      header.appendChild(signature);
      dom.appendChild(header);

      // Doc description
      const desc = document.createElement('div');
      desc.textContent = info?.doc || '';
      desc.style.cssText = `
        line-height: 1.4;
        color: #d4d4d4;
      `;
      dom.appendChild(desc);

      // Parameters list if available
      if (info?.parameters && info.parameters.length > 0) {
        const paramsList = document.createElement('div');
        paramsList.style.cssText = `
          margin-top: 6px;
          border-top: 1px solid #333;
          padding-top: 4px;
          font-size: 11px;
        `;
        info.parameters.forEach((param) => {
          const pRow = document.createElement('div');
          pRow.innerHTML = `<span style="color:#9cdcfe;font-family:monospace;">${param.name}</span>: <span style="color:#4ec9b0;font-family:monospace;">${param.type}</span>${param.doc ? ` — <span style="color:#888;">${param.doc}</span>` : ''}`;
          paramsList.appendChild(pRow);
        });
        dom.appendChild(paramsList);
      }

      return { dom };
    },
  };
});

// ============================================================================
// 4. PARAMETER HINTS EXTENSION (SIGNATURE HELP ON '(' OR ',')
// ============================================================================

export const parameterHintsExtension = hoverTooltip((view: EditorView, pos: number): Tooltip | null => {
  const line = view.state.doc.lineAt(pos);
  const textBefore = line.text.slice(0, pos - line.from);

  // Look backwards for open parenthesis
  let parenDepth = 0;
  let openParenIndex = -1;
  let paramIndex = 0;

  for (let i = textBefore.length - 1; i >= 0; i--) {
    const char = textBefore[i];
    if (char === ')') parenDepth++;
    else if (char === '(') {
      if (parenDepth === 0) {
        openParenIndex = i;
        break;
      }
      parenDepth--;
    } else if (char === ',' && parenDepth === 0) {
      paramIndex++;
    }
  }

  if (openParenIndex === -1) return null;

  // Extract function identifier before '('
  const funcPrefix = textBefore.slice(0, openParenIndex).trim();
  const funcNameMatch = funcPrefix.match(/([a-zA-Z0-9_$]+)$/);
  if (!funcNameMatch) return null;

  const funcName = funcNameMatch[1];
  const info = JS_TS_DOCS[funcName] || (PHP_DOCS as any)[funcName] || (LARAVEL_DOCS as any)[funcName];
  if (!info || !info.parameters || info.parameters.length === 0) return null;

  return {
    pos: line.from + openParenIndex,
    above: true,
    strictSide: true,
    create() {
      const dom = document.createElement('div');
      dom.className = 'xivig-param-hint-tooltip';
      dom.style.cssText = `
        background: #1f1f20;
        border: 1px solid #007acc;
        border-radius: 4px;
        padding: 5px 8px;
        color: #cccccc;
        font-family: Consolas, "Courier New", monospace;
        font-size: 11px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 3px;
      `;

      const params = info.parameters || [];
      const sigContainer = document.createElement('div');
      sigContainer.innerHTML = `${info.name}(${params
        .map((p, idx) => {
          const isActive = idx === paramIndex;
          return `<span style="${isActive ? 'color:#569cd6;font-weight:bold;text-decoration:underline;' : 'color:#9cdcfe;'}">${p.name}: ${p.type}</span>`;
        })
        .join(', ')})`;
      dom.appendChild(sigContainer);

      const activeParam = params[paramIndex];
      if (activeParam && activeParam.doc) {
        const hintDesc = document.createElement('div');
        hintDesc.style.cssText = 'color:#888;font-size:10px;font-family:sans-serif;margin-top:2px;';
        hintDesc.textContent = `${activeParam.name}: ${activeParam.doc}`;
        dom.appendChild(hintDesc);
      }

      return { dom };
    },
  };
});

// ============================================================================
// 5. GO TO DEFINITION COMMAND (F12)
// ============================================================================

export function goToDefinition(view: EditorView): boolean {
  const head = view.state.selection.main.head;
  const line = view.state.doc.lineAt(head);
  const col = head - line.from;

  // Extract word at cursor
  let start = col;
  let end = col;
  while (start > 0 && /[\w$]/.test(line.text[start - 1])) start--;
  while (end < line.text.length && /[\w$]/.test(line.text[end])) end++;

  if (start === end) return false;
  const symbol = line.text.slice(start, end);

  // Search active document for definition
  const fullText = view.state.doc.toString();
  const symbols = extractDocumentSymbols(fullText, 'js');
  const target = symbols.find((s) => s.name.replace(/\(\)$/, '') === symbol);

  if (target) {
    const targetLine = view.state.doc.line(target.line);
    view.dispatch({
      selection: EditorSelection.cursor(targetLine.from + target.col - 1),
      effects: EditorView.scrollIntoView(targetLine.from, { y: 'center' }),
    });
    view.focus();
    return true;
  }

  // Cross-document lookup in other open editor tabs
  const allDocs = useEditorStore.getState().documents;
  for (const doc of allDocs) {
    if (doc.content && doc.content.includes(symbol)) {
      const docSymbols = extractDocumentSymbols(doc.content, doc.language || 'js');
      const found = docSymbols.find((s) => s.name.replace(/\(\)$/, '') === symbol);
      if (found) {
        useEditorStore.getState().setActiveDocument(doc.id);
        setTimeout(() => {
          const newView = (window as any).__xivig_active_view as EditorView | undefined;
          if (newView) {
            const l = newView.state.doc.line(found.line);
            newView.dispatch({
              selection: EditorSelection.cursor(l.from + found.col - 1),
              effects: EditorView.scrollIntoView(l.from, { y: 'center' }),
            });
            newView.focus();
          }
        }, 80);
        return true;
      }
    }
  }

  return false;
}

export const codeIntelligenceKeymap = keymap.of([
  {
    key: 'F12',
    run: (view) => goToDefinition(view),
  },
]);
