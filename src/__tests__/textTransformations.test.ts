import { describe, it, expect } from 'vitest';
import {
  removeDuplicateLines,
  reverseLines,
  toTitleCase,
  toCamelCase,
  toSnakeCase,
  toKebabCase,
  trimTrailingWhitespace,
  ensureFinalNewline,
  adjustNumberString,
  transposeCharacters,
  transposeWords,
} from '../utils/textTransformations';

describe('textTransformations utilities', () => {
  describe('removeDuplicateLines', () => {
    it('removes duplicate lines preserving first occurrence', () => {
      const input = 'apple\nbanana\napple\norange\nbanana';
      expect(removeDuplicateLines(input)).toBe('apple\nbanana\norange');
    });

    it('preserves CRLF line endings', () => {
      const input = 'a\r\nb\r\na';
      expect(removeDuplicateLines(input)).toBe('a\r\nb');
    });
  });

  describe('reverseLines', () => {
    it('reverses line order', () => {
      const input = 'one\ntwo\nthree';
      expect(reverseLines(input)).toBe('three\ntwo\none');
    });
  });

  describe('case conversions', () => {
    it('toTitleCase capitalizes each word', () => {
      expect(toTitleCase('hello world from xivig')).toBe('Hello World From Xivig');
      expect(toTitleCase('FAST CODE EDITOR')).toBe('Fast Code Editor');
    });

    it('toCamelCase converts snake, kebab, and spaced strings', () => {
      expect(toCamelCase('my_variable_name')).toBe('myVariableName');
      expect(toCamelCase('user-profile-id')).toBe('userProfileId');
      expect(toCamelCase('Hello World')).toBe('helloWorld');
    });

    it('toSnakeCase converts camelCase and kebab-case', () => {
      expect(toSnakeCase('myVariableName')).toBe('my_variable_name');
      expect(toSnakeCase('user-profile-id')).toBe('user_profile_id');
      expect(toSnakeCase('Some Class Name')).toBe('some_class_name');
    });

    it('toKebabCase converts camelCase and snake_case', () => {
      expect(toKebabCase('myVariableName')).toBe('my-variable-name');
      expect(toKebabCase('user_profile_id')).toBe('user-profile-id');
    });
  });

  describe('trimTrailingWhitespace', () => {
    it('trims trailing spaces and tabs from each line', () => {
      const input = 'line 1   \nline 2\t\t\nline 3';
      expect(trimTrailingWhitespace(input)).toBe('line 1\nline 2\nline 3');
    });
  });

  describe('ensureFinalNewline', () => {
    it('appends newline if missing', () => {
      expect(ensureFinalNewline('hello')).toBe('hello\n');
      expect(ensureFinalNewline('hello\n')).toBe('hello\n');
    });

    it('preserves CRLF if document uses CRLF', () => {
      expect(ensureFinalNewline('line1\r\nline2')).toBe('line1\r\nline2\r\n');
    });
  });

  describe('adjustNumberString', () => {
    it('increments and decrements integer numbers', () => {
      expect(adjustNumberString('10', 1)).toBe('11');
      expect(adjustNumberString('10', -1)).toBe('9');
      expect(adjustNumberString('0', -1)).toBe('-1');
    });

    it('preserves floating point precision', () => {
      expect(adjustNumberString('1.5', 1)).toBe('2.5');
      expect(adjustNumberString('3.14', -1)).toBe('2.14');
    });
  });

  describe('transposeCharacters', () => {
    it('swaps mid-line characters before and under cursor', () => {
      const res = transposeCharacters('abc', 1);
      expect(res).not.toBeNull();
      expect(res?.text).toBe('bac');
      expect(res?.newPos).toBe(2);
    });

    it('swaps two characters before cursor if at end of line', () => {
      const res = transposeCharacters('abc', 3);
      expect(res).not.toBeNull();
      expect(res?.text).toBe('acb');
      expect(res?.newPos).toBe(3);
    });

    it('returns null if at start of string or invalid', () => {
      expect(transposeCharacters('a', 0)).toBeNull();
      expect(transposeCharacters('', 0)).toBeNull();
    });
  });

  describe('transposeWords', () => {
    it('swaps words around cursor', () => {
      const res = transposeWords('const alpha = beta;', 14); // between alpha and beta
      expect(res).not.toBeNull();
      expect(res?.text).toBe('const beta = alpha;');
    });
  });
});
