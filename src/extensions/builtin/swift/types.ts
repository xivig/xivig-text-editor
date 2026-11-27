export interface SwiftToolchain {
  path: string;
  version: string;
  isDefault: boolean;
  platform: 'windows' | 'macos' | 'linux';
}

export type SwiftSymbolKind =
  | 'func'
  | 'struct'
  | 'class'
  | 'actor'
  | 'protocol'
  | 'enum'
  | 'extension'
  | 'variable'
  | 'constant'
  | 'typealias';

export interface SwiftSymbol {
  name: string;
  kind: SwiftSymbolKind;
  signature?: string;
  isAsync?: boolean;
  isStatic?: boolean;
  accessLevel?: 'public' | 'private' | 'fileprivate' | 'internal' | 'open';
  lineNumber: number;
}

export interface SwiftPackageTarget {
  name: string;
  type: 'executable' | 'library' | 'test';
  dependencies: string[];
}

export interface SwiftPackageManifest {
  name: string;
  swiftToolsVersion?: string;
  platforms?: Array<{ name: string; version: string }>;
  products?: Array<{ name: string; type: string; targets: string[] }>;
  targets?: SwiftPackageTarget[];
}
