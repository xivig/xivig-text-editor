import { TabnineSettings } from './types';

export const DEFAULT_TABNINE_SETTINGS: TabnineSettings = {
  enabled: true,
  localModeOnly: true,
  enableWholeLine: true,
  snippetThreshold: 0.8,
};

// Common line prediction templates for popular languages
const PREDICTION_TEMPLATES: Record<string, string[]> = {
  typescript: [
    'if (!response.ok) throw new Error(`HTTP error ${response.status}`);',
    'const { data, error } = await query;',
    'return { success: true, data };',
    'export interface Props { children?: React.ReactNode; }',
    'const [state, setState] = useState(initialState);',
  ],
  javascript: [
    'console.log("Debug value:", value);',
    'return Array.from(new Set(items));',
    'const result = await fetch(url, options);',
    'module.exports = { ... };',
  ],
  python: [
    'if __name__ == "__main__":',
    'def __init__(self, *args, **kwargs):',
    'return {"status": "success", "data": result}',
    'raise ValueError(f"Invalid parameter: {param}")',
  ],
};

/**
 * Predicts the remainder of the current line based on prefix.
 */
export function predictWholeLine(linePrefix: string, language = 'typescript'): string | null {
  const trimmed = linePrefix.trim();
  if (!trimmed || trimmed.length < 3) return null;

  const langKey = language.toLowerCase().includes('python')
    ? 'python'
    : language.toLowerCase().includes('javascript')
    ? 'javascript'
    : 'typescript';

  const candidates = PREDICTION_TEMPLATES[langKey] || [];
  for (const cand of candidates) {
    if (cand.toLowerCase().startsWith(trimmed.toLowerCase()) && cand.length > trimmed.length) {
      return cand.slice(trimmed.length);
    }
  }

  return null;
}
