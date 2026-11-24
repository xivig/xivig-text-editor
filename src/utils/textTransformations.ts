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
 * Ensures text ends with a final newline matching the document's line endings.
 */
export function ensureFinalNewline(text: string): string {
  if (text.length === 0) return '\n';
  if (text.endsWith('\n') || text.endsWith('\r')) return text;
  const isCRLF = text.includes('\r\n');
  return text + (isCRLF ? '\r\n' : '\n');
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

/**
 * Transposes characters at or before cursor position (Sublime Text / Emacs style).
 * If at end of line: swaps previous two characters.
 * If mid-line: swaps character before cursor with character under cursor.
 */
export function transposeCharacters(text: string, pos: number): { text: string; newPos: number } | null {
  if (text.length < 2 || pos <= 0) return null;

  // Check if cursor is at end of text or at newline
  const isAtLineEnd = pos >= text.length || text[pos] === '\n' || text[pos] === '\r';

  let leftPos: number;
  let rightPos: number;

  if (isAtLineEnd) {
    // Swap two characters before pos
    rightPos = pos - 1;
    leftPos = pos - 2;
  } else {
    // Swap character before pos with character at pos
    leftPos = pos - 1;
    rightPos = pos;
  }

  if (leftPos < 0 || rightPos >= text.length) return null;

  const charLeft = text[leftPos];
  const charRight = text[rightPos];

  // Don't transpose across newlines
  if (charLeft === '\n' || charLeft === '\r' || charRight === '\n' || charRight === '\r') {
    return null;
  }

  const newText = text.substring(0, leftPos) + charRight + charLeft + text.substring(rightPos + 1);
  return {
    text: newText,
    newPos: isAtLineEnd ? pos : rightPos + 1,
  };
}

/**
 * Transposes the word before the cursor with the word after the cursor.
 */
export function transposeWords(text: string, pos: number): { text: string; newPos: number } | null {
  if (text.length < 3) return null;

  const isWordChar = (ch: string) => /[a-zA-Z0-9_]/.test(ch);

  // Find boundaries of the word before pos
  let leftWordEnd = pos;
  while (leftWordEnd > 0 && !isWordChar(text[leftWordEnd - 1])) {
    leftWordEnd--;
  }
  if (leftWordEnd <= 0) return null;

  let leftWordStart = leftWordEnd;
  while (leftWordStart > 0 && isWordChar(text[leftWordStart - 1])) {
    leftWordStart--;
  }

  // Find boundaries of the word after leftWordEnd
  let rightWordStart = leftWordEnd;
  while (rightWordStart < text.length && !isWordChar(text[rightWordStart])) {
    rightWordStart++;
  }
  if (rightWordStart >= text.length) return null;

  let rightWordEnd = rightWordStart;
  while (rightWordEnd < text.length && isWordChar(text[rightWordEnd])) {
    rightWordEnd++;
  }

  const word1 = text.substring(leftWordStart, leftWordEnd);
  const separator = text.substring(leftWordEnd, rightWordStart);
  const word2 = text.substring(rightWordStart, rightWordEnd);

  // Don't swap if separator contains newlines
  if (separator.includes('\n') || separator.includes('\r')) return null;

  const newText = text.substring(0, leftWordStart) + word2 + separator + word1 + text.substring(rightWordEnd);
  return {
    text: newText,
    newPos: leftWordStart + word2.length + separator.length + word1.length,
  };
}
