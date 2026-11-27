import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  FolderOpen,
  Plus,
  Terminal,
  Zap,
  Check,
  ExternalLink,
  Code2,
  Keyboard,
  Clock,
  Sparkles,
  BookOpen,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import logoUrl from '../../assets/logo.png';
import { useEditorStore, WELCOME_MARKDOWN_CONTENT } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { detectLanguageName } from '../editor/languageSupport';
import pkg from '../../../package.json';

export const WelcomeView: React.FC = () => {
  const [viewMode, setViewMode] = useState<'modern' | 'markdown'>('modern');
  const [appVersion, setAppVersion] = useState(pkg.version || '2.0.1');

  const settings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const createNewDocument = useEditorStore((state) => state.createNewDocument);
  const openDocument = useEditorStore((state) => state.openDocument);

  const recentWorkspaces = useFileStore((state) => state.recentWorkspaces);
  const recentFiles = useFileStore((state) => state.recentFiles);
  const setCurrentFolder = useFileStore((state) => state.setCurrentFolder);

  const openCommandPalette = useUIStore((state) => state.openCommandPalette);
  const openQuickOpen = useUIStore((state) => state.openQuickOpen);
  const toggleBottomPanel = useUIStore((state) => state.toggleBottomPanel);
  const openBuildSystemModal = useUIStore((state) => state.openBuildSystemModal);

  useEffect(() => {
    if (window.xivig?.getAppInfo) {
      window.xivig.getAppInfo().then((info) => {
        if (info?.version) {
          setAppVersion(info.version);
        }
      }).catch(() => {});
    }
  }, []);

  const handleOpenFile = async () => {
    if (window.xivig?.openFileDialog) {
      const res = await window.xivig.openFileDialog();
      if (!res.canceled && res.filePath) {
        openDocument({
          path: res.filePath,
          name: res.name || res.filePath.split(/[/\\]/).pop() || 'Untitled',
          content: res.content || '',
          language: detectLanguageName(res.filePath),
        });
      }
    }
  };

  const handleOpenFolder = async () => {
    if (window.xivig?.openFolderDialog) {
      const res = await window.xivig.openFolderDialog();
      if (!res.canceled && res.folderPath && res.files) {
        setCurrentFolder(res.folderPath, res.files);
      }
    }
  };

  const handleOpenRecentWorkspace = async (folderPath: string) => {
    if (window.xivig?.readDir) {
      const res = await window.xivig.readDir(folderPath);
      if (res.success && res.items) {
        setCurrentFolder(folderPath, res.items);
      }
    }
  };

  const handleOpenRecentFile = async (filePath: string, name: string) => {
    if (window.xivig?.readFile) {
      const res = await window.xivig.readFile(filePath);
      if (res.success && res.content !== undefined) {
        openDocument({
          path: filePath,
          name,
          content: res.content,
          language: detectLanguageName(filePath),
        });
      }
    }
  };

  // Safe zero-dependency Markdown-to-HTML parser for formatted preview
  const renderedMarkdownHtml = useMemo(() => {
    let md = WELCOME_MARKDOWN_CONTENT;
    md = md.replace(/\r\n/g, '\n');
    md = md.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

    // Headers
    md = md.replace(/^###\s+(.*)$/gm, '<h3 style="font-size:16px; font-weight:700; color:var(--xivig-accent); margin:20px 0 10px 0; border-bottom:1px solid var(--xivig-border); padding-bottom:6px;">$1</h3>');
    md = md.replace(/^##\s+(.*)$/gm, '<h2 style="font-size:19px; font-weight:700; color:#ffffff; margin:24px 0 12px 0;">$1</h2>');
    md = md.replace(/^#\s+(.*)$/gm, '<h1 style="font-size:24px; font-weight:800; color:#ffffff; margin:10px 0 12px 0;">$1</h1>');

    // Bold & Italics
    md = md.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#ffffff; font-weight:600;">$1</strong>');
    md = md.replace(/\*([^*]+)\*/g, '<em style="color:var(--xivig-text-muted);">$1</em>');

    // Unordered lists
    md = md.replace(/^\*\s+(.*)$/gm, '<li style="margin:6px 0; color:var(--xivig-text); list-style-type:disc; margin-left:20px;">$1</li>');

    // Code blocks / inline code
    md = md.replace(/`([^`]+)`/g, '<code style="background-color:rgba(108,140,255,0.12); color:var(--xivig-accent); padding:2px 6px; border-radius:4px; font-family:var(--xivig-font-mono); font-size:12px;">$1</code>');

    // Paragraphs
    md = md.replace(/^(?!<[h|l|u|d])(.*$)/gm, (match) => {
      const trimmed = match.trim();
      return trimmed ? `<p style="margin:8px 0; line-height:1.6; color:var(--xivig-text-muted); font-size:13px;">${trimmed}</p>` : '';
    });

    return md;
  }, []);

  const shortcutsList = [
    { label: 'Command Palette', keys: ['Ctrl', 'Shift', 'P'] },
    { label: 'Quick Open File', keys: ['Ctrl', 'P'] },
    { label: 'Find / Search', keys: ['Ctrl', 'F'] },
    { label: 'Global Replace', keys: ['Ctrl', 'H'] },
    { label: 'New File', keys: ['Ctrl', 'N'] },
    { label: 'Open File', keys: ['Ctrl', 'O'] },
    { label: 'Open Folder', keys: ['Ctrl', 'Shift', 'O'] },
    { label: 'Save Document', keys: ['Ctrl', 'S'] },
    { label: 'Integrated Terminal', keys: ['Ctrl', '`'] },
    { label: 'Run Build Task', keys: ['Ctrl', 'B'] },
    { label: 'Select Build Target', keys: ['Ctrl', 'Shift', 'B'] },
    { label: 'Toggle Sidebar', keys: ['Ctrl', 'B'] },
  ];

  return (
    <div style={welcomeContainerStyle}>
      <style>{`
        .xivig-welcome-action {
          transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .xivig-welcome-action:hover {
          background-color: rgba(255, 255, 255, 0.05) !important;
          color: #ffffff !important;
          transform: translateX(3px);
        }
        .xivig-welcome-card {
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .xivig-welcome-card:hover {
          border-color: rgba(108, 140, 255, 0.25) !important;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35) !important;
        }
      `}</style>
      <div style={welcomeScrollInnerStyle}>
        {/* Header Hero Section */}
        <div style={heroHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={logoWrapperStyle}>
              <img src={logoUrl} alt="Xivig Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', margin: 0 }}>
                  Xivig Text Editor
                </h1>
                <span style={versionBadgeStyle}>v{appVersion}</span>
                <span style={velocityBadgeStyle}>
                  <Zap size={11} style={{ marginRight: '4px' }} />
                  High Velocity
                </span>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '13px', color: 'var(--xivig-text-muted)', maxWidth: '580px', lineHeight: 1.5 }}>
                A modern, ultra-fast, keyboard-first desktop code editor inspired by Sublime Text. Built with Electron 45, CodeMirror 6, and instant live feedback.
              </p>
            </div>
          </div>

          {/* View Mode Toggle Button */}
          <div style={toggleContainerStyle}>
            <button
              onClick={() => setViewMode('modern')}
              style={{
                ...toggleBtnStyle,
                backgroundColor: viewMode === 'modern' ? 'var(--xivig-accent)' : 'transparent',
                color: viewMode === 'modern' ? '#ffffff' : 'var(--xivig-text-dim)',
              }}
            >
              <Sparkles size={13} style={{ marginRight: '5px' }} />
              Modern View
            </button>
            <button
              onClick={() => setViewMode('markdown')}
              style={{
                ...toggleBtnStyle,
                backgroundColor: viewMode === 'markdown' ? 'var(--xivig-accent)' : 'transparent',
                color: viewMode === 'markdown' ? '#ffffff' : 'var(--xivig-text-dim)',
              }}
            >
              <BookOpen size={13} style={{ marginRight: '5px' }} />
              Markdown Preview
            </button>
          </div>
        </div>

        {/* Content Body */}
        {viewMode === 'modern' ? (
          <div style={gridContainerStyle}>
            {/* Left Column: Quick Start & Recent */}
            <div style={columnStyle}>
              {/* Start Card */}
              <div className="xivig-welcome-card" style={cardStyle}>
                <h2 style={cardHeadingStyle}>
                  <Sparkles size={15} color="var(--xivig-accent)" style={{ marginRight: '8px' }} />
                  Start
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button onClick={() => createNewDocument()} className="xivig-welcome-action" style={actionItemBtnStyle}>
                    <Plus size={16} color="var(--xivig-accent)" style={{ marginRight: '10px' }} />
                    <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>New File</span>
                    <kbd style={kbdStyle}>Ctrl+N</kbd>
                  </button>

                  <button onClick={handleOpenFile} className="xivig-welcome-action" style={actionItemBtnStyle}>
                    <FileText size={15} color="#56b6c2" style={{ marginRight: '10px' }} />
                    <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>Open File...</span>
                    <kbd style={kbdStyle}>Ctrl+O</kbd>
                  </button>

                  <button onClick={handleOpenFolder} className="xivig-welcome-action" style={actionItemBtnStyle}>
                    <FolderOpen size={15} color="#e6ad45" style={{ marginRight: '10px' }} />
                    <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>Open Folder / Workspace...</span>
                    <kbd style={kbdStyle}>Ctrl+Shift+O</kbd>
                  </button>

                  <button onClick={() => openCommandPalette()} className="xivig-welcome-action" style={actionItemBtnStyle}>
                    <Code2 size={15} color="#c678dd" style={{ marginRight: '10px' }} />
                    <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>Command Palette</span>
                    <kbd style={kbdStyle}>Ctrl+Shift+P</kbd>
                  </button>

                  <button onClick={() => openQuickOpen()} className="xivig-welcome-action" style={actionItemBtnStyle}>
                    <Zap size={15} color="#35b779" style={{ marginRight: '10px' }} />
                    <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>Quick Open File</span>
                    <kbd style={kbdStyle}>Ctrl+P</kbd>
                  </button>
                </div>
              </div>

              {/* Recent Workspaces / Projects Card */}
              <div className="xivig-welcome-card" style={cardStyle}>
                <h2 style={cardHeadingStyle}>
                  <Clock size={15} color="var(--xivig-accent)" style={{ marginRight: '8px' }} />
                  Recent Workspaces
                </h2>

                {recentWorkspaces.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {recentWorkspaces.slice(0, 5).map((ws) => (
                      <div
                        key={ws.path}
                        onClick={() => handleOpenRecentWorkspace(ws.path)}
                        style={recentRowStyle}
                        title={ws.path}
                      >
                        <FolderOpen size={14} color="#e6ad45" style={{ marginRight: '10px', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--xivig-text)', marginRight: '8px' }}>
                          {ws.name}
                        </span>
                        <span style={pathTruncateStyle}>{ws.path}</span>
                        <ArrowRight size={12} color="var(--xivig-text-dim)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px 0', color: 'var(--xivig-text-dim)', fontSize: '12px' }}>
                    No recent workspaces yet. Open a project folder to get started!
                  </div>
                )}
              </div>

              {/* Recent Files */}
              {recentFiles.length > 0 && (
                <div style={cardStyle}>
                  <h2 style={cardHeadingStyle}>
                    <FileText size={15} color="var(--xivig-accent)" style={{ marginRight: '8px' }} />
                    Recent Files
                  </h2>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {recentFiles.slice(0, 4).map((f) => (
                      <div
                        key={f.path}
                        onClick={() => handleOpenRecentFile(f.path, f.name)}
                        style={recentRowStyle}
                        title={f.path}
                      >
                        <FileText size={14} color="#56b6c2" style={{ marginRight: '10px', flexShrink: 0 }} />
                        <span style={{ fontWeight: 500, color: 'var(--xivig-text)', marginRight: '8px' }}>
                          {f.name}
                        </span>
                        <span style={pathTruncateStyle}>{f.path}</span>
                        <ArrowRight size={12} color="var(--xivig-text-dim)" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Shortcuts & Architecture */}
            <div style={columnStyle}>
              {/* Keyboard Shortcuts Card */}
              <div style={cardStyle}>
                <h2 style={cardHeadingStyle}>
                  <Keyboard size={15} color="var(--xivig-accent)" style={{ marginRight: '8px' }} />
                  Keyboard Shortcuts
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '6px' }}>
                  {shortcutsList.map((sc) => (
                    <div key={sc.label} style={shortcutRowStyle}>
                      <span style={{ fontSize: '12px', color: 'var(--xivig-text)' }}>{sc.label}</span>
                      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                        {sc.keys.map((k, idx) => (
                          <React.Fragment key={k}>
                            <kbd style={kbdStyle}>{k}</kbd>
                            {idx < sc.keys.length - 1 && <span style={{ color: 'var(--xivig-text-dim)', fontSize: '10px' }}>+</span>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Architecture & Velocity Highlights */}
              <div style={cardStyle}>
                <h2 style={cardHeadingStyle}>
                  <Cpu size={15} color="var(--xivig-accent)" style={{ marginRight: '8px' }} />
                  Velocity Core & Architecture
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={featureBoxStyle}>
                    <div style={featureIconWrapperStyle}>
                      <Zap size={14} color="var(--xivig-accent)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff' }}>
                        Electron 45 + Node 24 LTS
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--xivig-text-muted)' }}>
                        Native low-overhead desktop container with high-throughput IPC and instant startup.
                      </div>
                    </div>
                  </div>

                  <div style={featureBoxStyle}>
                    <div style={featureIconWrapperStyle}>
                      <Code2 size={14} color="#35b779" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff' }}>
                        CodeMirror 6 Transaction Engine
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--xivig-text-muted)' }}>
                        Sublime-grade multi-cursor editing, bracket colorization, Emmet, and 120 FPS typing velocity.
                      </div>
                    </div>
                  </div>

                  <div style={featureBoxStyle}>
                    <div style={featureIconWrapperStyle}>
                      <Terminal size={14} color="#e6ad45" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff' }}>
                        Integrated Terminal & Build System
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--xivig-text-muted)' }}>
                        Full UTF-8 PowerShell / bash console and 1-key task runner with automated path resolution.
                      </div>
                    </div>
                  </div>

                  <div style={featureBoxStyle}>
                    <div style={featureIconWrapperStyle}>
                      <Layers size={14} color="#56b6c2" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff' }}>
                        In-Place Seamless Auto-Updater
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--xivig-text-muted)' }}>
                        Silent background downloads and 1-click reload updates without running setup wizards every time.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Rendered Markdown Preview View */
          <div style={markdownPreviewContainerStyle}>
            <div
              style={markdownBodyStyle}
              dangerouslySetInnerHTML={{ __html: renderedMarkdownHtml }}
            />
          </div>
        )}

        {/* Bottom Footer with Startup Checkbox */}
        <div style={footerStyle}>
          <label style={checkboxLabelStyle}>
            <input
              type="checkbox"
              checked={settings.showWelcomeOnStartup !== false}
              onChange={(e) => updateSettings({ showWelcomeOnStartup: e.target.checked })}
              style={checkboxStyle}
            />
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--xivig-text)' }}>
              Show Welcome page on startup
            </span>
          </label>
          <span style={{ fontSize: '11.5px', color: 'var(--xivig-text-dim)', marginLeft: '12px' }}>
            (You can always reopen this page anytime from <strong>Help → Welcome</strong>)
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', fontSize: '12px' }}>
            <a
              href="https://github.com/xivig/xivig-text-editor#readme"
              target="_blank"
              rel="noreferrer"
              style={footerLinkStyle}
            >
              Documentation <ExternalLink size={11} style={{ marginLeft: '3px' }} />
            </a>
            <a
              href="https://github.com/xivig/xivig-text-editor/releases"
              target="_blank"
              rel="noreferrer"
              style={footerLinkStyle}
            >
              Releases <ExternalLink size={11} style={{ marginLeft: '3px' }} />
            </a>
            <a
              href="https://github.com/xivig/xivig-text-editor/issues"
              target="_blank"
              rel="noreferrer"
              style={footerLinkStyle}
            >
              Report Issue <ExternalLink size={11} style={{ marginLeft: '3px' }} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const welcomeContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  backgroundColor: 'var(--xivig-editor, #17191f)',
  color: 'var(--xivig-text)',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  userSelect: 'none',
};

const welcomeScrollInnerStyle: React.CSSProperties = {
  maxWidth: '1120px',
  width: '100%',
  margin: '0 auto',
  padding: '36px 32px 48px 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const heroHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingBottom: '24px',
  borderBottom: '1px solid var(--xivig-border, #2c313d)',
  flexWrap: 'wrap',
  gap: '16px',
};

const logoWrapperStyle: React.CSSProperties = {
  width: '76px',
  height: '76px',
  borderRadius: '16px',
  backgroundColor: 'rgba(108, 140, 255, 0.08)',
  border: '1px solid rgba(108, 140, 255, 0.25)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
  flexShrink: 0,
};

const versionBadgeStyle: React.CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 700,
  color: 'var(--xivig-accent)',
  backgroundColor: 'rgba(108, 140, 255, 0.15)',
  padding: '2px 8px',
  borderRadius: '12px',
  border: '1px solid rgba(108, 140, 255, 0.25)',
};

const velocityBadgeStyle: React.CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 600,
  color: '#35b779',
  backgroundColor: 'rgba(53, 183, 121, 0.15)',
  padding: '2px 8px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
};

const toggleContainerStyle: React.CSSProperties = {
  display: 'flex',
  backgroundColor: 'var(--xivig-surface, #1d2028)',
  padding: '3px',
  borderRadius: '8px',
  border: '1px solid var(--xivig-border, #2c313d)',
};

const toggleBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  border: 'none',
  padding: '5px 12px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s ease',
};

const gridContainerStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: '24px',
};

const columnStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-surface, #1d2028)',
  border: '1px solid var(--xivig-border, #2c313d)',
  borderRadius: '10px',
  padding: '18px 20px',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
};

const cardHeadingStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#ffffff',
  margin: '0 0 14px 0',
  display: 'flex',
  alignItems: 'center',
  letterSpacing: '-0.01em',
};

const actionItemBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderRadius: '6px',
  border: '1px solid transparent',
  backgroundColor: 'transparent',
  color: 'var(--xivig-text)',
  fontSize: '12.5px',
  cursor: 'pointer',
  transition: 'all 0.12s ease',
};

const recentRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '7px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  cursor: 'pointer',
  transition: 'background-color 0.12s',
};

const pathTruncateStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--xivig-text-dim)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '220px',
};

const shortcutRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 10px',
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  borderRadius: '6px',
  border: '1px solid rgba(255, 255, 255, 0.04)',
};

const kbdStyle: React.CSSProperties = {
  padding: '2px 6px',
  borderRadius: '4px',
  backgroundColor: 'var(--xivig-activity-bar, #13151a)',
  border: '1px solid var(--xivig-border, #2c313d)',
  color: 'var(--xivig-accent, #6c8cff)',
  fontSize: '10.5px',
  fontFamily: 'var(--xivig-font-mono)',
  fontWeight: 600,
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
};

const featureBoxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  padding: '8px 10px',
  borderRadius: '6px',
  backgroundColor: 'rgba(0, 0, 0, 0.18)',
  border: '1px solid rgba(255, 255, 255, 0.04)',
};

const featureIconWrapperStyle: React.CSSProperties = {
  padding: '6px',
  borderRadius: '6px',
  backgroundColor: 'var(--xivig-surface-hover, #262a35)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const markdownPreviewContainerStyle: React.CSSProperties = {
  backgroundColor: 'var(--xivig-surface, #1d2028)',
  border: '1px solid var(--xivig-border, #2c313d)',
  borderRadius: '10px',
  padding: '28px 36px',
  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
};

const markdownBodyStyle: React.CSSProperties = {
  maxWidth: '780px',
  margin: '0 auto',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  paddingTop: '20px',
  borderTop: '1px solid var(--xivig-border, #2c313d)',
  marginTop: '8px',
  flexWrap: 'wrap',
  gap: '12px',
};

const checkboxLabelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  userSelect: 'none',
};

const checkboxStyle: React.CSSProperties = {
  width: '16px',
  height: '16px',
  cursor: 'pointer',
  accentColor: 'var(--xivig-accent)',
};

const footerLinkStyle: React.CSSProperties = {
  color: 'var(--xivig-text-dim)',
  textDecoration: 'none',
  display: 'flex',
  alignItems: 'center',
  transition: 'color 0.15s ease',
};
