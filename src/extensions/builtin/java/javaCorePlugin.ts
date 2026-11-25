import { JdkInstallation, JavaSymbol, JavaSettings } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const DEFAULT_JAVA_SETTINGS: JavaSettings = {
  enabled: true,
  autobuild: true,
  completionMatchCase: false,
};

const JAVA_KEYWORDS = [
  'public', 'protected', 'private', 'static', 'final', 'abstract',
  'synchronized', 'volatile', 'transient', 'native', 'strictfp',
  'class', 'interface', 'record', 'enum', 'extends', 'implements',
  'throws', 'throw', 'try', 'catch', 'finally', 'new', 'return',
  'if', 'else', 'switch', 'case', 'default', 'while', 'do', 'for',
  'break', 'continue', 'instanceof', 'assert', 'var', 'yield',
];

const JAVA_TYPES = [
  'void', 'boolean', 'byte', 'char', 'short', 'int', 'long', 'float', 'double',
  'String', 'Object', 'Integer', 'Long', 'Double', 'Boolean',
  'List', 'ArrayList', 'LinkedList', 'Map', 'HashMap', 'TreeMap',
  'Set', 'HashSet', 'TreeSet', 'Optional', 'Arrays', 'Collections',
  'Objects', 'CompletableFuture', 'Stream',
];

/**
 * Discovers JDK installations from environment variables and system directories.
 */
export function detectJdkInstallations(
  candidatePaths: string[],
  envVars: Record<string, string | undefined> = {}
): JdkInstallation[] {
  const jdks: JdkInstallation[] = [];
  const seenPaths = new Set<string>();

  const javaHome = envVars['JAVA_HOME'] || envVars['JDK_HOME'];
  if (javaHome) {
    const cleanHome = javaHome.replace(/\\/g, '/');
    seenPaths.add(cleanHome);
    jdks.push({
      path: cleanHome,
      name: 'JDK (JAVA_HOME)',
      isDefault: true,
    });
  }

  for (const p of candidatePaths) {
    if (!p) continue;
    const clean = p.replace(/\\/g, '/');
    if (!seenPaths.has(clean)) {
      seenPaths.add(clean);
      const isAdoptium = clean.toLowerCase().includes('adoptium') || clean.toLowerCase().includes('temurin');
      const isCorretto = clean.toLowerCase().includes('corretto');
      const isZulu = clean.toLowerCase().includes('zulu');

      let vendor = 'Oracle / OpenJDK';
      if (isAdoptium) vendor = 'Eclipse Temurin';
      else if (isCorretto) vendor = 'Amazon Corretto';
      else if (isZulu) vendor = 'Azul Zulu';

      jdks.push({
        path: clean,
        vendor,
        isDefault: jdks.length === 0,
      });
    }
  }

  return jdks;
}

/**
 * Lightweight AST/regex parser extracting package, class, record, interface, and method declarations.
 */
export function parseJavaSourceSymbols(sourceCode: string): {
  package?: string;
  symbols: JavaSymbol[];
} {
  if (!sourceCode || !sourceCode.trim()) {
    return { symbols: [] };
  }

  const lines = sourceCode.split(/\r?\n/);
  let pkg: string | undefined;
  const symbols: JavaSymbol[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();
    const lineNum = idx + 1;

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // Package declaration
    if (trimmed.startsWith('package ') && trimmed.endsWith(';')) {
      pkg = trimmed.slice(8, -1).trim();
      continue;
    }

    // Class / Interface / Record / Enum declaration
    const typeMatch = trimmed.match(
      /(?:(public|protected|private|static|final|abstract)\s+)*(class|interface|record|enum)\s+([a-zA-Z0-9_]+)/
    );
    if (typeMatch) {
      const modifiers = (typeMatch[1] ? typeMatch[1].split(/\s+/) : []);
      const kind = typeMatch[2] as JavaSymbol['kind'];
      const name = typeMatch[3];

      symbols.push({
        name,
        kind,
        package: pkg,
        lineNumber: lineNum,
        modifiers,
      });
      continue;
    }

    // Method declaration
    const methodMatch = trimmed.match(
      /(?:(public|protected|private|static|final|synchronized|abstract)\s+)+([a-zA-Z0-9_<>,\[\]]+)\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*(?:throws\s+[a-zA-Z0-9_,\s]+)?\s*\{?/
    );
    if (methodMatch && !['class', 'interface', 'record', 'enum', 'if', 'for', 'while', 'switch'].includes(methodMatch[3])) {
      symbols.push({
        name: methodMatch[3],
        kind: 'method',
        package: pkg,
        lineNumber: lineNum,
        modifiers: methodMatch[1] ? [methodMatch[1]] : [],
      });
    }
  }

  return {
    package: pkg,
    symbols,
  };
}

/**
 * Autocompletion for Java keywords and types.
 */
export function createJavaCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text;
    const options: any[] = [];

    for (const kw of JAVA_KEYWORDS) {
      if (kw.startsWith(norm)) {
        options.push({
          label: kw,
          type: 'keyword',
          detail: 'Java Keyword',
          boost: 3,
        });
      }
    }

    for (const ty of JAVA_TYPES) {
      if (ty.startsWith(norm)) {
        options.push({
          label: ty,
          type: 'type',
          detail: 'Java Type',
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
