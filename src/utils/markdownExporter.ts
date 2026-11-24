/**
 * Markdown Exporting Utilities (HTML and PDF)
 */

export function exportMarkdownToHtml(
  title: string,
  renderedBodyHtml: string,
  theme: 'dark' | 'light' = 'dark'
): string {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#181818' : '#ffffff';
  const textColor = isDark ? '#e0e0e0' : '#222222';
  const borderColor = isDark ? '#333333' : '#e1e4e8';
  const preBg = isDark ? '#1f1f1f' : '#f6f8fa';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || 'Exported Document'}</title>
  <style>
    @media print {
      body {
        background: #ffffff !important;
        color: #000000 !important;
        padding: 0 !important;
      }
      a { text-decoration: underline !important; color: #000 !important; }
      pre, blockquote, table { page-break-inside: avoid; }
      .no-print { display: none !important; }
    }
    body {
      background-color: ${bgColor};
      color: ${textColor};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 860px;
      margin: 0 auto;
      padding: 40px 24px;
    }
    h1, h2, h3, h4, h5, h6 {
      color: ${textColor};
      font-weight: 600;
      margin-top: 1.5em;
      margin-bottom: 0.5em;
    }
    h1 { border-bottom: 1px solid ${borderColor}; padding-bottom: 0.3em; }
    h2 { border-bottom: 1px solid ${borderColor}; padding-bottom: 0.2em; }
    code {
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
      font-size: 85%;
      background-color: rgba(127, 127, 127, 0.15);
      padding: 0.2em 0.4em;
      border-radius: 4px;
    }
    pre {
      background-color: ${preBg};
      border: 1px solid ${borderColor};
      padding: 16px;
      border-radius: 6px;
      overflow-x: auto;
    }
    pre code { background: none; padding: 0; }
    blockquote {
      border-left: 4px solid #6c8cff;
      margin: 1em 0;
      padding: 0.5em 1em;
      color: #888888;
      background: rgba(108, 140, 255, 0.05);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.2em 0;
    }
    th, td {
      border: 1px solid ${borderColor};
      padding: 8px 12px;
      text-align: left;
    }
    th { background-color: rgba(127, 127, 127, 0.1); font-weight: 600; }
    img { max-width: 100%; height: auto; border-radius: 4px; }
    a { color: #58a6ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .task-checkbox-input { margin-right: 8px; }
  </style>
</head>
<body>
  ${renderedBodyHtml}
</body>
</html>`;
}

export function downloadHtmlFile(filename: string, htmlContent: string): void {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function printMarkdownDocument(title: string, renderedBodyHtml: string): void {
  const fullHtml = exportMarkdownToHtml(title, renderedBodyHtml, 'light');
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(fullHtml);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }
}
