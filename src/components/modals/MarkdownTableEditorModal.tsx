import React, { useState } from 'react';
import { X, Table, Plus, Trash2, ArrowLeftRight } from 'lucide-react';
import { getActiveEditorView } from '../editor/editorViewRegistry';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const MarkdownTableEditorModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [cols, setCols] = useState<string[]>(['Header 1', 'Header 2', 'Header 3']);
  const [alignments, setAlignments] = useState<('left' | 'center' | 'right')[]>(['left', 'left', 'left']);
  const [rows, setRows] = useState<string[][]>([
    ['Row 1, Cell 1', 'Row 1, Cell 2', 'Row 1, Cell 3'],
    ['Row 2, Cell 1', 'Row 2, Cell 2', 'Row 2, Cell 3'],
  ]);

  if (!isOpen) return null;

  const addColumn = () => {
    setCols([...cols, `Header ${cols.length + 1}`]);
    setAlignments([...alignments, 'left']);
    setRows(rows.map((r) => [...r, `Data`]));
  };

  const removeColumn = (index: number) => {
    if (cols.length <= 1) return;
    setCols(cols.filter((_, i) => i !== index));
    setAlignments(alignments.filter((_, i) => i !== index));
    setRows(rows.map((r) => r.filter((_, i) => i !== index)));
  };

  const addRow = () => {
    setRows([...rows, Array(cols.length).fill('New Cell')]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateHeader = (index: number, val: string) => {
    const next = [...cols];
    next[index] = val;
    setCols(next);
  };

  const updateCell = (rowIndex: number, colIndex: number, val: string) => {
    const nextRows = rows.map((r, ri) =>
      ri === rowIndex ? r.map((c, ci) => (ci === colIndex ? val : c)) : r
    );
    setRows(nextRows);
  };

  const toggleAlignment = (index: number) => {
    const nextAlign = [...alignments];
    const curr = nextAlign[index];
    nextAlign[index] = curr === 'left' ? 'center' : curr === 'center' ? 'right' : 'left';
    setAlignments(nextAlign);
  };

  const generateMarkdownTable = (): string => {
    const headerLine = `| ${cols.join(' | ')} |`;
    const separatorLine = `| ${alignments
      .map((a) => (a === 'center' ? ':---:' : a === 'right' ? '---:' : ':---'))
      .join(' | ')} |`;
    const bodyLines = rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
    return `\n${headerLine}\n${separatorLine}\n${bodyLines}\n`;
  };

  const handleInsert = () => {
    const view = getActiveEditorView();
    const mdTable = generateMarkdownTable();
    if (view) {
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: mdTable },
      });
      onClose();
    } else {
      navigator.clipboard.writeText(mdTable);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '700px',
          maxHeight: '85vh',
          backgroundColor: 'var(--xivig-bg, #12141a)',
          border: '1px solid var(--xivig-border, #2c313d)',
          borderRadius: '8px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--xivig-text, #e5e7eb)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid var(--xivig-border, #2c313d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Table size={18} style={{ color: 'var(--xivig-accent, #6c8cff)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Markdown Table Generator</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div style={{ padding: '8px 18px', backgroundColor: 'var(--xivig-surface, #1d2028)', borderBottom: '1px solid var(--xivig-border)', display: 'flex', gap: '8px' }}>
          <button
            onClick={addColumn}
            style={{
              padding: '4px 10px',
              backgroundColor: 'var(--xivig-bg)',
              border: '1px solid var(--xivig-border)',
              borderRadius: '4px',
              color: 'var(--xivig-text)',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={12} /> Add Column
          </button>
          <button
            onClick={addRow}
            style={{
              padding: '4px 10px',
              backgroundColor: 'var(--xivig-bg)',
              border: '1px solid var(--xivig-border)',
              borderRadius: '4px',
              color: 'var(--xivig-text)',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Plus size={12} /> Add Row
          </button>
        </div>

        {/* Table Grid */}
        <div style={{ padding: '16px', flex: 1, overflowX: 'auto', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr>
                {cols.map((col, ci) => (
                  <th key={ci} style={{ padding: '6px', border: '1px solid var(--xivig-border)', backgroundColor: 'var(--xivig-surface)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => updateHeader(ci, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px',
                          background: '#12141a',
                          border: '1px solid #333',
                          color: '#fff',
                          borderRadius: '3px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => toggleAlignment(ci)}
                          title={`Alignment: ${alignments[ci]}`}
                          style={{
                            fontSize: '9px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--xivig-accent)',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                          }}
                        >
                          {alignments[ci]}
                        </button>
                        {cols.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeColumn(ci)}
                            style={{ background: 'none', border: 'none', color: '#ef6464', cursor: 'pointer', padding: 0 }}
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </th>
                ))}
                <th style={{ width: '32px' }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>
                  {row.map((cell, ci) => (
                    <td key={ci} style={{ padding: '4px', border: '1px solid var(--xivig-border)' }}>
                      <input
                        type="text"
                        value={cell}
                        onChange={(e) => updateCell(ri, ci, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px',
                          background: '#181b24',
                          border: '1px solid #282c37',
                          color: 'var(--xivig-text)',
                          borderRadius: '3px',
                          fontSize: '11px',
                        }}
                      />
                    </td>
                  ))}
                  <td style={{ textAlign: 'center', padding: '2px' }}>
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(ri)}
                        style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid var(--xivig-border)', display: 'flex', justifyContent: 'flex-end', gap: '8px', background: 'var(--xivig-surface)' }}>
          <button
            onClick={onClose}
            style={{
              padding: '6px 12px',
              backgroundColor: 'transparent',
              border: '1px solid var(--xivig-border)',
              borderRadius: '4px',
              color: 'var(--xivig-text)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            style={{
              padding: '6px 16px',
              backgroundColor: 'var(--xivig-accent, #6c8cff)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Insert Table
          </button>
        </div>
      </div>
    </div>
  );
};
