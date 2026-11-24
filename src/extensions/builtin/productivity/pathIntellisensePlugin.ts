import {
  Completion,
  CompletionContext,
  CompletionResult,
} from '@codemirror/autocomplete';
import { PathIntellisenseSettings } from './types';

export const DEFAULT_PATH_INTELLISENSE_SETTINGS: PathIntellisenseSettings = {
  enabled: true,
  showHiddenFiles: false,
  autoSlash: true,
  supportedFileExtensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss', '.html', '.svg', '.png'],
};

// Known common file structure candidates when exploring relative paths
const DEFAULT_WORKSPACE_FILES = [
  'App.tsx',
  'index.ts',
  'main.ts',
  'styles.css',
  'package.json',
  'tsconfig.json',
  'vite.config.ts',
  'README.md',
  'components/',
  'stores/',
  'utils/',
  'hooks/',
  'assets/',
  'types/',
  'services/',
  'public/',
];

export function createPathCompletionSource(
  workspaceFiles: string[] = DEFAULT_WORKSPACE_FILES,
  settings: PathIntellisenseSettings = DEFAULT_PATH_INTELLISENSE_SETTINGS
) {
  return (context: CompletionContext): CompletionResult | null => {
    if (!settings.enabled) return null;

    // Look for quote followed by relative path characters: e.g. from './ or src="./
    const match = context.matchBefore(/(?:['"`])([.a-zA-Z0-9_\-\/@]*\/[a-zA-Z0-9_\-\.]*)/);
    if (!match) return null;

    const pathPrefix = match.text.slice(1); // strip leading quote
    const lastSlashIdx = pathPrefix.lastIndexOf('/');
    const currentQuery = lastSlashIdx !== -1 ? pathPrefix.slice(lastSlashIdx + 1) : pathPrefix;

    const options: Completion[] = workspaceFiles
      .filter((file) => {
        if (!settings.showHiddenFiles && file.startsWith('.')) return false;
        if (currentQuery) {
          return file.toLowerCase().includes(currentQuery.toLowerCase());
        }
        return true;
      })
      .map((file) => {
        const isDir = file.endsWith('/');
        return {
          label: file,
          type: isDir ? 'folder' : 'file',
          detail: isDir ? 'Directory' : 'File',
          apply: file,
          boost: isDir ? 2 : 1,
        };
      });

    if (options.length === 0) return null;

    return {
      from: context.pos - currentQuery.length,
      options,
    };
  };
}
