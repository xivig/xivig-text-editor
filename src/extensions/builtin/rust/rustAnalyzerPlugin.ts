import { RustToolchain, RustSymbol } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

const RUST_KEYWORDS = [
  'fn', 'let', 'mut', 'const', 'static', 'struct', 'enum', 'trait',
  'impl', 'for', 'type', 'pub', 'pub(crate)', 'use', 'mod', 'as',
  'match', 'if', 'else', 'while', 'loop', 'return', 'break', 'continue',
  'async', 'await', 'unsafe', 'where', 'ref', 'move', 'dyn', 'self', 'Self',
  'macro_rules!',
];

const RUST_PRIMITIVES_AND_TYPES = [
  'i8', 'i16', 'i32', 'i64', 'i128', 'isize',
  'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
  'f32', 'f64', 'bool', 'char', 'str', 'String',
  'Vec', 'Option', 'Some', 'None', 'Result', 'Ok', 'Err',
  'Box', 'Rc', 'Arc', 'Mutex', 'RwLock', 'Cell', 'RefCell',
  'HashMap', 'HashSet', 'BTreeMap', 'BTreeSet',
];

/**
 * Detects local cargo and rustc executables.
 */
export function detectRustToolchain(candidatePaths: string[]): RustToolchain | null {
  let cargo: string | undefined;
  let rustc: string | undefined;

  for (const p of candidatePaths) {
    if (!p) continue;
    const clean = p.replace(/\\/g, '/');
    const lower = clean.toLowerCase();

    if (lower.endsWith('/cargo') || lower.endsWith('/cargo.exe')) {
      cargo = clean;
    } else if (lower.endsWith('/rustc') || lower.endsWith('/rustc.exe')) {
      rustc = clean;
    }
  }

  if (cargo || rustc) {
    return {
      cargoPath: cargo || 'cargo',
      rustcPath: rustc || 'rustc',
      isDefault: true,
    };
  }

  return null;
}

/**
 * Extracts Rust language symbols: functions, structs, enums, traits, and modules.
 */
export function parseRustSymbols(sourceCode: string): RustSymbol[] {
  if (!sourceCode || !sourceCode.trim()) return [];

  const symbols: RustSymbol[] = [];
  const lines = sourceCode.split(/\r?\n/);

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();
    const lineNum = idx + 1;

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
      continue;
    }

    // Determine visibility
    let visibility: RustSymbol['visibility'] = 'private';
    if (trimmed.startsWith('pub(crate) ')) {
      visibility = 'pub(crate)';
    } else if (trimmed.startsWith('pub ')) {
      visibility = 'pub';
    }

    // Function: [pub ] [async ] fn name(...)
    const fnMatch = trimmed.match(/(?:pub(?:\(crate\))?\s+)?(?:async\s+)?fn\s+([a-zA-Z0-9_]+)/);
    if (fnMatch) {
      symbols.push({
        name: fnMatch[1],
        kind: 'fn',
        visibility,
        lineNumber: lineNum,
      });
      continue;
    }

    // Struct: [pub ] struct Name
    const structMatch = trimmed.match(/(?:pub(?:\(crate\))?\s+)?struct\s+([a-zA-Z0-9_]+)/);
    if (structMatch) {
      symbols.push({
        name: structMatch[1],
        kind: 'struct',
        visibility,
        lineNumber: lineNum,
      });
      continue;
    }

    // Enum: [pub ] enum Name
    const enumMatch = trimmed.match(/(?:pub(?:\(crate\))?\s+)?enum\s+([a-zA-Z0-9_]+)/);
    if (enumMatch) {
      symbols.push({
        name: enumMatch[1],
        kind: 'enum',
        visibility,
        lineNumber: lineNum,
      });
      continue;
    }

    // Trait: [pub ] trait Name
    const traitMatch = trimmed.match(/(?:pub(?:\(crate\))?\s+)?trait\s+([a-zA-Z0-9_]+)/);
    if (traitMatch) {
      symbols.push({
        name: traitMatch[1],
        kind: 'trait',
        visibility,
        lineNumber: lineNum,
      });
      continue;
    }

    // Impl: impl Name or impl Trait for Name
    const implMatch = trimmed.match(/^impl(?:<[^>]+>)?\s+(?:([a-zA-Z0-9_]+)\s+for\s+)?([a-zA-Z0-9_]+)/);
    if (implMatch) {
      const name = implMatch[1] ? `${implMatch[1]} for ${implMatch[2]}` : implMatch[2];
      symbols.push({
        name,
        kind: 'impl',
        visibility: 'private',
        lineNumber: lineNum,
      });
      continue;
    }

    // Mod: [pub ] mod name;
    const modMatch = trimmed.match(/(?:pub(?:\(crate\))?\s+)?mod\s+([a-zA-Z0-9_]+)/);
    if (modMatch) {
      symbols.push({
        name: modMatch[1],
        kind: 'mod',
        visibility,
        lineNumber: lineNum,
      });
    }
  }

  return symbols;
}

/**
 * Builds Cargo execution commands with flags.
 */
export function buildCargoCliCommand(
  action: 'check' | 'build' | 'test' | 'run' | 'clippy',
  release = false,
  pkg?: string
): string {
  const parts: string[] = ['cargo', action];

  if (release) parts.push('--release');
  if (pkg) parts.push(`-p ${pkg}`);

  return parts.join(' ');
}

/**
 * Autocompletion for Rust keywords, traits, and primitive types.
 */
export function createRustCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_!]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text;
    const options: any[] = [];

    for (const kw of RUST_KEYWORDS) {
      if (kw.startsWith(norm)) {
        options.push({
          label: kw,
          type: 'keyword',
          detail: 'Rust Keyword',
          boost: 3,
        });
      }
    }

    for (const ty of RUST_PRIMITIVES_AND_TYPES) {
      if (ty.startsWith(norm)) {
        options.push({
          label: ty,
          type: 'type',
          detail: 'Rust Type',
          boost: 2,
        });
      }
    }

    if (options.length === 0) return null;

    return {
      from: word.from,
      options,
    };
  };
}
