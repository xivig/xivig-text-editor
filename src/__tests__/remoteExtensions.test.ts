import { describe, it, expect } from 'vitest';
import {
  parseSshConfigFile,
  buildSshCliArgs,
  buildRemoteUri,
  parseRemoteUri,
} from '../extensions/builtin/remote/remoteSshPlugin';
import {
  parseWslListOutput,
  translateWindowsPathToWsl,
  translateWslPathToWindows,
  buildWslCliCommand,
} from '../extensions/builtin/remote/wslPlugin';
import {
  RemoteExplorerRegistry,
} from '../extensions/builtin/remote/remoteExplorerPlugin';
import {
  buildDevContainerRunArgs,
  generateDevContainerSummary,
} from '../extensions/builtin/remote/remoteContainersPlugin';

describe('Remote Development Extension Suite (Category 17)', () => {
  describe('Remote - SSH', () => {
    it('parses OpenSSH config file with host aliases, identity files, and tunnels', () => {
      const configText = `# SSH Configuration
Host prod-cluster
  HostName 192.168.1.100
  User deploy
  Port 2222
  IdentityFile ~/.ssh/id_ed25519
  ForwardAgent yes
  LocalForward 8080 localhost:80

Host jump-host
  HostName bastion.example.com
  User admin`;

      const hosts = parseSshConfigFile(configText);
      expect(hosts).toHaveLength(2);

      const prod = hosts[0];
      expect(prod.host).toBe('prod-cluster');
      expect(prod.hostName).toBe('192.168.1.100');
      expect(prod.user).toBe('deploy');
      expect(prod.port).toBe(2222);
      expect(prod.identityFile).toBe('~/.ssh/id_ed25519');
      expect(prod.forwardAgent).toBe(true);
      expect(prod.localForwards).toEqual([
        { localPort: 8080, remoteHost: 'localhost', remotePort: 80 },
      ]);
    });

    it('builds safe CLI argument arrays for SSH invocation without shell interpolation', () => {
      const host = {
        host: 'dev-server',
        hostName: '10.0.0.5',
        user: 'developer',
        port: 2200,
        identityFile: '/path/to/key.pem',
        proxyJump: 'bastion',
        forwardAgent: true,
        localForwards: [{ localPort: 3000, remoteHost: 'localhost', remotePort: 3000 }],
      };

      const args = buildSshCliArgs(host, 'uname -a');
      expect(args).toContain('-p');
      expect(args).toContain('2200');
      expect(args).toContain('-i');
      expect(args).toContain('/path/to/key.pem');
      expect(args).toContain('-J');
      expect(args).toContain('bastion');
      expect(args).toContain('-A');
      expect(args).toContain('-L');
      expect(args).toContain('3000:localhost:3000');
      expect(args).toContain('developer@10.0.0.5');
      expect(args).toContain('uname -a');
    });

    it('creates and parses uniform remote URIs roundtrip', () => {
      const uri = buildRemoteUri('ssh', 'production-app', '/var/log/nginx/access.log');
      expect(uri).toBe('xivig-remote://ssh+production-app/var/log/nginx/access.log');

      const parsed = parseRemoteUri(uri);
      expect(parsed).not.toBeNull();
      expect(parsed?.type).toBe('ssh');
      expect(parsed?.target).toBe('production-app');
      expect(parsed?.path).toBe('/var/log/nginx/access.log');
    });
  });

  describe('WSL Integration', () => {
    it('parses wsl.exe -l -v table output including default distro flag and status', () => {
      const sampleOutput = `  NAME                   STATE           VERSION
* Ubuntu-22.04           Running         2
  docker-desktop         Running         2
  Debian                 Stopped         1`;

      const distros = parseWslListOutput(sampleOutput);
      expect(distros).toHaveLength(3);

      expect(distros[0].name).toBe('Ubuntu-22.04');
      expect(distros[0].isDefault).toBe(true);
      expect(distros[0].state).toBe('Running');
      expect(distros[0].version).toBe(2);

      expect(distros[2].name).toBe('Debian');
      expect(distros[2].isDefault).toBe(false);
      expect(distros[2].state).toBe('Stopped');
      expect(distros[2].version).toBe(1);
    });

    it('translates Windows and WSL file paths bidirectionally', () => {
      // Windows drive to WSL mount
      expect(translateWindowsPathToWsl('C:\\Users\\Alice\\code\\my-app')).toBe(
        '/mnt/c/Users/Alice/code/my-app'
      );

      // WSL mount back to Windows drive
      expect(translateWslPathToWindows('/mnt/c/Users/Alice/code/my-app')).toBe(
        'C:\\Users\\Alice\\code\\my-app'
      );

      // WSL UNC path to Linux POSIX path
      expect(
        translateWindowsPathToWsl('\\\\wsl$\\Ubuntu-22.04\\home\\alice\\project')
      ).toBe('/home/alice/project');

      // Linux POSIX path to WSL UNC path
      expect(
        translateWslPathToWindows('/home/alice/project', 'Ubuntu-22.04')
      ).toBe('\\\\wsl$\\Ubuntu-22.04\\home\\alice\\project');
    });

    it('builds safe wsl.exe subprocess execution arguments with working directory', () => {
      const cmd = buildWslCliCommand('Ubuntu-22.04', 'npm test', '/home/user/app');
      expect(cmd.binary).toBe('wsl.exe');
      expect(cmd.args).toEqual([
        '-d',
        'Ubuntu-22.04',
        '--cd',
        '/home/user/app',
        '--',
        'bash',
        '-c',
        'npm test',
      ]);
    });
  });

  describe('Remote Explorer', () => {
    it('manages targets, updates statuses, and categorizes into hierarchy tree', () => {
      const explorer = new RemoteExplorerRegistry();

      explorer.addTarget({
        id: 'target-1',
        type: 'ssh',
        label: 'Production Web',
        status: 'disconnected',
        hostOrDistro: 'prod.example.com',
      });

      explorer.addTarget({
        id: 'target-2',
        type: 'wsl',
        label: 'Ubuntu 22.04 (Default)',
        status: 'connected',
        hostOrDistro: 'Ubuntu-22.04',
      });

      explorer.updateTargetStatus('target-1', 'connected');
      expect(explorer.getTarget('target-1')?.status).toBe('connected');

      const tree = explorer.generateTargetTree();
      expect(tree).toHaveLength(4);

      const sshCategory = tree.find((c) => c.type === 'ssh');
      expect(sshCategory?.targets).toHaveLength(1);
      expect(sshCategory?.targets[0].label).toBe('Production Web');

      const wslCategory = tree.find((c) => c.type === 'wsl');
      expect(wslCategory?.targets).toHaveLength(1);
      expect(wslCategory?.targets[0].label).toBe('Ubuntu 22.04 (Default)');
    });
  });

  describe('Dev Containers - Remote', () => {
    it('builds docker run arguments with mounts, ports, and execution user', () => {
      const args = buildDevContainerRunArgs('node:20-alpine', {
        containerName: 'xivig-dev-env',
        remoteUser: 'node',
        workspaceMount: '/local/dir:/workspace',
        forwardPorts: [3000, 8080],
        env: { NODE_ENV: 'development' },
      });

      expect(args).toContain('run');
      expect(args).toContain('--name');
      expect(args).toContain('xivig-dev-env');
      expect(args).toContain('-u');
      expect(args).toContain('node');
      expect(args).toContain('-v');
      expect(args).toContain('/local/dir:/workspace');
      expect(args).toContain('-p');
      expect(args).toContain('3000:3000');
      expect(args).toContain('8080:8080');
      expect(args).toContain('-e');
      expect(args).toContain('NODE_ENV=development');
      expect(args[args.length - 1]).toBe('node:20-alpine');
    });

    it('generates dev container summary overview', () => {
      const summary = generateDevContainerSummary({
        name: 'TypeScript Fullstack',
        image: 'mcr.microsoft.com/devcontainers/typescript-node:20',
        forwardPorts: [3000, 5432],
        postCreateCommand: 'npm install',
      });

      expect(summary).toContain('# Dev Container: TypeScript Fullstack');
      expect(summary).toContain('Forwarded Ports: 3000, 5432');
      expect(summary).toContain('Post Create Script: `npm install`');
    });
  });
});
