/**
 * CSS Utilities & Diagnostics
 * Computes selector specificity, parses CSS custom properties (variables),
 * and validates selector syntax.
 */

export interface CssSpecificity {
  a: number; // IDs
  b: number; // Classes, attributes, pseudo-classes
  c: number; // Type selectors and pseudo-elements
  score: number; // e.g. 120 for (0, 1, 2)
  description: string;
}

export function calculateCssSpecificity(selector: string): CssSpecificity {
  const clean = selector.trim().replace(/:not\((.*?)\)/g, '$1');

  // Count IDs (#id)
  const idMatches = clean.match(/#[a-zA-Z0-9_-]+/g) || [];
  const a = idMatches.length;

  // Remove matched IDs before checking classes to avoid collisions
  let rest = clean.replace(/#[a-zA-Z0-9_-]+/g, '');

  // Count Classes (.class), Attributes ([type="text"]), Pseudo-classes (:hover)
  // Be careful not to count pseudo-elements (::before) as pseudo-classes
  const pseudoElementMatches = rest.match(/::[a-zA-Z0-9_-]+/g) || [];
  rest = rest.replace(/::[a-zA-Z0-9_-]+/g, '');

  const classMatches = rest.match(/\.[a-zA-Z0-9_-]+/g) || [];
  const attrMatches = rest.match(/\[[^\]]+\]/g) || [];
  const pseudoClassMatches = rest.match(/:[a-zA-Z0-9_-]+/g) || [];
  const b = classMatches.length + attrMatches.length + pseudoClassMatches.length;

  // Clean matched classes, attributes, pseudo-classes
  rest = rest
    .replace(/\.[a-zA-Z0-9_-]+/g, '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/:[a-zA-Z0-9_-]+/g, '')
    .replace(/[>+~*,\s]/g, ' ')
    .trim();

  // Count Elements / Type selectors (div, p, span)
  const typeTokens = rest.split(/\s+/).filter(Boolean);
  const c = typeTokens.length + pseudoElementMatches.length;

  const score = a * 100 + b * 10 + c;

  return {
    a,
    b,
    c,
    score,
    description: `Specificity: (${a}, ${b}, ${c}) ${a > 0 ? 'High' : b > 0 ? 'Medium' : 'Low'}`,
  };
}

export interface CssVariableDeclaration {
  name: string;
  value: string;
  line: number;
}

export function extractCssVariables(cssText: string): CssVariableDeclaration[] {
  const vars: CssVariableDeclaration[] = [];
  const lines = cssText.split('\n');

  const varRegex = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;

  while ((match = varRegex.exec(cssText)) !== null) {
    const varName = match[1];
    const varVal = match[2].trim();

    // Find line
    const matchPos = match.index;
    let accumulated = 0;
    let line = 1;
    for (let i = 0; i < lines.length; i++) {
      const len = lines[i].length + 1;
      if (accumulated + len > matchPos) {
        line = i + 1;
        break;
      }
      accumulated += len;
    }

    vars.push({ name: varName, value: varVal, line });
  }

  return vars;
}

export interface CssClassDefinition {
  name: string;
  line: number;
}

export function extractCssClasses(cssText: string): CssClassDefinition[] {
  const classes: CssClassDefinition[] = [];
  const lines = cssText.split('\n');

  const classRegex = /\.([a-zA-Z0-9_-]+)(?=[^{]*\{)/g;
  let match: RegExpExecArray | null;

  while ((match = classRegex.exec(cssText)) !== null) {
    const className = match[1];
    const matchPos = match.index;
    let accumulated = 0;
    let line = 1;
    for (let i = 0; i < lines.length; i++) {
      const len = lines[i].length + 1;
      if (accumulated + len > matchPos) {
        line = i + 1;
        break;
      }
      accumulated += len;
    }

    if (!classes.some((c) => c.name === className)) {
      classes.push({ name: className, line });
    }
  }

  return classes;
}

export function validateCssSelector(selector: string): { valid: boolean; error?: string } {
  const trimmed = selector.trim();
  if (!trimmed) return { valid: false, error: 'Empty selector' };

  // Check brackets balance
  const openBrackets = (trimmed.match(/\[/g) || []).length;
  const closeBrackets = (trimmed.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    return { valid: false, error: 'Unbalanced attribute brackets [ ] in selector' };
  }

  const openParens = (trimmed.match(/\(/g) || []).length;
  const closeParens = (trimmed.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return { valid: false, error: 'Unbalanced parentheses ( ) in pseudo-class' };
  }

  // Trailing combinator checks
  if (/[>+~]\s*$/.test(trimmed)) {
    return { valid: false, error: 'Dangling combinator (> , + or ~) at end of selector' };
  }

  return { valid: true };
}
