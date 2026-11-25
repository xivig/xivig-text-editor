import { AndroidManifestValidation } from './types';

/**
 * Validates an AndroidManifest.xml file and extracts declared activities and permissions.
 */
export function validateAndroidManifest(xmlContent: string): AndroidManifestValidation {
  const errors: string[] = [];
  const activities: string[] = [];
  const permissions: string[] = [];

  if (!xmlContent || !xmlContent.trim()) {
    return {
      valid: false,
      errors: ['AndroidManifest.xml is empty'],
      activities: [],
      permissions: [],
    };
  }

  // 1. Root manifest check
  if (!/<manifest\b/i.test(xmlContent)) {
    errors.push('Missing root <manifest> tag');
  }

  // 2. Package extraction
  const pkgMatch = xmlContent.match(/package\s*=\s*["']([^"']+)["']/i);
  const pkg = pkgMatch?.[1];

  // 3. Permission extraction
  const permMatches = xmlContent.matchAll(/<uses-permission[^>]+android:name\s*=\s*["']([^"']+)["']/gi);
  for (const p of permMatches) {
    permissions.push(p[1]);
  }

  // 4. Activity extraction
  const actMatches = xmlContent.matchAll(/<activity[^>]+android:name\s*=\s*["']([^"']+)["']/gi);
  for (const a of actMatches) {
    activities.push(a[1]);
  }

  // 5. Application tag check
  if (!/<application\b/i.test(xmlContent)) {
    errors.push('Missing <application> block within manifest');
  }

  return {
    valid: errors.length === 0,
    errors,
    package: pkg,
    activities,
    permissions,
  };
}

/**
 * Lightweight XML formatter indenting nested elements.
 */
export function formatXml(xml: string, indentSize = 2): string {
  if (!xml || !xml.trim()) return '';

  const pad = ' '.repeat(indentSize);
  const formatted: string[] = [];
  let depth = 0;

  // Split tags and text content
  const tokens = xml.replace(/>\s*</g, '><').split(/(?=<)|(?<=>)/).filter(Boolean);

  for (const token of tokens) {
    const trimmed = token.trim();
    if (!trimmed) continue;

    // Closing tag: </tag>
    if (trimmed.startsWith('</')) {
      depth = Math.max(0, depth - 1);
      formatted.push(pad.repeat(depth) + trimmed);
    }
    // Self-closing tag or xml header: <tag /> or <?xml ... ?>
    else if (trimmed.endsWith('/>') || trimmed.startsWith('<?') || trimmed.startsWith('<!')) {
      formatted.push(pad.repeat(depth) + trimmed);
    }
    // Opening tag: <tag>
    else if (trimmed.startsWith('<')) {
      formatted.push(pad.repeat(depth) + trimmed);
      depth++;
    }
    // Text content
    else {
      formatted.push(pad.repeat(depth) + trimmed);
    }
  }

  return formatted.join('\n') + '\n';
}
