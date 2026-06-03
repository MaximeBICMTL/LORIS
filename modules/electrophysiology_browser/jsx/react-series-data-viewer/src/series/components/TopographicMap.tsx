import {useEffect, useState} from "react";
import Modal from 'jsx/Modal';

type TopographicMapState =
  | { status: 'loading' }
  | { status: 'success'; imageURL: string }
  | { status: 'error'; message: string };

/**
 * The topographic map component.
 */
export function TopographicMap({physioFileID, tMin, tMax, lowPass, highPass}: {
  physioFileID: number,
  tMin: number,
  tMax: number,
  lowPass?: number,
  highPass?: number,
}) {
  const [state, setState] = useState<TopographicMapState>({ status: 'loading' });

  useEffect(() => {
    let currentImageURL: string | null = null;

    const fetchTopoData = async (physioFileID: number, tMin: number, tMax: number) => {
      try {
        let url = `/ephys/${physioFileID}/topographic-map?tmin=${tMin}&tmax=${tMax}`;
        if (lowPass !== undefined) {
          url += `&lfreq=${lowPass}`;
        }

        if (highPass !== undefined) {
          url += `&hfreq=${highPass}`;
        }

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'image/png',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          setState({ status: 'error', message: errorText || 'Failed to load topographic map image' });
          return;
        }

        const blob = await response.blob();
        currentImageURL = URL.createObjectURL(blob);
        setState({ status: 'success', imageURL: currentImageURL });
      } catch (err) {
        setState({ status: 'error', message: err instanceof Error ? err.message : 'Unknown error' });
      }
    };

    fetchTopoData(physioFileID, tMin, tMax);

    return () => {
      // Cleanup the image URL if it has been set.
      if (currentImageURL) {
        URL.revokeObjectURL(currentImageURL);
      }
    };
  }, [physioFileID, tMin, tMax]);

  switch (state.status) {
    case 'loading':
      return (
        <>
          Loading
          <span
            className='glyphicon glyphicon-refresh glyphicon-refresh-animate'>
          </span>
        </>
        );
    case 'error':
      return (
        <div style={{ color: 'red' }}>
          Failed to load topo: {state.message}
        </div>
      );
    case 'success':
      return (
        <div style={{display: 'flex', flexDirection: 'column'}}>
          <img
            src={state.imageURL}
            alt="Topographic map image"
            style={{maxHeight: '50vh', alignSelf: 'center'}}
          />
          <br/>
          <a href={state.imageURL} download="topo.png" style={{alignSelf: 'flex-end'}}>
            <button className='btn btn-default'>
              <span className="glyphicon glyphicon-download-alt"></span>
              &nbsp;
              Download
            </button>
          </a>
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
  const tMin = Math.min(timeSelection[0], timeSelection[1]);
  const tMax = Math.max(timeSelection[0], timeSelection[1]);
  const tAbs = Math.abs(timeSelection[0] - timeSelection[1]);

  return (
    <Modal
      show={show}
      title={`Channel Topography – ${tMin.toFixed(2)}s to ${tMax.toFixed(2)}s (${tAbs.toFixed(2)}s)`}
      onClose={() => setShow(false)}
    >
      <TopographicMap
        physioFileID={physioFileID}
        tMin={tMin}
        tMax={tMax}
        lowPass={lowPass}
        highPass={highPass}
      />
    </Modal>
  );
}

/**
 * The topographic map button component.
 */
export function TopographicMapButton({physioFileID, timeSelection, lowPass, highPass}: {
  physioFileID: number,
  timeSelection?: [number, number],
  lowPass?: number,
  highPass?: number,
}) {
  const [show, setShow] = useState(false);

  return (
    <>
      <button
        className={'btn btn-primary'}
        disabled={!timeSelection}
        style={{width: 'fit-content'}}
        onClick={() => setShow(!show)}
      >
        View Topographic Map
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
