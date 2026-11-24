import { snippetCompletion, Completion } from '@codemirror/autocomplete';

export const bladeSnippets: Completion[] = [
  // --- LAYOUT DIRECTIVES ---
  snippetCompletion("@extends('\${1:layouts.app}')", {
    label: '@extends',
    detail: 'Blade: Extend Layout Template',
    info: 'Specify which layout template this view should inherit.',
    type: 'snippet',
  }),
  snippetCompletion("@section('\${1:content}')\n\t\${2}\n@endsection", {
    label: '@section',
    detail: 'Blade: Section Block',
    info: 'Define a named content section to inject into a parent layout.',
    type: 'snippet',
  }),
  snippetCompletion("@section('\${1:title}', '\${2:Page Title}')", {
    label: '@section-inline',
    detail: 'Blade: Inline Short Section',
    info: 'Define a single-line section passing a literal value (e.g. page title).',
    type: 'snippet',
  }),
  snippetCompletion("@yield('\${1:content}')", {
    label: '@yield',
    detail: 'Blade: Yield Section Placeholder',
    info: 'Display the contents of a given section defined in child views.',
    type: 'snippet',
  }),
  snippetCompletion("@include('\${1:partials.header}', [\${2}])", {
    label: '@include',
    detail: 'Blade: Include Partial View',
    info: 'Include a Blade partial view and optionally pass variables.',
    type: 'snippet',
  }),

  // --- CONTROL STRUCTURES ---
  snippetCompletion('@if (\${1:condition})\n\t\${2}\n@endif', {
    label: '@if',
    detail: 'Blade: If Conditional Statement',
    type: 'snippet',
  }),
  snippetCompletion('@if (\${1:condition})\n\t\${2}\n@else\n\t\${3}\n@endif', {
    label: '@ifelse',
    detail: 'Blade: If / Else Statement',
    type: 'snippet',
  }),
  snippetCompletion('@elseif (\${1:condition})\n\t\${2}', {
    label: '@elseif',
    detail: 'Blade: Elseif Condition',
    type: 'snippet',
  }),
  snippetCompletion('@unless (\${1:condition})\n\t\${2}\n@endunless', {
    label: '@unless',
    detail: 'Blade: Unless (Inverse If) Statement',
    type: 'snippet',
  }),
  snippetCompletion('@isset(\${\${1:records}})\n\t\${2}\n@endisset', {
    label: '@isset',
    detail: 'Blade: Check Variable Isset',
    type: 'snippet',
  }),
  snippetCompletion('@empty(\${\${1:records}})\n\t\${2}\n@endempty', {
    label: '@empty',
    detail: 'Blade: Check Empty Variable',
    type: 'snippet',
  }),

  // --- AUTHENTICATION DIRECTIVES ---
  snippetCompletion('@auth\n\t\${1}\n@endauth', {
    label: '@auth',
    detail: 'Blade: Authenticated User Block',
    info: 'Conditionally render content for authenticated users.',
    type: 'snippet',
  }),
  snippetCompletion('@guest\n\t\${1}\n@endguest', {
    label: '@guest',
    detail: 'Blade: Guest / Unauthenticated User Block',
    info: 'Conditionally render content for unauthenticated guests.',
    type: 'snippet',
  }),

  // --- LOOPS ---
  snippetCompletion('@foreach (\${\${1:items}} as \${\${2:item}})\n\t\${3}\n@endforeach', {
    label: '@foreach',
    detail: 'Blade: Foreach Loop',
    type: 'snippet',
  }),
  snippetCompletion(
    '@forelse (\${\${1:items}} as \${\${2:item}})\n\t\${3}\n@empty\n\t\${4:No items found.}\n@endforelse',
    {
      label: '@forelse',
      detail: 'Blade: Forelse Loop with Empty Fallback',
      info: 'Loop through iterable or show empty message when array is empty.',
      type: 'snippet',
    }
  ),
  snippetCompletion('@for (\${\${1:i}} = 0; \${\${1:i}} < \${2:10}; \${\${1:i}}++)\n\t\${3}\n@endfor', {
    label: '@for',
    detail: 'Blade: For Loop',
    type: 'snippet',
  }),
  snippetCompletion('@while (\${1:condition})\n\t\${2}\n@endwhile', {
    label: '@while',
    detail: 'Blade: While Loop',
    type: 'snippet',
  }),

  // --- FORMS & SECURITY ---
  snippetCompletion('@csrf', {
    label: '@csrf',
    detail: 'Blade: Hidden CSRF Token Field',
    info: 'Generate a hidden CSRF token input field for form validation.',
    type: 'snippet',
  }),
  snippetCompletion("@method('\${1:PUT}')", {
    label: '@method',
    detail: 'Blade: HTTP Method Spoofing',
    info: 'Generate a hidden _method input field (PUT, PATCH, DELETE).',
    type: 'snippet',
  }),
  snippetCompletion(
    `@error('\${1:field}')
  <div class="invalid-feedback d-block">{{ $message }}</div>
@enderror`,
    {
      label: '@error',
      detail: 'Blade: Form Validation Error Block',
      info: 'Render markup and display validation error message for a given field.',
      type: 'snippet',
    }
  ),

  // --- ASSETS & LIVEWIRE ---
  snippetCompletion("@vite(['\${1:resources/css/app.css}', '\${2:resources/js/app.js}'])", {
    label: '@vite',
    detail: 'Blade: Vite Asset Bundler Tag',
    info: 'Inject compiled CSS and JavaScript assets via Laravel Vite plugin.',
    type: 'snippet',
  }),
  snippetCompletion("@livewire('\${1:component-name}', [\${2}])", {
    label: '@livewire',
    detail: 'Blade: Livewire Component Directive',
    info: 'Render a dynamic Livewire component into the view.',
    type: 'snippet',
  }),
  snippetCompletion("@push('\${1:scripts}')\n\t\${2}\n@endpush", {
    label: '@push',
    detail: 'Blade: Push Content to Stack',
    type: 'snippet',
  }),
  snippetCompletion("@stack('\${1:scripts}')", {
    label: '@stack',
    detail: 'Blade: Render Named Stack',
    type: 'snippet',
  }),
  snippetCompletion("@props([\n\t'\${1:variant}' => '\${2:primary}',\n])", {
    label: '@props',
    detail: 'Blade: Component Props Declaration',
    info: 'Define default properties and attributes for Blade components.',
    type: 'snippet',
  }),

  // --- DEBUGGING ---
  snippetCompletion('@dd(\${\${1:variable}})', {
    label: '@dd',
    detail: 'Blade: Dump and Die Debugging',
    info: 'Dump variables and terminate execution directly in Blade.',
    type: 'snippet',
  }),
  snippetCompletion('@dump(\${\${1:variable}})', {
    label: '@dump',
    detail: 'Blade: Dump Variable',
    type: 'snippet',
  }),
];
