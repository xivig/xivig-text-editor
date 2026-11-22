import { useEditorStore } from '../stores/editorStore';
import { useFileStore } from '../stores/fileStore';
import { FileItem } from '../types/editor';

const COMPLEMENTS: Record<string, string[]> = {
  cpp: ['h', 'hpp', 'hxx', 'hh', 'inl'],
  cxx: ['h', 'hpp', 'hxx', 'hh', 'inl'],
  cc: ['h', 'hpp', 'hxx', 'hh'],
  c: ['h'],
  h: ['c', 'cpp', 'cc', 'cxx'],
  hpp: ['cpp', 'cxx', 'cc'],
  hxx: ['cxx', 'cpp'],
  hh: ['cc', 'cpp'],
  ts: ['test.ts', 'spec.ts', 'css', 'scss'],
  tsx: ['css', 'scss', 'module.css', 'test.tsx', 'spec.tsx'],
  js: ['test.js', 'spec.js', 'css'],
  jsx: ['css', 'scss', 'module.css', 'test.jsx'],
  html: ['css', 'js', 'ts'],
  css: ['html', 'tsx', 'jsx', 'ts', 'js'],
};

export async function switchSiblingFile(sideBySide = false) {
  const activeDoc = useEditorStore.getState().getActiveDocument();
  if (!activeDoc || !activeDoc.path) return false;

  const currentPath = activeDoc.path;
  const lastDot = currentPath.lastIndexOf('.');
  if (lastDot === -1) return false;

  const basePath = currentPath.substring(0, lastDot);
  const ext = currentPath.substring(lastDot + 1).toLowerCase();
  const targetExts = COMPLEMENTS[ext] || [];

  if (targetExts.length === 0) return false;

  for (const tExt of targetExts) {
    const candidatePath = `${basePath}.${tExt}`;
    if (window.xivig?.readFile) {
      const res = await window.xivig.readFile(candidatePath);
      if (res.success && res.content !== undefined) {
        const candidateName = candidatePath.replace(/^.*[\\/]/, '');
        if (sideBySide) {
          useEditorStore.getState().setSplitLayout('two-columns');
          useEditorStore.getState().setActivePane('secondary');
        }
        useEditorStore.getState().openDocument({
          path: candidatePath,
          name: candidateName,
          content: res.content,
          language: candidateName,
        });
        return true;
      }
    }
  }

  return false;
}
