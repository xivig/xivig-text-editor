import { AndroidStringEntry } from './types';

/**
 * Parses Android strings.xml resource documents into typed string entries.
 */
export function parseAndroidStringsXml(xmlContent: string, locale = 'default'): AndroidStringEntry[] {
  if (!xmlContent || !xmlContent.trim()) return [];

  const entries: AndroidStringEntry[] = [];
  const stringMatches = xmlContent.matchAll(/<string\s+([^>]*?)>([\s\S]*?)<\/string>/gi);

  for (const m of stringMatches) {
    const attrs = m[1];
    const value = m[2].trim();

    const nameMatch = attrs.match(/name\s*=\s*["']([^"']+)["']/i);
    if (!nameMatch) continue;

    const name = nameMatch[1];
    const transMatch = attrs.match(/translatable\s*=\s*["']([^"']+)["']/i);
    const translatable = transMatch ? transMatch[1].toLowerCase() !== 'false' : true;

    entries.push({
      name,
      value,
      translatable,
      locale,
    });
  }

  return entries;
}

/**
 * Compares default locale strings against localized variants to find missing translations.
 */
export function findMissingTranslations(
  defaultStrings: AndroidStringEntry[],
  localizedMap: Record<string, AndroidStringEntry[]>
): Record<string, string[]> {
  const missingByLocale: Record<string, string[]> = {};
  const translatableDefaults = defaultStrings.filter((s) => s.translatable !== false);

  for (const [locale, localeEntries] of Object.entries(localizedMap)) {
    const presentKeys = new Set(localeEntries.map((e) => e.name));
    const missingKeys: string[] = [];

    for (const def of translatableDefaults) {
      if (!presentKeys.has(def.name)) {
        missingKeys.push(def.name);
      }
    }

    if (missingKeys.length > 0) {
      missingByLocale[locale] = missingKeys;
    }
  }

  return missingByLocale;
}

/**
 * Generates an Android strings.xml document from an array of entries.
 */
export function generateAndroidStringsXml(entries: AndroidStringEntry[]): string {
  const lines: string[] = ['<?xml version="1.0" encoding="utf-8"?>', '<resources>'];

  for (const entry of entries) {
    const transAttr = entry.translatable === false ? ' translatable="false"' : '';
    lines.push(`    <string name="${entry.name}"${transAttr}>${entry.value}</string>`);
  }

  lines.push('</resources>\n');
  return lines.join('\n');
}
