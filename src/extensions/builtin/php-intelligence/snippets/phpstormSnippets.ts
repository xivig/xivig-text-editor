import { snippetCompletion, Completion } from '@codemirror/autocomplete';

export const phpstormSnippets: Completion[] = [
  // --- METHODS & FUNCTIONS ---
  snippetCompletion(
    `public function \${1:name}(\${2}): \${3:void}
{
\t\${4}
}`,
    {
      label: 'pubf',
      detail: 'PhpStorm: public function',
      info: 'Public method declaration with return type hint.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `protected function \${1:name}(\${2}): \${3:void}
{
\t\${4}
}`,
    {
      label: 'prof',
      detail: 'PhpStorm: protected function',
      info: 'Protected method declaration with return type hint.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `private function \${1:name}(\${2}): \${3:void}
{
\t\${4}
}`,
    {
      label: 'prif',
      detail: 'PhpStorm: private function',
      info: 'Private method declaration with return type hint.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `public static function \${1:name}(\${2}): \${3:void}
{
\t\${4}
}`,
    {
      label: 'pubsf',
      detail: 'PhpStorm: public static function',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `protected static function \${1:name}(\${2}): \${3:void}
{
\t\${4}
}`,
    {
      label: 'prosf',
      detail: 'PhpStorm: protected static function',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `private static function \${1:name}(\${2}): \${3:void}
{
\t\${4}
}`,
    {
      label: 'prisf',
      detail: 'PhpStorm: private static function',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `public function __construct(
\t\${1}
) {
\t\${2}
}`,
    {
      label: 'con',
      detail: 'PhpStorm: constructor declaration',
      info: 'Class __construct() declaration with constructor property promotion.',
      type: 'snippet',
    }
  ),

  // --- CLASSES, INTERFACES, TRAITS, ENUMS ---
  snippetCompletion(
    `class \${1:ClassName}
{
\t\${2}
}`,
    {
      label: 'cl',
      detail: 'PhpStorm: class definition',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `interface \${1:InterfaceName}
{
\t\${2}
}`,
    {
      label: 'intf',
      detail: 'PhpStorm: interface definition',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `trait \${1:TraitName}
{
\t\${2}
}`,
    {
      label: 'trait',
      detail: 'PhpStorm: trait definition',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `enum \${1:EnumName}: \${2:string}
{
\tcase \${3:CASE} = '\${4:value}';
}`,
    {
      label: 'enum',
      detail: 'PhpStorm: backed enum definition (PHP 8.1+)',
      type: 'snippet',
    }
  ),

  // --- LOOPS & CONTROL FLOW ---
  snippetCompletion(
    `foreach (\${\${1:iterable}} as \${\${2:item}}) {
\t\${3}
}`,
    {
      label: 'fore',
      detail: 'PhpStorm: foreach ($iterable as $item)',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `foreach (\${\${1:iterable}} as \${\${2:key}} => \${\${3:value}}) {
\t\${4}
}`,
    {
      label: 'forek',
      detail: 'PhpStorm: foreach ($iterable as $key => $value)',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `match (\${\${1:expression}}) {
\t\${2:value} => \${3:result},
\tdefault => \${4:default},
};`,
    {
      label: 'match',
      detail: 'PhpStorm: match expression (PHP 8.0+)',
      type: 'snippet',
    }
  ),
  snippetCompletion('echo \${1};', {
    label: 'eco',
    detail: 'PhpStorm: echo variable',
    type: 'snippet',
  }),
  snippetCompletion("echo '\${1}';", {
    label: 'ech',
    detail: 'PhpStorm: echo string literal',
    type: 'snippet',
  }),

  // --- EXCEPTIONS & TRY/CATCH ---
  snippetCompletion(
    `try {
\t\${1}
} catch (\${2:\\Throwable} \$\${3:e}) {
\t\${4}
}`,
    {
      label: 'try',
      detail: 'PhpStorm: try / catch block',
      type: 'snippet',
    }
  ),
  snippetCompletion("throw new \${1:Exception}('\${2:message}');", {
    label: 'thr',
    detail: 'PhpStorm: throw new Exception',
    type: 'snippet',
  }),

  // --- GETTERS & SETTERS ---
  snippetCompletion(
    `public function get\${1:Property}(): \${2:string}
{
\treturn $this->\${3:property};
}`,
    {
      label: 'getter',
      detail: 'PhpStorm: getter method',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `public function set\${1:Property}(\${2:string} $\${3:property}): self
{
\t$this->\${3:property} = $\${3:property};
\treturn $this;
}`,
    {
      label: 'setter',
      detail: 'PhpStorm: fluent setter method',
      type: 'snippet',
    }
  ),

  // --- CLOSURES & ARROW FUNCTIONS ---
  snippetCompletion('fn(\${1}) => \${2};', {
    label: 'fn',
    detail: 'PhpStorm: arrow function fn() => ...',
    type: 'snippet',
  }),
  snippetCompletion(
    `function (\${1}) use (\${\${2:var}}) {
\t\${3}
}`,
    {
      label: 'closure',
      detail: 'PhpStorm: anonymous function with use()',
      type: 'snippet',
    }
  ),

  // --- DECLARATIONS & PHPDOC ---
  snippetCompletion('declare(strict_types=1);', {
    label: 'strict',
    detail: 'PhpStorm: declare(strict_types=1);',
    type: 'snippet',
  }),
  snippetCompletion(
    `/**
 * \${1:Summary description}
 *
 * @param \${2:string} $\${3:name}
 * @return \${4:void}
 */`,
    {
      label: 'docf',
      detail: 'PhpStorm: PHPDoc function docblock',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `/**
 * Class \${1:ClassName}
 *
 * @package \${2:App}
 */`,
    {
      label: 'docc',
      detail: 'PhpStorm: PHPDoc class docblock',
      type: 'snippet',
    }
  ),
];
