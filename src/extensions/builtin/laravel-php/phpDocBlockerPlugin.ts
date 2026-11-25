import { GeneratedDocBlock, PhpDocBlockParam } from './types';

/**
 * Generates an automated PHPDoc comment block from a PHP method/function signature.
 * Example input: public function getUser(int $id, ?string $token = null): ?User
 */
export function generatePhpDocBlock(signatureLine: string): GeneratedDocBlock | null {
  if (!signatureLine) return null;

  // Extract function name, parameter list, and return type
  const match = signatureLine.match(/function\s+([a-zA-Z0-9_]+)\s*\((.*?)\)(?:\s*:\s*([?a-zA-Z0-9_|\\]+))?/);
  if (!match) return null;

  const fnName = match[1];
  const rawParams = match[2].trim();
  const rawReturnType = match[3]?.trim();

  const params: PhpDocBlockParam[] = [];

  if (rawParams) {
    const paramTokens = rawParams.split(',').map((p) => p.trim()).filter(Boolean);
    for (const token of paramTokens) {
      // e.g. ?string $token = null OR int $id
      const pMatch = token.match(/^(?:([?a-zA-Z0-9_|\\]+)\s+)?(\$[a-zA-Z0-9_]+)(?:\s*=.*)?$/);
      if (pMatch) {
        let type = pMatch[1] || 'mixed';
        if (type.startsWith('?')) {
          type = `${type.slice(1)}|null`;
        }
        params.push({
          type,
          name: pMatch[2],
        });
      }
    }
  }

  let returnType = rawReturnType || 'void';
  if (returnType.startsWith('?')) {
    returnType = `${returnType.slice(1)}|null`;
  }

  // Format doc block
  const lines: string[] = ['/**'];
  for (const p of params) {
    lines.push(` * @param ${p.type} ${p.name}`);
  }
  if (returnType && returnType !== 'void') {
    lines.push(` * @return ${returnType}`);
  }
  lines.push(' */');

  return {
    summary: fnName,
    params,
    returnType,
    formatted: lines.join('\n'),
  };
}
