import { CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import { TailwindClassItem, TailwindSettings } from './types';

export const DEFAULT_TAILWIND_SETTINGS: TailwindSettings = {
  enabled: true,
  colorPreviews: true,
  hoverCssPreview: true,
  prefix: '',
};

/**
 * Standard Tailwind CSS curated utility catalog with CSS expansions & color swatches.
 */
export const TAILWIND_UTILITIES: TailwindClassItem[] = [
  // Layout & Display
  { name: 'block', category: 'layout', cssRules: 'display: block;' },
  { name: 'inline-block', category: 'layout', cssRules: 'display: inline-block;' },
  { name: 'inline', category: 'layout', cssRules: 'display: inline;' },
  { name: 'flex', category: 'flexbox', cssRules: 'display: flex;' },
  { name: 'inline-flex', category: 'flexbox', cssRules: 'display: inline-flex;' },
  { name: 'grid', category: 'grid', cssRules: 'display: grid;' },
  { name: 'inline-grid', category: 'grid', cssRules: 'display: inline-grid;' },
  { name: 'hidden', category: 'layout', cssRules: 'display: none;' },

  // Flexbox & Alignment
  { name: 'flex-row', category: 'flexbox', cssRules: 'flex-direction: row;' },
  { name: 'flex-row-reverse', category: 'flexbox', cssRules: 'flex-direction: row-reverse;' },
  { name: 'flex-col', category: 'flexbox', cssRules: 'flex-direction: column;' },
  { name: 'flex-col-reverse', category: 'flexbox', cssRules: 'flex-direction: column-reverse;' },
  { name: 'flex-wrap', category: 'flexbox', cssRules: 'flex-wrap: wrap;' },
  { name: 'flex-nowrap', category: 'flexbox', cssRules: 'flex-wrap: nowrap;' },
  { name: 'flex-1', category: 'flexbox', cssRules: 'flex: 1 1 0%;' },
  { name: 'flex-auto', category: 'flexbox', cssRules: 'flex: 1 1 auto;' },
  { name: 'flex-initial', category: 'flexbox', cssRules: 'flex: 0 1 auto;' },
  { name: 'flex-none', category: 'flexbox', cssRules: 'flex: none;' },
  { name: 'items-start', category: 'flexbox', cssRules: 'align-items: flex-start;' },
  { name: 'items-end', category: 'flexbox', cssRules: 'align-items: flex-end;' },
  { name: 'items-center', category: 'flexbox', cssRules: 'align-items: center;' },
  { name: 'items-baseline', category: 'flexbox', cssRules: 'align-items: baseline;' },
  { name: 'items-stretch', category: 'flexbox', cssRules: 'align-items: stretch;' },
  { name: 'justify-start', category: 'flexbox', cssRules: 'justify-content: flex-start;' },
  { name: 'justify-end', category: 'flexbox', cssRules: 'justify-content: flex-end;' },
  { name: 'justify-center', category: 'flexbox', cssRules: 'justify-content: center;' },
  { name: 'justify-between', category: 'flexbox', cssRules: 'justify-content: space-between;' },
  { name: 'justify-around', category: 'flexbox', cssRules: 'justify-content: space-around;' },
  { name: 'justify-evenly', category: 'flexbox', cssRules: 'justify-content: space-evenly;' },

  // Grid
  { name: 'grid-cols-1', category: 'grid', cssRules: 'grid-template-columns: repeat(1, minmax(0, 1fr));' },
  { name: 'grid-cols-2', category: 'grid', cssRules: 'grid-template-columns: repeat(2, minmax(0, 1fr));' },
  { name: 'grid-cols-3', category: 'grid', cssRules: 'grid-template-columns: repeat(3, minmax(0, 1fr));' },
  { name: 'grid-cols-4', category: 'grid', cssRules: 'grid-template-columns: repeat(4, minmax(0, 1fr));' },
  { name: 'grid-cols-6', category: 'grid', cssRules: 'grid-template-columns: repeat(6, minmax(0, 1fr));' },
  { name: 'grid-cols-12', category: 'grid', cssRules: 'grid-template-columns: repeat(12, minmax(0, 1fr));' },
  { name: 'gap-0', category: 'grid', cssRules: 'gap: 0px;' },
  { name: 'gap-1', category: 'grid', cssRules: 'gap: 0.25rem; /* 4px */' },
  { name: 'gap-2', category: 'grid', cssRules: 'gap: 0.5rem; /* 8px */' },
  { name: 'gap-3', category: 'grid', cssRules: 'gap: 0.75rem; /* 12px */' },
  { name: 'gap-4', category: 'grid', cssRules: 'gap: 1rem; /* 16px */' },
  { name: 'gap-6', category: 'grid', cssRules: 'gap: 1.5rem; /* 24px */' },
  { name: 'gap-8', category: 'grid', cssRules: 'gap: 2rem; /* 32px */' },

  // Spacing (Padding & Margin)
  { name: 'p-0', category: 'spacing', cssRules: 'padding: 0px;' },
  { name: 'p-1', category: 'spacing', cssRules: 'padding: 0.25rem; /* 4px */' },
  { name: 'p-2', category: 'spacing', cssRules: 'padding: 0.5rem; /* 8px */' },
  { name: 'p-3', category: 'spacing', cssRules: 'padding: 0.75rem; /* 12px */' },
  { name: 'p-4', category: 'spacing', cssRules: 'padding: 1rem; /* 16px */' },
  { name: 'p-6', category: 'spacing', cssRules: 'padding: 1.5rem; /* 24px */' },
  { name: 'p-8', category: 'spacing', cssRules: 'padding: 2rem; /* 32px */' },
  { name: 'px-2', category: 'spacing', cssRules: 'padding-left: 0.5rem; padding-right: 0.5rem;' },
  { name: 'px-4', category: 'spacing', cssRules: 'padding-left: 1rem; padding-right: 1rem;' },
  { name: 'px-6', category: 'spacing', cssRules: 'padding-left: 1.5rem; padding-right: 1.5rem;' },
  { name: 'py-1', category: 'spacing', cssRules: 'padding-top: 0.25rem; padding-bottom: 0.25rem;' },
  { name: 'py-2', category: 'spacing', cssRules: 'padding-top: 0.5rem; padding-bottom: 0.5rem;' },
  { name: 'py-3', category: 'spacing', cssRules: 'padding-top: 0.75rem; padding-bottom: 0.75rem;' },
  { name: 'py-4', category: 'spacing', cssRules: 'padding-top: 1rem; padding-bottom: 1rem;' },
  { name: 'm-0', category: 'spacing', cssRules: 'margin: 0px;' },
  { name: 'm-1', category: 'spacing', cssRules: 'margin: 0.25rem; /* 4px */' },
  { name: 'm-2', category: 'spacing', cssRules: 'margin: 0.5rem; /* 8px */' },
  { name: 'm-4', category: 'spacing', cssRules: 'margin: 1rem; /* 16px */' },
  { name: 'mx-auto', category: 'spacing', cssRules: 'margin-left: auto; margin-right: auto;' },
  { name: 'my-auto', category: 'spacing', cssRules: 'margin-top: auto; margin-bottom: auto;' },

  // Sizing
  { name: 'w-full', category: 'sizing', cssRules: 'width: 100%;' },
  { name: 'w-screen', category: 'sizing', cssRules: 'width: 100vw;' },
  { name: 'w-auto', category: 'sizing', cssRules: 'width: auto;' },
  { name: 'w-1/2', category: 'sizing', cssRules: 'width: 50%;' },
  { name: 'w-1/3', category: 'sizing', cssRules: 'width: 33.333333%;' },
  { name: 'w-2/3', category: 'sizing', cssRules: 'width: 66.666667%;' },
  { name: 'h-full', category: 'sizing', cssRules: 'height: 100%;' },
  { name: 'h-screen', category: 'sizing', cssRules: 'height: 100vh;' },
  { name: 'h-auto', category: 'sizing', cssRules: 'height: auto;' },
  { name: 'max-w-sm', category: 'sizing', cssRules: 'max-width: 24rem; /* 384px */' },
  { name: 'max-w-md', category: 'sizing', cssRules: 'max-width: 28rem; /* 448px */' },
  { name: 'max-w-lg', category: 'sizing', cssRules: 'max-width: 32rem; /* 512px */' },
  { name: 'max-w-xl', category: 'sizing', cssRules: 'max-width: 36rem; /* 576px */' },
  { name: 'max-w-full', category: 'sizing', cssRules: 'max-width: 100%;' },

  // Typography
  { name: 'text-xs', category: 'typography', cssRules: 'font-size: 0.75rem; line-height: 1rem;' },
  { name: 'text-sm', category: 'typography', cssRules: 'font-size: 0.875rem; line-height: 1.25rem;' },
  { name: 'text-base', category: 'typography', cssRules: 'font-size: 1rem; line-height: 1.5rem;' },
  { name: 'text-lg', category: 'typography', cssRules: 'font-size: 1.125rem; line-height: 1.75rem;' },
  { name: 'text-xl', category: 'typography', cssRules: 'font-size: 1.25rem; line-height: 1.75rem;' },
  { name: 'text-2xl', category: 'typography', cssRules: 'font-size: 1.5rem; line-height: 2rem;' },
  { name: 'text-3xl', category: 'typography', cssRules: 'font-size: 1.875rem; line-height: 2.25rem;' },
  { name: 'font-normal', category: 'typography', cssRules: 'font-weight: 400;' },
  { name: 'font-medium', category: 'typography', cssRules: 'font-weight: 500;' },
  { name: 'font-semibold', category: 'typography', cssRules: 'font-weight: 600;' },
  { name: 'font-bold', category: 'typography', cssRules: 'font-weight: 700;' },
  { name: 'text-left', category: 'typography', cssRules: 'text-align: left;' },
  { name: 'text-center', category: 'typography', cssRules: 'text-align: center;' },
  { name: 'text-right', category: 'typography', cssRules: 'text-align: right;' },
  { name: 'truncate', category: 'typography', cssRules: 'overflow: hidden; text-overflow: ellipsis; white-space: nowrap;' },

  // Background Colors (with Hex Swatches)
  { name: 'bg-white', category: 'colors', cssRules: 'background-color: #ffffff;', colorPreview: '#ffffff' },
  { name: 'bg-black', category: 'colors', cssRules: 'background-color: #000000;', colorPreview: '#000000' },
  { name: 'bg-transparent', category: 'colors', cssRules: 'background-color: transparent;' },
  { name: 'bg-slate-50', category: 'colors', cssRules: 'background-color: #f8fafc;', colorPreview: '#f8fafc' },
  { name: 'bg-slate-100', category: 'colors', cssRules: 'background-color: #f1f5f9;', colorPreview: '#f1f5f9' },
  { name: 'bg-slate-200', category: 'colors', cssRules: 'background-color: #e2e8f0;', colorPreview: '#e2e8f0' },
  { name: 'bg-slate-800', category: 'colors', cssRules: 'background-color: #1e293b;', colorPreview: '#1e293b' },
  { name: 'bg-slate-900', category: 'colors', cssRules: 'background-color: #0f172a;', colorPreview: '#0f172a' },
  { name: 'bg-red-500', category: 'colors', cssRules: 'background-color: #ef4444;', colorPreview: '#ef4444' },
  { name: 'bg-red-600', category: 'colors', cssRules: 'background-color: #dc2626;', colorPreview: '#dc2626' },
  { name: 'bg-blue-500', category: 'colors', cssRules: 'background-color: #3b82f6;', colorPreview: '#3b82f6' },
  { name: 'bg-blue-600', category: 'colors', cssRules: 'background-color: #2563eb;', colorPreview: '#2563eb' },
  { name: 'bg-green-500', category: 'colors', cssRules: 'background-color: #22c55e;', colorPreview: '#22c55e' },
  { name: 'bg-emerald-500', category: 'colors', cssRules: 'background-color: #10b981;', colorPreview: '#10b981' },
  { name: 'bg-amber-500', category: 'colors', cssRules: 'background-color: #f59e0b;', colorPreview: '#f59e0b' },
  { name: 'bg-indigo-600', category: 'colors', cssRules: 'background-color: #4f46e5;', colorPreview: '#4f46e5' },
  { name: 'bg-purple-600', category: 'colors', cssRules: 'background-color: #9333ea;', colorPreview: '#9333ea' },
  { name: 'bg-pink-500', category: 'colors', cssRules: 'background-color: #ec4899;', colorPreview: '#ec4899' },
  { name: 'bg-cyan-500', category: 'colors', cssRules: 'background-color: #06b6d4;', colorPreview: '#06b6d4' },

  // Text Colors
  { name: 'text-white', category: 'colors', cssRules: 'color: #ffffff;', colorPreview: '#ffffff' },
  { name: 'text-black', category: 'colors', cssRules: 'color: #000000;', colorPreview: '#000000' },
  { name: 'text-slate-500', category: 'colors', cssRules: 'color: #64748b;', colorPreview: '#64748b' },
  { name: 'text-slate-700', category: 'colors', cssRules: 'color: #334155;', colorPreview: '#334155' },
  { name: 'text-slate-900', category: 'colors', cssRules: 'color: #0f172a;', colorPreview: '#0f172a' },
  { name: 'text-red-500', category: 'colors', cssRules: 'color: #ef4444;', colorPreview: '#ef4444' },
  { name: 'text-red-600', category: 'colors', cssRules: 'color: #dc2626;', colorPreview: '#dc2626' },
  { name: 'text-blue-500', category: 'colors', cssRules: 'color: #3b82f6;', colorPreview: '#3b82f6' },
  { name: 'text-blue-600', category: 'colors', cssRules: 'color: #2563eb;', colorPreview: '#2563eb' },
  { name: 'text-green-600', category: 'colors', cssRules: 'color: #16a34a;', colorPreview: '#16a34a' },
  { name: 'text-amber-600', category: 'colors', cssRules: 'color: #d97706;', colorPreview: '#d97706' },

  // Borders & Rounded
  { name: 'rounded', category: 'borders', cssRules: 'border-radius: 0.25rem; /* 4px */' },
  { name: 'rounded-sm', category: 'borders', cssRules: 'border-radius: 0.125rem; /* 2px */' },
  { name: 'rounded-md', category: 'borders', cssRules: 'border-radius: 0.375rem; /* 6px */' },
  { name: 'rounded-lg', category: 'borders', cssRules: 'border-radius: 0.5rem; /* 8px */' },
  { name: 'rounded-xl', category: 'borders', cssRules: 'border-radius: 0.75rem; /* 12px */' },
  { name: 'rounded-2xl', category: 'borders', cssRules: 'border-radius: 1rem; /* 16px */' },
  { name: 'rounded-full', category: 'borders', cssRules: 'border-radius: 9999px;' },
  { name: 'border', category: 'borders', cssRules: 'border-width: 1px;' },
  { name: 'border-2', category: 'borders', cssRules: 'border-width: 2px;' },
  { name: 'border-4', category: 'borders', cssRules: 'border-width: 4px;' },
  { name: 'border-slate-200', category: 'borders', cssRules: 'border-color: #e2e8f0;', colorPreview: '#e2e8f0' },
  { name: 'border-slate-300', category: 'borders', cssRules: 'border-color: #cbd5e1;', colorPreview: '#cbd5e1' },
  { name: 'border-blue-500', category: 'borders', cssRules: 'border-color: #3b82f6;', colorPreview: '#3b82f6' },
  { name: 'border-red-500', category: 'borders', cssRules: 'border-color: #ef4444;', colorPreview: '#ef4444' },

  // Shadows & Effects
  { name: 'shadow-sm', category: 'effects', cssRules: 'box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);' },
  { name: 'shadow', category: 'effects', cssRules: 'box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);' },
  { name: 'shadow-md', category: 'effects', cssRules: 'box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);' },
  { name: 'shadow-lg', category: 'effects', cssRules: 'box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);' },
  { name: 'shadow-xl', category: 'effects', cssRules: 'box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);' },
  { name: 'opacity-50', category: 'effects', cssRules: 'opacity: 0.5;' },
  { name: 'opacity-75', category: 'effects', cssRules: 'opacity: 0.75;' },
  { name: 'opacity-100', category: 'effects', cssRules: 'opacity: 1;' },

  // Transitions & Animations
  { name: 'transition', category: 'transitions', cssRules: 'transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;\ntransition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\ntransition-duration: 150ms;' },
  { name: 'transition-all', category: 'transitions', cssRules: 'transition-property: all;\ntransition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\ntransition-duration: 150ms;' },
  { name: 'duration-150', category: 'transitions', cssRules: 'transition-duration: 150ms;' },
  { name: 'duration-200', category: 'transitions', cssRules: 'transition-duration: 200ms;' },
  { name: 'duration-300', category: 'transitions', cssRules: 'transition-duration: 300ms;' },
  { name: 'duration-500', category: 'transitions', cssRules: 'transition-duration: 500ms;' },
  { name: 'ease-in-out', category: 'transitions', cssRules: 'transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);' },
];

const tailwindMap = new Map<string, TailwindClassItem>(
  TAILWIND_UTILITIES.map((u) => [u.name, u])
);

/**
 * Looks up a specific Tailwind utility class.
 */
export function getTailwindClass(name: string): TailwindClassItem | undefined {
  return tailwindMap.get(name);
}

/**
 * Searches Tailwind utility classes matching a prefix.
 */
export function searchTailwindClasses(prefix = ''): TailwindClassItem[] {
  const norm = prefix.toLowerCase();
  if (!norm) return TAILWIND_UTILITIES;
  return TAILWIND_UTILITIES.filter((u) => u.name.toLowerCase().startsWith(norm) || u.name.toLowerCase().includes(norm));
}

/**
 * Returns formatted CSS rule expansion for a Tailwind class (useful for hover tooltips).
 */
export function getTailwindHoverCss(className: string): string | null {
  const item = getTailwindClass(className);
  if (!item) return null;

  return `.${item.name} {\n  ${item.cssRules}\n}`;
}

/**
 * CodeMirror 6 autocompletion source for Tailwind CSS utility classes.
 */
export function createTailwindCompletionSource() {
  return (context: CompletionContext): CompletionResult | null => {
    const line = context.state.doc.lineAt(context.pos);
    const textBefore = line.text.slice(0, context.pos - line.from);

    // Only activate inside class="..." or className="..."
    const classMatch = textBefore.match(/(?:class|className)\s*=\s*["']([^"']*)$/);
    if (!classMatch) return null;

    const fullValue = classMatch[1];
    const currentTokenMatch = fullValue.match(/([a-zA-Z0-9_:-]*)$/);
    const token = currentTokenMatch ? currentTokenMatch[1] : '';
    const from = context.pos - token.length;

    const matches = searchTailwindClasses(token);
    if (matches.length === 0) return null;

    return {
      from,
      options: matches.slice(0, 50).map((m) => ({
        label: m.name,
        type: 'property',
        detail: m.colorPreview ? `🎨 ${m.colorPreview}` : m.category,
        info: `Tailwind (${m.category}):\n${m.cssRules}`,
        boost: m.colorPreview ? 3 : 2,
      })),
    };
  };
}
