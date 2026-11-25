import { AndroidGradleConfig } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

const GRADLE_KEYWORDS = [
  'plugins {\n    \n}',
  'android {\n    \n}',
  'defaultConfig {\n    \n}',
  'buildTypes {\n    release {\n        minifyEnabled false\n    }\n}',
  'dependencies {\n    \n}',
  'implementation',
  'api',
  'compileOnly',
  'runtimeOnly',
  'testImplementation',
  'androidTestImplementation',
  'kapt',
  'ksp',
  'compileSdk = 34',
  'minSdk = 24',
  'targetSdk = 34',
];

/**
 * Extracts Android SDK versions and packaging info from build.gradle or build.gradle.kts.
 */
export function parseGradleAndroidConfig(content: string): AndroidGradleConfig {
  const config: AndroidGradleConfig = {};
  if (!content) return config;

  const compileMatch = content.match(/compileSdk(?:Version)?\s*[=:]?\s*(\d+)/);
  if (compileMatch) config.compileSdk = parseInt(compileMatch[1], 10);

  const minMatch = content.match(/minSdk(?:Version)?\s*[=:]?\s*(\d+)/);
  if (minMatch) config.minSdk = parseInt(minMatch[1], 10);

  const targetMatch = content.match(/targetSdk(?:Version)?\s*[=:]?\s*(\d+)/);
  if (targetMatch) config.targetSdk = parseInt(targetMatch[1], 10);

  const appIdMatch = content.match(/applicationId\s*[=:]?\s*["']([^"']+)["']/);
  if (appIdMatch) config.applicationId = appIdMatch[1];

  const codeMatch = content.match(/versionCode\s*[=:]?\s*(\d+)/);
  if (codeMatch) config.versionCode = parseInt(codeMatch[1], 10);

  const nameMatch = content.match(/versionName\s*[=:]?\s*["']([^"']+)["']/);
  if (nameMatch) config.versionName = nameMatch[1];

  return config;
}

/**
 * Builds Gradle command line invocations.
 */
export function buildGradleCliCommand(
  tasks: string[] = ['assembleDebug'],
  offline = false,
  stacktrace = false
): string {
  const parts: string[] = ['./gradlew'];

  if (offline) parts.push('--offline');
  if (stacktrace) parts.push('--stacktrace');

  parts.push(...tasks);
  return parts.join(' ');
}

/**
 * Autocompletion for Gradle Android build scripts.
 */
export function createGradleCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_.-]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text.toLowerCase();
    const options: any[] = [];

    for (const kw of GRADLE_KEYWORDS) {
      if (kw.toLowerCase().startsWith(norm)) {
        options.push({
          label: kw,
          type: 'keyword',
          detail: 'Gradle Android DSL',
          boost: 3,
        });
      }
    }

    if (options.length === 0) return null;

    return {
      from: word.from,
      options,
    };
  };
}
