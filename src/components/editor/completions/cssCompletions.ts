import { Completion, CompletionContext, CompletionResult, snippetCompletion } from '@codemirror/autocomplete';
import { cssCompletionSource } from '@codemirror/lang-css';

// ============================================================================
// 1. CSS PROPERTY CATALOG WITH TYPES AND DOCUMENTATION
// ============================================================================

export interface CssPropertyDef {
  name: string;
  doc: string;
  values?: string[];
  defaultValue?: string;
}

export const CSS_PROPERTIES: Record<string, CssPropertyDef> = {
  // Layout & Display
  'display': { name: 'display', doc: 'Specifies the rendering display box type of an element.', values: ['flex', 'grid', 'block', 'inline', 'inline-block', 'none', 'inline-flex', 'inline-grid', 'table', 'table-cell', 'contents'], defaultValue: 'flex' },
  'position': { name: 'position', doc: 'Specifies the positioning method used for an element.', values: ['relative', 'absolute', 'fixed', 'sticky', 'static'], defaultValue: 'relative' },
  'top': { name: 'top', doc: 'Specifies the vertical offset position for a positioned element.', values: ['0', 'auto', '50%', '100%'], defaultValue: '0' },
  'bottom': { name: 'bottom', doc: 'Specifies the bottom offset position for a positioned element.', values: ['0', 'auto', '50%'], defaultValue: '0' },
  'left': { name: 'left', doc: 'Specifies the horizontal left offset position.', values: ['0', 'auto', '50%', '100%'], defaultValue: '0' },
  'right': { name: 'right', doc: 'Specifies the horizontal right offset position.', values: ['0', 'auto', '50%', '100%'], defaultValue: '0' },
  'z-index': { name: 'z-index', doc: 'Controls the 3D stacking order of positioned elements.', values: ['auto', '0', '1', '10', '100', '999', '1000'], defaultValue: '10' },

  // Dimensions & Sizing
  'width': { name: 'width', doc: 'Specifies the width of the element\'s content area.', values: ['auto', '100%', '100vw', 'fit-content', 'max-content', 'min-content'], defaultValue: '100%' },
  'min-width': { name: 'min-width', doc: 'Sets the minimum width constraint of an element.', values: ['0', '100%', 'min-content'], defaultValue: '0' },
  'max-width': { name: 'max-width', doc: 'Sets the maximum width constraint of an element.', values: ['none', '100%', '1200px'], defaultValue: '100%' },
  'height': { name: 'height', doc: 'Specifies the height of the element\'s content area.', values: ['auto', '100%', '100vh', 'fit-content'], defaultValue: 'auto' },
  'min-height': { name: 'min-height', doc: 'Sets the minimum height constraint of an element.', values: ['0', '100%', '100vh'], defaultValue: '0' },
  'max-height': { name: 'max-height', doc: 'Sets the maximum height constraint of an element.', values: ['none', '100%', '100vh'], defaultValue: '100%' },
  'box-sizing': { name: 'box-sizing', doc: 'Defines how the total width and height of an element is calculated.', values: ['border-box', 'content-box'], defaultValue: 'border-box' },

  // Flexbox & Grid
  'flex': { name: 'flex', doc: 'Shorthand for flex-grow, flex-shrink, and flex-basis.', values: ['1', '0 1 auto', 'none', '1 1 auto'], defaultValue: '1' },
  'flex-direction': { name: 'flex-direction', doc: 'Sets how flex items are placed in the flex container.', values: ['row', 'column', 'row-reverse', 'column-reverse'], defaultValue: 'row' },
  'flex-wrap': { name: 'flex-wrap', doc: 'Sets whether flex items are forced onto one line or can wrap.', values: ['nowrap', 'wrap', 'wrap-reverse'], defaultValue: 'wrap' },
  'flex-grow': { name: 'flex-grow', doc: 'Specifies how much a flex item will grow relative to others.', values: ['0', '1', '2'], defaultValue: '1' },
  'flex-shrink': { name: 'flex-shrink', doc: 'Specifies how much a flex item will shrink relative to others.', values: ['0', '1'], defaultValue: '0' },
  'justify-content': { name: 'justify-content', doc: 'Aligns items along the main axis of a flex/grid container.', values: ['center', 'space-between', 'space-around', 'space-evenly', 'flex-start', 'flex-end'], defaultValue: 'center' },
  'align-items': { name: 'align-items', doc: 'Aligns items along the cross axis of a flex/grid container.', values: ['center', 'flex-start', 'flex-end', 'stretch', 'baseline'], defaultValue: 'center' },
  'align-content': { name: 'align-content', doc: 'Aligns lines along the cross axis when there is extra space.', values: ['center', 'space-between', 'space-around', 'stretch', 'flex-start', 'flex-end'] },
  'gap': { name: 'gap', doc: 'Specifies the gutters between grid rows/columns or flex items.', values: ['0', '0.5rem', '1rem', '1.5rem', '2rem', '10px', '20px'], defaultValue: '1rem' },
  'row-gap': { name: 'row-gap', doc: 'Sets the size of the gap (gutter) between element rows.' },
  'column-gap': { name: 'column-gap', doc: 'Sets the size of the gap (gutter) between element columns.' },
  'grid-template-columns': { name: 'grid-template-columns', doc: 'Defines the column names and track sizing functions.', values: ['repeat(auto-fit, minmax(250px, 1fr))', '1fr 1fr', 'repeat(3, 1fr)', '100px 1fr'], defaultValue: 'repeat(auto-fit, minmax(200px, 1fr))' },
  'grid-template-rows': { name: 'grid-template-rows', doc: 'Defines the row track sizing functions of a grid.' },

  // Spacing (Margin & Padding)
  'margin': { name: 'margin', doc: 'Sets the margin area on all four sides of an element.', values: ['0', '0 auto', 'auto', '1rem', '0.5rem 1rem'], defaultValue: '0' },
  'margin-top': { name: 'margin-top', doc: 'Sets the margin area on the top of an element.', defaultValue: '0' },
  'margin-bottom': { name: 'margin-bottom', doc: 'Sets the margin area on the bottom of an element.', defaultValue: '0' },
  'margin-left': { name: 'margin-left', doc: 'Sets the margin area on the left of an element.', values: ['0', 'auto'], defaultValue: '0' },
  'margin-right': { name: 'margin-right', doc: 'Sets the margin area on the right of an element.', values: ['0', 'auto'], defaultValue: '0' },
  'padding': { name: 'padding', doc: 'Sets the padding area on all four sides of an element.', values: ['0', '0.5rem', '1rem', '1rem 2rem'], defaultValue: '1rem' },
  'padding-top': { name: 'padding-top', doc: 'Sets the padding area on the top of an element.' },
  'padding-bottom': { name: 'padding-bottom', doc: 'Sets the padding area on the bottom of an element.' },
  'padding-left': { name: 'padding-left', doc: 'Sets the padding area on the left of an element.' },
  'padding-right': { name: 'padding-right', doc: 'Sets the padding area on the right of an element.' },

  // Colors & Backgrounds
  'color': { name: 'color', doc: 'Sets the foreground color of text and decorations.', values: ['#fff', '#000', 'inherit', 'currentColor', 'transparent', '#333'], defaultValue: '#333' },
  'background': { name: 'background', doc: 'Shorthand for all background style properties.', values: ['#fff', '#000', 'transparent', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'], defaultValue: '#fff' },
  'background-color': { name: 'background-color', doc: 'Sets the background color of an element.', values: ['transparent', '#fff', '#f8f9fa', '#1a202c', '#007bff'], defaultValue: '#fff' },
  'background-image': { name: 'background-image', doc: 'Sets one or more background images on an element.', values: ['none', 'url("image.png")', 'linear-gradient(...)'], defaultValue: 'url("$1")' },
  'background-size': { name: 'background-size', doc: 'Specifies the size of the background images.', values: ['cover', 'contain', 'auto', '100% 100%'], defaultValue: 'cover' },
  'background-position': { name: 'background-position', doc: 'Sets the initial position of each background image.', values: ['center', 'top', 'bottom', 'left', 'right'], defaultValue: 'center' },
  'background-repeat': { name: 'background-repeat', doc: 'Sets how background images are repeated.', values: ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'], defaultValue: 'no-repeat' },
  'opacity': { name: 'opacity', doc: 'Sets the transparency level of an element (0 to 1).', values: ['0', '0.5', '0.8', '1'], defaultValue: '1' },

  // Borders & Outlines
  'border': { name: 'border', doc: 'Shorthand for border-width, border-style, and border-color.', values: ['1px solid #ccc', '1px solid transparent', 'none'], defaultValue: '1px solid #ccc' },
  'border-color': { name: 'border-color', doc: 'Sets the color of all four borders.', values: ['#ccc', 'transparent', 'currentColor', '#007bff'], defaultValue: '#ccc' },
  'border-width': { name: 'border-width', doc: 'Sets the width of all four borders.', values: ['1px', '2px', '0'], defaultValue: '1px' },
  'border-style': { name: 'border-style', doc: 'Sets the style of all four borders.', values: ['solid', 'dashed', 'dotted', 'double', 'none'], defaultValue: 'solid' },
  'border-radius': { name: 'border-radius', doc: 'Rounds the corners of an element\'s outer border edge.', values: ['4px', '8px', '12px', '16px', '50%', '9999px'], defaultValue: '8px' },
  'border-top': { name: 'border-top', doc: 'Shorthand for border-top properties.', values: ['1px solid #ccc', 'none'] },
  'border-bottom': { name: 'border-bottom', doc: 'Shorthand for border-bottom properties.', values: ['1px solid #ccc', 'none'] },
  'border-left': { name: 'border-left', doc: 'Shorthand for border-left properties.', values: ['1px solid #ccc', 'none'] },
  'border-right': { name: 'border-right', doc: 'Shorthand for border-right properties.', values: ['1px solid #ccc', 'none'] },
  'outline': { name: 'outline', doc: 'Draws a line outside the border edge for focus highlighting.', values: ['none', '2px solid #007bff'], defaultValue: 'none' },

  // Typography & Text
  'font-family': { name: 'font-family', doc: 'Specifies a prioritized list of font family names.', values: ['system-ui, -apple-system, sans-serif', 'sans-serif', 'serif', 'monospace', '"Fira Code", monospace'], defaultValue: 'system-ui, sans-serif' },
  'font-size': { name: 'font-size', doc: 'Sets the size of the font.', values: ['14px', '16px', '18px', '1rem', '1.25rem', '1.5rem', '2rem', '0.875rem'], defaultValue: '16px' },
  'font-weight': { name: 'font-weight', doc: 'Sets the font weight (thickness) of text.', values: ['normal', 'bold', '300', '400', '500', '600', '700'], defaultValue: 'bold' },
  'font-style': { name: 'font-style', doc: 'Specifies font style (normal, italic, oblique).', values: ['normal', 'italic'], defaultValue: 'italic' },
  'line-height': { name: 'line-height', doc: 'Sets the height of a line box (leading).', values: ['1', '1.2', '1.5', '1.6', 'normal'], defaultValue: '1.5' },
  'letter-spacing': { name: 'letter-spacing', doc: 'Increases or decreases the space between characters.', values: ['normal', '0.05em', '-0.02em', '1px'] },
  'text-align': { name: 'text-align', doc: 'Sets the horizontal alignment of the inline-level content.', values: ['center', 'left', 'right', 'justify', 'start', 'end'], defaultValue: 'center' },
  'text-decoration': { name: 'text-decoration', doc: 'Sets text decorative lines (underline, line-through).', values: ['none', 'underline', 'line-through'], defaultValue: 'none' },
  'text-transform': { name: 'text-transform', doc: 'Specifies how to capitalize an element\'s text.', values: ['none', 'capitalize', 'uppercase', 'lowercase'], defaultValue: 'uppercase' },
  'white-space': { name: 'white-space', doc: 'Sets how white space inside an element is handled.', values: ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line'], defaultValue: 'nowrap' },
  'word-break': { name: 'word-break', doc: 'Specifies whether lines may break wherever within words.', values: ['normal', 'break-all', 'keep-all', 'break-word'] },
  'overflow': { name: 'overflow', doc: 'Specifies behavior when content overflows element bounds.', values: ['hidden', 'auto', 'scroll', 'visible'], defaultValue: 'hidden' },
  'overflow-x': { name: 'overflow-x', doc: 'Specifies horizontal overflow behavior.', values: ['hidden', 'auto', 'scroll'] },
  'overflow-y': { name: 'overflow-y', doc: 'Specifies vertical overflow behavior.', values: ['hidden', 'auto', 'scroll'] },

  // Visual effects & Transforms
  'transform': { name: 'transform', doc: 'Applies 2D or 3D transformations (translate, rotate, scale).', values: ['translateY(-50%)', 'translateX(-50%)', 'scale(1.05)', 'rotate(45deg)', 'none'], defaultValue: 'translateY(-2px)' },
  'transition': { name: 'transition', doc: 'Shorthand for transition property, duration, timing, delay.', values: ['all 0.3s ease', 'all 0.2s ease-in-out', 'transform 0.2s ease', 'opacity 0.2s ease'], defaultValue: 'all 0.3s ease' },
  'animation': { name: 'animation', doc: 'Applies CSS keyframe animation shorthand.', values: ['spin 1s linear infinite', 'fadeIn 0.3s ease-out'], defaultValue: 'fadeIn 0.3s ease' },
  'box-shadow': { name: 'box-shadow', doc: 'Adds shadow effects around an element\'s frame.', values: ['0 4px 6px -1px rgba(0, 0, 0, 0.1)', '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 'none', '0 2px 4px rgba(0,0,0,0.08)'], defaultValue: '0 4px 6px rgba(0, 0, 0, 0.1)' },
  'cursor': { name: 'cursor', doc: 'Sets the mouse cursor to display when mouse is over element.', values: ['pointer', 'default', 'not-allowed', 'grab', 'grabbing', 'text', 'move', 'wait'], defaultValue: 'pointer' },
  'pointer-events': { name: 'pointer-events', doc: 'Sets whether an element reacts to pointer events.', values: ['auto', 'none'], defaultValue: 'none' },
  'user-select': { name: 'user-select', doc: 'Controls whether the user can select text.', values: ['none', 'auto', 'text', 'all'], defaultValue: 'none' },
  'content': { name: 'content', doc: 'Used with ::before and ::after pseudo-elements to insert content.', values: ["''", '""', 'none', 'attr(data-title)'], defaultValue: "''" },
};

// ============================================================================
// 2. PSEUDO-CLASSES, PSEUDO-ELEMENTS, AND AT-RULES
// ============================================================================

export const CSS_PSEUDO_CLASSES = [
  { label: ':hover', detail: 'Matches when user designates element with cursor device.' },
  { label: ':focus', detail: 'Matches when element has focus (accepted keyboard events).' },
  { label: ':focus-visible', detail: 'Matches focus when browser determines it should be indicated.' },
  { label: ':focus-within', detail: 'Matches element or any of its descendants having focus.' },
  { label: ':active', detail: 'Matches when element is being activated by user (mousedown).' },
  { label: ':visited', detail: 'Matches links that have been visited by the user.' },
  { label: ':first-child', detail: 'Matches element that is the first child of its parent.' },
  { label: ':last-child', detail: 'Matches element that is the last child of its parent.' },
  { label: ':nth-child', detail: 'Matches elements based on an algebraic formula e.g. 2n+1.', apply: ':nth-child(${1:2n})' },
  { label: ':not', detail: 'Negation pseudo-class matching elements not matching argument.', apply: ':not(${1:selector})' },
  { label: ':disabled', detail: 'Matches form controls that are disabled.' },
  { label: ':checked', detail: 'Matches radio, checkbox, or option that is checked.' },
  { label: ':required', detail: 'Matches input or select having the required attribute.' },
  { label: ':root', detail: 'Matches the root element of document (<html> for HTML).' },
  { label: ':empty', detail: 'Matches element having no children or text nodes.' },
];

export const CSS_PSEUDO_ELEMENTS = [
  { label: '::before', detail: 'Creates pseudo-element that is first child of selected element.', apply: '::before {\n\tcontent: "${1}";\n\t${0}\n}' },
  { label: '::after', detail: 'Creates pseudo-element that is last child of selected element.', apply: '::after {\n\tcontent: "${1}";\n\t${0}\n}' },
  { label: '::placeholder', detail: 'Styles placeholder text in an input or textarea element.' },
  { label: '::selection', detail: 'Styles the portion of document highlighted by the user.' },
  { label: '::marker', detail: 'Styles list item bullet point or counter number.' },
  { label: '::backdrop', detail: 'Styles backdrop behind a <dialog> or fullscreen element.' },
];

export const CSS_AT_RULES = [
  { label: '@media', detail: 'Media query conditional styling rule.', apply: '@media (${1:max-width: 768px}) {\n\t${0}\n}' },
  { label: '@keyframes', detail: 'Keyframe animation sequence rule.', apply: '@keyframes ${1:name} {\n\t0% { ${2} }\n\t100% { ${3} }\n}' },
  { label: '@import', detail: 'Imports external stylesheet.', apply: '@import url("${1:style.css}");' },
  { label: '@font-face', detail: 'Specifies custom web font face.', apply: '@font-face {\n\tfont-family: "${1:MyFont}";\n\tsrc: url("${2:font.woff2}") format("woff2");\n}' },
  { label: '@supports', detail: 'Feature query conditional styling rule.', apply: '@supports (${1:display: grid}) {\n\t${0}\n}' },
  { label: '@container', detail: 'Container query conditional styling rule.', apply: '@container (${1:min-width: 400px}) {\n\t${0}\n}' },
];

// ============================================================================
// 3. CSS COMPLETION SOURCE IMPLEMENTATION
// ============================================================================

export function cssCompletions(context: CompletionContext): CompletionResult | null {
  const line = context.state.doc.lineAt(context.pos);
  const textBefore = line.text.slice(0, context.pos - line.from);

  // 1. Pseudo-element trigger: "::"
  const pseudoElemMatch = context.matchBefore(/::[a-zA-Z\-]*/);
  if (pseudoElemMatch) {
    return {
      from: pseudoElemMatch.from,
      options: CSS_PSEUDO_ELEMENTS.map((pe) => ({
        label: pe.label,
        type: 'type',
        detail: pe.detail,
        apply: pe.apply || pe.label,
        boost: 95,
      })),
      validFor: /^::[a-zA-Z\-]*$/,
    };
  }

  // 2. Pseudo-class trigger: ":" (not preceded by another colon)
  const pseudoClassMatch = context.matchBefore(/(?<!:):[a-zA-Z\-]*/);
  if (pseudoClassMatch && !textBefore.includes('{') && !textBefore.includes(';')) {
    return {
      from: pseudoClassMatch.from,
      options: CSS_PSEUDO_CLASSES.map((pc) => ({
        label: pc.label,
        type: 'type',
        detail: pc.detail,
        apply: pc.apply || pc.label,
        boost: 90,
      })),
      validFor: /^:[a-zA-Z\-]*$/,
    };
  }

  // 3. At-rules trigger on "@"
  const atRuleMatch = context.matchBefore(/@[a-zA-Z\-]*/);
  if (atRuleMatch) {
    return {
      from: atRuleMatch.from,
      options: CSS_AT_RULES.map((ar) => ({
        label: ar.label,
        type: 'keyword',
        detail: ar.detail,
        apply: ar.apply,
        boost: 95,
      })),
      validFor: /^@[a-zA-Z\-]*$/,
    };
  }

  // 4. CSS Property Value completion after "property: ..."
  const propValMatch = textBefore.match(/([a-zA-Z\-]+)\s*:\s*([^;]*)$/);
  if (propValMatch) {
    const propName = propValMatch[1].toLowerCase();
    const valTyped = propValMatch[2].trimStart();
    const propDef = CSS_PROPERTIES[propName];

    let options: Completion[] = [];
    if (propDef?.values && propDef.values.length > 0) {
      options = propDef.values.map((v) => ({
        label: v,
        type: 'constant',
        detail: `${propName}: ${v};`,
        boost: 90,
      }));
    }

    // Common CSS keywords valid for almost any property
    const globals = ['inherit', 'initial', 'unset', 'revert'].map((g) => ({
      label: g,
      type: 'keyword',
      detail: `Global keyword`,
      boost: 60,
    }));

    const allValOptions = [...options, ...globals];
    const valWord = context.matchBefore(/[a-zA-Z0-9_\-\(\)%#.]*/);

    if (valWord && allValOptions.length > 0) {
      return {
        from: valWord.from,
        options: allValOptions,
        validFor: /^[a-zA-Z0-9_\-\(\)%#.]*$/,
      };
    }
  }

  // 5. CSS Property Name completion
  const propWord = context.matchBefore(/[a-zA-Z\-]+/);
  if (propWord && !textBefore.endsWith(':') && !textBefore.includes(':')) {
    const options: Completion[] = Object.values(CSS_PROPERTIES).map((prop) => {
      const defaultVal = prop.defaultValue || prop.values?.[0] || '';
      return snippetCompletion(`${prop.name}: \${1:${defaultVal}};`, {
        label: prop.name,
        detail: prop.doc,
        type: 'property',
        boost: 85,
      });
    });

    return {
      from: propWord.from,
      options,
      validFor: /^[a-zA-Z\-]*$/,
    };
  }

  // 6. Delegate to CodeMirror's cssCompletionSource if available
  try {
    const res = cssCompletionSource(context);
    if (res && !(res instanceof Promise)) {
      return res;
    }
    return null;
  } catch {
    return null;
  }
}
