export type ActivationEvent =
  | 'onStartup'
  | 'onEditorCreated'
  | 'onLanguage'
  | 'onCommand'
  | '*';

export class ActivationManager {
  private eventHandlers = new Map<string, Set<string>>();
  private firedEvents = new Set<string>();

  registerActivationEvent(extensionId: string, event: string) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(extensionId);
  }

  unregisterExtension(extensionId: string) {
    for (const extensions of this.eventHandlers.values()) {
      extensions.delete(extensionId);
    }
  }

  getExtensionsForEvent(event: string): string[] {
    const direct = this.eventHandlers.get(event);
    const star = this.eventHandlers.get('*');
    const result = new Set<string>();

    if (direct) {
      for (const id of direct) result.add(id);
    }
    if (star) {
      for (const id of star) result.add(id);
    }

    return Array.from(result);
  }

  recordEvent(event: string) {
    this.firedEvents.add(event);
  }

  hasFired(event: string): boolean {
    return this.firedEvents.has(event);
  }
}

export const activationManager = new ActivationManager();
