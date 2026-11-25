import type { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import type { PlantUmlBlock } from './types';

/**
 * Parses PlantUML blocks from document text.
 */
export function parsePlantUmlBlocks(content: string): PlantUmlBlock[] {
  const blocks: PlantUmlBlock[] = [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');

  let inBlock = false;
  let blockType = 'uml';
  let startLine = 0;
  let blockLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Markdown fence ```plantuml
    if (trimmed.startsWith('```plantuml')) {
      inBlock = true;
      blockType = 'plantuml';
      startLine = i + 1;
      blockLines = [];
      continue;
    }
    if (inBlock && blockType === 'plantuml' && trimmed.startsWith('```')) {
      inBlock = false;
      blocks.push({
        type: 'plantuml',
        content: blockLines.join('\n'),
        startLine,
        endLine: i + 1,
      });
      continue;
    }

    // Direct @startuml / @startmindmap / @startsalt / @startwbs
    const startMatch = trimmed.match(/^@start(uml|mindmap|salt|wbs|json|yaml|gantt|chronology)/i);
    if (startMatch) {
      inBlock = true;
      blockType = startMatch[1].toLowerCase();
      startLine = i + 1;
      blockLines = [line];
      continue;
    }

    if (inBlock && trimmed.startsWith('@end')) {
      blockLines.push(line);
      inBlock = false;
      blocks.push({
        type: blockType,
        content: blockLines.join('\n'),
        startLine,
        endLine: i + 1,
      });
      continue;
    }

    if (inBlock) {
      blockLines.push(line);
    }
  }

  return blocks;
}

/**
 * Detects diagram type from PlantUML text.
 */
export function detectDiagramType(content: string): string {
  if (/@startmindmap/i.test(content) || /^\s*\*+\s+/m.test(content)) return 'mindmap';
  if (/@startwbs/i.test(content)) return 'wbs';
  if (/@startsalt/i.test(content)) return 'salt';
  if (/@startgantt/i.test(content)) return 'gantt';
  if (/@startjson/i.test(content)) return 'json';

  if (/->|-->|<-|<--|actor\s|participant\s/m.test(content)) return 'sequence';
  if (/class\s|interface\s|abstract\s+class/m.test(content)) return 'class';
  if (/state\s|\[\*\]/m.test(content)) return 'state';
  if (/usecase\s/m.test(content)) return 'usecase';
  if (/component\s|package\s|node\s/m.test(content)) return 'component';

  return 'generic-uml';
}

/**
 * Generates an SVG URL for a PlantUML diagram from an online PlantUML server.
 */
export function buildPlantUmlServerUrl(
  diagramSource: string,
  server = 'https://www.plantuml.com/plantuml/svg/'
): string {
  const cleanCode = diagramSource.trim();
  const fullDiagram = cleanCode.startsWith('@start') ? cleanCode : `@startuml\n${cleanCode}\n@enduml`;
  // Hex-encoded string is directly supported by PlantUML server: ~h + hex string
  const hex = Array.from(new TextEncoder().encode(fullDiagram))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const base = server.endsWith('/') ? server : `${server}/`;
  return `${base}~h${hex}`;
}

/**
 * Autocompletion source for PlantUML diagrams.
 */
export function createPlantUmlCompletionSource() {
  const keywords = [
    { label: '@startuml', type: 'keyword', apply: '@startuml\n\n@enduml' },
    { label: '@enduml', type: 'keyword' },
    { label: 'actor', type: 'keyword', apply: 'actor ' },
    { label: 'participant', type: 'keyword', apply: 'participant ' },
    { label: 'boundary', type: 'keyword' },
    { label: 'control', type: 'keyword' },
    { label: 'entity', type: 'keyword' },
    { label: 'database', type: 'keyword' },
    { label: 'collections', type: 'keyword' },
    { label: 'autonumber', type: 'keyword', apply: 'autonumber\n' },
    { label: 'activate', type: 'keyword', apply: 'activate ' },
    { label: 'deactivate', type: 'keyword', apply: 'deactivate ' },
    { label: 'alt', type: 'keyword', apply: 'alt condition\n\nelse\n\nend' },
    { label: 'opt', type: 'keyword', apply: 'opt condition\n\nend' },
    { label: 'loop', type: 'keyword', apply: 'loop condition\n\nend' },
    { label: 'note', type: 'keyword', apply: 'note right: ' },
    { label: 'class', type: 'keyword', apply: 'class Name {\n  +field: String\n  +method(): void\n}' },
    { label: 'interface', type: 'keyword', apply: 'interface IName {\n  +method(): void\n}' },
    { label: 'skinparam', type: 'keyword', apply: 'skinparam monochrome true\n' },
  ];

  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[@a-zA-Z0-9_-]+/);
    if (!word && !context.explicit) return null;

    return {
      from: word ? word.from : context.pos,
      options: keywords,
      validFor: /^[@a-zA-Z0-9_-]*$/,
    };
  };
}
