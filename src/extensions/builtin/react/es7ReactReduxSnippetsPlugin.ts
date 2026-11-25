import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { ReactSnippetItem, Es7ReactReduxSettings } from './types';

export const DEFAULT_ES7_REACT_REDUX_SETTINGS: Es7ReactReduxSettings = {
  enabled: true,
  typescriptComponents: true,
  arrowFunctionComponents: true,
  semi: true,
};

export const ES7_REACT_REDUX_SNIPPETS: ReactSnippetItem[] = [
  // Components
  {
    prefix: 'rafce',
    label: 'rafce',
    detail: 'React Arrow Function Component with Export',
    template: `import React from 'react';

export const $1 = () => {
  return (
    <div>
      $1
    </div>
  );
};

export default $1;`,
    description: 'Creates a React Arrow Function Component with both named and default export',
    category: 'component',
  },
  {
    prefix: 'rfc',
    label: 'rfc',
    detail: 'React Function Component',
    template: `import React from 'react';

export default function $1() {
  return (
    <div>
      $1
    </div>
  );
}`,
    description: 'Creates a React Function Component with default export',
    category: 'component',
  },
  {
    prefix: 'rfce',
    label: 'rfce',
    detail: 'React Function Component with Separate Export',
    template: `import React from 'react';

function $1() {
  return (
    <div>
      $1
    </div>
  );
}

export default $1;`,
    description: 'Creates a React Function Component with export default at bottom',
    category: 'component',
  },
  {
    prefix: 'rce',
    label: 'rce',
    detail: 'React Class Component with Export',
    template: `import React, { Component } from 'react';

export default class $1 extends Component {
  render() {
    return (
      <div>
        $1
      </div>
    );
  }
}`,
    description: 'Creates a React Class Component with render method and default export',
    category: 'component',
  },

  // Hooks
  {
    prefix: 'useS',
    label: 'useS',
    detail: 'useState Hook',
    template: 'const [$1, set$2] = useState($3);',
    description: 'Declares state variable and setter with React.useState',
    category: 'hook',
  },
  {
    prefix: 'useE',
    label: 'useE',
    detail: 'useEffect Hook',
    template: `useEffect(() => {
  $1
}, [$2]);`,
    description: 'Performs side effects with React.useEffect dependency array',
    category: 'hook',
  },
  {
    prefix: 'useC',
    label: 'useC',
    detail: 'useCallback Hook',
    template: `const $1 = useCallback(($2) => {
  $3
}, [$4]);`,
    description: 'Memoizes callback function reference with React.useCallback',
    category: 'hook',
  },
  {
    prefix: 'useM',
    label: 'useM',
    detail: 'useMemo Hook',
    template: `const $1 = useMemo(() => $2, [$3]);`,
    description: 'Memoizes expensive computed value with React.useMemo',
    category: 'hook',
  },
  {
    prefix: 'useR',
    label: 'useR',
    detail: 'useRef Hook',
    template: 'const $1 = useRef($2);',
    description: 'Creates a mutable ref object with React.useRef',
    category: 'hook',
  },
  {
    prefix: 'useCont',
    label: 'useCont',
    detail: 'useContext Hook',
    template: 'const $1 = useContext($2);',
    description: 'Consumes React Context with React.useContext',
    category: 'hook',
  },
  {
    prefix: 'useRed',
    label: 'useRed',
    detail: 'useReducer Hook',
    template: 'const [state, dispatch] = useReducer($1, $2);',
    description: 'Manages complex state with React.useReducer',
    category: 'hook',
  },

  // Redux & Redux Toolkit
  {
    prefix: 'rxaction',
    label: 'rxaction',
    detail: 'Redux Action Creator',
    template: `export const $1 = (payload) => ({
  type: '$2',
  payload,
});`,
    description: 'Creates a Redux action creator function',
    category: 'redux',
  },
  {
    prefix: 'rxslice',
    label: 'rxslice',
    detail: 'Redux Toolkit createSlice',
    template: `import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  $1
};

export const $2Slice = createSlice({
  name: '$2',
  initialState,
  reducers: {
    $3: (state, action) => {
      $4
    },
  },
});

export const { $3 } = $2Slice.actions;
export default $2Slice.reducer;`,
    description: 'Creates a Redux Toolkit slice with reducers and actions',
    category: 'redux',
  },
];

export function searchEs7Snippets(prefix = ''): ReactSnippetItem[] {
  const norm = prefix.toLowerCase();
  if (!norm) return ES7_REACT_REDUX_SNIPPETS;
  return ES7_REACT_REDUX_SNIPPETS.filter((s) => s.prefix.toLowerCase().startsWith(norm) || s.label.toLowerCase().includes(norm));
}

/**
 * CodeMirror 6 autocompletion source for ES7+ React/Redux snippets.
 */
export function createEs7ReactReduxCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/[a-zA-Z0-9_-]+/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const matches = searchEs7Snippets(word.text);
    if (matches.length === 0) return null;

    return {
      from: word.from,
      options: matches.map((s) => ({
        label: s.label,
        type: 'snippet',
        detail: s.detail,
        info: s.description,
        apply: s.template.replace(/\$[0-9]/g, ''),
        boost: 5,
      })),
    };
  };
}
