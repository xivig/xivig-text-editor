import { snippetCompletion, Completion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';

export const jsSnippets: Completion[] = [
  snippetCompletion('console.log(${1:object});', {
    label: 'clg',
    detail: 'console.log(...)',
    type: 'snippet',
  }),
  snippetCompletion('console.error(${1:error});', {
    label: 'cerr',
    detail: 'console.error(...)',
    type: 'snippet',
  }),
  snippetCompletion('function ${1:name}(${2:params}) {\n\t${3}\n}', {
    label: 'fn',
    detail: 'Function statement',
    type: 'snippet',
  }),
  snippetCompletion('const ${1:name} = (${2:params}) => {\n\t${3}\n};', {
    label: 'afn',
    detail: 'Arrow function expression',
    type: 'snippet',
  }),
  snippetCompletion('if (${1:condition}) {\n\t${2}\n} else {\n\t${3}\n}', {
    label: 'ife',
    detail: 'If-Else statement',
    type: 'snippet',
  }),
  snippetCompletion('for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {\n\t${3}\n}', {
    label: 'for',
    detail: 'For-loop',
    type: 'snippet',
  }),
  snippetCompletion('for (const ${1:item} of ${2:iterable}) {\n\t${3}\n}', {
    label: 'forof',
    detail: 'For-of loop',
    type: 'snippet',
  }),
  snippetCompletion('try {\n\t${1}\n} catch (${2:error}) {\n\tconsole.error(${2:error});\n}', {
    label: 'try',
    detail: 'Try-catch block',
    type: 'snippet',
  }),
  snippetCompletion('new Promise((${1:resolve}, ${2:reject}) => {\n\t${3}\n});', {
    label: 'prom',
    detail: 'New Promise constructor',
    type: 'snippet',
  }),
  snippetCompletion("import { ${1:items} } from '${2:module}';", {
    label: 'imp',
    detail: 'ESM Named Import',
    type: 'snippet',
  }),
  snippetCompletion("import ${1:defaultExport} from '${2:module}';", {
    label: 'impd',
    detail: 'ESM Default Import',
    type: 'snippet',
  }),
  snippetCompletion('export const ${1:name} = ${2:value};', {
    label: 'exp',
    detail: 'Named export',
    type: 'snippet',
  }),
  snippetCompletion('setTimeout(() => {\n\t${2}\n}, ${1:1000});', {
    label: 'timeout',
    detail: 'setTimeout callback',
    type: 'snippet',
  }),
  snippetCompletion('setInterval(() => {\n\t${2}\n}, ${1:1000});', {
    label: 'interval',
    detail: 'setInterval callback',
    type: 'snippet',
  }),
];

export const htmlSnippets: Completion[] = [
  snippetCompletion(
    '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t${2}\n</body>\n</html>',
    {
      label: 'html5',
      detail: 'HTML5 Boilerplate Template',
      type: 'snippet',
    }
  ),
  snippetCompletion('<div className="${1:className}">\n\t${2}\n</div>', {
    label: 'div',
    detail: 'div element',
    type: 'snippet',
  }),
  snippetCompletion('<button onClick={${1:handleClick}} className="${2:btn}">\n\t${3:Click Me}\n</button>', {
    label: 'btn',
    detail: 'button element',
    type: 'snippet',
  }),
  snippetCompletion('<a href="${1:url}" target="_blank" rel="noopener noreferrer">${2:Link}</a>', {
    label: 'a',
    detail: 'anchor link',
    type: 'snippet',
  }),
  snippetCompletion('<input type="${1:text}" placeholder="${2:placeholder}" value={${3:value}} onChange={${4:onChange}} />', {
    label: 'input',
    detail: 'input element',
    type: 'snippet',
  }),
];

export const cssSnippets: Completion[] = [
  snippetCompletion('display: flex;\nalign-items: center;\njustify-content: center;', {
    label: 'flexc',
    detail: 'Flex centered',
    type: 'snippet',
  }),
  snippetCompletion('display: grid;\ngrid-template-columns: repeat(${1:3}, 1fr);\ngap: ${2:16px};', {
    label: 'grid',
    detail: 'Grid 3 columns',
    type: 'snippet',
  }),
  snippetCompletion('box-shadow: 0 ${1:4px} ${2:12px} rgba(0, 0, 0, ${3:0.15});', {
    label: 'shadow',
    detail: 'Box shadow',
    type: 'snippet',
  }),
  snippetCompletion('@keyframes ${1:name} {\n\t0% {\n\t\t${2}\n\t}\n\t100% {\n\t\t${3}\n\t}\n}', {
    label: 'keyframes',
    detail: 'CSS @keyframes',
    type: 'snippet',
  }),
];

export const pythonSnippets: Completion[] = [
  snippetCompletion('def ${1:func_name}(${2:params}):\n\t"""${3:Docstring}"""\n\t${4:pass}', {
    label: 'def',
    detail: 'Function definition',
    type: 'snippet',
  }),
  snippetCompletion('class ${1:ClassName}:\n\tdef __init__(self, ${2:params}):\n\t\tself.${3:param} = ${3:param}\n', {
    label: 'class',
    detail: 'Class definition',
    type: 'snippet',
  }),
  snippetCompletion("if __name__ == '__main__':\n\t${1:main()}", {
    label: 'main',
    detail: "if __name__ == '__main__'",
    type: 'snippet',
  }),
  snippetCompletion('try:\n\t${1:pass}\nexcept ${2:Exception} as ${3:e}:\n\t${4:raise e}', {
    label: 'try',
    detail: 'Try-except block',
    type: 'snippet',
  }),
];

export const rustSnippets: Completion[] = [
  snippetCompletion('fn ${1:name}(${2:params}) -> ${3:()} {\n\t${4:todo!()}\n}', {
    label: 'fn',
    detail: 'Rust function',
    type: 'snippet',
  }),
  snippetCompletion('#[derive(Debug, Clone)]\npub struct ${1:Name} {\n\t${2:field}: ${3:String},\n}', {
    label: 'struct',
    detail: 'Rust struct with derives',
    type: 'snippet',
  }),
  snippetCompletion('impl ${1:Name} {\n\tpub fn new(${2:params}) -> Self {\n\t\tSelf {\n\t\t\t${3}\n\t\t}\n\t}\n}', {
    label: 'impl',
    detail: 'Rust impl block',
    type: 'snippet',
  }),
  snippetCompletion('match ${1:expression} {\n\t${2:pattern} => ${3:result},\n\t_ => ${4:default},\n}', {
    label: 'match',
    detail: 'Match expression',
    type: 'snippet',
  }),
];

export const markdownSnippets: Completion[] = [
  snippetCompletion('| ${1:Header 1} | ${2:Header 2} |\n| --- | --- |\n| ${3:Value 1} | ${4:Value 2} |', {
    label: 'table',
    detail: 'Markdown table',
    type: 'snippet',
  }),
  snippetCompletion('[${1:title}](${2:url})', {
    label: 'link',
    detail: 'Markdown link',
    type: 'snippet',
  }),
  snippetCompletion('![${1:alt text}](${2:url})', {
    label: 'img',
    detail: 'Markdown image',
    type: 'snippet',
  }),
  snippetCompletion('```${1:language}\n${2:code}\n```', {
    label: 'code',
    detail: 'Fenced code block',
    type: 'snippet',
  }),
];

export const loremSnippets: Completion[] = [
  snippetCompletion(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    {
      label: 'lorem',
      detail: 'Lorem Ipsum Paragraph (Brackets)',
      type: 'text',
    }
  ),
  snippetCompletion(
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    {
      label: 'lorem_s',
      detail: 'Lorem Ipsum Sentence',
      type: 'text',
    }
  ),
  snippetCompletion(
    '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>',
    {
      label: 'lorem_p',
      detail: 'HTML <p> Lorem Paragraph',
      type: 'text',
    }
  ),
  snippetCompletion(
    '<li>Lorem ipsum dolor sit amet.</li>\n<li>Consectetur adipiscing elit.</li>\n<li>Sed do eiusmod tempor incididunt.</li>',
    {
      label: 'lorem_li',
      detail: 'HTML <li> Lorem List Items',
      type: 'text',
    }
  ),
  snippetCompletion(
    'Lorem ipsum dolor sit amet.',
    {
      label: 'lorem_w',
      detail: '5 Lorem Words',
      type: 'text',
    }
  ),
];

export function getCustomSnippetSource(languageName: string) {
  const lang = languageName.toLowerCase();

  return (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) return null;

    let options: Completion[] = [];

    if (lang.includes('javascript') || lang.includes('typescript') || lang.endsWith('.js') || lang.endsWith('.ts') || lang.endsWith('.jsx') || lang.endsWith('.tsx')) {
      options = jsSnippets;
    } else if (lang.includes('html') || lang.endsWith('.html')) {
      options = htmlSnippets;
    } else if (lang.includes('css') || lang.endsWith('.css')) {
      options = cssSnippets;
    } else if (lang.includes('python') || lang.endsWith('.py')) {
      options = pythonSnippets;
    } else if (lang.includes('rust') || lang.endsWith('.rs')) {
      options = rustSnippets;
    } else if (lang.includes('markdown') || lang.endsWith('.md')) {
      options = markdownSnippets;
    }

    if (options.length === 0) {
      options = loremSnippets;
    } else {
      options = [...options, ...loremSnippets];
    }

    return {
      from: word.from,
      options,
      validFor: /^\w*$/,
    };
  };
}
