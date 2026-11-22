import { hoverTooltip, EditorView, Tooltip } from '@codemirror/view';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';

export interface HtmlLink {
  raw: string;
  type: 'stylesheet' | 'script';
  url: string;
  from: number;
  to: number;
}

/**
 * Extracts local relative links (<link ... href="..."> and <script ... src="...">) from HTML content.
 */
export function extractHtmlLinks(content: string): HtmlLink[] {
  const links: HtmlLink[] = [];

  // 1. Match <link ... href="..." ...>
  const linkRegex = /<link\s+[^>]*?href=(["'])(.*?)\1[^>]*?>/gi;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(content)) !== null) {
    const fullTag = match[0];
    const url = match[2].trim();

    // Ignore remote URLs, hashes, or empty strings
    if (!url || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//') || url.startsWith('#') || url.startsWith('data:')) {
      continue;
    }

    // Check if it's a stylesheet or css file
    const isStylesheet = /rel=(["'])stylesheet\1/i.test(fullTag) || url.toLowerCase().endsWith('.css');
    if (!isStylesheet) continue;

    const hrefAttrIndex = fullTag.indexOf(match[1] + match[2] + match[1]);
    const quoteStart = match.index + hrefAttrIndex + 1;
    const quoteEnd = quoteStart + url.length;

    links.push({
      raw: fullTag,
      type: 'stylesheet',
      url,
      from: quoteStart,
      to: quoteEnd,
    });
  }

  // 2. Match <script ... src="..." ...>
  const scriptRegex = /<script\s+[^>]*?src=(["'])(.*?)\1[^>]*?>/gi;
  while ((match = scriptRegex.exec(content)) !== null) {
    const fullTag = match[0];
    const url = match[2].trim();

    if (!url || url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//') || url.startsWith('#') || url.startsWith('data:')) {
      continue;
    }

    const srcAttrIndex = fullTag.indexOf(match[1] + match[2] + match[1]);
    const quoteStart = match.index + srcAttrIndex + 1;
    const quoteEnd = quoteStart + url.length;

    links.push({
      raw: fullTag,
      type: 'script',
      url,
      from: quoteStart,
      to: quoteEnd,
    });
  }

  return links;
}

/**
 * Resolves a relative link path to an absolute path.
 */
export function resolveLinkPath(
  relUrl: string,
  docPath: string | null,
  workspaceRoot: string | null
): string {
  const cleanUrl = relUrl.replace(/^\.\//, '');

  if (docPath) {
    // Replace backslashes
    const normalized = docPath.replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    const dir = lastSlash !== -1 ? normalized.slice(0, lastSlash) : normalized;
    return `${dir}/${cleanUrl}`;
  }

  if (workspaceRoot) {
    const normalized = workspaceRoot.replace(/\\/g, '/');
    return `${normalized}/${cleanUrl}`;
  }

  return cleanUrl;
}

/**
 * Checks if a file exists on disk.
 */
export async function checkFileExists(filePath: string): Promise<boolean> {
  if (!filePath || !window.xivig?.readFile) return false;
  try {
    const res = await window.xivig.readFile(filePath);
    return Boolean(res && res.success);
  } catch {
    return false;
  }
}

/**
 * Creates the missing linked file and opens it in an editor tab.
 */
export async function createAndOpenLinkedFile(
  linkUrl: string,
  currentDocPath: string | null,
  workspaceRoot: string | null
): Promise<boolean> {
  const isCss = linkUrl.toLowerCase().endsWith('.css') || !linkUrl.includes('.');
  const fileName = linkUrl.split('/').pop() || (isCss ? 'style.css' : 'script.js');
  const targetPath = resolveLinkPath(linkUrl, currentDocPath, workspaceRoot);

  const initialContent = isCss
    ? `/* ${fileName} */\n* {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}\n\nbody {\n  font-family: sans-serif;\n  line-height: 1.6;\n}\n`
    : `// ${fileName}\nconsole.log('${fileName} initialized');\n`;

  // If we have access to Electron file creation
  if (window.xivig?.createFileOrFolder && (currentDocPath || workspaceRoot)) {
    try {
      await window.xivig.createFileOrFolder(targetPath, false);

      if (window.xivig.saveFile) {
        await window.xivig.saveFile(targetPath, initialContent);
      }

      // Refresh workspace explorer tree
      useFileStore.getState().refreshCurrentFolder();

      // Open new tab
      useEditorStore.getState().openDocument({
        path: targetPath,
        name: fileName,
        content: initialContent,
        language: isCss ? 'css' : 'javascript',
      });

      return true;
    } catch (err) {
      console.error('Failed to create linked file on disk:', err);
    }
  }

  // Fallback if unsaved in-memory session
  useEditorStore.getState().openDocument({
    id: `doc_${Date.now()}_${fileName}`,
    path: null,
    name: fileName,
    content: initialContent,
    language: isCss ? 'css' : 'javascript',
  });

  return true;
}

/**
 * CodeMirror 6 Hover Tooltip for linked files in HTML.
 */
export const htmlLinkedFilesTooltip = hoverTooltip(async (view, pos, side): Promise<Tooltip | null> => {
  const docText = view.state.doc.toString();
  const links = extractHtmlLinks(docText);

  // Find if cursor is hovered inside a link URL
  const hovered = links.find((l) => pos >= l.from && pos <= l.to);
  if (!hovered) return null;

  const currentDoc = useEditorStore.getState().getActiveDocument();
  const currentPath = currentDoc?.path || null;
  const workspaceRoot = useFileStore.getState().currentFolderPath || null;
  const resolvedPath = resolveLinkPath(hovered.url, currentPath, workspaceRoot);

  const exists = await checkFileExists(resolvedPath);
  const fileName = hovered.url.split('/').pop() || hovered.url;

  return {
    pos: hovered.from,
    end: hovered.to,
    above: true,
    create() {
      const dom = document.createElement('div');
      dom.style.display = 'flex';
      dom.style.alignItems = 'center';
      dom.style.gap = '8px';
      dom.style.padding = '6px 10px';
      dom.style.fontSize = '12px';
      dom.style.fontFamily = 'var(--xivig-font-ui)';
      dom.style.backgroundColor = 'var(--xivig-surface)';
      dom.style.border = '1px solid var(--xivig-border)';
      dom.style.borderRadius = '4px';
      dom.style.boxShadow = '0 6px 18px rgba(0,0,0,0.4)';
      dom.style.color = 'var(--xivig-text)';

      if (exists) {
        dom.innerHTML = `
          <span style="color: var(--xivig-accent); font-weight: 500;">🔗 ${fileName}</span>
          <span style="color: var(--xivig-text-dim); font-size: 11px;">(File exists)</span>
        `;
        const openBtn = document.createElement('button');
        openBtn.textContent = 'Open File';
        openBtn.style.padding = '3px 8px';
        openBtn.style.borderRadius = '3px';
        openBtn.style.backgroundColor = 'var(--xivig-accent)';
        openBtn.style.color = '#ffffff';
        openBtn.style.fontSize = '11px';
        openBtn.style.fontWeight = '500';
        openBtn.style.cursor = 'pointer';

        openBtn.onclick = async () => {
          if (window.xivig?.readFile) {
            const res = await window.xivig.readFile(resolvedPath);
            if (res.success && res.content !== undefined) {
              useEditorStore.getState().openDocument({
                path: resolvedPath,
                name: fileName,
                content: res.content,
                language: fileName.endsWith('.css') ? 'css' : 'javascript',
              });
            }
          }
        };

        dom.appendChild(openBtn);
      } else {
        dom.innerHTML = `
          <span style="color: var(--xivig-warning); font-weight: 600;">⚠️ ${fileName}</span>
          <span style="color: var(--xivig-text-muted); font-size: 11px;">does not exist</span>
        `;
        const createBtn = document.createElement('button');
        createBtn.innerHTML = `➕ Create <strong>${fileName}</strong>`;
        createBtn.style.padding = '3px 8px';
        createBtn.style.borderRadius = '3px';
        createBtn.style.backgroundColor = 'var(--xivig-accent)';
        createBtn.style.color = '#ffffff';
        createBtn.style.fontSize = '11px';
        createBtn.style.fontWeight = '600';
        createBtn.style.cursor = 'pointer';

        createBtn.onclick = async () => {
          await createAndOpenLinkedFile(hovered.url, currentPath, workspaceRoot);
        };

        dom.appendChild(createBtn);
      }

      return { dom };
    },
  };
});
