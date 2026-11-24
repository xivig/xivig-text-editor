import { ExtensionContext, ExtensionManifest } from './types';

export abstract class Extension {
  abstract readonly manifest: ExtensionManifest;

  abstract activate(context: ExtensionContext): Promise<void> | void;

  deactivate?(): Promise<void> | void;
}
