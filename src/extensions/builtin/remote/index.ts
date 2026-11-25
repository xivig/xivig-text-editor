import { BuiltinExtensionModule } from '../../api/types';
import {
  parseSshConfigFile,
  buildSshCliArgs,
  buildRemoteUri,
  parseRemoteUri,
} from './remoteSshPlugin';
import {
  parseWslListOutput,
  translateWindowsPathToWsl,
  translateWslPathToWindows,
  buildWslCliCommand,
} from './wslPlugin';
import {
  remoteExplorerRegistry,
  RemoteExplorerRegistry,
} from './remoteExplorerPlugin';
import {
  buildDevContainerRunArgs,
  generateDevContainerSummary,
} from './remoteContainersPlugin';

export * from './types';
export * from './remoteSshPlugin';
export * from './wslPlugin';
export * from './remoteExplorerPlugin';
export * from './remoteContainersPlugin';

// 1. Remote SSH
export const remoteSshExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.remote-ssh',
    name: 'Remote - SSH',
    publisher: 'Microsoft',
    version: '0.115.0',
    description: 'Open any folder on a remote machine using SSH and take advantage of full Xivig features.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#0284c7',
    iconSymbol: '🌐',
  },
  activate: () => {},
  deactivate: () => {},
};

// 2. Remote Explorer
export const remoteExplorerExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.remote-explorer',
    name: 'Remote Explorer',
    publisher: 'Microsoft',
    version: '0.5.0',
    description: 'View and manage remote machines, SSH targets, WSL distributions, and Dev Containers in a unified explorer pane.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#0369a1',
    iconSymbol: '🧭',
  },
  activate: () => {},
  deactivate: () => {},
};

// 3. WSL
export const wslExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.remote-wsl',
    name: 'WSL',
    publisher: 'Microsoft',
    version: '0.88.0',
    description: 'Open any folder in the Windows Subsystem for Linux (WSL) and use Linux toolchains and runtimes.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#ea580c',
    iconSymbol: '🐧',
  },
  activate: () => {},
  deactivate: () => {},
};

// 4. Remote - Containers
export const remoteContainersExtensionModule: BuiltinExtensionModule = {
  manifest: {
    id: 'xivig.remote-containers',
    name: 'Dev Containers - Remote',
    publisher: 'Microsoft',
    version: '0.380.0',
    description: 'Open your workspace in a Docker development container with automated toolchain isolation.',
    categories: ['Productivity', 'Other'],
    engines: { xivig: '^1.0.0' },
    iconBg: '#0284c7',
    iconSymbol: '📦',
  },
  activate: () => {},
  deactivate: () => {},
};
