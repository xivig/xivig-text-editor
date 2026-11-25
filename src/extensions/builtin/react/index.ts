import { BuiltinExtensionModule } from '../../api/types';
import {
  DEFAULT_ES7_REACT_REDUX_SETTINGS,
  createEs7ReactReduxCompletionSource,
  ES7_REACT_REDUX_SNIPPETS,
} from './es7ReactReduxSnippetsPlugin';
import {
  DEFAULT_SIMPLE_REACT_SETTINGS,
  createSimpleReactCompletionSource,
  SIMPLE_REACT_SNIPPETS,
} from './simpleReactSnippetsPlugin';
import { DEFAULT_REACT_NATIVE_SETTINGS, REACT_NATIVE_SNIPPETS } from './reactNativeToolsPlugin';
import { DEFAULT_STYLED_COMPONENTS_SETTINGS } from './styledComponentsPlugin';

export * from './types';
export * from './es7ReactReduxSnippetsPlugin';
export * from './simpleReactSnippetsPlugin';
export * from './reactNativeToolsPlugin';
export * from './styledComponentsPlugin';

// 1. ES7+ React/Redux/React-Native Snippets
export const es7ReactReduxExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.es7-react-redux-snippets',
    name: 'ES7+ React/Redux/React-Native snippets',
    publisher: 'rodrigovallades',
    version: '4.4.3',
    description: 'Extensions for React, Redux and React Native in JS/TS with ES7+ syntax and hooks.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#00d8ff',
    iconSymbol: '⚛️',
  },
  activate: () => {},
  deactivate: () => {},
  getSnippets: (language?: string) => {
    const lang = (language || '').toLowerCase();
    if (
      lang.includes('react') ||
      lang.includes('javascript') ||
      lang.includes('typescript') ||
      lang.endsWith('.jsx') ||
      lang.endsWith('.tsx') ||
      lang.endsWith('.js') ||
      lang.endsWith('.ts')
    ) {
      return ES7_REACT_REDUX_SNIPPETS.map((s) => ({
        label: s.label,
        detail: s.detail,
        template: s.template,
      }));
    }
    return [];
  },
};

// 2. Simple React Snippets
export const simpleReactSnippetsExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.simple-react-snippets',
    name: 'Simple React Snippets',
    publisher: 'Burke Holland',
    version: '1.2.8',
    description: 'Essential React code snippets including quick imports, prop types, and component scaffolds.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#61dafb',
    iconSymbol: '⚛️',
  },
  activate: () => {},
  deactivate: () => {},
  getSnippets: (language?: string) => {
    const lang = (language || '').toLowerCase();
    if (
      lang.includes('react') ||
      lang.includes('javascript') ||
      lang.includes('typescript') ||
      lang.endsWith('.jsx') ||
      lang.endsWith('.tsx')
    ) {
      return SIMPLE_REACT_SNIPPETS.map((s) => ({
        label: s.label,
        detail: s.detail,
        template: s.template,
      }));
    }
    return [];
  },
};

// 3. React Native Tools
export const reactNativeToolsExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.react-native-tools',
    name: 'React Native Tools',
    publisher: 'Microsoft',
    version: '1.14.0',
    description: 'Mobile development tools, component snippets, and Metro packager workflows for React Native.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#20232a',
    iconSymbol: '📱',
  },
  activate: () => {},
  deactivate: () => {},
  getSnippets: (language?: string) => {
    const lang = (language || '').toLowerCase();
    if (lang.endsWith('.jsx') || lang.endsWith('.tsx') || lang.includes('react')) {
      return REACT_NATIVE_SNIPPETS.map((s) => ({
        label: s.name,
        detail: s.detail,
        template: s.template,
      }));
    }
    return [];
  },
};

// 4. Styled Components
export const styledComponentsExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.styled-components',
    name: 'vscode-styled-components',
    publisher: 'styled-components',
    version: '1.7.8',
    description: 'Syntax highlighting, CSS validation, and template literal intelligence for styled-components.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#db7093',
    iconSymbol: '💅',
  },
  activate: () => {},
  deactivate: () => {},
};
