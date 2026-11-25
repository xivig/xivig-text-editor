import { describe, it, expect } from 'vitest';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

import {
  // ES7+ React/Redux Snippets
  searchEs7Snippets,
  createEs7ReactReduxCompletionSource,
  es7ReactReduxExtensionModule,

  // Simple React Snippets
  searchSimpleReactSnippets,
  createSimpleReactCompletionSource,
  simpleReactSnippetsExtensionModule,

  // React Native Tools
  getReactNativeSnippet,
  generateReactNativeCommand,
  isReactNativeFile,
  reactNativeToolsExtensionModule,

  // Styled Components
  COMMON_STYLED_TEMPLATES,
  createStyledComponentSnippet,
  validateStyledCss,
  styledComponentsExtensionModule,
} from '../extensions/builtin/react';

describe('Category 6: React Development Extensions', () => {
  // --------------------------------------------------------------------------
  // 1. ES7+ React/Redux/React-Native Snippets
  // --------------------------------------------------------------------------
  describe('ES7+ React/Redux Snippets Extension', () => {
    it('searches and finds standard component and hook snippets', () => {
      const rafce = searchEs7Snippets('rafce');
      expect(rafce.length).toBe(1);
      expect(rafce[0].template).toContain('export const $1 = () =>');
      expect(rafce[0].template).toContain('export default $1;');

      const hooks = searchEs7Snippets('use');
      expect(hooks.some((h) => h.prefix === 'useS')).toBe(true);
      expect(hooks.some((h) => h.prefix === 'useE')).toBe(true);
      expect(hooks.some((h) => h.prefix === 'useC')).toBe(true);
      expect(hooks.some((h) => h.prefix === 'useM')).toBe(true);
    });

    it('searches and finds Redux Toolkit createSlice snippet', () => {
      const rxslice = searchEs7Snippets('rxslice');
      expect(rxslice.length).toBe(1);
      expect(rxslice[0].template).toContain('createSlice');
      expect(rxslice[0].template).toContain('initialState');
    });

    it('provides CodeMirror autocompletions for ES7 triggers', () => {
      const source = createEs7ReactReduxCompletionSource();
      const doc = 'rafce';
      const state = EditorState.create({ doc });
      const ctx = new CompletionContext(state, doc.length, false);
      const res = source(ctx);

      expect(res).not.toBeNull();
      expect(res?.options.some((o) => o.label === 'rafce')).toBe(true);
    });

    it('returns snippets for JSX and TSX files via module getSnippets', () => {
      const snippets = es7ReactReduxExtensionModule.getSnippets?.('typescriptreact');
      expect(snippets).toBeDefined();
      expect(snippets?.length).toBeGreaterThanOrEqual(10);
      expect(snippets?.some((s) => s.label === 'useS')).toBe(true);
    });

    it('manifests with proper metadata', () => {
      expect(es7ReactReduxExtensionModule.manifest.id).toBe('xivig.es7-react-redux-snippets');
      expect(es7ReactReduxExtensionModule.manifest.categories).toContain('Languages');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Simple React Snippets
  // --------------------------------------------------------------------------
  describe('Simple React Snippets Extension', () => {
    it('searches import shortcuts and PropTypes snippets', () => {
      const imr = searchSimpleReactSnippets('imr');
      expect(imr.some((s) => s.prefix === 'imr')).toBe(true);
      expect(imr.some((s) => s.prefix === 'imrs')).toBe(true);
      expect(imr.some((s) => s.prefix === 'imrse')).toBe(true);

      const pt = searchSimpleReactSnippets('pt');
      expect(pt.some((s) => s.prefix === 'pts')).toBe(true);
      expect(pt.some((s) => s.prefix === 'ptn')).toBe(true);
      expect(pt.some((s) => s.prefix === 'ptb')).toBe(true);
    });

    it('provides CodeMirror completion source for simple React snippets', () => {
      const source = createSimpleReactCompletionSource();
      const doc = 'imrs';
      const state = EditorState.create({ doc });
      const ctx = new CompletionContext(state, doc.length, false);
      const res = source(ctx);

      expect(res).not.toBeNull();
      expect(res?.options.some((o) => o.label === 'imrs')).toBe(true);
    });

    it('manifests with proper metadata', () => {
      expect(simpleReactSnippetsExtensionModule.manifest.id).toBe('xivig.simple-react-snippets');
    });
  });

  // --------------------------------------------------------------------------
  // 3. React Native Tools
  // --------------------------------------------------------------------------
  describe('React Native Tools Extension', () => {
    it('retrieves React Native component boilerplates', () => {
      const screen = getReactNativeSnippet('rn-screen');
      expect(screen).toBeDefined();
      expect(screen?.template).toContain('SafeAreaView');
      expect(screen?.template).toContain('StyleSheet.create');

      const flatlist = getReactNativeSnippet('rn-flatlist');
      expect(flatlist).toBeDefined();
      expect(flatlist?.template).toContain('FlatList');
      expect(flatlist?.template).toContain('keyExtractor');
    });

    it('generates React Native and Expo CLI execution commands', () => {
      expect(generateReactNativeCommand('run-android')).toBe('npx react-native run-android');
      expect(generateReactNativeCommand('run-ios')).toBe('npx react-native run-ios');
      expect(generateReactNativeCommand('start', 8088)).toBe('npx react-native start --port 8088');
      expect(generateReactNativeCommand('expo-start')).toBe('npx expo start');
    });

    it('identifies React Native files by import detection', () => {
      expect(isReactNativeFile("import { View } from 'react-native';")).toBe(true);
      expect(isReactNativeFile("import { StatusBar } from 'expo-status-bar';")).toBe(false);
      expect(isReactNativeFile("import React from 'react';")).toBe(false);
    });

    it('manifests with proper metadata', () => {
      expect(reactNativeToolsExtensionModule.manifest.id).toBe('xivig.react-native-tools');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Styled Components
  // --------------------------------------------------------------------------
  describe('Styled Components Extension', () => {
    it('provides common styled element templates', () => {
      expect(COMMON_STYLED_TEMPLATES.length).toBeGreaterThanOrEqual(4);
      const btn = COMMON_STYLED_TEMPLATES.find((t) => t.name === 'styled.button');
      expect(btn).toBeDefined();
      expect(btn?.template).toContain('styled.button`');
      expect(btn?.template).toContain('${(props) =>');
    });

    it('creates custom styled component declarations', () => {
      const declaration = createStyledComponentSnippet('HeroCard', 'div', 'background: #f0f0f0;\nborder-radius: 8px;');
      expect(declaration).toBe('export const HeroCard = styled.div`\n  background: #f0f0f0;\nborder-radius: 8px;\n`;');
    });

    it('validates balanced braces and parentheses in styled CSS', () => {
      expect(validateStyledCss('display: flex; padding: 1rem;').valid).toBe(true);
      expect(validateStyledCss('color: red; ${props => props.active ? "blue" : "black"};').valid).toBe(true);
      expect(validateStyledCss('div { color: red;').valid).toBe(false);
      expect(validateStyledCss('${(props => props.active}').valid).toBe(false);
    });

    it('manifests with proper metadata', () => {
      expect(styledComponentsExtensionModule.manifest.id).toBe('xivig.styled-components');
    });
  });
});
