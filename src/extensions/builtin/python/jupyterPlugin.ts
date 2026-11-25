import { JupyterNotebook, JupyterCell } from './types';

/**
 * Parses a .ipynb Jupyter Notebook JSON document.
 */
export function parseJupyterNotebook(jsonContent: string): JupyterNotebook | null {
  if (!jsonContent || !jsonContent.trim()) return null;

  try {
    const parsed = JSON.parse(jsonContent);
    if (!Array.isArray(parsed.cells) || typeof parsed.metadata !== 'object') {
      return null;
    }

    return {
      cells: parsed.cells,
      metadata: parsed.metadata,
      nbformat: parsed.nbformat || 4,
      nbformat_minor: parsed.nbformat_minor || 2,
    };
  } catch {
    return null;
  }
}

/**
 * Serializes a JupyterNotebook model to .ipynb JSON string.
 */
export function exportJupyterNotebook(notebook: JupyterNotebook): string {
  return JSON.stringify(notebook, null, 1);
}

/**
 * Extracts and consolidates all markdown documentation from a notebook.
 */
export function extractNotebookMarkdown(notebook: JupyterNotebook): string {
  const mdBlocks: string[] = [];

  for (const cell of notebook.cells) {
    if (cell.cell_type === 'markdown') {
      const text = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source || '');
      if (text.trim()) {
        mdBlocks.push(text.trim());
      }
    }
  }

  return mdBlocks.join('\n\n');
}

/**
 * Exports notebook code cells as a standard runnable Python script with '# %%' cell boundaries.
 */
export function extractNotebookPythonScript(notebook: JupyterNotebook): string {
  const scriptParts: string[] = ['# Generated from Jupyter Notebook via Xivig'];

  for (let idx = 0; idx < notebook.cells.length; idx++) {
    const cell = notebook.cells[idx];
    if (cell.cell_type === 'code') {
      const code = Array.isArray(cell.source) ? cell.source.join('') : String(cell.source || '');
      scriptParts.push(`\n# %% [cell ${idx + 1}]\n${code.trim()}`);
    }
  }

  return scriptParts.join('\n');
}
