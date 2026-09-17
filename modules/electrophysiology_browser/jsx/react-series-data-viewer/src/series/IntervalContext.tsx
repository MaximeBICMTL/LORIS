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
import {RootState} from './store';
import {updateViewedChunks} from './store/logic/fetchChunks';
import {DEFAULT_TIME_INTERVAL} from '../vector';
import {useAmplitude} from './AmplitudeContext';

export type Interval = [number, number];

type IntervalContextValue = {
  domain: Interval,
  interval: Interval,
  setInterval: (_: Interval) => void,
};

const IntervalContext = createContext<IntervalContextValue | undefined>(
  undefined
);

/**
 * Own and expose the time interval shared by the signal viewer.
 */
export const IntervalProvider: FunctionComponent<{
  children: React.ReactNode,
}> = ({children}) => {
  const domain = useSelector((state: RootState) => state.dataset.timeInterval);
  const filters = useSelector((state: RootState) => state.filters);
  const {amplitudeScale} = useAmplitude();
  const [interval, updateInterval] = useState<Interval>(DEFAULT_TIME_INTERVAL);
  const dispatch = useDispatch();

  const setInterval = useCallback((nextInterval: Interval) => {
    updateInterval([
      Math.min(nextInterval[0], nextInterval[1]),
      Math.max(nextInterval[0], nextInterval[1]),
    ]);
  }, []);

  useEffect(() => {
    dispatch(updateViewedChunks({domain, interval}));
  }, [amplitudeScale, dispatch, domain, filters, interval]);

  const value = useMemo(() => ({
    domain,
    interval,
    setInterval,
  }), [domain, interval, setInterval]);

  return (
    <IntervalContext.Provider value={value}>
      {children}
    </IntervalContext.Provider>
  );
};

/**
 * Access the interval shared by the signal viewer.
 */
export function useInterval(): IntervalContextValue {
  const context = useContext(IntervalContext);
  if (context === undefined) {
    throw new Error('useInterval must be used within an IntervalProvider');
  }
  return context;
}
