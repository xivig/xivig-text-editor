export interface MarkdownTocOptions {
  minDepth?: number;
  maxDepth?: number;
  ordered?: boolean;
  slugPrefix?: string;
}

export interface MarkdownTocItem {
  level: number;
  text: string;
  slug: string;
}

export interface MarkdownLintDiagnostic {
  rule: string;
  message: string;
  line: number;
  column?: number;
  severity: 'warning' | 'error' | 'info';
  fixable: boolean;
}

export interface FrontmatterMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  date?: string;
  author?: string;
  layout?: string;
  custom: Record<string, unknown>;
}

export interface EnhancedMarkdownDocument {
  frontmatter: FrontmatterMetadata | null;
  rawBody: string;
  hasMath: boolean;
  hasMermaid: boolean;
  hasPlantUml: boolean;
  imports: string[];
}

export interface PlantUmlBlock {
  type: string;
  content: string;
  startLine: number;
  endLine: number;
}

export interface DrawioCell {
  id: string;
  value: string;
  parent?: string;
  vertex?: boolean;
  edge?: boolean;
  source?: string;
  target?: string;
  style?: string;
}

export interface DrawioDiagramData {
  id?: string;
  name?: string;
  cells: DrawioCell[];
}
