import type { RemoteTarget } from './types';

export class RemoteExplorerRegistry {
  private targets: Map<string, RemoteTarget> = new Map();

  public addTarget(target: RemoteTarget): void {
    this.targets.set(target.id, target);
  }

  public removeTarget(id: string): boolean {
    return this.targets.delete(id);
  }

  public getTarget(id: string): RemoteTarget | undefined {
    return this.targets.get(id);
  }

  public getAllTargets(): RemoteTarget[] {
    return Array.from(this.targets.values());
  }

  public updateTargetStatus(id: string, status: RemoteTarget['status']): void {
    const target = this.targets.get(id);
    if (target) {
      target.status = status;
    }
  }

  public getTargetsByType(type: RemoteTarget['type']): RemoteTarget[] {
    return Array.from(this.targets.values()).filter((t) => t.type === type);
  }

  /**
   * Generates a categorized tree structure for the Remote Explorer view.
   */
  public generateTargetTree(): {
    type: RemoteTarget['type'];
    title: string;
    targets: RemoteTarget[];
  }[] {
    const categories: { type: RemoteTarget['type']; title: string }[] = [
      { type: 'ssh', title: 'SSH Targets' },
      { type: 'wsl', title: 'WSL Targets' },
      { type: 'container', title: 'Dev Containers' },
      { type: 'tunnel', title: 'Remote Tunnels' },
    ];

    return categories.map((cat) => ({
      type: cat.type,
      title: cat.title,
      targets: this.getTargetsByType(cat.type),
    }));
  }
}

export const remoteExplorerRegistry = new RemoteExplorerRegistry();
