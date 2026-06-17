import React, {ReactNode, useEffect, useState} from 'react';
import type {TFunction} from 'i18next';
import Modal from 'jsx/Modal';
import {
  PlainTextViewer,
  HTMLIframeViewer,
  TSVViewer,
} from '../common/FileViewers';

type FilePreviewType = 'html' | 'text' | 'tsv';

/**
 * Store the loaded content needed by the selected MEEGqc file viewer.
 */
type FilePreviewData =
  | {type: 'html'; url: string}
  | {type: 'text' | 'tsv'; content: string};

/**
 * Track the loading lifecycle for a MEEGqc file preview request.
 */
type FilePreviewState =
  | {status: 'idle'}
  | {status: 'loading'}
  | {status: 'success'; preview?: FilePreviewData}
  | {status: 'error'; message: string};

const ns = {ns: 'electrophysiology_browser'};

/**
 * Component for previewing a MEEGqc file in a modal dialog.
 */
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
  t: TFunction;
}) {
  const [state, setState] = useState<FilePreviewState>({status: 'idle'});
  const loadingLabel = t('Loading...', {ns: 'loris'});
  const unknownErrorMessage = t('Unknown file fetch error', ns);

  useEffect(() => {
    let ignoreResponse = false;

    /**
     * Fetch the file content from the MEEGqc LORIS API.
     */
    const fetchFileContent = async () => {
      if (!show) {
        setState({status: 'idle'});
        return;
      }

      setState({status: 'loading'});

      try {
        const viewType = getFilePreviewType(fileName);

        if (!viewType) {
          if (!ignoreResponse) {
            setState({status: 'success', preview: undefined});
          }

          return;
        }

        if (viewType === 'html') {
          if (!ignoreResponse) {
            setState({
              status: 'success',
              preview: {
                url: fileURL,
                type: viewType,
              },
            });
          }

          return;
        }

        const response = await fetch(
          fileURL,
          {credentials: 'same-origin'}
        );

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const content = await response.text();

        if (!ignoreResponse) {
          setState({
            status: 'success',
            preview: {
              content,
              type: viewType,
            },
          });
        }
      } catch (fetchError: unknown) {
        if (!ignoreResponse) {
          setState({
            status: 'error',
            message: fetchError instanceof Error
              ? fetchError.message
              : unknownErrorMessage,
          });
        }
      }
    };

    fetchFileContent();

    return () => {
      ignoreResponse = true;
    };
  }, [fileName, fileURL, show, unknownErrorMessage]);

  return (
    <Modal
      show={show}
      title={fileName}
      onClose={onClose}
      width='95vw'
    >
      <div
        style={{
          color: '#222',
          direction: 'ltr',
          fontFamily: 'Arial, Helvetica, sans-serif',
          textAlign: 'left',
        }}
      >
        <MEEGqcFileViewerContent
          loadingLabel={loadingLabel}
          state={state}
          t={t}
        />
      </div>
    </Modal>
  );
}

/**
 * Component for the body of the MEEGqc file preview modal.
 */
function MEEGqcFileViewerContent({
  state,
  loadingLabel,
  t,
}: {
  state: FilePreviewState;
  loadingLabel: ReactNode;
  t: TFunction;
}) {
  switch (state.status) {
  case 'idle':
  case 'loading':
    return (
      <>
        {loadingLabel}
        <span className='glyphicon glyphicon-refresh glyphicon-refresh-animate'>
        </span>
      </>
    );
  case 'error':
    return (
      <div className='alert alert-danger'>
        {t('Unable to load file.', ns)}
        <br/>
        {state.message}
      </div>
    );
  case 'success':
    if (!state.preview) {
      return (
        <div style={{color: '#777'}}>
          {t('File preview is not supported for this file type.', ns)}
        </div>
      );
    }

    switch (state.preview.type) {
    case 'html':
      return (
        <HTMLIframeViewer
          sandbox='allow-scripts'
          url={state.preview.url}
          title={t('MEEGqc HTML file preview', ns)}
        />
      );
    case 'tsv':
      return <TSVViewer content={state.preview.content}/>;
    case 'text':
      return <PlainTextViewer content={state.preview.content}/>;
    }
  }
}

/**
 * Choose the preview type for supported MEEGqc file extensions.
 */
function getFilePreviewType(fileName: string): FilePreviewType | null {
  switch (getFileExtension(fileName)) {
  case 'html':
    return 'html';
  case 'tsv':
    return 'tsv';
  case 'json':
  case 'txt':
    return 'text';
  }

  return null;
}

/**
 * Return the lower-case extension from a filename.
 */
function getFileExtension(fileName: string): string {
  const extension = fileName.split('.').pop();
  return extension?.toLowerCase() ?? '';
}

export default MEEGqcFileViewerModal;
