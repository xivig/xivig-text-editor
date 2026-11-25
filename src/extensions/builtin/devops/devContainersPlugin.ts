import { DevContainerConfig, DevContainerValidation } from './types';

/**
 * Strips comments from JSONC (JSON with comments) strings.
 */
export function stripJsonComments(jsonc: string): string {
  if (!jsonc) return '';
  const noBlock = jsonc.replace(/\/\*[\s\S]*?\*\//g, '');
  const lines = noBlock.split(/\r?\n/);
  return lines
    .map((line) => {
      let inString = false;
      let quoteChar = '';
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const prev = i > 0 ? line[i - 1] : '';
        if ((char === '"' || char === "'") && prev !== '\\') {
          if (!inString) {
            inString = true;
            quoteChar = char;
          } else if (quoteChar === char) {
            inString = false;
          }
        }
        if (!inString && char === '/' && line[i + 1] === '/') {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join('\n');
}

/**
 * Parses devcontainer.json string into a typed DevContainerConfig.
 */
export function parseDevContainerConfig(content: string): DevContainerConfig | null {
  if (!content || !content.trim()) return null;

  try {
    const cleanJson = stripJsonComments(content).replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(cleanJson) as DevContainerConfig;
  } catch {
    return null;
  }
}

/**
 * Validates a Dev Container configuration.
 */
export function validateDevContainerConfig(config: DevContainerConfig): DevContainerValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config || typeof config !== 'object') {
    return {
      valid: false,
      errors: ['Invalid configuration format'],
      warnings: [],
    };
  }

  const hasImage = Boolean(config.image);
  const hasDockerfile = Boolean(config.dockerFile || config.build?.dockerfile);
  const hasBuild = Boolean(config.build);
  const hasCompose = Boolean((config as any).dockerComposeFile);

  if (!hasImage && !hasDockerfile && !hasBuild && !hasCompose) {
    errors.push('Dev container must specify either "image", "dockerFile", "build", or "dockerComposeFile"');
  }

  if (!config.name) {
    warnings.push('Dev container configuration has no "name" defined');
  }

  if (config.forwardPorts) {
    if (!Array.isArray(config.forwardPorts)) {
      errors.push('"forwardPorts" must be an array of port numbers');
    } else {
      for (const p of config.forwardPorts) {
        if (typeof p !== 'number' || p < 1 || p > 65535) {
          errors.push(`Invalid port number '${p}' in forwardPorts (must be between 1 and 65535)`);
        }
      }
    }
  }

  if (config.features && (typeof config.features !== 'object' || Array.isArray(config.features))) {
    errors.push('"features" must be a key-value object of feature identifiers');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
