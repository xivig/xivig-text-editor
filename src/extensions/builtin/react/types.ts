/**
 * Category 6: React Development Extensions
 * Type definitions & configuration interfaces
 */

export interface ReactSnippetItem {
  prefix: string;
  label: string;
  detail: string;
  template: string;
  description: string;
  category: 'component' | 'hook' | 'redux' | 'native' | 'import' | 'proptypes';
}

export interface Es7ReactReduxSettings {
  enabled: boolean;
  typescriptComponents: boolean; // Generate TSX or JSX
  arrowFunctionComponents: boolean;
  semi: boolean;
}

export interface SimpleReactSnippetsSettings {
  enabled: boolean;
  useSemicolons: boolean;
}

export interface ReactNativeComponentSnippet {
  name: string;
  tag: string;
  importStatement: string;
  template: string;
  detail: string;
}

export interface ReactNativeToolsSettings {
  enabled: boolean;
  packagerPort: number; // default: 8081
  defaultPlatform: 'android' | 'ios' | 'web';
}

export interface StyledComponentTemplate {
  name: string;
  htmlTag: string;
  template: string;
  description: string;
}

export interface StyledComponentsSettings {
  enabled: boolean;
  cssValidation: boolean;
  autoFormatTemplateLiterals: boolean;
}
