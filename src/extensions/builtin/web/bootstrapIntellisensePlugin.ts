import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { BootstrapComponentSnippet, BootstrapSettings } from './types';

export const DEFAULT_BOOTSTRAP_SETTINGS: BootstrapSettings = {
  enabled: true,
  version: '5.3',
  includeGridSnippets: true,
  includeComponents: true,
};

export interface BootstrapClassItem {
  name: string;
  category: 'grid' | 'component' | 'color' | 'utility' | 'typography' | 'form';
  description: string;
}

export const BOOTSTRAP_CLASSES: BootstrapClassItem[] = [
  // Grid & Layout
  { name: 'container', category: 'grid', description: 'Fixed-width container with responsive breakpoints' },
  { name: 'container-fluid', category: 'grid', description: 'Full-width container spanning entire viewport' },
  { name: 'row', category: 'grid', description: 'Row container for flex columns' },
  { name: 'col', category: 'grid', description: 'Auto-layout column' },
  { name: 'col-12', category: 'grid', description: 'Full-width column (12/12)' },
  { name: 'col-md-6', category: 'grid', description: 'Half-width column on medium screens and up' },
  { name: 'col-lg-4', category: 'grid', description: 'One-third width column on large screens and up' },
  { name: 'col-lg-3', category: 'grid', description: 'One-fourth width column on large screens and up' },
  { name: 'col-auto', category: 'grid', description: 'Column sized to its content' },
  { name: 'g-1', category: 'grid', description: 'Grid horizontal and vertical gutter: 0.25rem' },
  { name: 'g-2', category: 'grid', description: 'Grid horizontal and vertical gutter: 0.5rem' },
  { name: 'g-3', category: 'grid', description: 'Grid horizontal and vertical gutter: 1rem' },
  { name: 'g-4', category: 'grid', description: 'Grid horizontal and vertical gutter: 1.5rem' },

  // Flex Utilities
  { name: 'd-flex', category: 'utility', description: 'Display flex container' },
  { name: 'd-inline-flex', category: 'utility', description: 'Display inline-flex container' },
  { name: 'd-none', category: 'utility', description: 'Hide element' },
  { name: 'd-block', category: 'utility', description: 'Display block element' },
  { name: 'justify-content-center', category: 'utility', description: 'Justify content center' },
  { name: 'justify-content-between', category: 'utility', description: 'Justify content space-between' },
  { name: 'align-items-center', category: 'utility', description: 'Align items center' },
  { name: 'flex-column', category: 'utility', description: 'Flex direction column' },
  { name: 'flex-row', category: 'utility', description: 'Flex direction row' },

  // Buttons
  { name: 'btn', category: 'component', description: 'Base Bootstrap button' },
  { name: 'btn-primary', category: 'color', description: 'Primary action button (blue)' },
  { name: 'btn-secondary', category: 'color', description: 'Secondary button (gray)' },
  { name: 'btn-success', category: 'color', description: 'Success button (green)' },
  { name: 'btn-danger', category: 'color', description: 'Danger button (red)' },
  { name: 'btn-warning', category: 'color', description: 'Warning button (yellow)' },
  { name: 'btn-info', category: 'color', description: 'Info button (teal/cyan)' },
  { name: 'btn-light', category: 'color', description: 'Light background button' },
  { name: 'btn-dark', category: 'color', description: 'Dark button' },
  { name: 'btn-outline-primary', category: 'color', description: 'Outlined primary button' },
  { name: 'btn-outline-danger', category: 'color', description: 'Outlined danger button' },
  { name: 'btn-sm', category: 'component', description: 'Small button' },
  { name: 'btn-lg', category: 'component', description: 'Large button' },

  // Cards
  { name: 'card', category: 'component', description: 'Flexible content container' },
  { name: 'card-header', category: 'component', description: 'Header section of a card' },
  { name: 'card-body', category: 'component', description: 'Main body of a card' },
  { name: 'card-footer', category: 'component', description: 'Footer section of a card' },
  { name: 'card-title', category: 'component', description: 'Title inside a card body' },
  { name: 'card-text', category: 'component', description: 'Body text inside a card' },

  // Navbar
  { name: 'navbar', category: 'component', description: 'Responsive navigation header' },
  { name: 'navbar-expand-lg', category: 'component', description: 'Responsive collapse threshold at large screen' },
  { name: 'navbar-brand', category: 'component', description: 'Navbar company or project brand logo/text' },
  { name: 'navbar-nav', category: 'component', description: 'Full-height and lightweight navigation' },
  { name: 'nav-item', category: 'component', description: 'Navbar navigation list item' },
  { name: 'nav-link', category: 'component', description: 'Navbar link item' },

  // Alerts & Badges
  { name: 'alert', category: 'component', description: 'Feedback banner element' },
  { name: 'alert-primary', category: 'color', description: 'Primary alert banner' },
  { name: 'alert-success', category: 'color', description: 'Success alert banner' },
  { name: 'alert-danger', category: 'color', description: 'Danger alert banner' },
  { name: 'alert-warning', category: 'color', description: 'Warning alert banner' },
  { name: 'badge', category: 'component', description: 'Small pill or count indicator' },
  { name: 'bg-primary', category: 'color', description: 'Primary background color' },
  { name: 'bg-success', category: 'color', description: 'Success background color' },
  { name: 'bg-danger', category: 'color', description: 'Danger background color' },
  { name: 'bg-dark', category: 'color', description: 'Dark background color' },
  { name: 'bg-light', category: 'color', description: 'Light background color' },
  { name: 'text-primary', category: 'color', description: 'Primary text color' },
  { name: 'text-success', category: 'color', description: 'Success text color' },
  { name: 'text-danger', category: 'color', description: 'Danger text color' },
  { name: 'text-muted', category: 'color', description: 'Muted gray text' },

  // Forms
  { name: 'form-control', category: 'form', description: 'Standard text input styling' },
  { name: 'form-select', category: 'form', description: 'Custom styled HTML select element' },
  { name: 'form-check', category: 'form', description: 'Checkbox or radio wrapper' },
  { name: 'form-check-input', category: 'form', description: 'Checkbox or radio input' },
  { name: 'form-check-label', category: 'form', description: 'Label for form check' },
  { name: 'form-label', category: 'form', description: 'Label for form control' },
  { name: 'input-group', category: 'form', description: 'Attach text or buttons to input fields' },

  // Tables
  { name: 'table', category: 'component', description: 'Base table styling' },
  { name: 'table-striped', category: 'component', description: 'Zebra-striped rows' },
  { name: 'table-hover', category: 'component', description: 'Hoverable rows' },
  { name: 'table-bordered', category: 'component', description: 'Borders on all sides of table and cells' },
  { name: 'table-responsive', category: 'component', description: 'Responsive scrollable container for tables' },

  // Modal
  { name: 'modal', category: 'component', description: 'Popup dialog wrapper' },
  { name: 'modal-dialog', category: 'component', description: 'Dialog sizing and positioning container' },
  { name: 'modal-content', category: 'component', description: 'Modal body, header and footer container' },
  { name: 'modal-header', category: 'component', description: 'Header with modal title and close button' },
  { name: 'modal-body', category: 'component', description: 'Content area of modal' },
  { name: 'modal-footer', category: 'component', description: 'Actions area of modal' },
];

export const BOOTSTRAP_SNIPPETS: BootstrapComponentSnippet[] = [
  {
    label: 'bs5-template',
    detail: 'Bootstrap 5.3 HTML5 Starter Template with CDN',
    category: 'components',
    template: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bootstrap 5.3 Starter</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  </head>
  <body>
    <div class="container py-5">
      <h1 class="display-4 fw-bold">Hello, Bootstrap 5.3!</h1>
      <p class="lead">Built with velocity in Xivig Editor.</p>
      <button class="btn btn-primary">Get Started</button>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
  </body>
</html>`,
  },
  {
    label: 'bs5-navbar',
    detail: 'Bootstrap 5.3 Responsive Navbar',
    category: 'components',
    template: `<nav class="navbar navbar-expand-lg bg-body-tertiary">
  <div class="container-fluid">
    <a class="navbar-brand fw-bold" href="#">Brand</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav me-auto">
        <li class="nav-item"><a class="nav-link active" href="#">Home</a></li>
        <li class="nav-item"><a class="nav-link" href="#">Features</a></li>
        <li class="nav-item"><a class="nav-link" href="#">Pricing</a></li>
      </ul>
      <button class="btn btn-outline-primary btn-sm">Sign In</button>
    </div>
  </div>
</nav>`,
  },
  {
    label: 'bs5-card',
    detail: 'Bootstrap 5.3 Card with Header, Body, and Button',
    category: 'components',
    template: `<div class="card shadow-sm">
  <div class="card-header fw-bold">Featured</div>
  <div class="card-body">
    <h5 class="card-title">Card title</h5>
    <p class="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
    <a href="#" class="btn btn-primary">Go somewhere</a>
  </div>
</div>`,
  },
  {
    label: 'bs5-grid-3col',
    detail: 'Bootstrap 5.3 Responsive 3-Column Grid Row',
    category: 'grid',
    template: `<div class="row g-4">
  <div class="col-12 col-md-4">
    <div class="p-3 border bg-light rounded">Column 1</div>
  </div>
  <div class="col-12 col-md-4">
    <div class="p-3 border bg-light rounded">Column 2</div>
  </div>
  <div class="col-12 col-md-4">
    <div class="p-3 border bg-light rounded">Column 3</div>
  </div>
</div>`,
  },
  {
    label: 'bs5-modal',
    detail: 'Bootstrap 5.3 Modal Dialog',
    category: 'components',
    template: `<div class="modal fade" id="exampleModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Modal title</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <p>Modal body content goes here.</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>`,
  },
];

export function searchBootstrapClasses(query = ''): BootstrapClassItem[] {
  const norm = query.toLowerCase();
  if (!norm) return BOOTSTRAP_CLASSES;
  return BOOTSTRAP_CLASSES.filter((c) => c.name.toLowerCase().includes(norm));
}

export function getBootstrapSnippet(label: string): BootstrapComponentSnippet | undefined {
  return BOOTSTRAP_SNIPPETS.find((s) => s.label === label);
}

/**
 * CodeMirror 6 autocompletion source for Bootstrap 5.3 classes and snippets.
 */
export function createBootstrapCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const line = context.state.doc.lineAt(context.pos);
    const textBefore = line.text.slice(0, context.pos - line.from);

    // 1. Check if typing snippet (e.g. "bs5-")
    const snippetMatch = textBefore.match(/(bs5-[a-zA-Z0-9_-]*)$/);
    if (snippetMatch) {
      const token = snippetMatch[1];
      const from = context.pos - token.length;
      const matches = BOOTSTRAP_SNIPPETS.filter((s) => s.label.startsWith(token));
      if (matches.length > 0) {
        return {
          from,
          options: matches.map((s) => ({
            label: s.label,
            type: 'snippet',
            detail: `Bootstrap 5.3: ${s.detail}`,
            apply: s.template,
            boost: 5,
          })),
        };
      }
    }

    // 2. Check if inside class="..." or className="..."
    const classMatch = textBefore.match(/(?:class|className)\s*=\s*["']([^"']*)$/);
    if (!classMatch) return null;

    const fullValue = classMatch[1];
    const currentTokenMatch = fullValue.match(/([a-zA-Z0-9_-]*)$/);
    const token = currentTokenMatch ? currentTokenMatch[1] : '';
    const from = context.pos - token.length;

    const matches = searchBootstrapClasses(token);
    if (matches.length === 0) return null;

    return {
      from,
      options: matches.slice(0, 40).map((m) => ({
        label: m.name,
        type: 'class',
        detail: `(BS 5.3: ${m.category})`,
        info: m.description,
        boost: 2,
      })),
    };
  };
}
