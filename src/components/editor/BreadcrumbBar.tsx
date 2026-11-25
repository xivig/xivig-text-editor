import React, { useMemo } from 'react';
import { ChevronRight, Folder } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useUIStore } from '../../stores/uiStore';
import { FileIcon } from '../common/FileIcon';
import { extractDocumentSymbols, ExtractedSymbol } from './codeIntelligence';

interface BreadcrumbBarProps {
  pane?: 'primary' | 'secondary';
}

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({ pane = 'primary' }) => {
  const activeDocId = useEditorStore((state) => (pane === 'secondary' ? state.secondaryDocumentId : state.activeDocumentId));
  const documents = useEditorStore((state) => state.documents);
  const openQuickOpenWithMode = useUIStore((state) => state.openQuickOpenWithMode);

  const activeDoc = useMemo(() => {
    return documents.find((d) => d.id === activeDocId);
  }, [documents, activeDocId]);

  // Determine path segments
  const pathSegments = useMemo(() => {
    if (!activeDoc) return [];
    const rawPath = activeDoc.path || activeDoc.name;
    const cleanPath = rawPath.replace(/\\/g, '/');
    const parts = cleanPath.split('/').filter(Boolean);
    return parts;
  }, [activeDoc?.path, activeDoc?.name]);

  // Determine active symbol at cursor
  const activeSymbol = useMemo<ExtractedSymbol | null>(() => {
    if (!activeDoc || !activeDoc.cursor || !activeDoc.content) return null;
    const currentLine = activeDoc.cursor.line;

    try {
      const symbols = extractDocumentSymbols(activeDoc.content, activeDoc.language || 'js');
      // Find the closest symbol defined at or before the current cursor line
      let bestMatch: ExtractedSymbol | null = null;
      for (const sym of symbols) {
        if (sym.line <= currentLine) {
          if (!bestMatch || sym.line > bestMatch.line) {
            bestMatch = sym;
          }
        }
      }
      return bestMatch;
    } catch {
      return null;
    }
  }, [activeDoc?.content, activeDoc?.cursor?.line, activeDoc?.language]);

  if (!activeDoc) return null;

  const fileName = activeDoc.name;
  const folderParts = pathSegments.length > 1 ? pathSegments.slice(0, -1) : [];

  return (
    <div style={containerStyle}>
      {/* Folder Crumbs */}
      {folderParts.map((folder, idx) => (
        <React.Fragment key={idx}>
          <div
            style={crumbItemStyle}
            title={`Folder: ${folder}`}
            onClick={() => openQuickOpenWithMode('')}
          >
            <Folder size={11} style={{ marginRight: '4px', opacity: 0.6 }} />
            <span>{folder}</span>
          </div>
          <ChevronRight size={11} style={separatorStyle} />
        </React.Fragment>
      ))}

      {/* File Crumb */}
      <div
        style={activeFileCrumbStyle}
        title={`File: ${fileName}`}
        onClick={() => openQuickOpenWithMode('')}
      >
        <FileIcon filename={fileName} size={12} style={{ marginRight: '5px' }} />
        <span style={{ fontWeight: 500 }}>{fileName}</span>
      </div>

      {/* Symbol Crumb (Active function / class at cursor) */}
      {activeSymbol && (
        <>
          <ChevronRight size={11} style={separatorStyle} />
          <div
            style={symbolCrumbStyle}
            title={`Symbol: ${activeSymbol.name} (Line ${activeSymbol.line}) - Click to browse symbols (@)`}
            onClick={() => openQuickOpenWithMode('@')}
          >
            <span style={symbolBadgeStyle}>
              {activeSymbol.kind === 'function' || activeSymbol.kind === 'method'
                ? 'ƒ'
                : activeSymbol.kind === 'class'
                ? 'C'
                : activeSymbol.kind === 'interface'
                ? 'I'
                : activeSymbol.kind === 'heading'
                ? '#'
                : 'v'}
            </span>
            <span style={{ color: 'var(--xivig-text)' }}>{activeSymbol.name}</span>
          </div>
        </>
      )}
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  height: '26px',
  minHeight: '26px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 14px',
  backgroundColor: 'var(--xivig-editor)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  fontSize: '11px',
  color: 'var(--xivig-text-dim, #888)',
  fontFamily: 'var(--xivig-font-ui, system-ui, sans-serif)',
  userSelect: 'none',
  overflowX: 'auto',
  whiteSpace: 'nowrap',
  scrollbarWidth: 'none',
  zIndex: 5,
};

const crumbItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '2px 6px',
  borderRadius: '4px',
  transition: 'color 0.15s, background-color 0.15s',
};

const activeFileCrumbStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  color: '#ffffff',
  cursor: 'pointer',
  padding: '2px 6px',
  borderRadius: '4px',
  fontWeight: 500,
};

const separatorStyle: React.CSSProperties = {
  margin: '0 4px',
  color: 'rgba(255, 255, 255, 0.2)',
  flexShrink: 0,
};

const symbolCrumbStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  padding: '2px 8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(108, 140, 255, 0.08)',
  border: '1px solid rgba(108, 140, 255, 0.2)',
};

const symbolBadgeStyle: React.CSSProperties = {
  color: '#6c8cff',
  fontFamily: 'var(--xivig-font-mono, monospace)',
  fontWeight: 'bold',
  fontSize: '11px',
  marginRight: '5px',
};
