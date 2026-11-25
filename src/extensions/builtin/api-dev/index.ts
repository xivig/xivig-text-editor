import { BuiltinExtensionModule } from '../../api/types';

export * from './types';
export * from './thunderClientPlugin';
export * from './postmanPlugin';
export * from './restClientPlugin';
export * from './openApiEditorPlugin';

// 1. Thunder Client
export const thunderClientExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.thunder-client',
    name: 'Thunder Client - REST API Client',
    publisher: 'Ranga Vadhineni',
    version: '2.24.2',
    description: 'Lightweight REST API Client Extension with environment variables, response viewer, and runners.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#0b5394',
    iconSymbol: '⚡',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. Postman
export const postmanExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.postman',
    name: 'Postman',
    publisher: 'Postman',
    version: '1.4.1',
    description: 'Postman collection v2.1 import, export, collection runner, and environment variable manager.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#ef5b25',
    iconSymbol: '🚀',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. REST Client
export const restClientExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.rest-client',
    name: 'REST Client',
    publisher: 'Huachao Mao',
    version: '0.25.1',
    description: 'Execute HTTP requests directly from .http and .rest files with RFC 7230 syntax and variable substitution.',
    categories: ['Productivity', 'Languages'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#1e88e5',
    iconSymbol: '📨',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. OpenAPI (Swagger) Editor
export const openApiEditorExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.openapi-swagger-editor',
    name: 'OpenAPI (Swagger) Editor',
    publisher: '42Crunch',
    version: '4.20.0',
    description: 'OpenAPI 3.x and Swagger 2.0 navigation, schema linting, parameter checks, and autocompletion.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#85ea2d',
    iconSymbol: '📖',
  },
  activate: () => {},
  deactivate: () => {},
};
