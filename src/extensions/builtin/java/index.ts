import { BuiltinExtensionModule } from '../../api/types';

export * from './types';
export * from './javaCorePlugin';
export * from './springBootPlugin';
export * from './mavenPlugin';
export * from './javaDebuggerPlugin';

// 1. Extension Pack for Java
export const extensionPackForJavaModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.vscode-java-pack',
    name: 'Extension Pack for Java',
    publisher: 'Microsoft',
    version: '0.29.0',
    description: 'Popular extensions for Java development in Xivig including language support, debugging, and testing.',
    categories: ['Languages', 'Productivity'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#e76f00',
    iconSymbol: '☕',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. Spring Boot Extension Pack
export const springBootExtensionPackModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.vscode-spring-boot-pack',
    name: 'Spring Boot Extension Pack',
    publisher: 'VMware',
    version: '0.1.7',
    description: 'Spring Boot annotations, properties autocompletion, live process inspection, and boot runners.',
    categories: ['Productivity', 'Languages'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#6db33f',
    iconSymbol: '🍃',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. Maven for Java
export const mavenForJavaModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.vscode-maven',
    name: 'Maven for Java',
    publisher: 'Microsoft',
    version: '0.44.0',
    description: 'Manage Maven projects, execute build goals, generate effective POMs, and explore dependencies.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#c71a36',
    iconSymbol: '🪶',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. Debugger for Java
export const debuggerForJavaModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.vscode-java-debug',
    name: 'Debugger for Java',
    publisher: 'Microsoft',
    version: '0.58.0',
    description: 'A lightweight Java debugger based on Java Debug Wire Protocol (JDWP) and launch configurations.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#b07219',
    iconSymbol: '🐞',
  },
  activate: () => {},
  deactivate: () => {},
};
