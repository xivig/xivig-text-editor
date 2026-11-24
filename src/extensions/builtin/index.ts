import { BuiltinExtensionModule } from '../api/types';
import { rainbowBracketsExtension } from './rainbow-brackets/index';
import { bootstrap5Extension } from './bootstrap5-fontawesome/index';

export const BUILTIN_EXTENSIONS: Record<string, BuiltinExtensionModule> = {
  'xivig-tool-rainbow': rainbowBracketsExtension,
  'xivig.rainbow-brackets': rainbowBracketsExtension,
  'xivig-tool-bootstrap5': bootstrap5Extension,
  'xivig.bootstrap5-fontawesome-snippets': bootstrap5Extension,
};

export { rainbowBracketsExtension, bootstrap5Extension };
