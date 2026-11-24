import React, { useEffect, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { ChevronRight, Code } from 'lucide-react';

interface StickyScrollProps {
  view: EditorView | null;
  content: string;
}

interface ScopeItem {
  line: number;
  text: string;
  depth: number;
}

export const StickyScroll: React.FC<StickyScrollProps> = ({ view, content }) => {
  const [activeScope, setActiveScope] = useState<ScopeItem | null>(null);

  useEffect(() => {
    if (!view) {
      setActiveScope(null);
      return;
    }

    const scroller = view.scrollDOM;

    const updateScope = () => {
      const scrollTop = scroller.scrollTop;
      if (scrollTop < 40) {
        setActiveScope(null);
        return;
      }

      try {
        // Find visible top line in editor view
        const topBlock = view.lineBlockAtHeight(scrollTop + 10);
        const currentLineNum = view.state.doc.lineAt(topBlock.from).number;

        // Scan backwards from current line to find the enclosing function, class, or block
        const lines = content.split('\n');
        let foundScope: ScopeItem | null = null;

        // Common definition patterns across JS, TS, Python, PHP, Rust, Go, C++, HTML
        const scopeRegex = /^\s*(export\s+)?(async\s+)?(function|class|interface|type|const\s+[a-zA-Z0-9_]+\s*=|enum|def\s+|class\s+|fn\s+|impl\s+|struct\s+|pub\s+fn|func\s+|public\s+function|private\s+function|protected\s+function|<[a-zA-Z0-9_-]+(\s+[^>]*)?>|#{1,6}\s+)/;

        for (let i = currentLineNum - 1; i >= Math.max(0, currentLineNum - 150); i--) {
          const lineText = lines[i] || '';
          const match = lineText.match(scopeRegex);
          if (match) {
            const trimmed = lineText.trim();
            // Don't show closing braces or one-liners
            if (trimmed.length > 2 && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
              const indent = lineText.search(/\S|$/);
              foundScope = {
                line: i + 1,
                text: trimmed.replace(/\{$/, '').trim(),
                depth: Math.floor(indent / 2),
              };
              break;
            }
          }
        }

        setActiveScope(foundScope);
      } catch (err) {
        setActiveScope(null);
      }
    };

    updateScope();
    scroller.addEventListener('scroll', updateScope, { passive: true });
    return () => scroller.removeEventListener('scroll', updateScope);
  }, [view, content]);

  if (!activeScope) return null;

  const handleClick = () => {
    if (!view) return;
    try {
      const targetLine = view.state.doc.line(activeScope.line);
      view.dispatch({
        selection: { anchor: targetLine.from },
        scrollIntoView: true,
      });
      view.focus();
    } catch (e) {}
  };

  return (
    <div
      onClick={handleClick}
      style={stickyContainerStyle}
      title={`Line ${activeScope.line}: Click to jump to scope definition`}
    >
      <div style={stickyContentStyle}>
        <Code size={13} style={{ color: 'var(--xivig-accent)', marginRight: '6px', flexShrink: 0 }} />
        <span style={lineBadgeStyle}>L{activeScope.line}</span>
        <span style={scopeTextStyle}>{activeScope.text}</span>
      </div>
    </div>
  );
};

const stickyContainerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: '80px', // Leave space for minimap
  zIndex: 15,
  backgroundColor: 'var(--xivig-surface, #1e222b)',
  borderBottom: '1px solid var(--xivig-border, #2c313d)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
  cursor: 'pointer',
  padding: '4px 12px',
  display: 'flex',
  alignItems: 'center',
  userSelect: 'none',
  transition: 'background-color 0.15s ease',
};

const stickyContentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  width: '100%',
};

const lineBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 600,
  padding: '1px 5px',
  borderRadius: '3px',
  backgroundColor: 'rgba(108, 140, 255, 0.15)',
  color: 'var(--xivig-accent, #6c8cff)',
  marginRight: '8px',
  flexShrink: 0,
};

const scopeTextStyle: React.CSSProperties = {
  fontFamily: 'var(--xivig-font-mono, monospace)',
  fontSize: '12px',
  color: 'var(--xivig-text, #e1e4ea)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
