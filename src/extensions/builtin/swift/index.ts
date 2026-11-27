import { BuiltinExtensionModule } from '../../api/types';
import { Extension as CodeMirrorExtension } from '@codemirror/state';

export * from './types';
export * from './swiftCorePlugin';
export * from './swiftAutocompletePlugin';
export * from './swiftDebugPlugin';

export const swiftExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.swift-lang',
    name: 'Swift',
    publisher: 'swift-lang',
    version: '6.0.1',
    description: 'Complete Swift development support for Xivig: syntax highlighting, autocompletion, Swift toolchains, and LLDB debugging.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#f05138',
    iconSymbol: '🦅',
  },
  activate: () => {},
  deactivate: () => {},
  getCodeMirrorExtensions: (): CodeMirrorExtension[] => [],
};
