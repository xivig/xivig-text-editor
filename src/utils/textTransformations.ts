/**
 * Utility functions for advanced text transformations (Sublime Text / Professional Editor grade)
 */

/**
 * Removes duplicate lines from a string, preserving first occurrence.
 */
export function removeDuplicateLines(text: string): string {
  const isCRLF = text.includes('\r\n');
  const lines = text.split(/\r?\n/);
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      unique.push(line);
    }
  }

  return unique.join(isCRLF ? '\r\n' : '\n');
}

/**
 * Reverses the line order in a string.
 */
export function reverseLines(text: string): string {
  const isCRLF = text.includes('\r\n');
  const lines = text.split(/\r?\n/);
  return lines.reverse().join(isCRLF ? '\r\n' : '\n');
}

/**
 * Transforms text to Title Case (capitalizes the first letter of each word).
 */
export function toTitleCase(text: string): string {
  return text.replace(/\b([a-zA-Z])(\w*)\b/g, (_, first, rest) => {
    return first.toUpperCase() + rest.toLowerCase();
  });
}

/**
 * Transforms text to camelCase.
 * e.g., "my_variable_name" -> "myVariableName", "user-profile-id" -> "userProfileId"
 */
export function toCamelCase(text: string): string {
  return text
    .trim()
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

/**
 * Transforms text to snake_case.
 * e.g., "myVariableName" -> "my_variable_name", "user-profile-id" -> "user_profile_id"
 */
export function toSnakeCase(text: string): string {
  return text
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

/**
 * Transforms text to kebab-case.
 * e.g., "myVariableName" -> "my-variable-name", "user_profile_id" -> "user-profile-id"
 */
export function toKebabCase(text: string): string {
  return text
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase();
}

/**
 * Trims trailing whitespace from every line in text.
 */
export function trimTrailingWhitespace(text: string): string {
  const isCRLF = text.includes('\r\n');
  const lines = text.split(/\r?\n/);
  const trimmed = lines.map((l) => l.replace(/[\t ]+$/, ''));
  return trimmed.join(isCRLF ? '\r\n' : '\n');
}

/**
 * Increments or decrements a number string by delta (+1 or -1).
 * Preserves decimal places if float.
 */
export function adjustNumberString(numStr: string, delta: number): string {
  const isFloat = numStr.includes('.');
  if (isFloat) {
    const decDigits = numStr.split('.')[1].length;
    const val = parseFloat(numStr) + delta;
    return val.toFixed(decDigits);
  }
  const val = parseInt(numStr, 10) + delta;
  return isNaN(val) ? numStr : val.toString();
}
