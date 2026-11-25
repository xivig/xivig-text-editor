/**
 * Category 14: Rust Development Extensions
 * Type definitions & configuration interfaces
 */

export interface RustToolchain {
  cargoPath: string;
  rustcPath: string;
  version?: string;
  isDefault?: boolean;
}

export interface RustSymbol {
  name: string;
  kind: 'fn' | 'struct' | 'enum' | 'trait' | 'impl' | 'mod' | 'macro';
  visibility: 'pub' | 'pub(crate)' | 'private';
  lineNumber: number;
}

export interface CargoDependency {
  name: string;
  version: string;
  features?: string[];
  optional?: boolean;
  path?: string;
  git?: string;
}

export interface CargoPackage {
  name: string;
  version: string;
  edition: string;
  dependencies: Record<string, CargoDependency>;
  devDependencies: Record<string, CargoDependency>;
}

export interface CodeLldbLaunchConfig {
  name: string;
  type: 'lldb';
  request: 'launch';
  program: string;
  args?: string[];
  cwd?: string;
  stopOnEntry?: boolean;
}
