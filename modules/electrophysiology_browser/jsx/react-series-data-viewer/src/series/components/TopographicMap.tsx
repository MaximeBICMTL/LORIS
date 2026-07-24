import {CSSProperties, useEffect, useState} from 'react';
import {Trans, useTranslation} from 'react-i18next';
import Modal from 'jsx/Modal';
import {
  HighPassFilterSelect,
  LowPassFilterSelect,
} from './PassFilterSelect';

declare const loris: {
  BaseURL: string;
};

const ns = {ns: 'electrophysiology_browser'};

type TopographicMapState =
  | { status: 'loading' }
  | { status: 'success'; imageURL: string }
  | { status: 'error'; message: string };

/**
 * The topographic map component.
 */
export function TopographicMap({
  physioFileID,
  tMin,
  tMax,
  lowPass,
  highPass,
  onImageURLChange,
}: {
  physioFileID: number,
  tMin: number,
  tMax: number,
  lowPass?: number,
  highPass?: number,
  onImageURLChange?: (imageURL: string | null) => void,
}) {
  const {t} = useTranslation();
  const [state, setState] = useState<TopographicMapState>({ status: 'loading' });

  useEffect(() => {
    let currentImageURL: string | null = null;
    let ignoreResponse = false;
    setState({ status: 'loading' });
    onImageURLChange?.(null);

    const fetchTopoData = async (physioFileID: number, tMin: number, tMax: number) => {
      try {
        let url = `${loris.BaseURL}/imaging_gateway/ephys/${physioFileID}`
          + `/topographic-map?tmin=${tMin}&tmax=${tMax}`;
        if (highPass !== undefined) {
          url += `&lfreq=${highPass}`;
        }

        if (lowPass !== undefined) {
          url += `&hfreq=${lowPass}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'image/png',
          },
        });

        if (ignoreResponse) {
          return;
        }

        if (!response.ok) {
          const errorText = await response.text();
          if (ignoreResponse) {
            return;
          }

          setState({
            status: 'error',
            message: errorText || t('Failed to load topographic map image.', ns),
          });
          return;
        }

        const blob = await response.blob();
        currentImageURL = URL.createObjectURL(blob);
        if (ignoreResponse) {
          URL.revokeObjectURL(currentImageURL);
          return;
        }

        setState({ status: 'success', imageURL: currentImageURL });
        onImageURLChange?.(currentImageURL);
      } catch (err) {
        if (ignoreResponse) {
          return;
        }

        setState({
          status: 'error',
          message: err instanceof Error
            ? err.message
            : t('Unknown error', {ns: 'loris'}),
        });
      }
    };

    fetchTopoData(physioFileID, tMin, tMax);

    return () => {
      ignoreResponse = true;
      // Cleanup the image URL if it has been set.
      if (currentImageURL) {
        URL.revokeObjectURL(currentImageURL);
      }
      onImageURLChange?.(null);
    };
  }, [physioFileID, tMin, tMax, lowPass, highPass, onImageURLChange, t]);

  switch (state.status) {
    case 'loading':
      return (
        <div style={topographicMapViewportStyle}>
          {t('Loading...', {ns: 'loris'})}
          <span
            className='glyphicon glyphicon-refresh glyphicon-refresh-animate'>
          </span>
        </div>
        );
    case 'error':
      return (
        <div style={{...topographicMapViewportStyle, color: 'red'}}>
          {t('Failed to load topographic map: {{message}}', {
            ...ns,
            message: state.message,
          })}
        </div>
      );
    case 'success':
      return (
        <div style={topographicMapViewportStyle}>
          <img
            src={state.imageURL}
            alt={t('Topographic map image', ns)}
            style={{
              maxHeight: '100%',
              maxWidth: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      );
  }
};

/**
 * The topographic map modal component.
 */
export function TopographicMapModal({physioFileID, timeSelection, lowPass, highPass, show, setShow}: {
  physioFileID: number,
  timeSelection: [number, number],
  lowPass?: number,
  highPass?: number,
  show: boolean,
  setShow: (show: boolean) => void,
}) {
  const {t} = useTranslation();
  const [imageURL, setImageURL] = useState<string | null>(null);
  const [selectedLowPass, setSelectedLowPass] = useState(lowPass);
  const [selectedHighPass, setSelectedHighPass] = useState(highPass);
  const tMin = Math.min(timeSelection[0], timeSelection[1]);
  const tMax = Math.max(timeSelection[0], timeSelection[1]);
  const tAbs = Math.abs(timeSelection[0] - timeSelection[1]);

  useEffect(() => {
    if (show) {
      setSelectedLowPass(lowPass);
      setSelectedHighPass(highPass);
    }
  }, [show, lowPass, highPass]);

  return (
    <Modal
      show={show}
      title={t(
        'Channel Topography – {{start}}s to {{end}}s ({{duration}}s)',
        {
          ...ns,
          start: tMin.toFixed(2),
          end: tMax.toFixed(2),
          duration: tAbs.toFixed(2),
        }
      )}
      onClose={() => setShow(false)}
      footer={
        <div style={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
        }}>
          <span>
            <Trans
              i18nKey='Image generated using the <mne>MNE</mne> library.'
              ns='electrophysiology_browser'
              components={{mne: <a href='https://mne.tools'/>}}
            />
          </span>
          {imageURL && (
            <a
              href={imageURL}
              download="topographic-map.png"
              className='btn btn-default'
            >
              <span className="glyphicon glyphicon-download-alt"></span>
              &nbsp;
              {t('Download Image', ns)}
            </a>
          )}
        </div>
      }
    >
      <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
        <div style={{display: 'flex', gap: '5px'}}>
          <HighPassFilterSelect
            value={selectedHighPass}
            onChange={setSelectedHighPass}
          />
          <LowPassFilterSelect
            value={selectedLowPass}
            onChange={setSelectedLowPass}
          />
        </div>
        <TopographicMap
          physioFileID={physioFileID}
          tMin={tMin}
          tMax={tMax}
          lowPass={selectedLowPass}
          highPass={selectedHighPass}
          onImageURLChange={setImageURL}
        />
      </div>
    </Modal>
  );
}

const topographicMapViewportStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  justifyContent: 'center',
  height: '50vh',
  minHeight: '280px',
  overflow: 'auto',
  textAlign: 'center',
  width: '100%',
};

/**
 * The topographic map button component.
 */
export function TopographicMapButton({physioFileID, timeSelection, lowPass, highPass}: {
  physioFileID: number,
  timeSelection?: [number, number],
  lowPass?: number,
  highPass?: number,
}) {
  const {t} = useTranslation();
  const [show, setShow] = useState(false);

  return (
    <>
      <button
        className={'btn btn-primary'}
        disabled={!timeSelection}
        style={{width: 'fit-content'}}
        onClick={() => setShow(!show)}
      >
        {t('View Topographic Map', ns)}
      </button>
      {timeSelection && (
        <TopographicMapModal
          physioFileID={physioFileID}
          timeSelection={timeSelection}
          lowPass={lowPass}
          highPass={highPass}
          show={show}
          setShow={setShow}
        />
      )}
    </>
  );
}
