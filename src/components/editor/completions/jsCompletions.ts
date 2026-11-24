import { Completion, CompletionContext, CompletionResult, snippetCompletion } from '@codemirror/autocomplete';
import { localCompletionSource } from '@codemirror/lang-javascript';

// ============================================================================
// 1. JAVASCRIPT / TYPESCRIPT GLOBALS, MEMBERS, AND PROTOTYPES
// ============================================================================

export interface JsMemberItem {
  label: string;
  type: 'function' | 'method' | 'property' | 'constant';
  detail: string;
  apply?: string;
  boost?: number;
}

export const JS_RECEIVER_MEMBERS: Record<string, JsMemberItem[]> = {
  'console': [
    { label: 'log', type: 'method', detail: 'console.log(...data: any[]): void', apply: 'log(${1})', boost: 99 },
    { label: 'error', type: 'method', detail: 'console.error(...data: any[]): void', apply: 'error(${1})', boost: 98 },
    { label: 'warn', type: 'method', detail: 'console.warn(...data: any[]): void', apply: 'warn(${1})', boost: 95 },
    { label: 'info', type: 'method', detail: 'console.info(...data: any[]): void', apply: 'info(${1})', boost: 90 },
    { label: 'table', type: 'method', detail: 'console.table(tabularData: any): void', apply: 'table(${1})', boost: 90 },
    { label: 'clear', type: 'method', detail: 'console.clear(): void', apply: 'clear()', boost: 80 },
    { label: 'time', type: 'method', detail: 'console.time(label?: string): void', apply: 'time("${1:timer}")', boost: 80 },
    { label: 'timeEnd', type: 'method', detail: 'console.timeEnd(label?: string): void', apply: 'timeEnd("${1:timer}")', boost: 80 },
    { label: 'trace', type: 'method', detail: 'console.trace(...data: any[]): void', apply: 'trace(${1})', boost: 75 },
    { label: 'assert', type: 'method', detail: 'console.assert(condition: boolean, ...data: any[]): void', apply: 'assert(${1:condition}, ${2:message})', boost: 75 },
    { label: 'count', type: 'method', detail: 'console.count(label?: string): void', apply: 'count("${1:label}")', boost: 70 },
  ],
  'document': [
    { label: 'querySelector', type: 'method', detail: 'document.querySelector<E>(selectors: string): E | null', apply: 'querySelector("${1:selector}")', boost: 99 },
    { label: 'querySelectorAll', type: 'method', detail: 'document.querySelectorAll<E>(selectors: string): NodeListOf<E>', apply: 'querySelectorAll("${1:selector}")', boost: 98 },
    { label: 'getElementById', type: 'method', detail: 'document.getElementById(elementId: string): HTMLElement | null', apply: 'getElementById("${1:id}")', boost: 97 },
    { label: 'getElementsByClassName', type: 'method', detail: 'document.getElementsByClassName(classNames: string): HTMLCollectionOf<Element>', apply: 'getElementsByClassName("${1:className}")', boost: 90 },
    { label: 'getElementsByTagName', type: 'method', detail: 'document.getElementsByTagName(qualifiedName: string): HTMLCollectionOf<Element>', apply: 'getElementsByTagName("${1:tag}")', boost: 88 },
    { label: 'createElement', type: 'method', detail: 'document.createElement<K>(tagName: K): HTMLElementTagNameMap[K]', apply: 'createElement("${1:div}")', boost: 96 },
    { label: 'createTextNode', type: 'method', detail: 'document.createTextNode(data: string): Text', apply: 'createTextNode("${1:text}")', boost: 85 },
    { label: 'addEventListener', type: 'method', detail: 'document.addEventListener(type: string, listener: EventListener): void', apply: 'addEventListener("${1:DOMContentLoaded}", (${2:e}) => {\n\t${0}\n})', boost: 95 },
    { label: 'removeEventListener', type: 'method', detail: 'document.removeEventListener(type: string, listener: EventListener): void', apply: 'removeEventListener("${1:type}", ${2:handler})', boost: 85 },
    { label: 'body', type: 'property', detail: 'document.body: HTMLBodyElement', boost: 92 },
    { label: 'head', type: 'property', detail: 'document.head: HTMLHeadElement', boost: 90 },
    { label: 'title', type: 'property', detail: 'document.title: string', boost: 88 },
    { label: 'cookie', type: 'property', detail: 'document.cookie: string', boost: 80 },
    { label: 'location', type: 'property', detail: 'document.location: Location', boost: 85 },
  ],
  'Math': [
    { label: 'floor', type: 'method', detail: 'Math.floor(x: number): number', apply: 'floor(${1:x})', boost: 95 },
    { label: 'ceil', type: 'method', detail: 'Math.ceil(x: number): number', apply: 'ceil(${1:x})', boost: 94 },
    { label: 'round', type: 'method', detail: 'Math.round(x: number): number', apply: 'round(${1:x})', boost: 93 },
    { label: 'abs', type: 'method', detail: 'Math.abs(x: number): number', apply: 'abs(${1:x})', boost: 92 },
    { label: 'min', type: 'method', detail: 'Math.min(...values: number[]): number', apply: 'min(${1:a}, ${2:b})', boost: 90 },
    { label: 'max', type: 'method', detail: 'Math.max(...values: number[]): number', apply: 'max(${1:a}, ${2:b})', boost: 90 },
    { label: 'random', type: 'method', detail: 'Math.random(): number (0 <= n < 1)', apply: 'random()', boost: 95 },
    { label: 'sqrt', type: 'method', detail: 'Math.sqrt(x: number): number', apply: 'sqrt(${1:x})', boost: 85 },
    { label: 'pow', type: 'method', detail: 'Math.pow(x: number, y: number): number', apply: 'pow(${1:base}, ${2:exp})', boost: 85 },
    { label: 'trunc', type: 'method', detail: 'Math.trunc(x: number): number', apply: 'trunc(${1:x})', boost: 80 },
    { label: 'PI', type: 'constant', detail: 'Math.PI: number = 3.141592653589793', boost: 85 },
    { label: 'E', type: 'constant', detail: 'Math.E: number = 2.718281828459045', boost: 70 },
  ],
  'JSON': [
    { label: 'parse', type: 'method', detail: 'JSON.parse<T = any>(text: string, reviver?: Function): T', apply: 'parse(${1:text})', boost: 98 },
    { label: 'stringify', type: 'method', detail: 'JSON.stringify(value: any, replacer?: Function | any[], space?: string | number): string', apply: 'stringify(${1:value}, null, 2)', boost: 98 },
  ],
  'Promise': [
    { label: 'resolve', type: 'method', detail: 'Promise.resolve<T>(value: T | PromiseLike<T>): Promise<T>', apply: 'resolve(${1:value})', boost: 95 },
    { label: 'reject', type: 'method', detail: 'Promise.reject<T = never>(reason?: any): Promise<T>', apply: 'reject(${1:error})', boost: 92 },
    { label: 'all', type: 'method', detail: 'Promise.all<T>(values: Iterable<T | PromiseLike<T>>): Promise<T[]>', apply: 'all([${1:promises}])', boost: 96 },
    { label: 'allSettled', type: 'method', detail: 'Promise.allSettled(values: Iterable<PromiseLike<any>>): Promise<PromiseSettledResult<any>[]>', apply: 'allSettled([${1:promises}])', boost: 90 },
    { label: 'race', type: 'method', detail: 'Promise.race<T>(values: Iterable<T | PromiseLike<T>>): Promise<T>', apply: 'race([${1:promises}])', boost: 85 },
    { label: 'any', type: 'method', detail: 'Promise.any<T>(values: Iterable<T | PromiseLike<T>>): Promise<T>', apply: 'any([${1:promises}])', boost: 85 },
  ],
  'Array': [
    { label: 'isArray', type: 'method', detail: 'Array.isArray(arg: any): arg is any[]', apply: 'isArray(${1:arg})', boost: 98 },
    { label: 'from', type: 'method', detail: 'Array.from<T, U>(iterable: Iterable<T>, mapfn?: (v: T, k: number) => U): U[]', apply: 'from(${1:iterable})', boost: 92 },
    { label: 'of', type: 'method', detail: 'Array.of<T>(...items: T[]): T[]', apply: 'of(${1:items})', boost: 85 },
  ],
  'Object': [
    { label: 'keys', type: 'method', detail: 'Object.keys(o: object): string[]', apply: 'keys(${1:obj})', boost: 98 },
    { label: 'values', type: 'method', detail: 'Object.values<T>(o: { [s: string]: T } | ArrayLike<T>): T[]', apply: 'values(${1:obj})', boost: 97 },
    { label: 'entries', type: 'method', detail: 'Object.entries<T>(o: { [s: string]: T }): [string, T][]', apply: 'entries(${1:obj})', boost: 96 },
    { label: 'assign', type: 'method', detail: 'Object.assign<T, U>(target: T, source: U): T & U', apply: 'assign({}, ${1:source})', boost: 94 },
    { label: 'freeze', type: 'method', detail: 'Object.freeze<T>(a: T): Readonly<T>', apply: 'freeze(${1:obj})', boost: 88 },
    { label: 'create', type: 'method', detail: 'Object.create(o: object | null): any', apply: 'create(${1:proto})', boost: 85 },
    { label: 'fromEntries', type: 'method', detail: 'Object.fromEntries<T = any>(entries: Iterable<readonly [PropertyKey, T]>): { [k: string]: T }', apply: 'fromEntries(${1:entries})', boost: 90 },
    { label: 'hasOwn', type: 'method', detail: 'Object.hasOwn(o: object, v: PropertyKey): boolean', apply: 'hasOwn(${1:obj}, "${2:prop}")', boost: 92 },
  ],
};

// Generic prototype methods offered on any dot expression
export const JS_PROTOTYPE_METHODS: JsMemberItem[] = [
  // Array methods
  { label: 'map', type: 'method', detail: '.map<U>(callback: (value: T, index: number) => U): U[]', apply: 'map((${1:item}) => ${2:item})', boost: 99 },
  { label: 'filter', type: 'method', detail: '.filter(predicate: (value: T, index: number) => boolean): T[]', apply: 'filter((${1:item}) => ${2:Boolean(item)})', boost: 98 },
  { label: 'reduce', type: 'method', detail: '.reduce<U>(callback: (previousValue: U, currentValue: T) => U, initialValue: U): U', apply: 'reduce((${1:acc}, ${2:curr}) => ${3:acc}, ${4:initial})', boost: 95 },
  { label: 'forEach', type: 'method', detail: '.forEach(callback: (value: T, index: number) => void): void', apply: 'forEach((${1:item}) => {\n\t${0}\n})', boost: 97 },
  { label: 'find', type: 'method', detail: '.find(predicate: (value: T) => boolean): T | undefined', apply: 'find((${1:item}) => ${2:item.id === id})', boost: 94 },
  { label: 'findIndex', type: 'method', detail: '.findIndex(predicate: (value: T) => boolean): number', apply: 'findIndex((${1:item}) => ${2:item.id === id})', boost: 92 },
  { label: 'includes', type: 'method', detail: '.includes(searchElement: T, fromIndex?: number): boolean', apply: 'includes(${1:item})', boost: 96 },
  { label: 'indexOf', type: 'method', detail: '.indexOf(searchElement: T, fromIndex?: number): number', apply: 'indexOf(${1:item})', boost: 90 },
  { label: 'slice', type: 'method', detail: '.slice(start?: number, end?: number): T[]', apply: 'slice(${1:0}, ${2:length})', boost: 92 },
  { label: 'splice', type: 'method', detail: '.splice(start: number, deleteCount?: number, ...items: T[]): T[]', apply: 'splice(${1:start}, ${2:deleteCount})', boost: 88 },
  { label: 'push', type: 'method', detail: '.push(...items: T[]): number', apply: 'push(${1:item})', boost: 95 },
  { label: 'pop', type: 'method', detail: '.pop(): T | undefined', apply: 'pop()', boost: 90 },
  { label: 'shift', type: 'method', detail: '.shift(): T | undefined', apply: 'shift()', boost: 88 },
  { label: 'unshift', type: 'method', detail: '.unshift(...items: T[]): number', apply: 'unshift(${1:item})', boost: 88 },
  { label: 'join', type: 'method', detail: '.join(separator?: string): string', apply: 'join("${1:,}")', boost: 93 },
  { label: 'concat', type: 'method', detail: '.concat(...items: ConcatArray<T>[]): T[]', apply: 'concat(${1:otherArray})', boost: 85 },
  { label: 'flat', type: 'method', detail: '.flat<A, D>(depth?: D): FlatArray<A, D>[]', apply: 'flat(${1:1})', boost: 88 },
  { label: 'flatMap', type: 'method', detail: '.flatMap<U>(callback: (value: T) => U | readonly U[]): U[]', apply: 'flatMap((${1:item}) => ${2:item})', boost: 88 },
  { label: 'some', type: 'method', detail: '.some(predicate: (value: T) => boolean): boolean', apply: 'some((${1:item}) => ${2:condition})', boost: 90 },
  { label: 'every', type: 'method', detail: '.every(predicate: (value: T) => boolean): boolean', apply: 'every((${1:item}) => ${2:condition})', boost: 90 },
  { label: 'sort', type: 'method', detail: '.sort(compareFn?: (a: T, b: T) => number): this', apply: 'sort((${1:a}, ${2:b}) => ${1:a} - ${2:b})', boost: 92 },
  { label: 'reverse', type: 'method', detail: '.reverse(): this', apply: 'reverse()', boost: 85 },
  { label: 'length', type: 'property', detail: '.length: number', boost: 97 },

  // String methods
  { label: 'split', type: 'method', detail: '.split(separator: string | RegExp, limit?: number): string[]', apply: 'split("${1:}")', boost: 96 },
  { label: 'trim', type: 'method', detail: '.trim(): string', apply: 'trim()', boost: 95 },
  { label: 'trimStart', type: 'method', detail: '.trimStart(): string', apply: 'trimStart()', boost: 85 },
  { label: 'trimEnd', type: 'method', detail: '.trimEnd(): string', apply: 'trimEnd()', boost: 85 },
  { label: 'toLowerCase', type: 'method', detail: '.toLowerCase(): string', apply: 'toLowerCase()', boost: 94 },
  { label: 'toUpperCase', type: 'method', detail: '.toUpperCase(): string', apply: 'toUpperCase()', boost: 94 },
  { label: 'replace', type: 'method', detail: '.replace(searchValue: string | RegExp, replaceValue: string): string', apply: 'replace("${1:target}", "${2:replacement}")', boost: 95 },
  { label: 'replaceAll', type: 'method', detail: '.replaceAll(searchValue: string | RegExp, replaceValue: string): string', apply: 'replaceAll("${1:target}", "${2:replacement}")', boost: 95 },
  { label: 'substring', type: 'method', detail: '.substring(start: number, end?: number): string', apply: 'substring(${1:0}, ${2:end})', boost: 88 },
  { label: 'startsWith', type: 'method', detail: '.startsWith(searchString: string, position?: number): boolean', apply: 'startsWith("${1:prefix}")', boost: 93 },
  { label: 'endsWith', type: 'method', detail: '.endsWith(searchString: string, endPosition?: number): boolean', apply: 'endsWith("${1:suffix}")', boost: 93 },
  { label: 'charAt', type: 'method', detail: '.charAt(pos: number): string', apply: 'charAt(${1:0})', boost: 85 },
  { label: 'repeat', type: 'method', detail: '.repeat(count: number): string', apply: 'repeat(${1:count})', boost: 80 },

  // DOM methods
  { label: 'addEventListener', type: 'method', detail: '.addEventListener(type: string, listener: EventListener): void', apply: 'addEventListener("${1:click}", (${2:e}) => {\n\t${0}\n})', boost: 96 },
  { label: 'removeEventListener', type: 'method', detail: '.removeEventListener(type: string, listener: EventListener): void', apply: 'removeEventListener("${1:click}", ${2:handler})', boost: 85 },
  { label: 'setAttribute', type: 'method', detail: '.setAttribute(qualifiedName: string, value: string): void', apply: 'setAttribute("${1:attr}", "${2:value}")', boost: 92 },
  { label: 'getAttribute', type: 'method', detail: '.getAttribute(qualifiedName: string): string | null', apply: 'getAttribute("${1:attr}")', boost: 92 },
  { label: 'removeAttribute', type: 'method', detail: '.removeAttribute(qualifiedName: string): void', apply: 'removeAttribute("${1:attr}")', boost: 88 },
  { label: 'hasAttribute', type: 'method', detail: '.hasAttribute(qualifiedName: string): boolean', apply: 'hasAttribute("${1:attr}")', boost: 88 },
  { label: 'classList', type: 'property', detail: '.classList: DOMTokenList (add, remove, toggle, contains)', boost: 95 },
  { label: 'appendChild', type: 'method', detail: '.appendChild<T extends Node>(node: T): T', apply: 'appendChild(${1:child})', boost: 90 },
  { label: 'removeChild', type: 'method', detail: '.removeChild<T extends Node>(child: T): T', apply: 'removeChild(${1:child})', boost: 88 },
  { label: 'closest', type: 'method', detail: '.closest<E extends Element = Element>(selectors: string): E | null', apply: 'closest("${1:selector}")', boost: 91 },
  { label: 'matches', type: 'method', detail: '.matches(selectors: string): boolean', apply: 'matches("${1:selector}")', boost: 88 },
  { label: 'innerHTML', type: 'property', detail: '.innerHTML: string', boost: 92 },
  { label: 'textContent', type: 'property', detail: '.textContent: string | null', boost: 92 },
  { label: 'value', type: 'property', detail: '.value: string', boost: 92 },
  { label: 'style', type: 'property', detail: '.style: CSSStyleDeclaration', boost: 90 },

  // Promise instance methods
  { label: 'then', type: 'method', detail: '.then<TResult1, TResult2>(onfulfilled?: Function, onrejected?: Function): Promise<TResult1 | TResult2>', apply: 'then((${1:res}) => {\n\t${0}\n})', boost: 96 },
  { label: 'catch', type: 'method', detail: '.catch<TResult>(onrejected?: (reason: any) => TResult): Promise<T | TResult>', apply: 'catch((${1:err}) => {\n\t${0}\n})', boost: 95 },
  { label: 'finally', type: 'method', detail: '.finally(onfinally?: () => void): Promise<T>', apply: 'finally(() => {\n\t${0}\n})', boost: 90 },
];

// ============================================================================
// 2. JS / TS KEYWORDS & GLOBALS
// ============================================================================

export const JS_KEYWORDS: { label: string; detail: string; apply?: string; boost?: number }[] = [
  { label: 'const', detail: 'Declares a block-scoped, immutable variable reference.', apply: 'const ${1:name} = ${2:value};', boost: 95 },
  { label: 'let', detail: 'Declares a block-scoped, mutable local variable.', apply: 'let ${1:name} = ${2:value};', boost: 94 },
  { label: 'var', detail: 'Declares a function-scoped or globally-scoped variable.', apply: 'var ${1:name} = ${2:value};', boost: 70 },
  { label: 'function', detail: 'Declares a function with specified parameters.', apply: 'function ${1:name}(${2:params}) {\n\t${0}\n}', boost: 95 },
  { label: 'return', detail: 'Specifies the value to be returned from a function.', apply: 'return ${1};', boost: 95 },
  { label: 'async', detail: 'Declares an asynchronous function returning a Promise.', apply: 'async function ${1:name}(${2:params}) {\n\t${0}\n}', boost: 92 },
  { label: 'await', detail: 'Pauses execution until a Promise settles.', apply: 'await ${1:promise}', boost: 92 },
  { label: 'if', detail: 'Executes a statement if a specified condition is truthy.', apply: 'if (${1:condition}) {\n\t${0}\n}', boost: 95 },
  { label: 'else', detail: 'Executes a statement if the preceding if condition is falsy.', apply: 'else {\n\t${0}\n}', boost: 92 },
  { label: 'for', detail: 'Creates a loop consisting of three optional expressions.', apply: 'for (let ${1:i} = 0; ${1:i} < ${2:length}; ${1:i}++) {\n\t${0}\n}', boost: 92 },
  { label: 'while', detail: 'Creates a loop that executes while condition evaluates to true.', apply: 'while (${1:condition}) {\n\t${0}\n}', boost: 88 },
  { label: 'switch', detail: 'Evaluates an expression and matches against multiple case clauses.', apply: 'switch (${1:expression}) {\n\tcase ${2:value}:\n\t\t${3}\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}', boost: 88 },
  { label: 'try', detail: 'Marks a block of statements to try and catch exceptions.', apply: 'try {\n\t${0}\n} catch (${1:error}) {\n\tconsole.error(${1:error});\n}', boost: 90 },
  { label: 'catch', detail: 'Catches exceptions thrown in preceding try block.', apply: 'catch (${1:error}) {\n\t${0}\n}', boost: 88 },
  { label: 'finally', detail: 'Executes statements after try/catch regardless of outcome.', apply: 'finally {\n\t${0}\n}', boost: 85 },
  { label: 'throw', detail: 'Throws a user-defined exception.', apply: 'throw new Error("${1:message}");', boost: 85 },
  { label: 'class', detail: 'Creates a new class declaration.', apply: 'class ${1:Name} {\n\tconstructor(${2}) {\n\t\t${0}\n\t}\n}', boost: 90 },
  { label: 'extends', detail: 'Creates a subclass or derived class.', apply: 'extends ${1:SuperClass}', boost: 88 },
  { label: 'import', detail: 'Imports bindings exported by another module.', apply: "import { ${1:items} } from '${2:module}';", boost: 95 },
  { label: 'export', detail: 'Exports values from a JavaScript module.', apply: 'export const ${1:name} = ${2:value};', boost: 92 },
  { label: 'default', detail: 'Specifies the default export or switch case.' },
  { label: 'new', detail: 'Creates an instance of an object that has a constructor function.' },
  { label: 'typeof', detail: 'Returns a string indicating the type of the unevaluated operand.' },
  { label: 'instanceof', detail: 'Tests whether the prototype property of a constructor appears anywhere in prototype chain.' },
  { label: 'this', detail: 'Refers to current execution context.' },
  { label: 'super', detail: 'Calls or accesses functions on an object\'s parent.' },
  { label: 'interface', detail: 'TypeScript interface declaration.', apply: 'interface ${1:Name} {\n\t${0}\n}', boost: 90 },
  { label: 'type', detail: 'TypeScript type alias declaration.', apply: 'type ${1:Name} = ${2:Type};', boost: 90 },
];

export const JS_GLOBALS: { label: string; detail: string; type: 'variable' | 'class' | 'function'; boost?: number }[] = [
  { label: 'console', detail: 'Provides access to the browser/runtime debugging console.', type: 'variable', boost: 99 },
  { label: 'document', detail: 'Represents any web page loaded in the browser.', type: 'variable', boost: 98 },
  { label: 'window', detail: 'Represents a window containing a DOM document (global scope).', type: 'variable', boost: 96 },
  { label: 'fetch', detail: 'Starts the process of fetching a resource from the network.', type: 'function', boost: 97 },
  { label: 'setTimeout', detail: 'Sets a timer which executes a function once the timer expires.', type: 'function', boost: 94 },
  { label: 'setInterval', detail: 'Repeatedly calls a function with fixed time delay.', type: 'function', boost: 92 },
  { label: 'clearTimeout', detail: 'Cancels a timeout previously established by setTimeout.', type: 'function', boost: 90 },
  { label: 'clearInterval', detail: 'Cancels repeated action established by setInterval.', type: 'function', boost: 90 },
  { label: 'Math', detail: 'Built-in object that has properties and methods for mathematical constants.', type: 'variable', boost: 95 },
  { label: 'JSON', detail: 'Built-in object with methods for parsing and stringifying JSON.', type: 'variable', boost: 95 },
  { label: 'Promise', detail: 'Represents the eventual completion (or failure) of an asynchronous operation.', type: 'class', boost: 95 },
  { label: 'Array', detail: 'JavaScript Array constructor and static helper methods.', type: 'class', boost: 94 },
  { label: 'Object', detail: 'JavaScript Object constructor and static helper methods.', type: 'class', boost: 94 },
  { label: 'String', detail: 'JavaScript String constructor.', type: 'class', boost: 90 },
  { label: 'Number', detail: 'JavaScript Number constructor and constants.', type: 'class', boost: 90 },
  { label: 'Boolean', detail: 'JavaScript Boolean constructor.', type: 'class', boost: 90 },
  { label: 'Date', detail: 'JavaScript Date constructor for handling dates and times.', type: 'class', boost: 92 },
  { label: 'RegExp', detail: 'JavaScript RegExp constructor for pattern matching.', type: 'class', boost: 90 },
  { label: 'Map', detail: 'Collection of keyed data items like an Object, allowing any key type.', type: 'class', boost: 92 },
  { label: 'Set', detail: 'Collection of unique values.', type: 'class', boost: 92 },
  { label: 'Error', detail: 'Creates an error object representing a runtime error.', type: 'class', boost: 90 },
  { label: 'localStorage', detail: 'Accesses a Storage object for the Document\'s origin (persisted).', type: 'variable', boost: 92 },
  { label: 'sessionStorage', detail: 'Accesses a Storage object for session-scoped data.', type: 'variable', boost: 90 },
  { label: 'navigator', detail: 'Represents the state and the identity of the user agent.', type: 'variable', boost: 88 },
  { label: 'location', detail: 'Represents the location (URL) of the object it is linked to.', type: 'variable', boost: 88 },
];

// ============================================================================
// 3. JAVASCRIPT COMPLETION SOURCE IMPLEMENTATION
// ============================================================================

export function jsCompletions(context: CompletionContext): CompletionResult | null {
  const line = context.state.doc.lineAt(context.pos);
  const textBefore = line.text.slice(0, context.pos - line.from);

  // 1. Member dot completion: receiver.member
  const dotMatch = textBefore.match(/([a-zA-Z0-9_$]+)\.([a-zA-Z0-9_$]*)$/);
  if (dotMatch) {
    const receiver = dotMatch[1];
    const memberPrefix = dotMatch[2];
    const fromPos = context.pos - memberPrefix.length;

    // Check if receiver has specific known members
    const knownMembers = JS_RECEIVER_MEMBERS[receiver];
    let memberOptions: Completion[] = [];

    if (knownMembers) {
      memberOptions = knownMembers.map((m) => {
        if (m.apply) {
          return snippetCompletion(m.apply, {
            label: m.label,
            detail: m.detail,
            type: m.type,
            boost: m.boost ?? 90,
          });
        }
        return {
          label: m.label,
          detail: m.detail,
          type: m.type,
          boost: m.boost ?? 90,
        };
      });
    } else {
      // General prototype methods (array, string, dom, promise)
      memberOptions = JS_PROTOTYPE_METHODS.map((m) => {
        if (m.apply) {
          return snippetCompletion(m.apply, {
            label: m.label,
            detail: m.detail,
            type: m.type,
            boost: m.boost ?? 85,
          });
        }
        return {
          label: m.label,
          detail: m.detail,
          type: m.type,
          boost: m.boost ?? 85,
        };
      });
    }

    return {
      from: fromPos,
      options: memberOptions,
      validFor: /^[a-zA-Z0-9_$]*$/,
    };
  }

  // 2. Word prefix trigger: keywords and globals
  const word = context.matchBefore(/[a-zA-Z_$][a-zA-Z0-9_$]*/);
  if (word && !textBefore.endsWith('.')) {
    const keywordOptions: Completion[] = JS_KEYWORDS.map((k) => {
      if (k.apply) {
        return snippetCompletion(k.apply, {
          label: k.label,
          detail: k.detail,
          type: 'keyword',
          boost: k.boost ?? 85,
        });
      }
      return {
        label: k.label,
        detail: k.detail,
        type: 'keyword',
        boost: k.boost ?? 85,
      };
    });

    const globalOptions: Completion[] = JS_GLOBALS.map((g) => ({
      label: g.label,
      detail: g.detail,
      type: g.type,
      boost: g.boost ?? 85,
    }));

    const options = [...keywordOptions, ...globalOptions];

    return {
      from: word.from,
      options,
      validFor: /^[a-zA-Z0-9_$]*$/,
    };
  }

  // 3. Delegate to CodeMirror's local scope completions if available
  try {
    const res = localCompletionSource(context);
    if (res && !(res instanceof Promise)) {
      return res;
    }
    return null;
  } catch {
    return null;
  }
}
