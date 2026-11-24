import { Completion, CompletionContext, CompletionResult, snippetCompletion } from '@codemirror/autocomplete';
import { htmlCompletionSource } from '@codemirror/lang-html';

// ============================================================================
// 1. HTML5 TAG DEFINITIONS WITH DOCUMENTATION & SNIPPETS
// ============================================================================

export interface HtmlTagDef {
  name: string;
  doc: string;
  void?: boolean;
  template?: string;
  attributes?: string[];
}

export const HTML_TAGS: Record<string, HtmlTagDef> = {
  // Document structure
  'html': { name: 'html', doc: 'The root element of an HTML document.', template: '<html lang="${1:en}">\n\t${0}\n</html>' },
  'head': { name: 'head', doc: 'Container for metadata (title, scripts, styles).', template: '<head>\n\t${0}\n</head>' },
  'body': { name: 'body', doc: 'Contains the visible contents of the HTML document.', template: '<body>\n\t${0}\n</body>' },
  'title': { name: 'title', doc: 'Sets the title of the document shown in browser tab.', template: '<title>${1:Document}</title>' },
  'meta': { name: 'meta', doc: 'Document metadata such as charset, viewport, description.', void: true, template: '<meta ${1:charset="UTF-8"}>' },
  'link': { name: 'link', doc: 'Links an external resource such as a CSS stylesheet or favicon.', void: true, template: '<link rel="${1:stylesheet}" href="${2:style.css}">' },
  'style': { name: 'style', doc: 'Embedded CSS style sheet.', template: '<style>\n\t${0}\n</style>' },
  'script': { name: 'script', doc: 'Embedded or external executable script (JavaScript).', template: '<script${1: src="${2:app.js}"}>${0}</script>' },
  'noscript': { name: 'noscript', doc: 'Fallback content for browsers that do not support JavaScript.' },

  // Content grouping & structural
  'div': { name: 'div', doc: 'Generic flow content division container.', template: '<div class="${1:container}">\n\t${0}\n</div>' },
  'span': { name: 'span', doc: 'Generic inline content container.', template: '<span class="${1:text}">${0}</span>' },
  'p': { name: 'p', doc: 'Paragraph element for blocks of text.', template: '<p>${0}</p>' },
  'header': { name: 'header', doc: 'Introductory content or navigational aids for section or page.', template: '<header>\n\t${0}\n</header>' },
  'footer': { name: 'footer', doc: 'Footer for its nearest section or root document.', template: '<footer>\n\t${0}\n</footer>' },
  'main': { name: 'main', doc: 'Dominant content of the document body.', template: '<main>\n\t${0}\n</main>' },
  'nav': { name: 'nav', doc: 'Section with navigation links.', template: '<nav>\n\t${0}\n</nav>' },
  'section': { name: 'section', doc: 'Standalone generic thematic section of content.', template: '<section class="${1:section}">\n\t${0}\n</section>' },
  'article': { name: 'article', doc: 'Self-contained composition intended to be reusable.', template: '<article>\n\t${0}\n</article>' },
  'aside': { name: 'aside', doc: 'Portion of document whose content is only indirectly related.', template: '<aside>\n\t${0}\n</aside>' },

  // Headings
  'h1': { name: 'h1', doc: 'Level 1 section heading.', template: '<h1>${0}</h1>' },
  'h2': { name: 'h2', doc: 'Level 2 section heading.', template: '<h2>${0}</h2>' },
  'h3': { name: 'h3', doc: 'Level 3 section heading.', template: '<h3>${0}</h3>' },
  'h4': { name: 'h4', doc: 'Level 4 section heading.', template: '<h4>${0}</h4>' },
  'h5': { name: 'h5', doc: 'Level 5 section heading.', template: '<h5>${0}</h5>' },
  'h6': { name: 'h6', doc: 'Level 6 section heading.', template: '<h6>${0}</h6>' },

  // Lists
  'ul': { name: 'ul', doc: 'Unordered list of items (bulleted).', template: '<ul>\n\t<li>${0}</li>\n</ul>' },
  'ol': { name: 'ol', doc: 'Ordered list of items (numbered).', template: '<ol>\n\t<li>${0}</li>\n</ol>' },
  'li': { name: 'li', doc: 'List item inside ul, ol, or menu.', template: '<li>${0}</li>' },
  'dl': { name: 'dl', doc: 'Description list of name-value pairs.' },
  'dt': { name: 'dt', doc: 'Description term inside a dl.' },
  'dd': { name: 'dd', doc: 'Description details or definition inside a dl.' },

  // Text formatting & phrasing
  'a': { name: 'a', doc: 'Hyperlink to another web page, file, or email address.', template: '<a href="${1:#}">${0}</a>', attributes: ['href', 'target', 'rel', 'download'] },
  'b': { name: 'b', doc: 'Brings attention to text without imparting extra importance.', template: '<b>${0}</b>' },
  'strong': { name: 'strong', doc: 'Indicates strong importance, seriousness, or urgency.', template: '<strong>${0}</strong>' },
  'i': { name: 'i', doc: 'Represents text in an alternate voice or mood.', template: '<i>${0}</i>' },
  'em': { name: 'em', doc: 'Marks text that has stress emphasis.', template: '<em>${0}</em>' },
  'code': { name: 'code', doc: 'Displays inline computer code fragment.', template: '<code>${0}</code>' },
  'pre': { name: 'pre', doc: 'Preformatted text block respecting whitespace and tabs.', template: '<pre><code>${0}</code></pre>' },
  'blockquote': { name: 'blockquote', doc: 'Indicates that the enclosed text is an extended quotation.', template: '<blockquote cite="${1:url}">\n\t<p>${0}</p>\n</blockquote>' },
  'hr': { name: 'hr', doc: 'Thematic break between paragraph-level elements.', void: true, template: '<hr>' },
  'br': { name: 'br', doc: 'Produces a line break in text (carriage-return).', void: true, template: '<br>' },
  'small': { name: 'small', doc: 'Represents side-comments, disclaimers, or legal small print.' },
  'sub': { name: 'sub', doc: 'Subscript text offset below the normal line of type.' },
  'sup': { name: 'sup', doc: 'Superscript text offset above the normal line of type.' },
  'mark': { name: 'mark', doc: 'Highlighted or marked text for reference purposes.' },
  'time': { name: 'time', doc: 'Specific period in time or dateTime value.', template: '<time datetime="${1:2026-01-01}">${0}</time>' },

  // Forms & User input
  'form': { name: 'form', doc: 'Interactive form containing input controls.', template: '<form action="${1:#}" method="${2:post}">\n\t${0}\n</form>', attributes: ['action', 'method', 'enctype', 'target', 'novalidate'] },
  'input': { name: 'input', doc: 'Interactive control for web-based forms to accept user data.', void: true, template: '<input type="${1:text}" name="${2:name}" class="${3:form-control}" placeholder="${4:}">', attributes: ['type', 'name', 'value', 'placeholder', 'required', 'disabled', 'readonly', 'checked', 'min', 'max', 'step', 'pattern', 'autocomplete', 'autofocus'] },
  'button': { name: 'button', doc: 'Clickable button element to submit forms or trigger actions.', template: '<button type="${1:button}" class="${2:btn}">${0}</button>', attributes: ['type', 'disabled', 'name', 'value', 'form'] },
  'select': { name: 'select', doc: 'Drop-down select menu offering list of options.', template: '<select name="${1:name}" id="${2:id}">\n\t<option value="${3:val}">${0}</option>\n</select>', attributes: ['name', 'id', 'multiple', 'required', 'disabled', 'size'] },
  'option': { name: 'option', doc: 'Option item in a select, optgroup, or datalist.', template: '<option value="${1:value}">${0}</option>', attributes: ['value', 'selected', 'disabled'] },
  'optgroup': { name: 'optgroup', doc: 'Group of option items within a select control.', attributes: ['label', 'disabled'] },
  'textarea': { name: 'textarea', doc: 'Multi-line plain-text editing control.', template: '<textarea name="${1:name}" rows="${2:4}" class="${3:form-control}">${0}</textarea>', attributes: ['name', 'rows', 'cols', 'placeholder', 'required', 'disabled', 'readonly', 'maxlength'] },
  'label': { name: 'label', doc: 'Caption for an item in a user interface.', template: '<label for="${1:id}">${0}</label>', attributes: ['for'] },
  'fieldset': { name: 'fieldset', doc: 'Groups several controls and labels within a web form.' },
  'legend': { name: 'legend', doc: 'Caption for the content of its parent fieldset.' },
  'datalist': { name: 'datalist', doc: 'Contains a set of option elements that represent suggested options for input.' },
  'progress': { name: 'progress', doc: 'Displays an indicator showing completion progress of a task.' },
  'meter': { name: 'meter', doc: 'Represents either a scalar value within a known range or fractional value.' },

  // Tables
  'table': { name: 'table', doc: 'Represents tabular data with rows and columns.', template: '<table class="${1:table}">\n\t<thead>\n\t\t<tr>\n\t\t\t<th>${2:Header}</th>\n\t\t</tr>\n\t</thead>\n\t<tbody>\n\t\t<tr>\n\t\t\t<td>${0}</td>\n\t\t</tr>\n\t</tbody>\n</table>' },
  'thead': { name: 'thead', doc: 'Defines a set of rows defining the head of the columns of the table.' },
  'tbody': { name: 'tbody', doc: 'Encapsulates a set of table rows (tr) containing table data (td).' },
  'tfoot': { name: 'tfoot', doc: 'Encapsulates a set of table rows (tr) defining footer for table.' },
  'tr': { name: 'tr', doc: 'Defines a row of cells in a table.', template: '<tr>\n\t<td>${0}</td>\n</tr>' },
  'th': { name: 'th', doc: 'Defines a cell as header of a group of table cells.', template: '<th>${0}</th>' },
  'td': { name: 'td', doc: 'Defines a standard data cell of a table.', template: '<td>${0}</td>' },
  'caption': { name: 'caption', doc: 'Specifies the caption or title of a table.' },

  // Embedded content & media
  'img': { name: 'img', doc: 'Embeds an image into the document.', void: true, template: '<img src="${1:image.jpg}" alt="${2:Description}" />', attributes: ['src', 'alt', 'width', 'height', 'loading', 'srcset', 'sizes'] },
  'iframe': { name: 'iframe', doc: 'Nested browsing context, embedding another HTML page into current one.', template: '<iframe src="${1:url}" title="${2:description}" width="${3:100%}" height="${4:400}"></iframe>', attributes: ['src', 'title', 'width', 'height', 'loading', 'allow', 'allowfullscreen'] },
  'video': { name: 'video', doc: 'Embeds video content with media playback.', template: '<video controls width="${1:640}">\n\t<source src="${2:video.mp4}" type="video/mp4">\n\t${0}\n</video>', attributes: ['src', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'preload', 'width', 'height'] },
  'audio': { name: 'audio', doc: 'Embeds sound content with playback controls.', template: '<audio controls>\n\t<source src="${1:audio.mp3}" type="audio/mpeg">\n\t${0}\n</audio>', attributes: ['src', 'controls', 'autoplay', 'loop', 'muted', 'preload'] },
  'source': { name: 'source', doc: 'Specifies media resources for picture, audio, or video.', void: true, template: '<source src="${1:media.mp4}" type="${2:video/mp4}">' },
  'canvas': { name: 'canvas', doc: 'Bitmap canvas container for scripted 2D / WebGL drawing.', template: '<canvas id="${1:canvas}" width="${2:600}" height="${3:400}"></canvas>' },
  'svg': { name: 'svg', doc: 'XML-based vector graphic container.', template: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="${1:0 0 24 24}" width="${2:24}" height="${3:24}">\n\t${0}\n</svg>' },
  'path': { name: 'path', doc: 'SVG generic path element.', template: '<path d="${1:M...}" fill="${2:currentColor}" />' },
  'picture': { name: 'picture', doc: 'Container with multiple sources for responsive images.' },

  // Interactive & modern elements
  'details': { name: 'details', doc: 'Disclosure widget from which user can obtain additional information.', template: '<details>\n\t<summary>${1:Summary}</summary>\n\t<p>${0}</p>\n</details>' },
  'summary': { name: 'summary', doc: 'Disclosure caption or summary for details element.', template: '<summary>${0}</summary>' },
  'dialog': { name: 'dialog', doc: 'Dialog box, modal, or inspector window subwindow.', template: '<dialog id="${1:dialog}">\n\t<form method="dialog">\n\t\t${0}\n\t\t<button>Close</button>\n\t</form>\n</dialog>' },
  'template': { name: 'template', doc: 'Mechanism for holding HTML that is not rendered immediately upon page load.', template: '<template id="${1:template}">\n\t${0}\n</template>' },
};

// ============================================================================
// 2. HTML ATTRIBUTE DEFINITIONS & VALUES
// ============================================================================

export interface HtmlAttributeDef {
  name: string;
  doc: string;
  values?: string[];
}

export const GLOBAL_ATTRIBUTES: HtmlAttributeDef[] = [
  { name: 'class', doc: 'Space-separated list of CSS class names.' },
  { name: 'id', doc: 'Unique identifier for the element across the document.' },
  { name: 'style', doc: 'Inline CSS style declarations.' },
  { name: 'title', doc: 'Advisory title information, commonly shown as a tooltip.' },
  { name: 'hidden', doc: 'Boolean indicating the element is not yet or no longer relevant.' },
  { name: 'tabindex', doc: 'Specifies the tab order of an element (-1, 0, or positive).' },
  { name: 'role', doc: 'ARIA role definition for accessibility (e.g. "button", "dialog", "navigation").' },
  { name: 'aria-label', doc: 'Defines a string value that labels an interactive element.' },
  { name: 'aria-hidden', doc: 'Indicates whether the element is exposed to accessibility APIs.', values: ['true', 'false'] },
  { name: 'aria-expanded', doc: 'Indicates whether the element or another grouping element is expanded or collapsed.', values: ['true', 'false'] },
  { name: 'aria-disabled', doc: 'Indicates that the element is perceivable but disabled.', values: ['true', 'false'] },
  { name: 'dir', doc: 'Directionality of the element\'s text.', values: ['ltr', 'rtl', 'auto'] },
  { name: 'lang', doc: 'Primary language for the element\'s contents and attribute values.' },
  { name: 'contenteditable', doc: 'Indicates whether the element\'s contents are editable by the user.', values: ['true', 'false'] },
  { name: 'draggable', doc: 'Indicates whether the element can be dragged using HTML Drag & Drop API.', values: ['true', 'false'] },
  { name: 'data-', doc: 'Custom private data attributes for scripting.' },
  // Event handlers
  { name: 'onclick', doc: 'Fires when user clicks the element.' },
  { name: 'onchange', doc: 'Fires when element value is committed by the user.' },
  { name: 'onsubmit', doc: 'Fires when a form is submitted.' },
  { name: 'oninput', doc: 'Fires immediately when the value of an input or textarea changes.' },
  { name: 'onkeydown', doc: 'Fires when a key is pressed down.' },
  { name: 'onkeyup', doc: 'Fires when a pressed key is released.' },
  { name: 'onfocus', doc: 'Fires when an element receives focus.' },
  { name: 'onblur', doc: 'Fires when an element loses focus.' },
  { name: 'onmouseenter', doc: 'Fires when mouse pointer enters the element.' },
  { name: 'onmouseleave', doc: 'Fires when mouse pointer leaves the element.' },
];

export const ATTRIBUTE_VALUES: Record<string, string[]> = {
  'type': [
    'text', 'password', 'email', 'number', 'checkbox', 'radio', 'submit', 'button',
    'reset', 'hidden', 'file', 'date', 'time', 'datetime-local', 'month', 'week',
    'color', 'tel', 'url', 'range', 'search', 'image'
  ],
  'method': ['get', 'post', 'dialog'],
  'target': ['_blank', '_self', '_parent', '_top'],
  'rel': ['stylesheet', 'noopener', 'noreferrer', 'icon', 'preload', 'prefetch', 'alternate', 'author', 'license', 'next', 'prev', 'search'],
  'loading': ['lazy', 'eager'],
  'autocomplete': ['on', 'off', 'new-password', 'current-password', 'username', 'email', 'tel', 'address-line1', 'postal-code', 'country'],
  'enctype': ['application/x-www-form-urlencoded', 'multipart/form-data', 'text/plain'],
  'inputmode': ['text', 'decimal', 'numeric', 'tel', 'search', 'email', 'url'],
  'dir': ['ltr', 'rtl', 'auto'],
  'aria-hidden': ['true', 'false'],
  'aria-expanded': ['true', 'false'],
  'aria-disabled': ['true', 'false'],
  'contenteditable': ['true', 'false'],
  'draggable': ['true', 'false'],
  'spellcheck': ['true', 'false'],
};

// ============================================================================
// 3. HTML COMPLETION SOURCE IMPLEMENTATION
// ============================================================================

export function htmlCompletions(context: CompletionContext): CompletionResult | null {
  const line = context.state.doc.lineAt(context.pos);
  const textBefore = line.text.slice(0, context.pos - line.from);

  // 1. Check if user is typing an attribute value: attr="val...
  const attrValMatch = textBefore.match(/([a-zA-Z0-9_\-]+)\s*=\s*["']([^"']*)$/);
  if (attrValMatch) {
    const attrName = attrValMatch[1].toLowerCase();
    const valPrefix = attrValMatch[2];
    const values = ATTRIBUTE_VALUES[attrName];
    if (values && values.length > 0) {
      const fromPos = context.pos - valPrefix.length;
      return {
        from: fromPos,
        options: values.map((val) => ({
          label: val,
          type: 'constant',
          detail: `${attrName}="${val}"`,
          boost: 90,
        })),
        validFor: /^[a-zA-Z0-9_\-]*$/,
      };
    }
  }

  // 2. Check if user is inside an open tag after tag name: <tag ... attr...
  const inTagMatch = textBefore.match(/<([a-zA-Z0-9_\-]+)\s+([^>]*)$/);
  if (inTagMatch) {
    // Current token before cursor
    const attrWord = context.matchBefore(/[a-zA-Z0-9_\-:]*/);
    const tagName = inTagMatch[1].toLowerCase();
    const tagDef = HTML_TAGS[tagName];

    const tagAttrs = (tagDef?.attributes || []).map((attr) => ({
      label: attr,
      type: 'property',
      detail: `Attribute for <${tagName}>`,
      apply: `${attr}="$1"`,
      boost: 95,
    }));

    const globalAttrs = GLOBAL_ATTRIBUTES.map((attr) => ({
      label: attr.name,
      type: 'property',
      detail: attr.doc,
      apply: `${attr.name}="$1"`,
      boost: 85,
    }));

    const options = [...tagAttrs, ...globalAttrs];

    if (attrWord) {
      return {
        from: attrWord.from,
        options,
        validFor: /^[a-zA-Z0-9_\-:]*$/,
      };
    }
  }

  // 3. Tag completion when starting with "<" or typing a tag name
  const tagWithBracket = context.matchBefore(/<[a-zA-Z0-9_\-]*/);
  if (tagWithBracket) {
    const typed = tagWithBracket.text.slice(1); // omit leading '<'
    const options: Completion[] = Object.values(HTML_TAGS).map((tag) => {
      if (tag.template) {
        // Strip the leading '<' from template if tagWithBracket matched '<'
        const cleanTemplate = tag.template.replace(/^</, '');
        return snippetCompletion(cleanTemplate, {
          label: tag.name,
          detail: tag.doc,
          type: 'type',
          boost: 90,
        });
      }
      return {
        label: tag.name,
        detail: tag.doc,
        type: 'type',
        apply: tag.void ? `${tag.name} />` : `${tag.name}>$0</${tag.name}>`,
        boost: 90,
      };
    });

    return {
      from: tagWithBracket.from + 1,
      options,
      validFor: /^[a-zA-Z0-9_\-]*$/,
    };
  }

  // 4. Standalone tag name trigger (e.g. typing "div" in an HTML context)
  const tagWord = context.matchBefore(/[a-zA-Z0-9_\-]+/);
  if (tagWord && !textBefore.endsWith('>') && !textBefore.includes('=')) {
    const options: Completion[] = Object.values(HTML_TAGS).map((tag) => {
      const template = tag.template || (tag.void ? `<${tag.name} />` : `<${tag.name}>$0</${tag.name}>`);
      return snippetCompletion(template, {
        label: tag.name,
        detail: `<${tag.name}> ${tag.doc}`,
        type: 'type',
        boost: 80,
      });
    });

    return {
      from: tagWord.from,
      options,
      validFor: /^[a-zA-Z0-9_\-]*$/,
    };
  }

  // 5. Delegate to @codemirror/lang-html for syntax tree-based completions if available
  try {
    const res = htmlCompletionSource(context);
    if (res && !(res instanceof Promise)) {
      return res;
    }
    return null;
  } catch {
    return null;
  }
}
