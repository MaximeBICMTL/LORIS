import {useEffect, useRef, useState} from 'react';
import {useSelector} from 'react-redux';
import {usePassFilters} from '../contexts/PassFilterContext';
import {useTimeWindow} from '../contexts/TimeWindowContext';
import {RootState} from '../store';
import {Channel} from '../store/types';
import {loadViewedChannels} from '../viewedChannels';

type ViewedChannels = {
  channels: Channel[],
  loadedChannels: number,
};

const UPDATE_DEBOUNCE_TIME = 100;

/** Load the signal data needed by the current viewport and channel page. */
export function useViewedChannels(channelIndexes: number[]): ViewedChannels {
  const {chunksURL, shapes, validSamples} = useSelector(
    (state: RootState) => state.dataset
  );
  const {recordingTimeRange, timeWindow} = useTimeWindow();
  const {filters} = usePassFilters();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loadedChannels, setLoadedChannels] = useState(0);
  const requestId = useRef(0);
  const channelIndexesKey = channelIndexes.join(',');
  const previousChannelIndexesKey = useRef('');

  useEffect(() => {
    const currentRequestId = ++requestId.current;
    setLoadedChannels(0);

    if (previousChannelIndexesKey.current !== channelIndexesKey) {
      setChannels(channelIndexes.map((index) => ({
        index,
        traces: [{chunks: [], type: 'line'}],
      })));
      previousChannelIndexesKey.current = channelIndexesKey;
    }

    if (!chunksURL || channelIndexes.length === 0 || shapes.length === 0) {
      setChannels([]);
      return;
    }

    const timeout = window.setTimeout(() => {
      loadViewedChannels({
        chunksURL,
        channelIndexes,
        shapes,
        validSamples,
        recordingTimeRange,
        timeWindow,
        filters,
        onChannelLoaded: () => {
          if (requestId.current === currentRequestId) {
            setLoadedChannels((count) => count + 1);
          }
        },
      }).then((nextChannels) => {
        if (requestId.current === currentRequestId) {
          setChannels(nextChannels);
        }
      }).catch((error) => {
        if (requestId.current === currentRequestId) {
          console.error('Could not load signal chunks', error);
          setChannels([]);
        }
      });
    }, UPDATE_DEBOUNCE_TIME);

    return () => {
      window.clearTimeout(timeout);
      requestId.current++;
    };
  }, [
    channelIndexesKey,
    chunksURL,
    filters,
    recordingTimeRange,
    shapes,
    timeWindow,
    validSamples,
  ]);

  return {channels, loadedChannels};
}
