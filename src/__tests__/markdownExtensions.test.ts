import { describe, it, expect } from 'vitest';
import {
  generateTableOfContentsMarkdown,
  formatMarkdownTable,
  getNextListPrefix,
  toggleFormatMarker,
  extractMarkdownHeadings,
  slugifyHeader,
} from '../extensions/builtin/markdown/markdownAllInOnePlugin';
import {
  extractFrontmatter,
  parseEnhancedMarkdown,
} from '../extensions/builtin/markdown/markdownPreviewEnhancedPlugin';
import {
  lintMarkdownDocument,
  autoFixMarkdownLint,
} from '../extensions/builtin/markdown/markdownLintPlugin';
import {
  parsePlantUmlBlocks,
  detectDiagramType,
  buildPlantUmlServerUrl,
} from '../extensions/builtin/markdown/plantUmlPlugin';
import {
  parseDrawioXml,
  validateDrawioXml,
  createDrawioXmlTemplate,
} from '../extensions/builtin/markdown/drawioPlugin';

describe('Markdown & Documentation Extension Suite (Category 16)', () => {
  describe('Markdown All in One', () => {
    it('slugifies headers cleanly and handles special characters', () => {
      expect(slugifyHeader('Overview & Architecture Guide')).toBe('overview-architecture-guide');
      expect(slugifyHeader('1. Quick Start!')).toBe('1-quick-start');
    });

    it('extracts headings and generates unordered Table of Contents with slugs', () => {
      const doc = `# Product Architecture
Some intro text

## Component Overview
Overview details

### Backend Service
Details here

\`\`\`markdown
# Fake Heading In Code
\`\`\`

## Deployment
Steps`;

      const toc = generateTableOfContentsMarkdown(doc, { minDepth: 1, maxDepth: 3 });
      expect(toc).toContain('- [Product Architecture](#product-architecture)');
      expect(toc).toContain('  - [Component Overview](#component-overview)');
      expect(toc).toContain('    - [Backend Service](#backend-service)');
      expect(toc).toContain('  - [Deployment](#deployment)');
      expect(toc).not.toContain('Fake Heading In Code');
    });

    it('generates ordered Table of Contents', () => {
      const doc = `# First
## Sub A
## Sub B`;
      const toc = generateTableOfContentsMarkdown(doc, { ordered: true });
      expect(toc).toContain('1. [First](#first)');
      expect(toc).toContain('  2. [Sub A](#sub-a)');
      expect(toc).toContain('  3. [Sub B](#sub-b)');
    });

    it('formats ragged Markdown tables with column alignments', () => {
      const unformatted = `| Name | Role | Score |
| :--- | :---: | ---: |
| Alice | Engineering Lead | 98 |
| Bob | Architect | 100 |`;

      const formatted = formatMarkdownTable(unformatted);
      expect(formatted).toContain('| Name  |       Role       | Score |');
      expect(formatted).toContain('| :---- | :--------------: | ----: |');
      expect(formatted).toContain('| Alice | Engineering Lead |    98 |');
      expect(formatted).toContain('| Bob   |    Architect     |   100 |');
    });

    it('calculates list continuation prefixes correctly', () => {
      expect(getNextListPrefix('1. Item one')).toBe('2. ');
      expect(getNextListPrefix('  3. Item three')).toBe('  4. ');
      expect(getNextListPrefix('- Item')).toBe('- ');
      expect(getNextListPrefix('* [ ] Task one')).toBe('* [ ] ');
      expect(getNextListPrefix('  1. [ ] Check tests')).toBe('  2. [ ] ');
      // Terminate empty list
      expect(getNextListPrefix('1. ')).toBe('');
      expect(getNextListPrefix('- ')).toBe('');
      expect(getNextListPrefix('Not a list')).toBeNull();
    });

    it('toggles formatting markers (bold, italic, code)', () => {
      expect(toggleFormatMarker('important', '**')).toBe('**important**');
      expect(toggleFormatMarker('**important**', '**')).toBe('important');
      expect(toggleFormatMarker('token', '`')).toBe('`token`');
      expect(toggleFormatMarker('`token`', '`')).toBe('token');
    });
  });

  describe('Markdown Preview Enhanced', () => {
    it('extracts YAML frontmatter metadata and isolates body', () => {
      const doc = `---
title: System Architecture
date: 2026-11-25
author: Team
tags: [architecture, design, docs]
layout: doc
draft: false
---

# Main Content
Body here`;

      const result = extractFrontmatter(doc);
      expect(result.frontmatter).not.toBeNull();
      expect(result.frontmatter?.title).toBe('System Architecture');
      expect(result.frontmatter?.date).toBe('2026-11-25');
      expect(result.frontmatter?.author).toBe('Team');
      expect(result.frontmatter?.tags).toEqual(['architecture', 'design', 'docs']);
      expect(result.body.trim()).toBe('# Main Content\nBody here');
    });

    it('detects math, Mermaid, PlantUML, and transclusions in enhanced markdown', () => {
      const doc = `---
title: Math & Diagrams
---

Here is formula $E = mc^2$ and block math:
$$
\\int_0^1 x^2 dx
$$

\`\`\`mermaid
graph TD
  A --> B
\`\`\`

\`\`\`plantuml
@startuml
Alice -> Bob: Request
@enduml
\`\`\`

@import "components/header.md"
![[shared-glossary]]`;

      const enhanced = parseEnhancedMarkdown(doc);
      expect(enhanced.hasMath).toBe(true);
      expect(enhanced.hasMermaid).toBe(true);
      expect(enhanced.hasPlantUml).toBe(true);
      expect(enhanced.imports).toContain('components/header.md');
      expect(enhanced.imports).toContain('shared-glossary');
    });
  });

  describe('markdownlint', () => {
    it('detects common markdown structural and whitespace issues', () => {
      const doc = `### Skipped Heading  \t
#NoSpaceHeading
#  DoubleSpaceHeading
Some line with trailing space   
Code below:
\`\`\`
code line with trailing space   
\`\`\``;

      const diagnostics = lintMarkdownDocument(doc);
      const rules = diagnostics.map((d) => d.rule);

      expect(rules).toContain('MD009'); // trailing space
      expect(rules).toContain('MD010'); // hard tab
      expect(rules).toContain('MD018'); // no space after hash
      expect(rules).toContain('MD019'); // multiple spaces after hash
      expect(rules).toContain('MD041'); // first heading not h1
    });

    it('automatically fixes fixable markdownlint issues', () => {
      const broken = `##NoSpace  \t
###  TooManySpaces   
Paragraph with trailing spaces   `;

      const fixed = autoFixMarkdownLint(broken);
      expect(fixed).toContain('## NoSpace');
      expect(fixed).toContain('### TooManySpaces');
      expect(fixed.endsWith('Paragraph with trailing spaces')).toBe(true);
      expect(fixed.includes('\t')).toBe(false);
    });
  });

  describe('PlantUML', () => {
    it('extracts PlantUML blocks and detects diagram types', () => {
      const doc = `@startuml
actor User
participant Client
participant Server
User -> Client: Click
Client -> Server: API Call
@enduml

@startmindmap
* Root Idea
** Topic 1
** Topic 2
@endmindmap`;

      const blocks = parsePlantUmlBlocks(doc);
      expect(blocks).toHaveLength(2);
      expect(detectDiagramType(blocks[0].content)).toBe('sequence');
      expect(detectDiagramType(blocks[1].content)).toBe('mindmap');
    });

    it('builds hex-encoded PlantUML server URLs', () => {
      const diagram = `@startuml\nA -> B: Hello\n@enduml`;
      const url = buildPlantUmlServerUrl(diagram);
      expect(url).toContain('https://www.plantuml.com/plantuml/svg/~h');
    });
  });

  describe('Draw.io Integration', () => {
    it('parses Draw.io XML cells, vertices, and edges', () => {
      const xml = `<mxfile host="app.diagrams.net">
  <diagram id="diag_1" name="Page-1">
    <mxGraphModel>
      <root>
        <mxCell id="0"/>
        <mxCell id="1" parent="0"/>
        <mxCell id="v1" value="Web Server" vertex="1" parent="1"/>
        <mxCell id="v2" value="Database" vertex="1" parent="1"/>
        <mxCell id="e1" edge="1" source="v1" target="v2" parent="1"/>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

      const data = parseDrawioXml(xml);
      expect(data.name).toBe('Page-1');
      expect(data.cells).toHaveLength(5);

      const edge = data.cells.find((c) => c.edge);
      expect(edge?.source).toBe('v1');
      expect(edge?.target).toBe('v2');
    });

    it('creates and validates Draw.io XML templates', () => {
      const template = createDrawioXmlTemplate('Cloud Architecture');
      const validation = validateDrawioXml(template);

      expect(validation.valid).toBe(true);
      expect(validation.cellCount).toBeGreaterThanOrEqual(3);
      expect(template).toContain('Cloud Architecture');
      expect(template).toContain('<mxGraphModel');
    });
  });
});
