import { MavenProject, MavenDependency, MavenSettings } from './types';
import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const DEFAULT_MAVEN_SETTINGS: MavenSettings = {
  enabled: true,
  defaultGoals: ['clean', 'compile'],
};

const MAVEN_XML_TAGS = [
  '<dependencies>\n  \n</dependencies>',
  '<dependency>\n  <groupId></groupId>\n  <artifactId></artifactId>\n  <version></version>\n</dependency>',
  '<groupId></groupId>',
  '<artifactId></artifactId>',
  '<version></version>',
  '<scope>test</scope>',
  '<scope>provided</scope>',
  '<scope>runtime</scope>',
  '<plugins>\n  \n</plugins>',
  '<properties>\n  <maven.compiler.source>21</maven.compiler.source>\n  <maven.compiler.target>21</maven.compiler.target>\n</properties>',
];

/**
 * Lightweight XML parser for Maven pom.xml projects.
 */
export function parsePomXml(xmlContent: string): MavenProject | null {
  if (!xmlContent || !xmlContent.trim()) return null;

  try {
    const groupIdMatch = xmlContent.match(/<project[\s\S]*?<groupId>([^<]+)<\/groupId>/);
    const artifactIdMatch = xmlContent.match(/<project[\s\S]*?<artifactId>([^<]+)<\/artifactId>/);
    const versionMatch = xmlContent.match(/<project[\s\S]*?<version>([^<]+)<\/version>/);
    const packagingMatch = xmlContent.match(/<packaging>([^<]+)<\/packaging>/);
    const nameMatch = xmlContent.match(/<name>([^<]+)<\/name>/);

    const dependencies: MavenDependency[] = [];
    const depMatches = xmlContent.matchAll(/<dependency>([\s\S]*?)<\/dependency>/g);

    for (const match of depMatches) {
      const depBlock = match[1];
      const g = depBlock.match(/<groupId>([^<]+)<\/groupId>/)?.[1]?.trim() || '';
      const a = depBlock.match(/<artifactId>([^<]+)<\/artifactId>/)?.[1]?.trim() || '';
      const v = depBlock.match(/<version>([^<]+)<\/version>/)?.[1]?.trim();
      const s = depBlock.match(/<scope>([^<]+)<\/scope>/)?.[1]?.trim();

      if (g && a) {
        dependencies.push({
          groupId: g,
          artifactId: a,
          version: v,
          scope: s,
        });
      }
    }

    return {
      groupId: groupIdMatch?.[1]?.trim(),
      artifactId: artifactIdMatch?.[1]?.trim(),
      version: versionMatch?.[1]?.trim(),
      packaging: packagingMatch?.[1]?.trim(),
      name: nameMatch?.[1]?.trim(),
      dependencies,
    };
  } catch {
    return null;
  }
}

/**
 * Builds Maven execution CLI command with flags.
 */
export function buildMavenCliCommand(
  goals: string[] = ['clean', 'compile'],
  options?: {
    offline?: boolean;
    debug?: boolean;
    profile?: string;
  }
): string {
  const parts: string[] = ['mvn'];

  if (options?.offline) parts.push('-o');
  if (options?.debug) parts.push('-X');
  if (options?.profile) parts.push(`-P ${options.profile}`);

  parts.push(...goals);
  return parts.join(' ');
}

/**
 * Autocompletion for pom.xml Maven tags.
 */
export function createMavenCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/<[a-zA-Z0-9_-]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const norm = word.text.toLowerCase();
    const options: any[] = [];

    for (const tag of MAVEN_XML_TAGS) {
      if (tag.toLowerCase().startsWith(norm)) {
        options.push({
          label: tag,
          type: 'snippet',
          detail: 'Maven POM Tag',
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
