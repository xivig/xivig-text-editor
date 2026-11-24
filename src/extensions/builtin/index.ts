import { BuiltinExtensionModule } from '../api/types';
import { rainbowBracketsExtension } from './rainbow-brackets/index';

export const BUILTIN_EXTENSIONS: Record<string, BuiltinExtensionModule> = {
  'xivig-tool-rainbow': rainbowBracketsExtension,
  'xivig.rainbow-brackets': rainbowBracketsExtension,
};

export { rainbowBracketsExtension };
