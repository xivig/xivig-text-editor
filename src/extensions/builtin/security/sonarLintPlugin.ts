import type { SonarLintRuleMatch } from './types';

/**
 * Static security analysis rules engine emulating SonarLint rules.
 */
export function analyzeSonarLint(code: string): SonarLintRuleMatch[] {
  const matches: SonarLintRuleMatch[] = [];
  const lines = code.replace(/\r\n/g, '\n').split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Ignore comment lines
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // 1. S2068: Hardcoded credentials
    if (
      /(?:password|passwd|secret|api_key|apikey|access_token|private_key)\s*[:=]\s*['"][a-zA-Z0-9_\-\.\$\/]{8,}['"]/i.test(
        line
      ) &&
      !line.includes('process.env')
    ) {
      matches.push({
        ruleKey: 'typescript:S2068',
        type: 'VULNERABILITY',
        severity: 'CRITICAL',
        message: 'Hardcoded credentials or sensitive secret detected',
        line: lineNum,
      });
    }

    // 2. S1523: Dynamic code execution (eval, Function constructor)
    if (/\beval\s*\(/.test(line) || /\bnew\s+Function\s*\(/.test(line)) {
      matches.push({
        ruleKey: 'typescript:S1523',
        type: 'VULNERABILITY',
        severity: 'HIGH',
        message: 'Dynamically executing code using eval or Function constructor is insecure',
        line: lineNum,
      });
    }

    // 3. S3358: Nested ternary operators
    const ternaryQuestionCount = (line.match(/\?/g) || []).length;
    const ternaryColonCount = (line.match(/:/g) || []).length;
    if (ternaryQuestionCount >= 2 && ternaryColonCount >= 2 && !line.includes('//')) {
      matches.push({
        ruleKey: 'typescript:S3358',
        type: 'CODE_SMELL',
        severity: 'MEDIUM',
        message: 'Extract nested ternary operators into independent statements for readability',
        line: lineNum,
      });
    }

    // 4. S1874: Deprecated method calls
    if (/\b(?:substr|unescape|escape)\s*\(/.test(line)) {
      matches.push({
        ruleKey: 'typescript:S1874',
        type: 'CODE_SMELL',
        severity: 'LOW',
        message: 'Deprecated JavaScript API call; use modern standard alternatives',
        line: lineNum,
      });
    }

    // 5. S5144: Server-Side Request Forgery / arbitrary URL fetch
    if (/\bfetch\s*\(\s*(?:req|request)\.(?:body|query|params)/.test(line)) {
      matches.push({
        ruleKey: 'typescript:S5144',
        type: 'SECURITY_HOTSPOT',
        severity: 'HIGH',
        message: 'Unvalidated user input passed directly to network request (potential SSRF)',
        line: lineNum,
      });
    }
  }

  return matches;
}
