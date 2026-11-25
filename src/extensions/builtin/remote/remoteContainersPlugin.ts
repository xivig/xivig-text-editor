/**
 * Builds docker run arguments for launching a development container.
 */
export function buildDevContainerRunArgs(
  image: string,
  options: {
    containerName?: string;
    workspaceMount?: string;
    forwardPorts?: number[];
    remoteUser?: string;
    env?: Record<string, string>;
  } = {}
): string[] {
  const args = ['run', '-d', '--init'];

  if (options.containerName) {
    args.push('--name', options.containerName);
  }

  if (options.remoteUser) {
    args.push('-u', options.remoteUser);
  }

  if (options.workspaceMount) {
    args.push('-v', options.workspaceMount);
  }

  if (options.forwardPorts) {
    for (const port of options.forwardPorts) {
      args.push('-p', `${port}:${port}`);
    }
  }

  if (options.env) {
    for (const [k, v] of Object.entries(options.env)) {
      args.push('-e', `${k}=${v}`);
    }
  }

  args.push(image);
  return args;
}

/**
 * Generates an inspection overview of a Dev Container configuration.
 */
export function generateDevContainerSummary(config: {
  name?: string;
  image?: string;
  forwardPorts?: number[];
  postCreateCommand?: string;
}): string {
  const lines: string[] = [
    `# Dev Container: ${config.name || 'Unnamed'}`,
    `Base Image: ${config.image || 'Custom Dockerfile'}`,
  ];

  if (config.forwardPorts && config.forwardPorts.length > 0) {
    lines.push(`Forwarded Ports: ${config.forwardPorts.join(', ')}`);
  }

  if (config.postCreateCommand) {
    lines.push(`Post Create Script: \`${config.postCreateCommand}\``);
  }

  return lines.join('\n');
}
