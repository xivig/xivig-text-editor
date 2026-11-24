import { BuiltinExtensionModule } from '../api/types';
import { rainbowBracketsExtension } from './rainbow-brackets/index';
import { bootstrap5Extension } from './bootstrap5-fontawesome/index';
import { laravelExtension } from './laravel-all-in-one/index';
import { phpIntelligenceExtension } from './php-intelligence/index';
import {
  prettierExtensionModule,
  eslintExtensionModule,
  editorConfigExtensionModule,
  errorLensExtensionModule,
  spellCheckerExtensionModule,
  pathIntellisenseExtensionModule,
  autoRenameTagExtensionModule,
  autoCloseTagExtensionModule,
  betterCommentsExtensionModule,
  todoTreeExtensionModule,
} from './productivity/index';

import {
  gitLensExtensionModule,
  gitGraphExtensionModule,
  gitHistoryExtensionModule,
  githubPrsExtensionModule,
  copilotExtensionModule,
} from './git/index';

export const BUILTIN_EXTENSIONS: Record<string, BuiltinExtensionModule> = {
  'xivig-tool-rainbow': rainbowBracketsExtension,
  'xivig.rainbow-brackets': rainbowBracketsExtension,
  'xivig-tool-bootstrap5': bootstrap5Extension,
  'xivig.bootstrap5-fontawesome-snippets': bootstrap5Extension,
  'xivig-tool-laravel': laravelExtension,
  'xivig.laravel-all-in-one': laravelExtension,
  'xivig-tool-php': phpIntelligenceExtension,
  'xivig.php-intelligence': phpIntelligenceExtension,

  // Essential Productivity Suite
  'xivig.prettier': prettierExtensionModule,
  'xivig-tool-prettier': prettierExtensionModule,
  'xivig.eslint': eslintExtensionModule,
  'xivig-tool-eslint': eslintExtensionModule,
  'xivig.editorconfig': editorConfigExtensionModule,
  'xivig-tool-editorconfig': editorConfigExtensionModule,
  'xivig.error-lens': errorLensExtensionModule,
  'xivig-tool-error-lens': errorLensExtensionModule,
  'xivig.code-spell-checker': spellCheckerExtensionModule,
  'xivig-tool-spellchecker': spellCheckerExtensionModule,
  'xivig.path-intellisense': pathIntellisenseExtensionModule,
  'xivig-tool-path-intellisense': pathIntellisenseExtensionModule,
  'xivig.auto-rename-tag': autoRenameTagExtensionModule,
  'xivig-tool-auto-rename-tag': autoRenameTagExtensionModule,
  'xivig.auto-close-tag': autoCloseTagExtensionModule,
  'xivig-tool-auto-close-tag': autoCloseTagExtensionModule,
  'xivig.better-comments': betterCommentsExtensionModule,
  'xivig-tool-better-comments': betterCommentsExtensionModule,
  'xivig.todo-tree': todoTreeExtensionModule,
  'xivig-tool-todo-tree': todoTreeExtensionModule,

  // Git & Version Control Suite
  'xivig.gitlens': gitLensExtensionModule,
  'xivig-tool-gitlens': gitLensExtensionModule,
  'xivig.git-graph': gitGraphExtensionModule,
  'xivig-tool-git-graph': gitGraphExtensionModule,
  'xivig.git-history': gitHistoryExtensionModule,
  'xivig-tool-git-history': gitHistoryExtensionModule,
  'xivig.github-prs': githubPrsExtensionModule,
  'xivig-tool-github-prs': githubPrsExtensionModule,
  'xivig.copilot': copilotExtensionModule,
  'xivig-tool-copilot': copilotExtensionModule,
};

export {
  rainbowBracketsExtension,
  bootstrap5Extension,
  laravelExtension,
  phpIntelligenceExtension,
  prettierExtensionModule,
  eslintExtensionModule,
  editorConfigExtensionModule,
  errorLensExtensionModule,
  spellCheckerExtensionModule,
  pathIntellisenseExtensionModule,
  autoRenameTagExtensionModule,
  autoCloseTagExtensionModule,
  betterCommentsExtensionModule,
  todoTreeExtensionModule,
  gitLensExtensionModule,
  gitGraphExtensionModule,
  gitHistoryExtensionModule,
  githubPrsExtensionModule,
  copilotExtensionModule,
};
