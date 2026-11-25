import type { DrawioCell, DrawioDiagramData } from './types';

/**
 * Parses Draw.io XML or .drawio / .dio file content.
 */
export function parseDrawioXml(xmlContent: string): DrawioDiagramData {
  const cells: DrawioCell[] = [];

  // Extract diagram name
  const diagramMatch = xmlContent.match(/<diagram[^>]*name=["']([^"']+)["']/i);
  const name = diagramMatch ? diagramMatch[1] : undefined;

  const idMatch = xmlContent.match(/<diagram[^>]*id=["']([^"']+)["']/i);
  const id = idMatch ? idMatch[1] : undefined;

  // Extract <mxCell ... /> tags
  const cellRegex = /<mxCell\s+([^>]*?)(?:\/?>|>([\s\S]*?)<\/mxCell>)/gi;
  let match: RegExpExecArray | null;

  while ((match = cellRegex.exec(xmlContent)) !== null) {
    const attrs = match[1];
    const cellId = attrs.match(/id=["']([^"']+)["']/i)?.[1] || '';
    const value = attrs.match(/value=["']([^"']*)["']/i)?.[1] || '';
    const parent = attrs.match(/parent=["']([^"']+)["']/i)?.[1];
    const vertex = /vertex=["']1["']/i.test(attrs);
    const edge = /edge=["']1["']/i.test(attrs);
    const source = attrs.match(/source=["']([^"']+)["']/i)?.[1];
    const target = attrs.match(/target=["']([^"']+)["']/i)?.[1];
    const style = attrs.match(/style=["']([^"']+)["']/i)?.[1];

    if (cellId) {
      cells.push({
        id: cellId,
        value,
        parent,
        vertex: vertex || undefined,
        edge: edge || undefined,
        source,
        target,
        style,
      });
    }
  }

  return {
    id,
    name,
    cells,
  };
}

/**
 * Validates whether string is a valid Draw.io XML document.
 */
export function validateDrawioXml(xmlContent: string): {
  valid: boolean;
  error?: string;
  cellCount: number;
} {
  if (!xmlContent || !xmlContent.trim()) {
    return { valid: false, error: 'Empty file', cellCount: 0 };
  }

  if (!xmlContent.includes('<mxfile') && !xmlContent.includes('<mxGraphModel')) {
    return { valid: false, error: 'Missing mxfile or mxGraphModel root element', cellCount: 0 };
  }

  const parsed = parseDrawioXml(xmlContent);
  return {
    valid: true,
    cellCount: parsed.cells.length,
  };
}

/**
 * Creates a minimal starter .drawio XML template.
 */
export function createDrawioXmlTemplate(diagramName = 'Architecture'): string {
  const timestamp = new Date().toISOString();
  return `<mxfile host="Xivig" modified="${timestamp}" agent="Xivig Editor" version="1.0">
  <diagram id="dia1" name="${diagramName}">
    <mxGraphModel dx="1000" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
        <mxCell id="node1" value="${diagramName} Root" style="rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;" vertex="1" parent="1">
          <mxGeometry x="120" y="120" width="160" height="60" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;
}
