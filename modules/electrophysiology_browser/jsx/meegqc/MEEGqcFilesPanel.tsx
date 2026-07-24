import React, {useEffect, useMemo, useState} from 'react';
import type {TFunction} from 'i18next';
import Panel from 'jsx/Panel';
import MEEGqcFileViewerModal from './MEEGqcFileViewerModal';

declare const loris: {
  BaseURL: string;
};

/**
 * Store metadata for one MEEGqc output file.
 */
type MEEGqcFile = {
  id: number;
  name: string;
  category: string;
};

/**
 * Match the response returned by the MEEGqc files endpoint.
 */
type MEEGqcFilesResponse = {
  files: MEEGqcFile[];
};

/**
 * Track the loading lifecycle for the MEEGqc files list.
 */
type MEEGqcFilesState =
  | {status: 'loading'}
  | {status: 'success'; files: MEEGqcFile[]}
  | {status: 'error'; message: string};

/**
 * Store a display group of files that share a category.
 */
type FilesByCategory = {
  category: string;
  files: MEEGqcFile[];
};

const ns = {ns: 'electrophysiology_browser'};

/**
 * Component for listing and downloading MEEGqc output files.
 */
function MEEGqcFilesPanel({
  id,
  physioFileID,
  t,
}: {
  id: string;
  physioFileID: number;
  t: TFunction;
}) {
  const [state, setState] = useState<MEEGqcFilesState>({status: 'loading'});

  useEffect(() => {
    let ignoreResponse = false;

    /**
     * Fetch the list of MEEGqc files from the LORIS MEEGqc API.
     */
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

  /**
   * Render the content of the MEEGqc files panel.
   */
  function renderContent() {
    switch (state.status) {
    case 'loading':
      return (
        <button className='btn-info has-spinner'>
          {t('Loading...', {ns: 'loris'})}
          <span
            className='glyphicon glyphicon-refresh glyphicon-refresh-animate'
          >
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
          <div style={{color: '#777'}}>
            {t('No files available.', ns)}
          </div>
        );
      }

      return (
        <>
          <div style={{display: 'flex', justifyContent: 'flex-end'}}>
            <a
              className='btn btn-default btn-sm'
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

/**
 * Component for one category section in the MEEGqc files list.
 */
function MEEGqcFileCategoryGroup({
  group,
  physioFileID,
  t,
}: {
  group: FilesByCategory;
  physioFileID: number;
  t: TFunction;
}) {
  return (
    <div className='meegqc-file-category'>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          margin: '12px 0 6px',
        }}
      >
        <strong>{group.category}</strong>
        <a
          className='btn btn-default btn-xs'
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
            <th style={{textAlign: 'right'}}>
              {t('Actions', ns)}
            </th>
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

/**
 * Component for one MEEGqc file row with preview and download actions.
 */
function MEEGqcFileRow({file, physioFileID, t}: {
  file: MEEGqcFile;
  physioFileID: number;
  t: TFunction;
}) {
  const [showViewer, setShowViewer] = useState(false);
  const fileURL = getFileURL(physioFileID, file.id);
  const viewLabel = t('View', ns);
  const downloadLabel = t('Download', ns);

  return (
    <tr>
      <td>{file.name}</td>
      <td
        style={{
          textAlign: 'right',
          whiteSpace: 'nowrap',
        }}
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
        {showViewer && (
          <MEEGqcFileViewerModal
            fileName={file.name}
            fileURL={fileURL}
            show={showViewer}
            onClose={() => setShowViewer(false)}
            t={t}
          />
        )}
      </td>
    </tr>
  );
}

/**
 * Build the MEEGqc files endpoint URL.
 */
function getFilesURL(physioFileID: number): string {
  return `${loris.BaseURL}/imaging_gateway/meegqc/${physioFileID}/files`;
}

/**
 * Build the endpoint URL for one MEEGqc file.
 */
function getFileURL(
  physioFileID: number,
  meegqcFileID: number
): string {
  return `${getFilesURL(physioFileID)}/${meegqcFileID}`;
}

/**
 * Build the archive download URL for all files or one category.
 */
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

/**
 * Group MEEGqc files by category and sort files within each group.
 */
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

export default MEEGqcFilesPanel;
