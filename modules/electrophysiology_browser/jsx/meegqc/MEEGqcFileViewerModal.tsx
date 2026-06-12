import React, {useEffect, useMemo, useState} from 'react';
import Modal from 'jsx/Modal';

type TranslationFunction = (
  key: string,
  options?: Record<string, unknown>
) => string;

type FileViewMode = 'html' | 'text' | 'tsv';

type FileViewerState =
  | {status: 'idle'}
  | {status: 'loading'}
  | {status: 'success'; content: string; mode: 'text' | 'tsv'}
  | {status: 'success'; objectURL: string; mode: 'html'}
  | {status: 'error'; message: string};

const ns = {ns: 'electrophysiology_browser'};

function getFileExtension(fileName: string): string {
  const extension = fileName.split('.').pop();
  return extension?.toLowerCase() ?? '';
}

function getFileViewMode(fileName: string): FileViewMode {
  switch (getFileExtension(fileName)) {
  case 'html':
  case 'htm':
    return 'html';
  case 'tsv':
    return 'tsv';
  default:
    return 'text';
  }
}

function parseTSV(content: string): string[][] {
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((row) => row.length > 0)
    .map((row) => row.split('\t'));
}

function MEEGqcTSVViewer({content}: {content: string}) {
  const rows = useMemo(() => parseTSV(content), [content]);

  if (rows.length === 0) {
    return <div className='text-muted'>No rows to display.</div>;
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

function MEEGqcHTMLViewer({objectURL}: {objectURL: string}) {
  return (
    <iframe
      sandbox='allow-scripts'
      src={objectURL}
      style={{
        border: '1px solid #ddd',
        height: '70vh',
        width: '100%',
      }}
      title='MEEGqc HTML file preview'
    />
  );
}

function MEEGqcTextViewer({content}: {content: string}) {
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

function MEEGqcFileViewerContent({
  state,
  t,
}: {
  state: FileViewerState;
  t: TranslationFunction;
}) {
  switch (state.status) {
  case 'idle':
  case 'loading':
    return (
      <>
        {t('Loading...', {ns: 'loris'})}
        <span className='glyphicon glyphicon-refresh glyphicon-refresh-animate'>
        </span>
      </>
    );
  case 'error':
    return (
      <div className='alert alert-danger'>
        {t('Unable to load MEEGqc file.', ns)}
        <br/>
        {state.message}
      </div>
    );
  case 'success':
    switch (state.mode) {
    case 'html':
      return <MEEGqcHTMLViewer objectURL={state.objectURL}/>;
    case 'tsv':
      return <MEEGqcTSVViewer content={state.content}/>;
    case 'text':
      return <MEEGqcTextViewer content={state.content}/>;
    }
  }
}

function MEEGqcFileViewerModal({
  fileName,
  fileURL,
  show,
  onClose,
  t,
}: {
  fileName: string;
  fileURL: string;
  show: boolean;
  onClose: () => void;
  t: TranslationFunction;
}) {
  const [state, setState] = useState<FileViewerState>({status: 'idle'});

  useEffect(() => {
    let ignoreResponse = false;
    let objectURL: string | null = null;

    const fetchFileContent = async () => {
      if (!show) {
        setState({status: 'idle'});
        return;
      }

      setState({status: 'loading'});

      try {
        const response = await fetch(
          fileURL,
          {credentials: 'same-origin'}
        );

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const mode = getFileViewMode(fileName);

        if (mode === 'html') {
          const blob = await response.blob();
          objectURL = URL.createObjectURL(
            new Blob([blob], {type: 'text/html'})
          );

          if (!ignoreResponse) {
            setState({
              status: 'success',
              objectURL,
              mode,
            });
          }

          return;
        }

        const content = await response.text();

        if (!ignoreResponse) {
          setState({
            status: 'success',
            content,
            mode,
          });
        }
      } catch (fetchError: unknown) {
        if (!ignoreResponse) {
          setState({
            status: 'error',
            message: fetchError instanceof Error
              ? fetchError.message
              : 'Unknown MEEGqc file fetch error',
          });
        }
      }
    };

    fetchFileContent();

    return () => {
      ignoreResponse = true;
      if (objectURL !== null) {
        URL.revokeObjectURL(objectURL);
      }
    };
  }, [fileName, fileURL, show]);

  return (
    <Modal
      show={show}
      title={fileName}
      onClose={onClose}
      width='90vw'
    >
      <div
        style={{
          color: '#222',
          direction: 'ltr',
          fontFamily: 'Arial, Helvetica, sans-serif',
          textAlign: 'left',
        }}
      >
        <MEEGqcFileViewerContent state={state} t={t}/>
      </div>
    </Modal>
  );
}

export default MEEGqcFileViewerModal;
