import { BuiltinExtensionModule } from '../api/types';
import { rainbowBracketsExtension } from './rainbow-brackets/index';
import { bootstrap5Extension } from './bootstrap5-fontawesome/index';
import { laravelExtension } from './laravel-all-in-one/index';
import { phpIntelligenceExtension } from './php-intelligence/index';

export const BUILTIN_EXTENSIONS: Record<string, BuiltinExtensionModule> = {
  'xivig-tool-rainbow': rainbowBracketsExtension,
  'xivig.rainbow-brackets': rainbowBracketsExtension,
  'xivig-tool-bootstrap5': bootstrap5Extension,
  'xivig.bootstrap5-fontawesome-snippets': bootstrap5Extension,
  'xivig-tool-laravel': laravelExtension,
  'xivig.laravel-all-in-one': laravelExtension,
  'xivig-tool-php': phpIntelligenceExtension,
  'xivig.php-intelligence': phpIntelligenceExtension,
};

export { rainbowBracketsExtension, bootstrap5Extension, laravelExtension, phpIntelligenceExtension };
