export interface SshHostConfig {
  host: string;
  hostName?: string;
  user?: string;
  port?: number;
  identityFile?: string;
  proxyJump?: string;
  forwardAgent?: boolean;
  localForwards?: { localPort: number; remoteHost: string; remotePort: number }[];
  customOptions?: Record<string, string>;
}

export interface RemoteTarget {
  id: string;
  type: 'ssh' | 'wsl' | 'container' | 'tunnel';
  label: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  hostOrDistro: string;
  remotePath?: string;
  details?: Record<string, unknown>;
}

export interface WslDistro {
  name: string;
  state: 'Running' | 'Stopped';
  version: 1 | 2;
  isDefault: boolean;
}

export interface RemoteUri {
  type: 'ssh' | 'wsl' | 'container';
  target: string;
  path: string;
}
