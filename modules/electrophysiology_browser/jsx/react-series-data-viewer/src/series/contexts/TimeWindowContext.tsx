import React, {
  createContext,
  FunctionComponent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../store';
import {updateViewedChunks} from '../store/logic/fetchChunks';
import {DEFAULT_TIME_WINDOW} from '../../vector';
import {useAmplitude} from './AmplitudeContext';
import {usePassFilters} from './PassFilterContext';
import {TimeRange} from './types';
import {normalizeTimeWindow} from '../timeWindow';

type TimeWindowContextValue = {
  recordingTimeRange: TimeRange,
  timeWindow: TimeRange,
  setTimeWindow: (_: TimeRange) => void,
};

const TimeWindowContext = createContext<TimeWindowContextValue | undefined>(
  undefined
);

/**
 * Own and expose the visible time window shared by the signal viewer.
 */
export const TimeWindowProvider: FunctionComponent<{
  children: React.ReactNode,
}> = ({children}) => {
  const recordingTimeRange = useSelector(
    (state: RootState) => state.dataset.timeInterval
  );
  const {filters} = usePassFilters();
  const {amplitudeScale} = useAmplitude();
  const [timeWindow, updateTimeWindow] = useState<TimeRange>(() =>
    normalizeTimeWindow(DEFAULT_TIME_WINDOW, recordingTimeRange)
  );
  const dispatch = useDispatch();

  const setTimeWindow = useCallback((nextTimeWindow: TimeRange) => {
    updateTimeWindow(normalizeTimeWindow(
      nextTimeWindow,
      recordingTimeRange
    ));
  }, [recordingTimeRange]);

  useEffect(() => {
    updateTimeWindow((currentTimeWindow) => normalizeTimeWindow(
      currentTimeWindow,
      recordingTimeRange
    ));
  }, [recordingTimeRange]);

  useEffect(() => {
    dispatch(updateViewedChunks({
      filters,
      recordingTimeRange,
      timeWindow,
    }));
  }, [amplitudeScale, dispatch, filters, recordingTimeRange, timeWindow]);

  const value = useMemo(() => ({
    recordingTimeRange,
    timeWindow,
    setTimeWindow,
  }), [recordingTimeRange, timeWindow, setTimeWindow]);

  return (
    <TimeWindowContext.Provider value={value}>
      {children}
    </TimeWindowContext.Provider>
  );
};

/**
 * Access the visible time window shared by the signal viewer.
 */
export function useTimeWindow(): TimeWindowContextValue {
  const context = useContext(TimeWindowContext);
  if (context === undefined) {
    throw new Error('useTimeWindow must be used within a TimeWindowProvider');
  }
  return context;
}
