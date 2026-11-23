import React from 'react';

export interface FileIconProps {
  filename: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  isSettings?: boolean;
}

export interface FolderIconProps {
  folderName: string;
  isOpen?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * High-fidelity File Type Icon Component.
 */
export const FileIcon: React.FC<FileIconProps> = ({
  filename,
  size = 15,
  className,
  style,
  isSettings,
}) => {
  if (isSettings || filename.toLowerCase() === 'settings') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <circle cx="8" cy="8" r="2.8" stroke="var(--xivig-accent)" strokeWidth="1.6" />
        <path
          d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.4 3.4l1.3 1.3M11.3 11.3l1.3 1.3M3.4 12.6l1.3-1.3M11.3 4.7l1.3-1.3"
          stroke="var(--xivig-accent)"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (filename.toLowerCase() === 'welcome' || filename.toLowerCase() === 'welcome.md') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <path
          d="M8 1.5L9.6 5.5L14 6L10.7 9.2L11.6 14L8 11.7L4.4 14L5.3 9.2L2 6L6.4 5.5L8 1.5Z"
          fill="var(--xivig-accent)"
        />
      </svg>
    );
  }

  const name = filename.toLowerCase();

  // 1. Exact Filename Matches
  if (name === 'package.json' || name === 'package-lock.json') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <rect width="16" height="16" rx="2.5" fill="#cb3837" />
        <path d="M3 4h10v8H8v-6H5.5v6H3V4z" fill="#ffffff" />
      </svg>
    );
  }

  if (name.startsWith('tsconfig') && name.endsWith('.json')) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <rect width="16" height="16" rx="2.5" fill="#1e3a5f" stroke="#3178c6" strokeWidth="1" />
        <text x="8" y="11.5" fontSize="7" fontWeight="bold" fill="#60a5fa" textAnchor="middle" fontFamily="sans-serif">
          ⚙TS
        </text>
      </svg>
    );
  }

  if (name.startsWith('vite.config.')) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <rect width="16" height="16" rx="2.5" fill="#1f1837" stroke="#7952d4" strokeWidth="1" />
        <path d="M12.5 2.5l-5 11-3-7.5 3.5-.5L9 2l3.5.5z" fill="#ffc107" />
      </svg>
    );
  }

  if (name.startsWith('.env')) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <rect width="16" height="16" rx="2.5" fill="#3f3815" stroke="#eab308" strokeWidth="1" />
        <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2h1v6h-7V7h1zm1.5-2a1 1 0 0 1 2 0v2h-2V5z" fill="#eab308" />
      </svg>
    );
  }

  if (name.startsWith('.git') || name === '.gitignore') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <path
          d="M14.6 6.8L9.2 1.4c-.5-.5-1.3-.5-1.8 0L6.1 2.7l2.3 2.3c.5-.2 1.2-.1 1.6.3.5.5.5 1.2.2 1.8l2.2 2.2c.6-.3 1.3-.3 1.8.2.7.7.7 1.8 0 2.5s-1.8.7-2.5 0c-.5-.5-.6-1.3-.2-1.9L9.4 8v3.5c.2.1.4.3.5.5.7.7.7 1.8 0 2.5s-1.8.7-2.5 0c-.7-.7-.7-1.8 0-2.5.3-.3.8-.5 1.2-.5V7.8c-.4 0-.9-.2-1.2-.5-.5-.5-.6-1.3-.2-1.9L4.8 3.1 1.4 6.5c-.5.5-.5 1.3 0 1.8l5.4 5.4c.5.5 1.3.5 1.8 0l6-6c.5-.5.5-1.4 0-1.9z"
          fill="#f05032"
        />
      </svg>
    );
  }

  if (name === 'readme.md' || name === 'readme') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <rect width="16" height="16" rx="2.5" fill="#083344" stroke="#0891b2" strokeWidth="1" />
        <path d="M2.5 4.5v7h2l1.8-3.5 1.8 3.5h2v-7h-1.5v4.5l-1.5-3h-1.5l-1.5 3V4.5H2.5zm9 0v4h-1.5l2.2 3 2.3-3H13v-4h-1.5z" fill="#38bdf8" />
      </svg>
    );
  }

  // 2. Extension Based Matches
  const ext = name.includes('.') ? name.split('.').pop() || '' : '';

  switch (ext) {
    case 'ts':
    case 'mts':
    case 'cts':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#3178c6" />
          <path
            d="M3 5h5v1.4H6.2v5.6H4.8V6.4H3V5zm5.5 2.8c.4-.5 1-1 1.9-1 1.2 0 2 .8 2 2v.2c0 .3-.1.6-.3.8-.4.5-1.1.7-1.8.9l-.6.2c-.6.2-.9.4-.9.8 0 .4.4.7.9.7.6 0 1.1-.3 1.4-.7l.9.8c-.5.7-1.3 1.1-2.3 1.1-1.3 0-2.1-.8-2.1-1.9 0-.6.3-1.2.7-1.5.4-.4 1-.6 1.7-.8l.6-.2c.5-.2.7-.4.7-.7 0-.3-.3-.6-.7-.6-.5 0-.9.2-1.2.6l-.9-.7z"
            fill="#ffffff"
          />
        </svg>
      );

    case 'tsx':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#1b4268" stroke="#3178c6" strokeWidth="1" />
          <text x="8" y="11.5" fontSize="7.5" fontWeight="900" fill="#61dafb" textAnchor="middle" fontFamily="sans-serif">
            TSX
          </text>
        </svg>
      );

    case 'js':
    case 'mjs':
    case 'cjs':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#f7df1e" />
          <text x="8" y="11.5" fontSize="8.5" fontWeight="900" fill="#000000" textAnchor="middle" fontFamily="sans-serif">
            JS
          </text>
        </svg>
      );

    case 'jsx':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#20232a" stroke="#61dafb" strokeWidth="1" />
          <circle cx="8" cy="8" r="1.5" fill="#61dafb" />
          <ellipse cx="8" cy="8" rx="5.5" ry="2" stroke="#61dafb" strokeWidth="1" transform="rotate(30 8 8)" />
          <ellipse cx="8" cy="8" rx="5.5" ry="2" stroke="#61dafb" strokeWidth="1" transform="rotate(90 8 8)" />
          <ellipse cx="8" cy="8" rx="5.5" ry="2" stroke="#61dafb" strokeWidth="1" transform="rotate(150 8 8)" />
        </svg>
      );

    case 'html':
    case 'htm':
    case 'xhtml':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <path d="M2.5 1.5l1.1 12.3 4.4 1.2 4.4-1.2 1.1-12.3H2.5z" fill="#e34f26" />
          <path d="M8 2.5v11.3l3.5-1 .9-10.3H8z" fill="#ef652a" />
          <path d="M5.5 5.5h5l-.2 2.2H5.7l.2 2.2h4.2l-.3 3.3L8 13.7l-1.8-.5-.1-1.3H4.8l.2 2.4L8 15.3l3-1 .4-4.5H8v-.9h3.7l.3-3.4H5.5z" fill="#ffffff" />
        </svg>
      );

    case 'css':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <path d="M2.5 1.5l1.1 12.3 4.4 1.2 4.4-1.2 1.1-12.3H2.5z" fill="#1572b6" />
          <path d="M8 2.5v11.3l3.5-1 .9-10.3H8z" fill="#33a9dc" />
          <path d="M5.5 5.5h5l-.2 2.2H5.7l.2 2.2h4.2l-.3 3.3L8 13.7l-1.8-.5-.1-1.3H4.8l.2 2.4L8 15.3l3-1 .4-4.5H8v-.9h3.7l.3-3.4H5.5z" fill="#ffffff" />
        </svg>
      );

    case 'scss':
    case 'sass':
    case 'less':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#c6538c" />
          <text x="8" y="11.5" fontSize="7" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">
            SCSS
          </text>
        </svg>
      );

    case 'json':
    case 'jsonc':
    case 'json5':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#2d2d2d" stroke="#eab308" strokeWidth="1" />
          <text x="8" y="12" fontSize="11" fontWeight="bold" fill="#facc15" textAnchor="middle" fontFamily="monospace">
            {"{}"}
          </text>
        </svg>
      );

    case 'py':
    case 'pyw':
    case 'ipynb':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <path
            d="M7.9 1.5c-3 0-2.8 1.3-2.8 1.3l0 1.4h2.9v.4H3.9S1.5 4.3 1.5 7.4c0 3 2.1 2.9 2.1 2.9h1.2v-1.7s-.1-2.1 2-2.1h3.4s2 0 2-2V2.8s.2-1.3-4.3-1.3zm-1.6 1a.6.6 0 1 1 0 1.2.6.6 0 0 1 0-1.2z"
            fill="#3776ab"
          />
          <path
            d="M8.1 14.5c3 0 2.8-1.3 2.8-1.3l0-1.4H8v-.4h4.1s2.4.3 2.4-2.8c0-3-2.1-2.9-2.1-2.9h-1.2v1.7s.1 2.1-2 2.1H5.8s-2 0-2 2v1.7s-.2 1.3 4.3 1.3zm1.6-1a.6.6 0 1 1 0-1.2.6.6 0 0 1 0 1.2z"
            fill="#ffd43b"
          />
        </svg>
      );

    case 'rs':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#ce412b" />
          <text x="8" y="11.5" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">
            RS
          </text>
        </svg>
      );

    case 'md':
    case 'markdown':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#083344" stroke="#0891b2" strokeWidth="1" />
          <path d="M2.5 4.5v7h2l1.8-3.5 1.8 3.5h2v-7h-1.5v4.5l-1.5-3h-1.5l-1.5 3V4.5H2.5zm9 0v4h-1.5l2.2 3 2.3-3H13v-4h-1.5z" fill="#06b6d4" />
        </svg>
      );

    case 'svg':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#ff9900" />
          <path d="M4 6l-2 2 2 2M12 6l2 2-2 2M9 5l-2 6" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'ico':
    case 'webp':
    case 'bmp':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#2d1f3d" stroke="#a855f7" strokeWidth="1" />
          <circle cx="5.5" cy="5.5" r="1.5" fill="#c084fc" />
          <path d="M2.5 13.5l4-5 3 3.5 2-2.5 2 4H2.5z" fill="#c084fc" />
        </svg>
      );

    case 'sh':
    case 'bash':
    case 'zsh':
    case 'ps1':
    case 'bat':
    case 'cmd':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#142918" stroke="#22c55e" strokeWidth="1" />
          <path d="M4 5.5l3 2.5-3 2.5M8.5 11h3.5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case 'sql':
    case 'sqlite':
    case 'db':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <ellipse cx="8" cy="4" rx="5.5" ry="2" fill="#d97706" />
          <path d="M2.5 4v4c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V4" stroke="#d97706" strokeWidth="1.2" fill="none" />
          <path d="M2.5 8v4c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2V8" stroke="#d97706" strokeWidth="1.2" fill="none" />
        </svg>
      );

    case 'yml':
    case 'yaml':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#3b0764" stroke="#c084fc" strokeWidth="1" />
          <text x="8" y="11.5" fontSize="7" fontWeight="bold" fill="#e9d5ff" textAnchor="middle" fontFamily="sans-serif">
            YML
          </text>
        </svg>
      );

    case 'c':
    case 'cpp':
    case 'cc':
    case 'h':
    case 'hpp':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#00599c" />
          <text x="8" y="11.5" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">
            C++
          </text>
        </svg>
      );

    case 'java':
    case 'jar':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#b07219" />
          <text x="8" y="11.5" fontSize="7" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">
            JAVA
          </text>
        </svg>
      );

    case 'go':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#00add8" />
          <text x="8" y="11.5" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">
            GO
          </text>
        </svg>
      );

    case 'php':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <rect width="16" height="16" rx="2.5" fill="#777bb4" />
          <text x="8" y="11.5" fontSize="7.5" fontWeight="bold" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif">
            PHP
          </text>
        </svg>
      );

    default:
      // Generic Text Document
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
          <path d="M3 2h7l3 3v9H3V2z" fill="var(--xivig-surface-hover)" stroke="var(--xivig-border)" strokeWidth="1" />
          <path d="M10 2v3h3" stroke="var(--xivig-border)" strokeWidth="1" fill="none" />
          <path d="M5 7h6M5 9h6M5 11h4" stroke="var(--xivig-text-dim)" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
  }
};

/**
 * High-fidelity Folder Icon Component.
 */
export const FolderIcon: React.FC<FolderIconProps> = ({
  folderName,
  isOpen = false,
  size = 15,
  className,
  style,
}) => {
  const name = folderName.toLowerCase();

  // Special Folders
  if (name === 'node_modules') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <path d="M2 3a1 1 0 0 1 1-1h3.5l1.5 1.5H13a1 1 0 0 1 1 1V5H2V3z" fill="#4ade80" />
        <path d="M1.5 5h13l-1 8.5a1 1 0 0 1-1 .5H3.5a1 1 0 0 1-1-.5L1.5 5z" fill="#22c55e" />
        <circle cx="8" cy="9" r="1.5" fill="#14532d" />
      </svg>
    );
  }

  if (name === 'src' || name === 'source') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <path d="M2 3a1 1 0 0 1 1-1h3.5l1.5 1.5H13a1 1 0 0 1 1 1V5H2V3z" fill="#60a5fa" />
        <path d="M1.5 5h13l-1 8.5a1 1 0 0 1-1 .5H3.5a1 1 0 0 1-1-.5L1.5 5z" fill="#3b82f6" />
        <path d="M6.5 7.5L5 9l1.5 1.5M9.5 7.5L11 9l-1.5 1.5" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === 'public' || name === 'static') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <path d="M2 3a1 1 0 0 1 1-1h3.5l1.5 1.5H13a1 1 0 0 1 1 1V5H2V3z" fill="#34d399" />
        <path d="M1.5 5h13l-1 8.5a1 1 0 0 1-1 .5H3.5a1 1 0 0 1-1-.5L1.5 5z" fill="#10b981" />
        <circle cx="8" cy="9" r="2" stroke="#ffffff" strokeWidth="1" fill="none" />
      </svg>
    );
  }

  if (name === 'dist' || name === 'build' || name === 'out') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <path d="M2 3a1 1 0 0 1 1-1h3.5l1.5 1.5H13a1 1 0 0 1 1 1V5H2V3z" fill="#fb923c" />
        <path d="M1.5 5h13l-1 8.5a1 1 0 0 1-1 .5H3.5a1 1 0 0 1-1-.5L1.5 5z" fill="#f97316" />
        <rect x="6.5" y="7.5" width="3" height="3" fill="#ffffff" rx="0.5" />
      </svg>
    );
  }

  if (name === 'components') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <path d="M2 3a1 1 0 0 1 1-1h3.5l1.5 1.5H13a1 1 0 0 1 1 1V5H2V3z" fill="#38bdf8" />
        <path d="M1.5 5h13l-1 8.5a1 1 0 0 1-1 .5H3.5a1 1 0 0 1-1-.5L1.5 5z" fill="#0284c7" />
        <circle cx="8" cy="9" r="1.5" fill="#ffffff" />
      </svg>
    );
  }

  if (name === 'assets' || name === 'images' || name === 'media') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <path d="M2 3a1 1 0 0 1 1-1h3.5l1.5 1.5H13a1 1 0 0 1 1 1V5H2V3z" fill="#c084fc" />
        <path d="M1.5 5h13l-1 8.5a1 1 0 0 1-1 .5H3.5a1 1 0 0 1-1-.5L1.5 5z" fill="#9333ea" />
        <circle cx="8" cy="9" r="1.5" fill="#ffffff" />
      </svg>
    );
  }

  if (name === '.git') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <path d="M2 3a1 1 0 0 1 1-1h3.5l1.5 1.5H13a1 1 0 0 1 1 1V5H2V3z" fill="#f87171" />
        <path d="M1.5 5h13l-1 8.5a1 1 0 0 1-1 .5H3.5a1 1 0 0 1-1-.5L1.5 5z" fill="#ef4444" />
      </svg>
    );
  }

  // Standard Folders (Open vs Closed)
  if (isOpen) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
        <path d="M2 3a1 1 0 0 1 1-1h3.5l1.5 1.5H13a1 1 0 0 1 1 1V5H2V3z" fill="#fbbf24" />
        <path d="M1 6.5h14l-2 7H3l-2-7z" fill="#f59e0b" />
      </svg>
    );
  }

  // Closed folder
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className} style={style}>
      <path d="M2 3a1 1 0 0 1 1-1h3.5l1.5 1.5H13a1 1 0 0 1 1 1V5H2V3z" fill="#fbbf24" />
      <path d="M1.5 5h13l-1 8.5a1 1 0 0 1-1 .5H3.5a1 1 0 0 1-1-.5L1.5 5z" fill="#f59e0b" />
    </svg>
  );
};
