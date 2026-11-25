import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export interface BladeSnippetItem {
  prefix: string;
  label: string;
  detail: string;
  template: string;
  description: string;
}

export const BLADE_SNIPPETS: BladeSnippetItem[] = [
  {
    prefix: '@extends',
    label: '@extends',
    detail: "@extends('layout')",
    template: "@extends('$1')",
    description: 'Extends a parent layout template',
  },
  {
    prefix: '@section',
    label: '@section',
    detail: "@section('name') ... @endsection",
    template: "@section('$1')\n  $0\n@endsection",
    description: 'Defines a template section block',
  },
  {
    prefix: '@yield',
    label: '@yield',
    detail: "@yield('section')",
    template: "@yield('$1')",
    description: 'Outputs content of given section',
  },
  {
    prefix: '@include',
    label: '@include',
    detail: "@include('view.name')",
    template: "@include('$1')",
    description: 'Includes a sub-view within current template',
  },
  {
    prefix: '@component',
    label: '@component',
    detail: "@component('component') ... @endcomponent",
    template: "@component('$1')\n  $0\n@endcomponent",
    description: 'Renders a component block',
  },
  {
    prefix: '@slot',
    label: '@slot',
    detail: "@slot('name') ... @endslot",
    template: "@slot('$1')\n  $0\n@endslot",
    description: 'Slot injection into a component',
  },
  {
    prefix: '@push',
    label: '@push',
    detail: "@push('scripts') ... @endpush",
    template: "@push('$1')\n  $0\n@endpush",
    description: 'Pushes content to a named stack',
  },
  {
    prefix: '@stack',
    label: '@stack',
    detail: "@stack('scripts')",
    template: "@stack('$1')",
    description: 'Renders a named stack content',
  },
  {
    prefix: '@auth',
    label: '@auth',
    detail: '@auth ... @endauth',
    template: '@auth\n  $0\n@endauth',
    description: 'Renders content only for authenticated users',
  },
  {
    prefix: '@guest',
    label: '@guest',
    detail: '@guest ... @endguest',
    template: '@guest\n  $0\n@endguest',
    description: 'Renders content only for guest/unauthenticated visitors',
  },
  {
    prefix: '@can',
    label: '@can',
    detail: "@can('ability') ... @endcan",
    template: "@can('$1')\n  $0\n@endcan",
    description: 'Authorization gate check',
  },
  {
    prefix: '@error',
    label: '@error',
    detail: "@error('field') ... @enderror",
    template: "@error('$1')\n  <div class=\"alert alert-danger\">{{ $message }}</div>\n@enderror",
    description: 'Validation error feedback block',
  },
  {
    prefix: '@livewire',
    label: '@livewire',
    detail: "@livewire('component')",
    template: "@livewire('$1')",
    description: 'Renders a Livewire dynamic component',
  },
  {
    prefix: '@vite',
    label: '@vite',
    detail: "@vite(['resources/css/app.css', 'resources/js/app.js'])",
    template: "@vite(['resources/css/app.css', 'resources/js/app.js'])",
    description: 'Injects Vite asset bundler tags into head',
  },
  {
    prefix: '@csrf',
    label: '@csrf',
    detail: '@csrf',
    template: '@csrf',
    description: 'Generates hidden CSRF input token for forms',
  },
  {
    prefix: '@method',
    label: '@method',
    detail: "@method('PUT')",
    template: "@method('$1')",
    description: 'Generates hidden HTTP method spoofing input',
  },
];

export function searchBladeSnippets(prefix = ''): BladeSnippetItem[] {
  const norm = prefix.toLowerCase();
  if (!norm) return BLADE_SNIPPETS;
  return BLADE_SNIPPETS.filter((s) => s.prefix.toLowerCase().startsWith(norm) || s.label.toLowerCase().includes(norm));
}

/**
 * CodeMirror 6 autocompletion source for Blade directives.
 */
export function createBladeDirectivesCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/@[a-zA-Z0-9_-]*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    const matches = searchBladeSnippets(word.text);
    if (matches.length === 0) return null;

    return {
      from: word.from,
      options: matches.map((s) => ({
        label: s.label,
        type: 'keyword',
        detail: s.detail,
        info: s.description,
        apply: s.template.replace(/\$[0-9]/g, ''),
        boost: 5,
      })),
    };
  };
}
