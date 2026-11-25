import { describe, it, expect } from 'vitest';
import {
  detectRustToolchain,
  parseRustSymbols,
  buildCargoCliCommand,
  createRustCompletionSource,
  parseCargoToml,
  validateCargoToml,
  createTomlCompletionSource,
  buildCodeLldbLaunchConfig,
  buildRustPanicBreakpointArgs,
  parseCratesDependencies,
  checkCratesUpdates,
} from '../extensions/builtin/rust';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

describe('Category 14: Rust Development Extensions', () => {
  describe('rust-analyzer', () => {
    it('detects cargo and rustc toolchain executables', () => {
      const candidates = [
        'C:/Users/User/.cargo/bin/cargo.exe',
        'C:/Users/User/.cargo/bin/rustc.exe',
      ];
      const toolchain = detectRustToolchain(candidates);
      expect(toolchain).not.toBeNull();
      expect(toolchain?.cargoPath).toContain('cargo.exe');
      expect(toolchain?.rustcPath).toContain('rustc.exe');
    });

    it('parses functions, structs, enums, traits, impls, and modules with visibility', () => {
      const rustCode = `
pub mod network;

pub struct ServerConfig {
    port: u16,
}

pub(crate) enum Status {
    Active,
    Idle,
}

pub trait Service {
    fn serve(&self);
}

impl Service for ServerConfig {
    fn serve(&self) {}
}

pub async fn start_server(cfg: ServerConfig) {
    println!("Starting server on port {}", cfg.port);
}
      `;

      const symbols = parseRustSymbols(rustCode);
      expect(symbols.length).toBeGreaterThanOrEqual(6);

      const modSym = symbols.find((s) => s.kind === 'mod');
      expect(modSym?.name).toBe('network');
      expect(modSym?.visibility).toBe('pub');

      const structSym = symbols.find((s) => s.kind === 'struct');
      expect(structSym?.name).toBe('ServerConfig');
      expect(structSym?.visibility).toBe('pub');

      const enumSym = symbols.find((s) => s.kind === 'enum');
      expect(enumSym?.name).toBe('Status');
      expect(enumSym?.visibility).toBe('pub(crate)');

      const traitSym = symbols.find((s) => s.kind === 'trait');
      expect(traitSym?.name).toBe('Service');

      const fnSym = symbols.find((s) => s.name === 'start_server');
      expect(fnSym?.kind).toBe('fn');
      expect(fnSym?.visibility).toBe('pub');
    });

    it('builds Cargo CLI execution commands with release and package options', () => {
      const checkCmd = buildCargoCliCommand('check');
      expect(checkCmd).toBe('cargo check');

      const buildRelease = buildCargoCliCommand('build', true, 'xivig-core');
      expect(buildRelease).toBe('cargo build --release -p xivig-core');

      const testCmd = buildCargoCliCommand('test', false);
      expect(testCmd).toBe('cargo test');
    });

    it('provides CodeMirror completion for Rust keywords and core types', () => {
      const state = EditorState.create({ doc: 'as' });
      const context = new CompletionContext(state, 2, true);
      const source = createRustCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels).toContain('async');
    });
  });

  describe('Even Better TOML (Cargo.toml)', () => {
    const tomlDoc = `
[package]
name = "xivig_renderer"
version = "1.5.0"
edition = "2021"

[dependencies]
serde = "1.0.197"
tokio = { version = "1.36.0", features = ["full"] }

[dev-dependencies]
criterion = "0.5.1"
    `;

    it('parses package metadata and dependencies from Cargo.toml', () => {
      const pkg = parseCargoToml(tomlDoc);
      expect(pkg).not.toBeNull();
      expect(pkg?.name).toBe('xivig_renderer');
      expect(pkg?.version).toBe('1.5.0');
      expect(pkg?.edition).toBe('2021');

      expect(pkg?.dependencies['serde']).toEqual({ name: 'serde', version: '1.0.197' });
      expect(pkg?.dependencies['tokio']).toEqual({
        name: 'tokio',
        version: '1.36.0',
        features: ['full'],
      });
      expect(pkg?.devDependencies['criterion']).toEqual({ name: 'criterion', version: '0.5.1' });
    });

    it('validates Cargo.toml semantic versioning and required keys', () => {
      const val = validateCargoToml(tomlDoc);
      expect(val.valid).toBe(true);
      expect(val.errors).toHaveLength(0);

      const invalidToml = `
[package]
name = "broken"
version = "invalid-semver"
      `;
      const invalidVal = validateCargoToml(invalidToml);
      expect(invalidVal.valid).toBe(false);
      expect(invalidVal.errors[0]).toContain("Invalid semantic version 'invalid-semver'");
    });

    it('provides CodeMirror completion for Cargo.toml sections', () => {
      const state = EditorState.create({ doc: '[dep' });
      const context = new CompletionContext(state, 4, true);
      const source = createTomlCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels.some((l) => l.includes('[dependencies]'))).toBe(true);
    });
  });

  describe('CodeLLDB Native Debugger', () => {
    it('builds CodeLLDB launch configuration', () => {
      const config = buildCodeLldbLaunchConfig('target/debug/xivig_server', ['--port', '8080'], '${workspaceFolder}/backend', true);
      expect(config.name).toBe('Debug xivig_server');
      expect(config.type).toBe('lldb');
      expect(config.request).toBe('launch');
      expect(config.program).toBe('target/debug/xivig_server');
      expect(config.args).toEqual(['--port', '8080']);
      expect(config.cwd).toBe('${workspaceFolder}/backend');
      expect(config.stopOnEntry).toBe(true);
    });

    it('generates Rust panic breakpoint interceptor commands', () => {
      const args = buildRustPanicBreakpointArgs();
      expect(args).toContain('breakpoint set --name rust_panic');
      expect(args).toContain('breakpoint set --name core::panicking::panic');
    });
  });

  describe('Crates Dependency Manager', () => {
    const cargoToml = `
[dependencies]
serde = "1.0.190"
tokio = "1.30.0"
    `;

    it('extracts dependency names with their line numbers', () => {
      const deps = parseCratesDependencies(cargoToml);
      expect(deps).toHaveLength(2);
      expect(deps[0]).toEqual({ name: 'serde', currentVersion: '1.0.190', line: 3 });
      expect(deps[1]).toEqual({ name: 'tokio', currentVersion: '1.30.0', line: 4 });
    });

    it('detects available crate updates against simulated crates.io registry', () => {
      const deps = [
        { name: 'serde', currentVersion: '1.0.190' },
        { name: 'tokio', currentVersion: '1.36.0' },
      ];
      const registry = {
        serde: '1.0.200',
        tokio: '1.36.0',
      };

      const results = checkCratesUpdates(deps, registry);
      expect(results[0].hasUpdate).toBe(true);
      expect(results[0].latest).toBe('1.0.200');

      expect(results[1].hasUpdate).toBe(false);
      expect(results[1].latest).toBe('1.36.0');
    });
  });
});
