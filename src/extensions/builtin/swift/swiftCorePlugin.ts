import { SwiftSymbol, SwiftPackageManifest } from './types';

/**
 * Returns common toolchain installation directories for Swift across platforms.
 */
export function getStandardSwiftToolchainPaths(): string[] {
  const isWin = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase().includes('windows') : process.platform === 'win32';
  if (isWin) {
    return [
      'C:\\Program Files\\Swift\\Toolchains',
      'C:\\Program Files\\Swift\\bin',
      'C:\\Program Files (x86)\\Swift\\bin',
      'C:\\Swift\\bin',
    ];
  }
  return [
    '/usr/bin',
    '/usr/local/bin',
    '/Applications/Xcode.app/Contents/Developer/Toolchains/XcodeDefault.xctoolchain/usr/bin',
    '/Library/Developer/Toolchains/swift-latest.xctoolchain/usr/bin',
  ];
}

/**
 * Parses Swift source code to extract top-level and member declarations
 * (functions, structs, classes, actors, protocols, enums, extensions, constants, variables).
 */
export function parseSwiftSymbols(sourceCode: string): SwiftSymbol[] {
  if (!sourceCode || !sourceCode.trim()) return [];

  const lines = sourceCode.split(/\r?\n/);
  const symbols: SwiftSymbol[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const trimmed = line.trim();
    const lineNum = idx + 1;

    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // Access modifier
    let accessLevel: 'public' | 'private' | 'fileprivate' | 'internal' | 'open' | undefined;
    if (/\bopen\b/.test(trimmed)) accessLevel = 'open';
    else if (/\bpublic\b/.test(trimmed)) accessLevel = 'public';
    else if (/\bprivate\b/.test(trimmed)) accessLevel = 'private';
    else if (/\bfileprivate\b/.test(trimmed)) accessLevel = 'fileprivate';
    else if (/\binternal\b/.test(trimmed)) accessLevel = 'internal';

    const isStatic = /\bstatic\b/.test(trimmed);
    const isAsync = /\basync\b/.test(trimmed);

    // Function: [public ] [static ] func name(...)
    const funcMatch = trimmed.match(/(?:func)\s+([a-zA-Z_]\w*)\s*(?:<[^>]+>)?\s*\(/);
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        kind: 'func',
        signature: trimmed.replace(/\{.*$/, '').trim(),
        isAsync,
        isStatic,
        accessLevel,
        lineNumber: lineNum,
      });
      continue;
    }

    // Struct: struct Name ...
    const structMatch = trimmed.match(/(?:struct)\s+([a-zA-Z_]\w*)/);
    if (structMatch) {
      symbols.push({
        name: structMatch[1],
        kind: 'struct',
        accessLevel,
        lineNumber: lineNum,
      });
      continue;
    }

    // Class: class Name ...
    const classMatch = trimmed.match(/(?:class)\s+([a-zA-Z_]\w*)/);
    if (classMatch && !trimmed.includes('func ')) {
      symbols.push({
        name: classMatch[1],
        kind: 'class',
        accessLevel,
        lineNumber: lineNum,
      });
      continue;
    }

    // Actor: actor Name ...
    const actorMatch = trimmed.match(/(?:actor)\s+([a-zA-Z_]\w*)/);
    if (actorMatch) {
      symbols.push({
        name: actorMatch[1],
        kind: 'actor',
        accessLevel,
        lineNumber: lineNum,
      });
      continue;
    }

    // Protocol: protocol Name ...
    const protocolMatch = trimmed.match(/(?:protocol)\s+([a-zA-Z_]\w*)/);
    if (protocolMatch) {
      symbols.push({
        name: protocolMatch[1],
        kind: 'protocol',
        accessLevel,
        lineNumber: lineNum,
      });
      continue;
    }

    // Enum: enum Name ...
    const enumMatch = trimmed.match(/(?:enum)\s+([a-zA-Z_]\w*)/);
    if (enumMatch) {
      symbols.push({
        name: enumMatch[1],
        kind: 'enum',
        accessLevel,
        lineNumber: lineNum,
      });
      continue;
    }

    // Extension: extension Name ...
    const extMatch = trimmed.match(/(?:extension)\s+([a-zA-Z_]\w*)/);
    if (extMatch) {
      symbols.push({
        name: extMatch[1],
        kind: 'extension',
        lineNumber: lineNum,
      });
      continue;
    }

    // Constant: let name ...
    const letMatch = trimmed.match(/(?:let)\s+([a-zA-Z_]\w*)/);
    if (letMatch && !trimmed.startsWith('if ') && !trimmed.startsWith('guard ')) {
      symbols.push({
        name: letMatch[1],
        kind: 'constant',
        isStatic,
        accessLevel,
        lineNumber: lineNum,
      });
      continue;
    }

    // Variable: var name ...
    const varMatch = trimmed.match(/(?:var)\s+([a-zA-Z_]\w*)/);
    if (varMatch && !trimmed.startsWith('if ') && !trimmed.startsWith('for ')) {
      symbols.push({
        name: varMatch[1],
        kind: 'variable',
        isStatic,
        accessLevel,
        lineNumber: lineNum,
      });
      continue;
    }
  }

  return symbols;
}

/**
 * Parses a Swift Package.swift manifest file.
 */
export function parsePackageManifest(manifestContent: string): SwiftPackageManifest {
  const result: SwiftPackageManifest = {
    name: 'Package',
    targets: [],
  };

  if (!manifestContent) return result;

  // swift-tools-version
  const toolsMatch = manifestContent.match(/\/\/\s*swift-tools-version:\s*([0-9.]+)/i);
  if (toolsMatch) {
    result.swiftToolsVersion = toolsMatch[1];
  }

  // Package name
  const nameMatch = manifestContent.match(/name:\s*["']([^"']+)["']/);
  if (nameMatch) {
    result.name = nameMatch[1];
  }

  // Targets
  const targetRegex = /\.(executableTarget|target|testTarget)\s*\(\s*name:\s*["']([^"']+)["']/g;
  let tMatch: RegExpExecArray | null;
  while ((tMatch = targetRegex.exec(manifestContent)) !== null) {
    const rawKind = tMatch[1];
    const targetName = tMatch[2];
    result.targets?.push({
      name: targetName,
      type: rawKind === 'testTarget' ? 'test' : rawKind === 'executableTarget' ? 'executable' : 'library',
      dependencies: [],
    });
  }

  return result;
}

/**
 * Formats standard Swift CLI invocation.
 */
export function buildSwiftCommand(subcommand: 'build' | 'test' | 'run' | 'package', flags: string[] = []): string {
  const joinedFlags = flags.length > 0 ? ` ${flags.join(' ')}` : '';
  return `swift ${subcommand}${joinedFlags}`;
}
