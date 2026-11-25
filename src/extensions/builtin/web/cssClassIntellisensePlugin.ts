import { CssSpecificityScore, CssClassIntellisenseSettings } from './types';

export const DEFAULT_CSS_CLASS_INTELLISENSE_SETTINGS: CssClassIntellisenseSettings = {
  enabled: true,
  showSpecificityScore: true,
  showSpecificityBadge: true,
  sortOrder: 'specificity',
};

/**
 * Computes official CSS Specificity according to W3C Selectors Level 4:
 * a: ID selectors (#id)
 * b: Class selectors (.class), attribute selectors ([type="text"]), pseudo-classes (:hover)
 * c: Type selectors (div, p, span), pseudo-elements (::before, ::after)
 *
 * Specificity Score = a * 1000 + b * 100 + c
 */
export function calculateCssSpecificity(selector: string): CssSpecificityScore {
  if (!selector || !selector.trim()) {
    return {
      a: 0,
      b: 0,
      c: 0,
      score: 0,
      formatted: '(0, 0, 0)',
      category: 'low',
    };
  }

  // Handle :not(), :is(), :has() - they themselves do not add specificity, but their contents do
  let clean = selector.trim().replace(/:(?:not|is|has)\((.*?)\)/g, '$1');

  // Count IDs (#id)
  const idMatches = clean.match(/#[a-zA-Z0-9_-]+/g) || [];
  const a = idMatches.length;

  // Remove matched IDs before checking classes to prevent collisions
  let rest = clean.replace(/#[a-zA-Z0-9_-]+/g, '');

  // Count pseudo-elements (::before, ::after, ::placeholder)
  const pseudoElementMatches = rest.match(/::[a-zA-Z0-9_-]+/g) || [];
  rest = rest.replace(/::[a-zA-Z0-9_-]+/g, '');

  // Count Classes (.class), Attributes ([type="text"]), Pseudo-classes (:hover)
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

  // Count Elements / Type selectors (div, p, span, h1, body)
  const typeTokens = rest.split(/\s+/).filter(Boolean);
  const c = typeTokens.length + pseudoElementMatches.length;

  const score = a * 1000 + b * 100 + c;
  const formatted = `(${a}, ${b}, ${c})`;

  let category: 'low' | 'medium' | 'high' | 'ultra' = 'low';
  if (a > 1) {
    category = 'ultra';
  } else if (a === 1) {
    category = 'high';
  } else if (b > 0) {
    category = 'medium';
  }

  return {
    a,
    b,
    c,
    score,
    formatted,
    category,
  };
}

/**
 * Compares two CSS selectors by cascading specificity.
 * Returns 1 if selectorA wins, -1 if selectorB wins, 0 if equal.
 */
export function compareSpecificity(selectorA: string, selectorB: string): number {
  const specA = calculateCssSpecificity(selectorA);
  const specB = calculateCssSpecificity(selectorB);

  if (specA.a !== specB.a) {
    return specA.a > specB.a ? 1 : -1;
  }
  if (specA.b !== specB.b) {
    return specA.b > specB.b ? 1 : -1;
  }
  if (specA.c !== specB.c) {
    return specA.c > specB.c ? 1 : -1;
  }
  return 0;
}

/**
 * Formats a specificity score badge string for completion items.
 */
export function formatSpecificityBadge(score: CssSpecificityScore): string {
  return `[Spec: ${score.formatted} - ${score.category.toUpperCase()}]`;
}
