import React, { useEffect } from 'react';
import { useFormatStore } from '../../formatting/formatStore';
import { Sparkles, Check, AlertTriangle, X, Terminal, Settings } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const FormattingSettingsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const formatters = useFormatStore((state) => state.formatters);
  const loadFormatters = useFormatStore((state) => state.loadFormatters);
  const defaultFormatterByLanguage = useFormatStore((state) => state.defaultFormatterByLanguage);
  const setDefaultFormatter = useFormatStore((state) => state.setDefaultFormatter);
  const formatOnSave = useFormatStore((state) => state.formatOnSave);
  const setFormatOnSave = useFormatStore((state) => state.setFormatOnSave);
  const formatOnPaste = useFormatStore((state) => state.formatOnPaste);
  const setFormatOnPaste = useFormatStore((state) => state.setFormatOnPaste);
  const lintOnSave = useFormatStore((state) => state.lintOnSave);
  const setLintOnSave = useFormatStore((state) => state.setLintOnSave);
  const organizeImportsOnSave = useFormatStore((state) => state.organizeImportsOnSave);
  const setOrganizeImportsOnSave = useFormatStore((state) => state.setOrganizeImportsOnSave);

  useEffect(() => {
    if (isOpen) {
      loadFormatters();
    }
  }, [isOpen, loadFormatters]);

  if (!isOpen) return null;

  const supportedLanguages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'typescript', name: 'TypeScript' },
    { id: 'python', name: 'Python' },
    { id: 'php', name: 'PHP / Laravel' },
    { id: 'html', name: 'HTML' },
    { id: 'css', name: 'CSS / SCSS' },
    { id: 'json', name: 'JSON' },
    { id: 'c', name: 'C / C++' },
    { id: 'rust', name: 'Rust' },
    { id: 'go', name: 'Go' },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '680px',
          maxHeight: '85vh',
          backgroundColor: 'var(--xivig-bg, #12141a)',
          border: '1px solid var(--xivig-border, #2c313d)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
          color: 'var(--xivig-text, #e5e7eb)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--xivig-border, #2c313d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} style={{ color: 'var(--xivig-accent, #6c8cff)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Formatting & Code Quality</h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--xivig-text-dim, #646b7a)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* General Toggles */}
          <div style={{ backgroundColor: 'var(--xivig-surface, #1d2028)', borderRadius: '6px', padding: '14px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 12px 0' }}>Automation Options</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formatOnSave}
                  onChange={(e) => setFormatOnSave(e.target.checked)}
                />
                Format on Save
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formatOnPaste}
                  onChange={(e) => setFormatOnPaste(e.target.checked)}
                />
                Format on Paste
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={lintOnSave}
                  onChange={(e) => setLintOnSave(e.target.checked)}
                />
                Lint & Fix on Save
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={organizeImportsOnSave}
                  onChange={(e) => setOrganizeImportsOnSave(e.target.checked)}
                />
                Organize Imports on Save
              </label>
            </div>
          </div>

          {/* Per-Language Default Formatter Selection */}
          <div style={{ backgroundColor: 'var(--xivig-surface, #1d2028)', borderRadius: '6px', padding: '14px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 12px 0' }}>Per-Language Default Formatter</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {supportedLanguages.map((lang) => {
                const current = defaultFormatterByLanguage[lang.id] || 'default';
                const availableForLang = formatters.filter(
                  (f) => f.type === 'formatter' && f.languages.includes(lang.id)
                );

                return (
                  <div
                    key={lang.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 500 }}>{lang.name}</span>
                    <select
                      value={current}
                      onChange={(e) => setDefaultFormatter(lang.id, e.target.value)}
                      style={{
                        backgroundColor: 'var(--xivig-bg, #12141a)',
                        color: 'var(--xivig-text, #e5e7eb)',
                        border: '1px solid var(--xivig-border, #2c313d)',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="prettier">Prettier</option>
                      {lang.id === 'python' && (
                        <>
                          <option value="ruff">Ruff</option>
                          <option value="black">Black</option>
                        </>
                      )}
                      {lang.id === 'php' && (
                        <>
                          <option value="pint">Laravel Pint</option>
                          <option value="php-cs-fixer">PHP-CS-Fixer</option>
                          <option value="phpcbf">PHP_CodeSniffer</option>
                        </>
                      )}
                      {lang.id === 'c' && <option value="clang-format">clang-format</option>}
                      {lang.id === 'rust' && <option value="rustfmt">rustfmt</option>}
                      {lang.id === 'go' && <option value="gofmt">gofmt</option>}
                      <option value="lsp">Language Server Protocol (LSP)</option>
                      <option value="beautify">Built-in Beautifier</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Available Formatters Status List */}
          <div style={{ backgroundColor: 'var(--xivig-surface, #1d2028)', borderRadius: '6px', padding: '14px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 12px 0' }}>Detected Tools & Formatters</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {formatters.map((fmt) => (
                <div
                  key={fmt.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 8px',
                    fontSize: '11px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: fmt.isAvailable ? '#22c55e' : '#64748b',
                      }}
                    />
                    <span style={{ fontWeight: 600 }}>{fmt.name}</span>
                    <span style={{ color: 'var(--xivig-text-dim, #646b7a)' }}>({fmt.command})</span>
                  </div>
                  <span style={{ color: fmt.isAvailable ? '#22c55e' : 'var(--xivig-text-dim, #646b7a)' }}>
                    {fmt.isAvailable ? 'Available on PATH' : 'Not installed'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid var(--xivig-border, #2c313d)',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              backgroundColor: 'var(--xivig-accent, #6c8cff)',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
