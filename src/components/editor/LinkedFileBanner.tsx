import React, { useState, useEffect } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';
import { useEditorStore } from '../../stores/editorStore';
import { useFileStore } from '../../stores/fileStore';
import {
  extractHtmlLinks,
  resolveLinkPath,
  checkFileExists,
  createAndOpenLinkedFile,
  HtmlLink,
} from './htmlLinkedFiles';
import { FileIcon } from '../common/FileIcon';

export const LinkedFileBanner: React.FC = () => {
  const activeDoc = useEditorStore((state) =>
    state.documents.find((d) => d.id === state.activeDocumentId)
  );
  const workspaceRoot = useFileStore((state) => state.currentFolderPath);

  const [missingLinks, setMissingLinks] = useState<HtmlLink[]>([]);
  const [dismissedUrls, setDismissedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!activeDoc) {
      setMissingLinks([]);
      return;
    }

    const docName = (activeDoc.name || activeDoc.language || '').toLowerCase();
    const isHtml = docName.endsWith('.html') || docName.endsWith('.htm') || activeDoc.language === 'html';

    if (!isHtml) {
      setMissingLinks([]);
      return;
    }

    const links = extractHtmlLinks(activeDoc.content);
    if (links.length === 0) {
      setMissingLinks([]);
      return;
    }

    let isMounted = true;

    async function verifyLinks() {
      const missing: HtmlLink[] = [];
      const currentPath = activeDoc?.path || null;

      for (const link of links) {
        if (dismissedUrls.has(link.url)) continue;

        const resolved = resolveLinkPath(link.url, currentPath, workspaceRoot);
        const exists = await checkFileExists(resolved);
        if (!exists) {
          missing.push(link);
        }
      }

      if (isMounted) {
        setMissingLinks(missing);
      }
    }

    verifyLinks();

    return () => {
      isMounted = false;
    };
  }, [activeDoc?.content, activeDoc?.path, workspaceRoot, dismissedUrls]);

  if (missingLinks.length === 0) return null;

  const firstMissing = missingLinks[0];
  const fileName = firstMissing.url.split('/').pop() || firstMissing.url;

  const handleCreate = async () => {
    await createAndOpenLinkedFile(
      firstMissing.url,
      activeDoc?.path || null,
      workspaceRoot || null
    );
    setDismissedUrls((prev) => new Set([...prev, firstMissing.url]));
  };

  const handleDismiss = () => {
    setDismissedUrls((prev) => new Set([...prev, firstMissing.url]));
  };

  return (
    <div style={bannerContainerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileIcon filename={fileName} size={15} />
        <span style={{ fontSize: '12px', color: 'var(--xivig-text)' }}>
          Missing linked {firstMissing.type === 'stylesheet' ? 'stylesheet' : 'script'}:{' '}
          <strong style={{ color: 'var(--xivig-accent)', fontFamily: 'var(--xivig-font-mono)' }}>
            {firstMissing.url}
          </strong>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button onClick={handleCreate} style={createBtnStyle}>
          <Plus size={12} style={{ marginRight: '4px' }} />
          <span>Create {fileName}</span>
        </button>
        <button onClick={handleDismiss} title="Dismiss notification" style={dismissBtnStyle}>
          <X size={13} />
        </button>
      </div>
    </div>
  );
};

const bannerContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '6px 14px',
  backgroundColor: 'var(--xivig-surface)',
  borderBottom: '1px solid var(--xivig-border)',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  zIndex: 10,
  userSelect: 'none',
};

const createBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  padding: '3px 10px',
  borderRadius: '3px',
  backgroundColor: 'var(--xivig-accent)',
  color: '#ffffff',
  fontSize: '11.5px',
  fontWeight: 600,
  cursor: 'pointer',
};

const dismissBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px',
  borderRadius: '3px',
  color: 'var(--xivig-text-dim)',
  cursor: 'pointer',
};
