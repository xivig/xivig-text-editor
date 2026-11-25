import {
  DockerfileInstruction,
  DockerfileLintError,
  DockerInstructionType,
  DockerSettings,
} from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const DEFAULT_DOCKER_SETTINGS: DockerSettings = {
  enabled: true,
  lintOnSave: true,
};

const DOCKER_INSTRUCTIONS: DockerInstructionType[] = [
  'FROM', 'RUN', 'CMD', 'LABEL', 'EXPOSE', 'ENV', 'ADD', 'COPY',
  'ENTRYPOINT', 'VOLUME', 'USER', 'WORKDIR', 'ARG', 'ONBUILD',
  'STOPSIGNAL', 'HEALTHCHECK', 'SHELL',
];

/**
 * Parses Dockerfile content into structured instruction objects.
 */
export function parseDockerfile(content: string): DockerfileInstruction[] {
  if (!content || !content.trim()) return [];

  const instructions: DockerfileInstruction[] = [];
  const lines = content.split(/\r?\n/);

  let currentInstruction: DockerInstructionType | null = null;
  let currentArgs = '';
  let startLine = 1;

  function commitInstruction() {
    if (currentInstruction) {
      let stageName: string | undefined;
      if (currentInstruction === 'FROM') {
        const asMatch = currentArgs.match(/\bAS\s+([a-zA-Z0-9_-]+)/i);
        if (asMatch) stageName = asMatch[1];
      }

      instructions.push({
        instruction: currentInstruction,
        args: currentArgs.trim(),
        lineNumber: startLine,
        stageName,
      });
    }
    currentInstruction = null;
    currentArgs = '';
  }

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (currentInstruction) {
      if (currentArgs.endsWith('\\')) {
        currentArgs = currentArgs.slice(0, -1).trim() + ' ' + trimmed;
        if (!trimmed.endsWith('\\')) {
          commitInstruction();
        }
        continue;
      }
    }

    const firstWord = trimmed.split(/\s+/)[0].toUpperCase() as DockerInstructionType;
    if (DOCKER_INSTRUCTIONS.includes(firstWord)) {
      if (currentInstruction) commitInstruction();

      currentInstruction = firstWord;
      currentArgs = trimmed.slice(firstWord.length).trim();
      startLine = idx + 1;

      if (!trimmed.endsWith('\\')) {
        commitInstruction();
      }
    }
  }

  commitInstruction();
  return instructions;
}

/**
 * Lints Dockerfile instructions for production best practices and security rules.
 */
export function lintDockerfile(content: string): DockerfileLintError[] {
  const errors: DockerfileLintError[] = [];
  const instructions = parseDockerfile(content);

  if (instructions.length === 0) {
    errors.push({
      lineNumber: 1,
      severity: 'error',
      message: 'Dockerfile is empty or contains only comments',
    });
    return errors;
  }

  let hasFrom = false;
  let cmdCount = 0;
  let entrypointCount = 0;

  for (const inst of instructions) {
    if (!hasFrom && inst.instruction !== 'ARG') {
      if (inst.instruction === 'FROM') {
        hasFrom = true;
      } else {
        errors.push({
          lineNumber: inst.lineNumber,
          severity: 'error',
          instruction: inst.instruction,
          message: 'The first instruction in a Dockerfile must be FROM (or ARG for FROM)',
        });
      }
    }

    if (inst.instruction === 'FROM') {
      const imgToken = inst.args.split(/\s+/)[0];
      if (!imgToken.includes(':') || imgToken.endsWith(':latest')) {
        errors.push({
          lineNumber: inst.lineNumber,
          severity: 'warning',
          instruction: 'FROM',
          message: `Avoid using ':latest' or untagged base image '${imgToken}'. Pin an explicit version tag for reproducible builds.`,
        });
      }
    }

    if (inst.instruction === 'CMD') {
      cmdCount++;
      if (cmdCount > 1) {
        errors.push({
          lineNumber: inst.lineNumber,
          severity: 'warning',
          instruction: 'CMD',
          message: 'Multiple CMD instructions found. Only the last CMD will take effect.',
        });
      }
    }

    if (inst.instruction === 'ENTRYPOINT') {
      entrypointCount++;
      if (entrypointCount > 1) {
        errors.push({
          lineNumber: inst.lineNumber,
          severity: 'warning',
          instruction: 'ENTRYPOINT',
          message: 'Multiple ENTRYPOINT instructions found. Only the last ENTRYPOINT will take effect.',
        });
      }
    }

    if (inst.instruction === 'RUN' && /\bsudo\b/i.test(inst.args)) {
      errors.push({
        lineNumber: inst.lineNumber,
        severity: 'warning',
        instruction: 'RUN',
        message: 'Avoid using "sudo" inside RUN instructions. Containers execute as root by default unless USER is specified.',
      });
    }

    if (inst.instruction === 'EXPOSE') {
      const portTokens = inst.args.split(/\s+/);
      for (const token of portTokens) {
        const portNum = parseInt(token.split('/')[0], 10);
        if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
          errors.push({
            lineNumber: inst.lineNumber,
            severity: 'error',
            instruction: 'EXPOSE',
            message: `Invalid port number '${token}' in EXPOSE instruction`,
          });
        }
      }
    }
  }

  return errors;
}

/**
 * Builds a docker run command string.
 */
export function buildDockerRunCommand(
  image: string,
  options?: {
    name?: string;
    ports?: string[];
    env?: Record<string, string>;
    detached?: boolean;
    removeOnExit?: boolean;
  }
): string {
  const parts: string[] = ['docker', 'run'];

  if (options?.detached) parts.push('-d');
  if (options?.removeOnExit !== false) parts.push('--rm');
  if (options?.name) parts.push(`--name ${options.name}`);

  if (options?.ports) {
    for (const p of options.ports) {
      parts.push(`-p ${p}`);
    }
  }

  if (options?.env) {
    for (const [k, v] of Object.entries(options.env)) {
      parts.push(`-e ${k}="${v.replace(/"/g, '\\"')}"`);
    }
  }

  parts.push(image);
  return parts.join(' ');
}

/**
 * Autocompletion source for Dockerfile instructions and multi-stage syntax.
 */
export function createDockerfileCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z_-]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text.toUpperCase();
    const matches = DOCKER_INSTRUCTIONS.filter((inst) => inst.startsWith(norm));
    if (matches.length === 0) return null;

    return {
      from: word.from,
      options: matches.map((inst) => ({
        label: `${inst} `,
        type: 'keyword',
        detail: 'Dockerfile instruction',
        boost: 4,
      })),
    };
  };
}
