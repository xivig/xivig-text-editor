import { describe, it, expect } from 'vitest';
import {
  detectVirtualEnvironments,
  buildPythonExecutionCommand,
  parsePythonTestDiscovery,
  extractPythonSymbols,
  extractDocstrings,
  buildAutoImport,
  createPythonCompletionSource,
  parseJupyterNotebook,
  exportJupyterNotebook,
  extractNotebookMarkdown,
  extractNotebookPythonScript,
  formatPythonCode,
  sortPythonImports,
  lintPythonCode,
} from '../extensions/builtin/python';
import { EditorState } from '@codemirror/state';
import { CompletionContext } from '@codemirror/autocomplete';

describe('Category 11: Python Development Extensions', () => {
  describe('Python Core & Environment Discovery', () => {
    it('detects virtualenvs, conda, and pyenv environments from workspace paths', () => {
      const candidates = [
        'E:/projects/ml-app/.venv',
        'E:/projects/ml-app/venv',
        'C:/Users/User/miniconda3/envs/data-science',
        'C:/Users/User/.pyenv/versions/3.11.4',
      ];

      const envs = detectVirtualEnvironments(candidates);
      expect(envs).toHaveLength(4);

      expect(envs[0].type).toBe('venv');
      expect(envs[0].isDefault).toBe(true);

      expect(envs[2].type).toBe('conda');
      expect(envs[3].type).toBe('pyenv');
    });

    it('builds executable python command quoting paths with spaces', () => {
      const cmd = buildPythonExecutionCommand(
        'C:/Program Files/Python311/python.exe',
        'E:/my scripts/main.py',
        ['--verbose', '--port', '8000']
      );

      expect(cmd).toBe('"C:/Program Files/Python311/python.exe" "E:/my scripts/main.py" --verbose --port 8000');
    });

    it('parses pytest test discovery output into individual test nodes', () => {
      const pytestOutput = `
tests/test_api.py::test_login_success
tests/test_api.py::test_login_failure
tests/test_database.py:45: test_connection_pool
      `;

      const tests = parsePythonTestDiscovery(pytestOutput);
      expect(tests).toHaveLength(3);
      expect(tests[0]).toEqual({ file: 'tests/test_api.py', name: 'test_login_success', line: 1 });
      expect(tests[2]).toEqual({ file: 'tests/test_database.py', name: 'test_connection_pool', line: 45 });
    });
  });

  describe('Pylance Language Intelligence', () => {
    const sampleCode = `
class DataPipeline(BasePipeline):
    """
    High-throughput ETL processing pipeline for events.
    """
    def __init__(self, name: str):
        self.name = name

    def process(self, batch_size: int = 100) -> dict:
        """Process event batch."""
        return {"status": "ok"}

max_retries: int = 3
    `;

    it('extracts top-level classes, functions, return type annotations, and variables', () => {
      const symbols = extractPythonSymbols(sampleCode);
      expect(symbols.length).toBeGreaterThanOrEqual(2);

      const cls = symbols.find((s) => s.kind === 'class');
      expect(cls?.name).toBe('DataPipeline');

      const varSymbol = symbols.find((s) => s.kind === 'variable');
      expect(varSymbol?.name).toBe('max_retries');
      expect(varSymbol?.typeAnnotation).toBe('int');
    });

    it('extracts triple-quoted docstrings from classes and functions', () => {
      const classDoc = extractDocstrings(sampleCode, 'DataPipeline');
      expect(classDoc).toContain('High-throughput ETL processing pipeline for events.');
    });

    it('builds import and from-import statements', () => {
      expect(buildAutoImport('os')).toBe('import os');
      expect(buildAutoImport('typing', 'List, Dict')).toBe('from typing import List, Dict');
    });

    it('provides CodeMirror completion for Python keywords, builtins, and typing constructs', () => {
      const state = EditorState.create({ doc: 'as' });
      const context = new CompletionContext(state, 2, true);
      const source = createPythonCompletionSource();
      const res = source(context);

      expect(res).not.toBeNull();
      const labels = res!.options.map((o) => o.label);
      expect(labels).toContain('async def');
    });
  });

  describe('Jupyter Notebook (.ipynb)', () => {
    const notebookJson = JSON.stringify({
      cells: [
        {
          cell_type: 'markdown',
          source: ['# Exploratory Data Analysis\n', 'This notebook trains a classifier.'],
        },
        {
          cell_type: 'code',
          execution_count: 1,
          source: ['import numpy as np\n', 'arr = np.zeros((3, 3))'],
          outputs: [],
        },
      ],
      metadata: { kernelspec: { name: 'python3' } },
      nbformat: 4,
      nbformat_minor: 2,
    });

    it('parses valid Jupyter notebook JSON and validates cells and metadata', () => {
      const nb = parseJupyterNotebook(notebookJson);
      expect(nb).not.toBeNull();
      expect(nb?.cells).toHaveLength(2);
      expect(nb?.nbformat).toBe(4);
    });

    it('extracts markdown documentation and converts code cells to runnable Python with # %% markers', () => {
      const nb = parseJupyterNotebook(notebookJson)!;
      const md = extractNotebookMarkdown(nb);
      expect(md).toContain('# Exploratory Data Analysis');
      expect(md).toContain('This notebook trains a classifier.');

      const script = extractNotebookPythonScript(nb);
      expect(script).toContain('# %% [cell 2]');
      expect(script).toContain('import numpy as np');
      expect(script).toContain('arr = np.zeros((3, 3))');
    });

    it('exports serialized Jupyter notebook matching schema', () => {
      const nb = parseJupyterNotebook(notebookJson)!;
      const exported = exportJupyterNotebook(nb);
      expect(exported).toContain('"nbformat": 4');
      expect(exported).toContain('Exploratory Data Analysis');
    });
  });

  describe('Black Formatter PEP 8 Rules', () => {
    it('normalizes single quotes to double quotes and ensures proper operator spacing', () => {
      const unformatted = "greeting = 'hello world'\ncount=0\nflag=True";
      const formatted = formatPythonCode(unformatted);

      expect(formatted).toContain('greeting = "hello world"');
      expect(formatted).toContain('count = 0');
      expect(formatted).toContain('flag = True');
    });

    it('enforces two blank lines before top-level function definitions', () => {
      const code = 'a = 1\ndef calculate():\n    return 42';
      const formatted = formatPythonCode(code);
      expect(formatted).toBe('a = 1\n\n\ndef calculate():\n    return 42\n');
    });
  });

  describe('isort Import Sorting', () => {
    it('sorts imports into 4 PEP 8 sections: future, stdlib, third-party, and local modules', () => {
      const mixedCode = `
import requests
import os
from __future__ import annotations
import sys
from .utils import helper
import numpy as np

def run():
    pass
      `;

      const sorted = sortPythonImports(mixedCode);
      const lines = sorted.split('\n').filter(Boolean);

      // Section 1: __future__
      expect(lines[0]).toBe('from __future__ import annotations');

      // Section 2: Standard Library (os, sys)
      expect(lines.slice(1, 3)).toEqual(['import os', 'import sys']);

      // Section 3: Third Party (numpy, requests)
      expect(lines.slice(3, 5)).toEqual(['import numpy as np', 'import requests']);

      // Section 4: Local (.utils)
      expect(lines[5]).toBe('from .utils import helper');

      expect(sorted).toContain('def run():');
    });
  });

  describe('Ruff Python Linter', () => {
    it('detects bare except clauses (E722)', () => {
      const code = `
try:
    x = 1 / 0
except:
    pass
      `;
      const diags = lintPythonCode(code);
      expect(diags.some((d) => d.code === 'E722')).toBe(true);
    });

    it('detects dangerous mutable default arguments (B006)', () => {
      const code = `
def add_item(item, basket=[]):
    basket.append(item)
    return basket
      `;
      const diags = lintPythonCode(code);
      expect(diags.some((d) => d.code === 'B006')).toBe(true);
    });

    it('warns on equality comparison to None (E711)', () => {
      const code = 'if value == None:\n    print("empty")';
      const diags = lintPythonCode(code);
      expect(diags.some((d) => d.code === 'E711')).toBe(true);
    });

    it('detects unused imported modules (F401)', () => {
      const code = `
import math
import sys

print(sys.version)
      `;
      const diags = lintPythonCode(code);
      const mathDiag = diags.find((d) => d.code === 'F401');
      expect(mathDiag).toBeDefined();
      expect(mathDiag?.message).toContain("'math' imported but unused");
    });
  });
});
