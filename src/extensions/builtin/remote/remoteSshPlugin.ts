import type { RemoteUri, SshHostConfig } from './types';

/**
 * Parses OpenSSH configuration file (~/.ssh/config) into typed host definitions.
 */
export function parseSshConfigFile(content: string): SshHostConfig[] {
  const hosts: SshHostConfig[] = [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  let currentHost: SshHostConfig | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    // Split on first whitespace or '='
    const sepIdx = line.search(/[\s=]/);
    if (sepIdx === -1) continue;

    const key = line.slice(0, sepIdx).trim();
    const val = line.slice(sepIdx + 1).trim().replace(/^['"]|['"]$/g, '');

    if (key.toLowerCase() === 'host') {
      if (currentHost) {
        hosts.push(currentHost);
      }
      currentHost = {
        host: val,
        customOptions: {},
      };
      continue;
    }

    if (!currentHost) {
      // Global option before first Host block
      continue;
    }

    const lowerKey = key.toLowerCase();
    switch (lowerKey) {
      case 'hostname':
        currentHost.hostName = val;
        break;
      case 'user':
        currentHost.user = val;
        break;
      case 'port':
        currentHost.port = parseInt(val, 10);
        break;
      case 'identityfile':
        currentHost.identityFile = val;
        break;
      case 'proxyjump':
        currentHost.proxyJump = val;
        break;
      case 'forwardagent':
        currentHost.forwardAgent = val.toLowerCase() === 'yes' || val === '1';
        break;
      case 'localforward': {
        // format: [bind_address:]port host:hostport
        const parts = val.split(/\s+/);
        if (parts.length >= 2) {
          const localPart = parts[0];
          const remotePart = parts[1];
          const localPort = parseInt(localPart.includes(':') ? localPart.split(':')[1] : localPart, 10);
          const [remoteHost, remotePortStr] = remotePart.split(':');
          const remotePort = parseInt(remotePortStr, 10);
          if (!currentHost.localForwards) currentHost.localForwards = [];
          currentHost.localForwards.push({ localPort, remoteHost, remotePort });
        }
        break;
      }
      default:
        if (currentHost.customOptions) {
          currentHost.customOptions[key] = val;
        }
        break;
    }
  }

  if (currentHost) {
    hosts.push(currentHost);
  }

  return hosts;
}

/**
 * Builds array of command arguments for invoking OpenSSH client safely.
 */
export function buildSshCliArgs(config: SshHostConfig, remoteCommand?: string): string[] {
  const args: string[] = [];

  if (config.port && config.port !== 22) {
    args.push('-p', String(config.port));
  }

  if (config.identityFile) {
    args.push('-i', config.identityFile);
  }

  if (config.proxyJump) {
    args.push('-J', config.proxyJump);
  }

  if (config.forwardAgent) {
    args.push('-A');
  }

  if (config.localForwards) {
    for (const f of config.localForwards) {
      args.push('-L', `${f.localPort}:${f.remoteHost}:${f.remotePort}`);
    }
  }

  // Construct user@hostname or host alias
  let target = config.hostName || config.host;
  if (config.user) {
    target = `${config.user}@${target}`;
  }
  args.push(target);

  if (remoteCommand) {
    args.push(remoteCommand);
  }

  return args;
}

/**
 * Formats a uniform remote URI.
 * e.g. xivig-remote://ssh+prod-server/var/www/project
 */
export function buildRemoteUri(type: 'ssh' | 'wsl' | 'container', target: string, path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `xivig-remote://${type}+${encodeURIComponent(target)}${cleanPath}`;
}

/**
 * Parses a uniform remote URI back into type, target, and path.
 */
export function parseRemoteUri(uriString: string): RemoteUri | null {
  const match = uriString.match(/^xivig-remote:\/\/([a-z]+)\+([^/]+)(\/.*)?$/);
  if (!match) return null;

  const type = match[1] as 'ssh' | 'wsl' | 'container';
  const target = decodeURIComponent(match[2]);
  const path = match[3] || '/';

  return { type, target, path };
}
