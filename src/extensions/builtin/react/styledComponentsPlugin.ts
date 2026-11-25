import { StyledComponentTemplate, StyledComponentsSettings } from './types';

export const DEFAULT_STYLED_COMPONENTS_SETTINGS: StyledComponentsSettings = {
  enabled: true,
  cssValidation: true,
  autoFormatTemplateLiterals: true,
};

export const COMMON_STYLED_TEMPLATES: StyledComponentTemplate[] = [
  {
    name: 'styled.div',
    htmlTag: 'div',
    template: `export const $1 = styled.div\`
  display: flex;
  flex-direction: column;
  padding: 1rem;
\`;`,
    description: 'Creates a styled <div> container component',
  },
  {
    name: 'styled.button',
    htmlTag: 'button',
    template: `export const $1 = styled.button\`
  background-color: \${(props) => (props.primary ? '#007bff' : '#6c757d')};
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 1rem;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
\`;`,
    description: 'Creates a styled <button> with props-based variant styling',
  },
  {
    name: 'styled.section',
    htmlTag: 'section',
    template: `export const $1 = styled.section\`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
\`;`,
    description: 'Creates a centered styled <section> container',
  },
  {
    name: 'styled.input',
    htmlTag: 'input',
    template: `export const $1 = styled.input\`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #80bdff;
  }
\`;`,
    description: 'Creates a styled <input> field with focus states',
  },
];

/**
 * Creates a custom styled-component declaration.
 */
export function createStyledComponentSnippet(
  componentName: string,
  htmlTag = 'div',
  cssBody = 'display: flex;\n  padding: 1rem;'
): string {
  return `export const ${componentName} = styled.${htmlTag}\`\n  ${cssBody}\n\`;`;
}

/**
 * Validates CSS balance inside styled-components template strings.
 */
export function validateStyledCss(templateText: string): { valid: boolean; error?: string } {
  if (!templateText) return { valid: true };

  // Check balanced curly braces
  const openBraces = (templateText.match(/\{/g) || []).length;
  const closeBraces = (templateText.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    return { valid: false, error: 'Unbalanced curly braces in styled-components CSS block' };
  }

  // Check balanced parentheses in interpolations
  const openParens = (templateText.match(/\(/g) || []).length;
  const closeParens = (templateText.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return { valid: false, error: 'Unbalanced parentheses in styled-components expression' };
  }

  return { valid: true };
}
