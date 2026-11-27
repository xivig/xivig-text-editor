import { describe, it, expect, beforeEach } from 'vitest';
import { EditorState } from '@codemirror/state';
import { autocompletion } from '@codemirror/autocomplete';
import { extensionManager } from '../extensions/runtime/extensionManager';
import {
  parseSwiftSymbols,
  parsePackageManifest,
  buildSwiftCommand,
  getStandardSwiftToolchainPaths,
} from '../extensions/builtin/swift/swiftCorePlugin';
import {
  swiftCompletionSource,
  createSwiftCompletionSource,
  SWIFT_KEYWORDS_COMPLETIONS,
  SWIFT_PROPERTY_WRAPPERS_COMPLETIONS,
  SWIFT_TYPES_COMPLETIONS,
  SWIFT_SNIPPETS_COMPLETIONS,
} from '../extensions/builtin/swift/swiftAutocompletePlugin';
import {
  buildSwiftDebugLaunchConfig,
  buildSwiftFatalErrorBreakpointArgs,
} from '../extensions/builtin/swift/swiftDebugPlugin';
import { swiftExtensionModule } from '../extensions/builtin/swift/index';
import { getLanguageExtension, swiftLanguage } from '../components/editor/languageSupport';
import { useBuildStore } from '../stores/buildStore';
import { useEditorStore } from '../stores/editorStore';
import { useFileStore } from '../stores/fileStore';
import { useExtensionStore } from '../stores/extensionStore';

describe('Swift Extension & Toolchain Support', () => {
  describe('Swift Core Plugin: parseSwiftSymbols', () => {
    it('parses functions, structs, classes, actors, protocols, enums and properties', () => {
      const sampleSwiftCode = `
import Foundation
import SwiftUI

public struct ContentView: View {
    @State private var counter: Int = 0
    public let title: String = "Hello Swift"

    public var body: some View {
        Text(title)
    }

    public func increment() {
        counter += 1
    }

    public static func makeDefault() -> ContentView {
        return ContentView()
    }
}

public final class NetworkManager {
    public static let shared = NetworkManager()
    
    public func fetchData() async throws -> String {
        return "data"
    }
}

public actor DataStore {
    private var cache: [String: Any] = [:]
}

public protocol ServiceProtocol {
    func execute()
}

public enum RequestStatus {
    case pending
    case completed
}

extension ContentView {
    func reset() {
        counter = 0
    }
}
      `.trim();

      const symbols = parseSwiftSymbols(sampleSwiftCode);

      // Verify struct
      const structSymbol = symbols.find((s) => s.name === 'ContentView' && s.kind === 'struct');
      expect(structSymbol).toBeDefined();
      expect(structSymbol?.accessLevel).toBe('public');

      // Verify functions
      const incFunc = symbols.find((s) => s.name === 'increment' && s.kind === 'func');
      expect(incFunc).toBeDefined();

      const staticFunc = symbols.find((s) => s.name === 'makeDefault' && s.kind === 'func');
      expect(staticFunc?.isStatic).toBe(true);

      const asyncFunc = symbols.find((s) => s.name === 'fetchData' && s.kind === 'func');
      expect(asyncFunc?.isAsync).toBe(true);

      // Verify class
      const classSymbol = symbols.find((s) => s.name === 'NetworkManager' && s.kind === 'class');
      expect(classSymbol).toBeDefined();

      // Verify actor
      const actorSymbol = symbols.find((s) => s.name === 'DataStore' && s.kind === 'actor');
      expect(actorSymbol).toBeDefined();

      // Verify protocol
      const protocolSymbol = symbols.find((s) => s.name === 'ServiceProtocol' && s.kind === 'protocol');
      expect(protocolSymbol).toBeDefined();

      // Verify enum
      const enumSymbol = symbols.find((s) => s.name === 'RequestStatus' && s.kind === 'enum');
      expect(enumSymbol).toBeDefined();

      // Verify extension
      const extSymbol = symbols.find((s) => s.name === 'ContentView' && s.kind === 'extension');
      expect(extSymbol).toBeDefined();

      // Verify properties
      const titleConst = symbols.find((s) => s.name === 'title' && s.kind === 'constant');
      expect(titleConst).toBeDefined();

      const counterVar = symbols.find((s) => s.name === 'counter' && s.kind === 'variable');
      expect(counterVar).toBeDefined();
    });

    it('returns empty array on empty or whitespace code', () => {
      expect(parseSwiftSymbols('')).toEqual([]);
      expect(parseSwiftSymbols('   \n  \t  ')).toEqual([]);
    });

    it('returns standard toolchain paths for platform', () => {
      const paths = getStandardSwiftToolchainPaths();
      expect(Array.isArray(paths)).toBe(true);
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  describe('Swift Core Plugin: parsePackageManifest & CLI builder', () => {
    it('parses Package.swift manifest metadata and targets', () => {
      const manifest = `
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "XivigServer",
    platforms: [.macOS(.v13)],
    products: [
        .executable(name: "XivigServer", targets: ["XivigServer"]),
    ],
    dependencies: [],
    targets: [
        .executableTarget(name: "XivigServer", dependencies: []),
        .target(name: "XivigCore", dependencies: []),
        .testTarget(name: "XivigServerTests", dependencies: ["XivigServer"]),
    ]
)
      `.trim();

      const parsed = parsePackageManifest(manifest);
      expect(parsed.name).toBe('XivigServer');
      expect(parsed.swiftToolsVersion).toBe('5.9');
      expect(parsed.targets).toHaveLength(3);

      expect(parsed.targets?.[0]).toEqual({
        name: 'XivigServer',
        type: 'executable',
        dependencies: [],
      });
      expect(parsed.targets?.[1]).toEqual({
        name: 'XivigCore',
        type: 'library',
        dependencies: [],
      });
      expect(parsed.targets?.[2]).toEqual({
        name: 'XivigServerTests',
        type: 'test',
        dependencies: [],
      });
    });

    it('builds standard Swift CLI commands with flags', () => {
      expect(buildSwiftCommand('build')).toBe('swift build');
      expect(buildSwiftCommand('test', ['--parallel', '--filter', 'CoreTests'])).toBe('swift test --parallel --filter CoreTests');
      expect(buildSwiftCommand('run', ['--configuration', 'release'])).toBe('swift run --configuration release');
    });
  });

  describe('Swift Autocomplete Plugin: swiftCompletionSource', () => {
    it('contains comprehensive Swift keywords, property wrappers, types and snippets', () => {
      expect(SWIFT_KEYWORDS_COMPLETIONS.some((c) => c.label === 'func')).toBe(true);
      expect(SWIFT_KEYWORDS_COMPLETIONS.some((c) => c.label === 'guard')).toBe(true);
      expect(SWIFT_KEYWORDS_COMPLETIONS.some((c) => c.label === 'actor')).toBe(true);
      expect(SWIFT_KEYWORDS_COMPLETIONS.some((c) => c.label === 'async')).toBe(true);

      expect(SWIFT_PROPERTY_WRAPPERS_COMPLETIONS.some((c) => c.label === '@State')).toBe(true);
      expect(SWIFT_PROPERTY_WRAPPERS_COMPLETIONS.some((c) => c.label === '@Binding')).toBe(true);
      expect(SWIFT_PROPERTY_WRAPPERS_COMPLETIONS.some((c) => c.label === '@main')).toBe(true);
      expect(SWIFT_PROPERTY_WRAPPERS_COMPLETIONS.some((c) => c.label === '@Observable')).toBe(true);

      expect(SWIFT_TYPES_COMPLETIONS.some((c) => c.label === 'String')).toBe(true);
      expect(SWIFT_TYPES_COMPLETIONS.some((c) => c.label === 'Int')).toBe(true);
      expect(SWIFT_TYPES_COMPLETIONS.some((c) => c.label === 'Task')).toBe(true);
      expect(SWIFT_TYPES_COMPLETIONS.some((c) => c.label === 'Sendable')).toBe(true);

      expect(SWIFT_SNIPPETS_COMPLETIONS.some((c) => c.label === 'struct')).toBe(true);
      expect(SWIFT_SNIPPETS_COMPLETIONS.some((c) => c.label === 'swiftui-view')).toBe(true);
    });

    it('returns completions matching the current token', () => {
      const mockContext = {
        state: {
          sliceDoc: (from: number, to: number) => 'func',
        },
        pos: 4,
        matchBefore: (regex: RegExp) => {
          return { from: 0, to: 4, text: 'func' };
        },
        explicit: false,
      } as any;

      const result = swiftCompletionSource(mockContext);
      expect(result).not.toBeNull();
      expect(result?.options.length).toBeGreaterThan(0);
      expect(result?.options.some((opt) => opt.label.startsWith('func'))).toBe(true);
    });
  });

  describe('Swift Debug Plugin: LLDB configuration', () => {
    it('generates LLDB launch configuration for Swift', () => {
      const config = buildSwiftDebugLaunchConfig('C:/Projects/MyApp/bin/MyApp.exe', ['--port', '8080'], 'C:/Projects/MyApp');
      expect(config.name).toBe('Debug MyApp.exe (LLDB)');
      expect(config.type).toBe('swift');
      expect(config.request).toBe('launch');
      expect(config.program).toBe('C:/Projects/MyApp/bin/MyApp.exe');
      expect(config.args).toEqual(['--port', '8080']);
      expect(config.cwd).toBe('C:/Projects/MyApp');
      expect(config.stopOnEntry).toBe(false);
    });

    it('provides Swift fatal error breakpoint commands', () => {
      const bpArgs = buildSwiftFatalErrorBreakpointArgs();
      expect(bpArgs).toContain('breakpoint set --name _swift_runtime_on_report');
      expect(bpArgs).toContain('breakpoint set --name swift_willThrow');
      expect(bpArgs).toContain('breakpoint set --name _swift_failed_assertion');
    });
  });

  describe('Swift Extension Module & Language Support Integration', () => {
    it('exports complete builtin extension manifest and CodeMirror extensions', () => {
      expect(swiftExtensionModule.manifest.id).toBe('xivig.swift-lang');
      expect(swiftExtensionModule.manifest.name).toBe('Swift');
      expect(swiftExtensionModule.manifest.categories).toContain('Languages');
      expect(swiftExtensionModule.manifest.categories).toContain('Productivity');

      const cmExts = swiftExtensionModule.getCodeMirrorExtensions?.();
      expect(Array.isArray(cmExts)).toBe(true);
      expect(cmExts?.length).toBe(0);
      expect(typeof createSwiftCompletionSource()).toBe('function');
    });

    it('resolves swiftLanguage for .swift files and includes autocomplete', () => {
      const ext = getLanguageExtension('swift', 'main.swift');
      expect(ext).toBe(swiftLanguage);

      const state = EditorState.create({
        doc: 'import Foundation\n\nfunc hello() {}',
        extensions: [ext],
      });
      const autocompletes = state.languageDataAt<any>('autocomplete', 0);
      expect(autocompletes).toContain(swiftCompletionSource);
    });

    it('is registered and pre-enabled in extensionStore', () => {
      const state = useExtensionStore.getState();
      const inMarketplace = state.marketplace.find((m) => m.id === 'xivig-tool-swift');
      expect(inMarketplace).toBeDefined();
      expect(inMarketplace?.name).toBe('Swift');
      expect(state.installedIds).toContain('xivig-tool-swift');
      expect(state.enabledIds).toContain('xivig-tool-swift');
    });

    it('creates EditorState with active extensions without override conflict', async () => {
      await useExtensionStore.getState().installExtension('xivig-tool-swift');
      const activeCmExts = extensionManager.getActiveCodeMirrorExtensions();

      expect(() => {
        EditorState.create({
          doc: 'import SwiftUI\n\nstruct AppView: View {}',
          extensions: [
            autocompletion({
              override: [
                createSwiftCompletionSource(),
              ],
            }),
            activeCmExts,
          ],
        });
      }).not.toThrow();
    });
  });

  describe('Swift Build Targets in BuildStore', () => {
    beforeEach(() => {
      useEditorStore.setState({
        documents: [
          {
            id: 'doc-swift',
            name: 'main.swift',
            path: 'C:/Users/Dev/Workspace/main.swift',
            content: 'print("Hello Swift!")',
            language: 'swift',
            cursor: { line: 1, col: 1 },
            isDirty: false,
          },
        ],
        activeDocumentId: 'doc-swift',
      });
      useFileStore.setState({
        currentFolderPath: 'C:/Users/Dev/Workspace',
        fileTree: [
          { id: 'f-1', name: 'main.swift', path: 'C:/Users/Dev/Workspace/main.swift', isDirectory: false },
          { id: 'f-2', name: 'Package.swift', path: 'C:/Users/Dev/Workspace/Package.swift', isDirectory: false },
        ],
      });
    });

    it('discovers Swift file runners and Package.swift SPM targets', () => {
      const targets = useBuildStore.getState().getAvailableTargets();

      // Check current file runner
      const runTarget = targets.find((t) => t.id === 'swift-run-file');
      expect(runTarget).toBeDefined();
      expect(runTarget?.command).toBe('swift');
      expect(runTarget?.args).toEqual(['C:/Users/Dev/Workspace/main.swift']);

      // Check compile & run target
      const compileTarget = targets.find((t) => t.id === 'swift-build-release');
      expect(compileTarget).toBeDefined();
      expect(compileTarget?.command).toBe('swiftc');
      expect(compileTarget?.secondaryCommand).toBeDefined();

      // Check SPM targets
      const spmBuild = targets.find((t) => t.id === 'swift-package-build');
      expect(spmBuild).toBeDefined();
      expect(spmBuild?.command).toBe('swift');
      expect(spmBuild?.args).toEqual(['build']);

      const spmRun = targets.find((t) => t.id === 'swift-package-run');
      expect(spmRun).toBeDefined();
      expect(spmRun?.command).toBe('swift');
      expect(spmRun?.args).toEqual(['run']);

      const spmTest = targets.find((t) => t.id === 'swift-package-test');
      expect(spmTest).toBeDefined();
      expect(spmTest?.command).toBe('swift');
      expect(spmTest?.args).toEqual(['test']);
    });

    it('detectDefaultTarget automatically selects Swift target for active .swift file', () => {
      const defaultTarget = useBuildStore.getState().detectDefaultTarget();
      expect(defaultTarget).toBeDefined();
      expect(defaultTarget.category).toBe('swift');
    });
  });
});
