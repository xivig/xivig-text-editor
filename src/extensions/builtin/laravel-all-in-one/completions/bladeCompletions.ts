import { snippetCompletion, Completion } from '@codemirror/autocomplete';
import { bladeSnippets } from '../snippets/bladeSnippets';

export const ADDITIONAL_BLADE_COMPLETIONS: Completion[] = [
  snippetCompletion('@php\n\t\${1}\n@endphp', {
    label: '@php',
    detail: 'Blade: Raw PHP Execution Block',
    info: 'Execute arbitrary raw PHP code within a Blade template.',
    type: 'snippet',
  }),
  snippetCompletion("@can('\${1:ability}', \${2:$model})\n\t\${3}\n@endcan", {
    label: '@can',
    detail: 'Blade: Authorization Can Check',
    info: 'Conditionally render markup if user is authorized for the given ability.',
    type: 'snippet',
  }),
  snippetCompletion("@cannot('\${1:ability}', \${2:$model})\n\t\${3}\n@endcannot", {
    label: '@cannot',
    detail: 'Blade: Authorization Cannot Check',
    info: 'Conditionally render markup if user is NOT authorized for the given ability.',
    type: 'snippet',
  }),
  snippetCompletion("@canany([\${1:'edit', 'delete'}], \${2:$model})\n\t\${3}\n@endcanany", {
    label: '@canany',
    detail: 'Blade: Authorization Canany Check',
    info: 'Conditionally render if user has any of the listed abilities.',
    type: 'snippet',
  }),
  snippetCompletion("@class([\n\t'\${1:p-4}' => true,\n\t'\${2:font-bold}' => \${3:$isActive},\n\t'\${4:bg-red}' => \${5:$hasError},\n])", {
    label: '@class',
    detail: 'Blade: Conditional CSS Class Compilation',
    info: 'Conditionally compile CSS class strings based on array of conditions.',
    type: 'snippet',
  }),
  snippetCompletion("@style([\n\t'\${1:background-color: red}' => \${2:$hasError},\n\t'\${3:font-weight: bold}' => \${4:$isBold},\n])", {
    label: '@style',
    detail: 'Blade: Conditional Inline CSS Styles',
    info: 'Conditionally compile inline CSS styles based on array of conditions.',
    type: 'snippet',
  }),
  snippetCompletion('@checked(\${1:$isActive})', {
    label: '@checked',
    detail: 'Blade: Conditional Checked HTML Attribute',
    info: 'Indicate whether a given checkbox or radio input is checked.',
    type: 'snippet',
  }),
  snippetCompletion('@selected(\${1:$isSelected})', {
    label: '@selected',
    detail: 'Blade: Conditional Selected HTML Attribute',
    info: 'Indicate whether a given select option is selected.',
    type: 'snippet',
  }),
  snippetCompletion('@disabled(\${1:$isDisabled})', {
    label: '@disabled',
    detail: 'Blade: Conditional Disabled HTML Attribute',
    info: 'Indicate whether an HTML element should be disabled.',
    type: 'snippet',
  }),
  snippetCompletion('@readonly(\${1:$isReadOnly})', {
    label: '@readonly',
    detail: 'Blade: Conditional Readonly HTML Attribute',
    info: 'Indicate whether an HTML input should be read-only.',
    type: 'snippet',
  }),
  snippetCompletion('@required(\${1:$isRequired})', {
    label: '@required',
    detail: 'Blade: Conditional Required HTML Attribute',
    info: 'Indicate whether an HTML input is required.',
    type: 'snippet',
  }),
  snippetCompletion("@includeIf('\${1:partials.header}', [\${2}])", {
    label: '@includeIf',
    detail: 'Blade: Include View If Exists',
    info: 'Include a partial view only if the template file exists.',
    type: 'snippet',
  }),
  snippetCompletion("@includeWhen(\${1:$boolean}, '\${2:view.name}', [\${3}])", {
    label: '@includeWhen',
    detail: 'Blade: Include View When Condition is True',
    info: 'Include a partial view when the boolean condition evaluates to true.',
    type: 'snippet',
  }),
  snippetCompletion("@includeUnless(\${1:$boolean}, '\${2:view.name}', [\${3}])", {
    label: '@includeUnless',
    detail: 'Blade: Include View Unless Condition is True',
    info: 'Include a partial view unless the boolean condition evaluates to true.',
    type: 'snippet',
  }),
  snippetCompletion('@once\n\t\${1}\n@endonce', {
    label: '@once',
    detail: 'Blade: Render Content Only Once per Request',
    info: 'Ensure pushed script or style is only rendered once even in loops or components.',
    type: 'snippet',
  }),
  snippetCompletion('@verbatim\n\t\${1}\n@endverbatim', {
    label: '@verbatim',
    detail: 'Blade: Verbatim Raw Template Block',
    info: 'Display JavaScript framework templates (Vue, React) without Blade evaluation.',
    type: 'snippet',
  }),
  snippetCompletion("@env('\${1:local}')\n\t\${2}\n@endenv", {
    label: '@env',
    detail: 'Blade: Check Application Environment',
    info: 'Render content only if running in a specific environment (local, staging, etc.).',
    type: 'snippet',
  }),
  snippetCompletion('@production\n\t\${1}\n@endproduction', {
    label: '@production',
    detail: 'Blade: Production Environment Only',
    info: 'Render content only when running in production environment.',
    type: 'snippet',
  }),
  snippetCompletion("@prepend('\${1:scripts}')\n\t\${2}\n@endprepend", {
    label: '@prepend',
    detail: 'Blade: Prepend Content to Stack',
    info: 'Prepend content to the beginning of a named stack.',
    type: 'snippet',
  }),
  snippetCompletion("@session('\${1:status}')\n\t<div class=\"alert alert-success\">{{ $value }}</div>\n@endsession", {
    label: '@session',
    detail: 'Blade: Session Flash Message Block',
    info: 'Check if a session key exists and render content with variable $value.',
    type: 'snippet',
  }),
  snippetCompletion('{{-- \${1:comment} --}}', {
    label: '{{--',
    detail: 'Blade: Hidden Template Comment',
    info: 'Add a Blade comment that will not be rendered into the client HTML output.',
    type: 'snippet',
  }),
];

export const ALL_BLADE_DIRECTIVES: Completion[] = [
  ...bladeSnippets,
  ...ADDITIONAL_BLADE_COMPLETIONS,
];
