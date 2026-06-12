import React, {useEffect, useMemo, useState} from 'react';
import Panel from 'jsx/Panel';
import MEEGqcFileViewerModal from './MEEGqcFileViewerModal';

declare const loris: {
  BaseURL: string;
};

type TranslationFunction = (
  key: string,
  options?: Record<string, unknown>
) => string;

type MEEGqcFile = {
  id: number;
  name: string;
  category: string;
};

type MEEGqcFilesResponse = {
  files: MEEGqcFile[];
};

type MEEGqcFilesState =
  | {status: 'loading'}
  | {status: 'success'; files: MEEGqcFile[]}
  | {status: 'error'; message: string};

type FilesByCategory = {
  category: string;
  files: MEEGqcFile[];
};

const ns = {ns: 'electrophysiology_browser'};

function getFilesURL(physioFileID: number): string {
  return `${loris.BaseURL}/ephys/${physioFileID}/meegqc/files`;
}

function getFileURL(
  physioFileID: number,
  meegqcFileID: number
): string {
  return `${getFilesURL(physioFileID)}/${meegqcFileID}`;
}

function getArchiveDownloadURL(
  physioFileID: number,
  category?: string
): string {
  const baseURL = `${getFilesURL(physioFileID)}/archive`;

  if (!category) {
    return baseURL;
  }

  return `${baseURL}?category=${encodeURIComponent(category)}`;
}

function groupFilesByCategory(files: MEEGqcFile[]): FilesByCategory[] {
  const filesByCategory = new Map<string, MEEGqcFile[]>();

  for (const file of files) {
    const category = file.category || 'unknown';
    filesByCategory.set(
      category,
      [...(filesByCategory.get(category) ?? []), file]
    );
  }

  return [...filesByCategory.entries()]
    .sort(([categoryA], [categoryB]) => categoryA.localeCompare(categoryB))
    .map(([category, categoryFiles]) => ({
      category,
      files: [...categoryFiles].sort((fileA, fileB) =>
        fileA.name.localeCompare(fileB.name)
      ),
    }));
}

function MEEGqcFileRow({
  file,
  physioFileID,
  t,
}: {
  file: MEEGqcFile;
  physioFileID: number;
  t: TranslationFunction;
}) {
  const [showViewer, setShowViewer] = useState(false);
  const fileURL = getFileURL(physioFileID, file.id);
  const viewLabel = t('View', ns);
  const downloadLabel = t('Download', ns);

  return (
    <tr>
      <td>{file.name}</td>
      <td
        className='text-right'
        style={{whiteSpace: 'nowrap'}}
      >
        <a
          href={fileURL}
          title={viewLabel}
          aria-label={viewLabel}
          style={{marginRight: '10px'}}
          onClick={(event) => {
            event.preventDefault();
            setShowViewer(true);
          }}
        >
          <span className='glyphicon glyphicon-eye-open'></span>
        </a>
        <a
          href={fileURL}
          download={file.name}
          target='_blank'
          rel='noreferrer'
          title={downloadLabel}
          aria-label={downloadLabel}
        >
          <span className='glyphicon glyphicon-download-alt'></span>
        </a>
        <MEEGqcFileViewerModal
          fileName={file.name}
          fileURL={fileURL}
          show={showViewer}
          onClose={() => setShowViewer(false)}
          t={t}
        />
      </td>
    </tr>
  );
}

function MEEGqcFileCategoryGroup({
  group,
  physioFileID,
  t,
}: {
  group: FilesByCategory;
  physioFileID: number;
  t: TranslationFunction;
}) {
  return (
    <div className='meegqc-file-category'>
      <div
        className='clearfix'
        style={{margin: '12px 0 6px'}}
      >
        <strong>{group.category}</strong>
        <a
          className='btn btn-default btn-xs pull-right'
          href={getArchiveDownloadURL(physioFileID, group.category)}
          target='_blank'
          rel='noreferrer'
        >
          <span
            className='glyphicon glyphicon-download-alt'
            style={{marginRight: '5px'}}
          ></span>
          {t('Download category', ns)}
        </a>
      </div>
      <table className='table table-condensed table-striped'>
        <thead>
          <tr>
            <th>{t('File', ns)}</th>
            <th className='text-right'>{t('Actions', ns)}</th>
          </tr>
        </thead>
        <tbody>
          {group.files.map((file) => (
            <MEEGqcFileRow
              key={file.id}
              file={file}
              physioFileID={physioFileID}
              t={t}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MEEGqcFilesPanel({
  id,
  physioFileID,
  t,
}: {
  id: string;
  physioFileID: number;
  t: TranslationFunction;
}) {
  const [state, setState] = useState<MEEGqcFilesState>({status: 'loading'});

  useEffect(() => {
    let ignoreResponse = false;

    const fetchMEEGqcFiles = async () => {
      setState({status: 'loading'});

      try {
        const response = await fetch(
          getFilesURL(physioFileID),
          {credentials: 'same-origin'}
        );

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const data = await response.json() as MEEGqcFilesResponse;

        if (!ignoreResponse) {
          setState({status: 'success', files: data.files ?? []});
        }
      } catch (fetchError: unknown) {
        if (!ignoreResponse) {
          setState({
            status: 'error',
            message: fetchError instanceof Error
              ? fetchError.message
              : 'Unknown MEEGqc files fetch error',
          });
        }
      }
    };

    fetchMEEGqcFiles();

    return () => {
      ignoreResponse = true;
    };
  }, [physioFileID]);

  const files = state.status === 'success' ? state.files : [];
  const groupedFiles = useMemo(() => groupFilesByCategory(files), [files]);

  function renderContent() {
    switch (state.status) {
    case 'loading':
      return (
        <button className='btn-info has-spinner'>
          {t('Loading...', {ns: 'loris'})}
          <span className='glyphicon glyphicon-refresh glyphicon-refresh-animate'>
          </span>
        </button>
      );
    case 'error':
      return (
        <div className='alert alert-danger'>
          {t('Unable to load MEEGqc files.', ns)}
        </div>
      );
    case 'success':
      if (state.files.length === 0) {
        return (
          <div className='text-muted'>
            {t('No files available.', ns)}
          </div>
        );
      }

      return (
        <>
          <div className='clearfix'>
            <a
              className='btn btn-default btn-sm pull-right'
              href={getArchiveDownloadURL(physioFileID)}
              target='_blank'
              rel='noreferrer'
            >
              <span
                className='glyphicon glyphicon-download-alt'
                style={{marginRight: '5px'}}
              ></span>
              {t('Download all files', ns)}
            </a>
          </div>
          {groupedFiles.map((group) => (
            <MEEGqcFileCategoryGroup
              key={group.category}
              group={group}
              physioFileID={physioFileID}
              t={t}
            />
          ))}
        </>
      );
    }
  }

  return (
    <Panel
      id={id}
      title={t('MEEGqc', ns)}
    >
      <div
        style={{
          maxHeight: '300px',
          minHeight: '300px',
          overflowY: 'auto',
        }}
      >
        {renderContent()}
      </div>
    </Panel>
  );
}

export default MEEGqcFilesPanel;
