import React, { useState, useMemo, useEffect } from 'react';
import {
  Code,
  CheckCircle,
  AlertTriangle,
  Info,
  Terminal,
  Play,
  Sliders,
  Hash,
  Layers,
  Search,
} from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useTaskStore } from '../../stores/taskStore';
import { validateHtmlDocument, ValidationIssue } from './htmlValidator';
import { extractHtmlOutline, HtmlOutlineNode } from './htmlOutline';
import { calculateCssSpecificity, extractCssVariables, extractCssClasses } from './cssTools';
import { getActiveEditorView } from '../editor/editorViewRegistry';

interface Props {
  onOpenCssHelpers?: (tab?: 'flexbox' | 'grid' | 'gradient' | 'animation') => void;
}

export const WebToolkitPanel: React.FC<Props> = ({ onOpenCssHelpers }) => {
  const [activeTab, setActiveTab] = useState<'outline' | 'audit' | 'css' | 'npm'>('outline');
  const [cssSelectorTest, setCssSelectorTest] = useState('div.container > button:hover');
  const [packageScripts, setPackageScripts] = useState<Record<string, string>>({});

  const activeDoc = useEditorStore((state) =>
    state.documents.find((d) => d.id === state.activeDocumentId)
  );
  const currentFolderPath = useFileStore((state) => state.currentFolderPath);
  const runTask = useTaskStore((state) => state.runTask);

  const docText = activeDoc?.content || '';
  const isHtml = activeDoc?.name?.endsWith('.html') || activeDoc?.language === 'html';
  const isCss = activeDoc?.name?.endsWith('.css') || activeDoc?.language === 'css';

  // 1. HTML Validation & Audit
  const auditIssues = useMemo<ValidationIssue[]>(() => {
    if (!docText) return [];
    return validateHtmlDocument(docText);
  }, [docText]);

  // 2. HTML Document Outline
  const outlineNodes = useMemo<HtmlOutlineNode[]>(() => {
    if (!docText) return [];
    return extractHtmlOutline(docText);
  }, [docText]);

  // 3. CSS Properties & Specificity
  const specificity = useMemo(() => {
    return calculateCssSpecificity(cssSelectorTest);
  }, [cssSelectorTest]);

  const cssVariables = useMemo(() => {
    if (!isCss && !isHtml) return [];
    return extractCssVariables(docText);
  }, [docText, isCss, isHtml]);

  const cssClasses = useMemo(() => {
    if (!isCss) return [];
    return extractCssClasses(docText);
  }, [docText, isCss]);

  // 4. Discover NPM scripts from workspace package.json
  useEffect(() => {
    async function loadNpmScripts() {
      if (!currentFolderPath || !window.xivig?.readFile) return;
      try {
        const pkgPath = `${currentFolderPath.replace(/\\/g, '/')}/package.json`;
        const res = await window.xivig.readFile(pkgPath);
        if (res.success && res.content) {
          const parsed = JSON.parse(res.content);
          if (parsed.scripts) {
            setPackageScripts(parsed.scripts);
          }
        }
      } catch {
        // Not a node project or no package.json
      }
    }
    loadNpmScripts();
  }, [currentFolderPath]);

  // Jump editor cursor to line
  const jumpToLine = (line: number, col = 1) => {
    const view = getActiveEditorView();
    if (!view) return;
    try {
      const doc = view.state.doc;
      const targetLine = Math.min(Math.max(1, line), doc.lines);
      const linePos = doc.line(targetLine).from + Math.max(0, col - 1);
      view.dispatch({
        selection: { anchor: linePos },
        scrollIntoView: true,
      });
      view.focus();
    } catch (e) {
      console.warn('Unable to jump to line:', e);
    }
  };

  const renderOutlineTree = (nodes: HtmlOutlineNode[]) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {nodes.map((node) => (
          <div key={node.id} style={{ marginLeft: `${node.depth * 10}px` }}>
            <div
              onClick={() => jumpToLine(node.line, node.col)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 6px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '11px',
                color: 'var(--xivig-text, #e5e7eb)',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--xivig-surface-hover, #232733)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <span style={{ color: 'var(--xivig-accent, #6c8cff)', fontWeight: 600 }}>&lt;{node.tag}&gt;</span>
              {node.elementId && (
                <span style={{ color: '#e6ad45' }}>#{node.elementId}</span>
              )}
              {node.classes.length > 0 && (
                <span style={{ color: '#35b779' }}>.{node.classes.join('.')}</span>
              )}
              {node.textSnippet && (
                <span style={{ color: 'var(--xivig-text-dim, #777)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  "{node.textSnippet}"
                </span>
              )}
              <span style={{ marginLeft: 'auto', fontSize: '9px', color: 'var(--xivig-text-dim, #666)' }}>
                :{node.line}
              </span>
            </div>
            {node.children.length > 0 && renderOutlineTree(node.children)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'var(--xivig-text)' }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--xivig-border)', backgroundColor: 'var(--xivig-surface)' }}>
        <button
          onClick={() => setActiveTab('outline')}
          style={{
            flex: 1,
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'outline' ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
            borderBottom: activeTab === 'outline' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
          }}
        >
          Outline
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          style={{
            flex: 1,
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'audit' ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
            borderBottom: activeTab === 'audit' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
          }}
        >
          Audit ({auditIssues.length})
        </button>
        <button
          onClick={() => setActiveTab('css')}
          style={{
            flex: 1,
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'css' ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
            borderBottom: activeTab === 'css' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
          }}
        >
          CSS
        </button>
        <button
          onClick={() => setActiveTab('npm')}
          style={{
            flex: 1,
            padding: '8px 4px',
            background: 'none',
            border: 'none',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            color: activeTab === 'npm' ? 'var(--xivig-accent)' : 'var(--xivig-text-dim)',
            borderBottom: activeTab === 'npm' ? '2px solid var(--xivig-accent)' : '2px solid transparent',
          }}
        >
          Scripts
        </button>
      </div>

      {/* Quick Visual Helper Button Bar */}
      {onOpenCssHelpers && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--xivig-border)', display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onOpenCssHelpers('flexbox')}
            style={{
              flex: 1,
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 600,
              backgroundColor: 'var(--xivig-surface)',
              border: '1px solid var(--xivig-border)',
              borderRadius: '4px',
              color: 'var(--xivig-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Sliders size={12} /> Flexbox
          </button>
          <button
            onClick={() => onOpenCssHelpers('grid')}
            style={{
              flex: 1,
              padding: '4px 8px',
              fontSize: '10px',
              fontWeight: 600,
              backgroundColor: 'var(--xivig-surface)',
              border: '1px solid var(--xivig-border)',
              borderRadius: '4px',
              color: 'var(--xivig-text)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <Layers size={12} /> Grid
          </button>
        </div>
      )}

      {/* Body Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {/* TAB 1: HTML OUTLINE */}
        {activeTab === 'outline' && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
              DOM Outline {outlineNodes.length > 0 && `(${outlineNodes.length} roots)`}
            </div>
            {outlineNodes.length > 0 ? (
              renderOutlineTree(outlineNodes)
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--xivig-text-dim)', textAlign: 'center', marginTop: '20px' }}>
                Open an HTML file to view its structural DOM outline.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AUDIT & ACCESSIBILITY */}
        {activeTab === 'audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {auditIssues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: '#35b779' }}>
                <CheckCircle size={24} style={{ marginBottom: '6px' }} />
                <div style={{ fontSize: '13px', fontWeight: 600 }}>All Checks Passed!</div>
                <div style={{ fontSize: '11px', color: 'var(--xivig-text-dim)', marginTop: '4px' }}>
                  No accessibility (a11y), SEO, or HTML structure violations detected.
                </div>
              </div>
            ) : (
              auditIssues.map((issue) => (
                <div
                  key={issue.id}
                  onClick={() => jumpToLine(issue.line, issue.col)}
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--xivig-surface)',
                    borderLeft: `3px solid ${
                      issue.severity === 'error' ? '#ef6464' : issue.severity === 'warning' ? '#e6ad45' : '#6c8cff'
                    }`,
                    cursor: 'pointer',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '9px', color: 'var(--xivig-text-dim)' }}>
                      {issue.category} • {issue.rule}
                    </span>
                    <span style={{ fontSize: '9px', color: 'var(--xivig-text-dim)' }}>Line {issue.line}</span>
                  </div>
                  <div style={{ color: 'var(--xivig-text)', fontWeight: 500, marginBottom: '2px' }}>{issue.message}</div>
                  {issue.suggestion && (
                    <div style={{ color: 'var(--xivig-text-dim)', fontStyle: 'italic', fontSize: '10px' }}>
                      Tip: {issue.suggestion}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: CSS SPECIFICITY & VARIABLES */}
        {activeTab === 'css' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Specificity Calculator */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-dim)', marginBottom: '6px', textTransform: 'uppercase' }}>
                Selector Specificity Calculator
              </div>
              <input
                type="text"
                value={cssSelectorTest}
                onChange={(e) => setCssSelectorTest(e.target.value)}
                placeholder="Enter CSS selector..."
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  fontSize: '11px',
                  backgroundColor: 'var(--xivig-surface)',
                  border: '1px solid var(--xivig-border)',
                  borderRadius: '4px',
                  color: 'var(--xivig-text)',
                  marginBottom: '6px',
                  outline: 'none',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px',
                  backgroundColor: 'var(--xivig-surface)',
                  borderRadius: '4px',
                  fontSize: '11px',
                }}
              >
                <div>
                  <span style={{ color: 'var(--xivig-accent)', fontWeight: 700 }}>({specificity.a}, {specificity.b}, {specificity.c})</span>
                  <span style={{ marginLeft: '6px', color: 'var(--xivig-text-dim)' }}>Score: {specificity.score}</span>
                </div>
                <span style={{ fontWeight: 600, color: specificity.a > 0 ? '#ef6464' : specificity.b > 0 ? '#e6ad45' : '#35b779' }}>
                  {specificity.a > 0 ? 'High' : specificity.b > 0 ? 'Medium' : 'Low'}
                </span>
              </div>
            </div>

            {/* CSS Variables Found in Document */}
            {cssVariables.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-dim)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  CSS Variables ({cssVariables.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {cssVariables.map((v) => (
                    <div
                      key={v.name}
                      onClick={() => jumpToLine(v.line)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 6px',
                        backgroundColor: 'var(--xivig-surface)',
                        borderRadius: '3px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ color: 'var(--xivig-accent)', fontWeight: 600 }}>{v.name}</span>
                      <span style={{ color: 'var(--xivig-text-dim)', fontSize: '10px' }}>{v.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CSS Classes Found in Document */}
            {cssClasses.length > 0 && (
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-dim)', marginBottom: '6px', textTransform: 'uppercase' }}>
                  Declared Classes ({cssClasses.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {cssClasses.map((c) => (
                    <span
                      key={c.name}
                      onClick={() => jumpToLine(c.line)}
                      style={{
                        padding: '2px 6px',
                        backgroundColor: 'rgba(108, 140, 255, 0.15)',
                        border: '1px solid rgba(108, 140, 255, 0.3)',
                        borderRadius: '3px',
                        fontSize: '10px',
                        color: 'var(--xivig-accent)',
                        cursor: 'pointer',
                      }}
                    >
                      .{c.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: NPM SCRIPTS */}
        {activeTab === 'npm' && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--xivig-text-dim)', marginBottom: '8px', textTransform: 'uppercase' }}>
              Project NPM Scripts
            </div>
            {Object.keys(packageScripts).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {Object.entries(packageScripts).map(([name, cmd]) => (
                  <div
                    key={name}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      backgroundColor: 'var(--xivig-surface)',
                      borderRadius: '4px',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--xivig-text)' }}>{name}</div>
                      <div style={{ color: 'var(--xivig-text-dim)', fontSize: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cmd}
                      </div>
                    </div>
                    <button
                      onClick={() => runTask({ label: `npm run ${name}`, command: `npm run ${name}`, type: 'shell' })}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'var(--xivig-accent)',
                        border: 'none',
                        borderRadius: '3px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '10px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Play size={10} /> Run
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '12px', color: 'var(--xivig-text-dim)', textAlign: 'center', marginTop: '20px' }}>
                No package.json found in the active workspace.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
