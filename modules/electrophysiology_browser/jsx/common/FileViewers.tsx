import React, {useMemo} from 'react';
import {useTranslation} from 'react-i18next';
import Papa from 'papaparse';

/**
 * Component for displaying an HTML document from a URL inside an iframe.
 */
export function HTMLIframeViewer({
  url,
  title,
  sandbox,
}: {
  url: string;
  title: string;
  sandbox?: string;
}) {
  return (
    <iframe
      sandbox={sandbox}
      src={url}
      style={{
        border: '1px solid #ddd',
        height: '70vh',
        width: '100%',
      }}
      title={title}
    />
  );
}

/**
 * Component for plain text content that preserves whitespace and wraps long lines.
 */
export function PlainTextViewer({content}: {content: string}) {
  return (
    <pre
      style={{
        background: 'transparent',
        border: 0,
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        textAlign: 'left',
      }}
    >
      {content}
    </pre>
  );
}

/**
 * Component for displaying TSV content as a simple scrollable table.
 */
export function TSVViewer({content}: {content: string}) {
  const {t} = useTranslation();
  const rows = useMemo(() => parseTSV(content), [content]);

  if (rows.length === 0) {
    return (
      <div style={{color: '#777'}}>
        {t('No rows to display.', {ns: 'electrophysiology_browser'})}
      </div>
    );
  }

  const [header, ...bodyRows] = rows;

  return (
    <div style={{overflowX: 'auto'}}>
      <table
        style={{
          borderCollapse: 'collapse',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontSize: '14px',
          width: '100%',
        }}
      >
        <thead>
          <tr>
            {header.map((cell, cellIndex) => (
              <th
                key={cellIndex}
                style={{
                  borderBottom: '2px solid #ddd',
                  padding: '4px 6px',
                  textAlign: 'left',
                }}
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {header.map((_cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    borderTop: '1px solid #ddd',
                    padding: '4px 6px',
                    textAlign: 'left',
                  }}
                >
                  {row[cellIndex] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Parse TSV text into rows and cells.
 */
function parseTSV(content: string): string[][] {
  const parsed = Papa.parse<string[]>(content, {
    delimiter: '\t',
    skipEmptyLines: true,
  });

  return parsed.data;
}
