import React from 'react';
import { GitBranch, AlertCircle } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { detectLanguageName } from '../editor/languageSupport';

export const StatusBar: React.FC = () => {
  const activeDoc = useEditorStore((state) => state.getActiveDocument());

  const languageName = activeDoc ? detectLanguageName(activeDoc.name || activeDoc.language) : 'Plain Text';
  const line = activeDoc?.cursor.line || 1;
  const col = activeDoc?.cursor.col || 1;

  return (
    <footer style={statusBarStyle}>
      {/* Left items */}
      <div style={sectionStyle}>
        <div style={itemStyle}>
          <GitBranch size={12} style={{ marginRight: '4px' }} />
          <span>main</span>
        </div>
        <div style={itemStyle}>
          <AlertCircle size={12} style={{ marginRight: '4px' }} />
          <span>0</span>
        </div>
      </div>

      {/* Right items */}
      <div style={sectionStyle}>
        <div style={itemStyle}>
          <span>Ln {line}, Col {col}</span>
        </div>
        <div style={itemStyle}>
          <span>Spaces: 2</span>
        </div>
        <div style={itemStyle}>
          <span>UTF-8</span>
        </div>
        <div style={itemStyle}>
          <span>LF</span>
        </div>
        <div style={{ ...itemStyle, color: 'var(--xivig-accent)', fontWeight: 500 }}>
          <span>{languageName}</span>
        </div>
      </div>
    </footer>
  );
};

const statusBarStyle: React.CSSProperties = {
  height: 'var(--xivig-statusbar-height)',
  backgroundColor: 'var(--xivig-statusbar)',
  borderTop: '1px solid var(--xivig-border-subtle)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 10px',
  fontSize: 'var(--xivig-font-size-sm)',
  color: 'var(--xivig-text-muted)',
  userSelect: 'none',
};

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const itemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
};
