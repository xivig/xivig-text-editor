import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { ReactSnippetItem, SimpleReactSnippetsSettings } from './types';

export const DEFAULT_SIMPLE_REACT_SETTINGS: SimpleReactSnippetsSettings = {
  enabled: true,
  useSemicolons: true,
};

export const SIMPLE_REACT_SNIPPETS: ReactSnippetItem[] = [
  // Quick Imports
  {
    prefix: 'imr',
    label: 'imr',
    detail: "import React from 'react'",
    template: "import React from 'react';",
    description: 'Import React module',
    category: 'import',
  },
  {
    prefix: 'imrs',
    label: 'imrs',
    detail: "import React, { useState } from 'react'",
    template: "import React, { useState } from 'react';",
    description: 'Import React with useState',
    category: 'import',
  },
  {
    prefix: 'imrse',
    label: 'imrse',
    detail: "import React, { useState, useEffect } from 'react'",
    template: "import React, { useState, useEffect } from 'react';",
    description: 'Import React with useState and useEffect',
    category: 'import',
  },
  {
    prefix: 'imrc',
    label: 'imrc',
    detail: "import React, { Component } from 'react'",
    template: "import React, { Component } from 'react';",
    description: 'Import React with Component class',
    category: 'import',
  },
  {
    prefix: 'imrd',
    label: 'imrd',
    detail: "import ReactDOM from 'react-dom'",
    template: "import ReactDOM from 'react-dom';",
    description: 'Import ReactDOM module',
    category: 'import',
  },

  // Components & Composition
  {
    prefix: 'fcc',
    label: 'fcc',
    detail: 'Functional Component with Children',
    template: `export const $1 = ({ children }) => {
  return (
    <div>
      {children}
    </div>
  );
};`,
    description: 'Creates a component receiving and rendering { children } prop',
    category: 'component',
  },

  // Hooks & Selectors
  {
    prefix: 'disp',
    label: 'disp',
    detail: 'const dispatch = useDispatch()',
    template: 'const dispatch = useDispatch();',
    description: 'Redux useDispatch hook trigger',
    category: 'redux',
  },
  {
    prefix: 'sel',
    label: 'sel',
    detail: 'const val = useSelector((state) => state.prop)',
    template: 'const $1 = useSelector((state) => state.$2);',
    description: 'Redux useSelector hook selector',
    category: 'redux',
  },

  // PropTypes
  {
    prefix: 'pts',
    label: 'pts',
    detail: 'PropTypes.string',
    template: 'PropTypes.string,',
    description: 'PropTypes string validator',
    category: 'proptypes',
  },
  {
    prefix: 'ptn',
    label: 'ptn',
    detail: 'PropTypes.number',
    template: 'PropTypes.number,',
    description: 'PropTypes number validator',
    category: 'proptypes',
  },
  {
    prefix: 'ptb',
    label: 'ptb',
    detail: 'PropTypes.bool',
    template: 'PropTypes.bool,',
    description: 'PropTypes boolean validator',
    category: 'proptypes',
  },
  {
    prefix: 'ptf',
    label: 'ptf',
    detail: 'PropTypes.func',
    template: 'PropTypes.func,',
    description: 'PropTypes function validator',
    category: 'proptypes',
  },
  {
    prefix: 'pta',
    label: 'pta',
    detail: 'PropTypes.array',
    template: 'PropTypes.array,',
    description: 'PropTypes array validator',
    category: 'proptypes',
  },
  {
    prefix: 'pto',
    label: 'pto',
    detail: 'PropTypes.object',
    template: 'PropTypes.object,',
    description: 'PropTypes object validator',
    category: 'proptypes',
  },
  {
    prefix: 'ptnode',
    label: 'ptnode',
    detail: 'PropTypes.node',
    template: 'PropTypes.node,',
    description: 'PropTypes renderable node validator',
    category: 'proptypes',
  },
];

export function searchSimpleReactSnippets(prefix = ''): ReactSnippetItem[] {
  const norm = prefix.toLowerCase();
  if (!norm) return SIMPLE_REACT_SNIPPETS;
  return SIMPLE_REACT_SNIPPETS.filter((s) => s.prefix.toLowerCase().startsWith(norm) || s.label.toLowerCase().includes(norm));
}

/**
 * CodeMirror 6 autocompletion source for Simple React snippets.
 */
export function createSimpleReactCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_-]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const matches = searchSimpleReactSnippets(word.text);
    if (matches.length === 0) return null;

    return {
      from: word.from,
      options: matches.map((s) => ({
        label: s.label,
        type: 'snippet',
        detail: s.detail,
        info: s.description,
        apply: s.template.replace(/\$[0-9]/g, ''),
        boost: 4,
      })),
    };
  };
}
