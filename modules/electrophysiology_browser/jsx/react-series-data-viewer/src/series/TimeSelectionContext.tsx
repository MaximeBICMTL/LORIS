import React, {
  createContext,
  FunctionComponent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {MIN_INTERVAL} from '../vector';
import {roundTime} from '../utils';
import {useInterval} from './IntervalContext';

export type TimeSelection = [number, number] | null;

type TimeSelectionContextValue = {
  timeSelection: TimeSelection,
  setTimeSelection: (_: TimeSelection) => void,
  startTimeSelection: (_: number) => void,
  continueTimeSelection: (_: number) => void,
  endTimeSelection: () => void,
};

const TimeSelectionContext = createContext<
  TimeSelectionContextValue | undefined
>(undefined);

/**
 * Own the transient selection drawn over the current time interval.
 */
export const TimeSelectionProvider: FunctionComponent<{
  children: React.ReactNode,
}> = ({children}) => {
  const {interval} = useInterval();
  const [timeSelection, setTimeSelection] = useState<TimeSelection>(null);

  const getTimeAtPosition = useCallback((position: number) => {
    return roundTime(interval[0] + position * (interval[1] - interval[0]));
  }, [interval]);

  const startTimeSelection = useCallback((position: number) => {
    const time = getTimeAtPosition(position);
    setTimeSelection([time, time]);
  }, [getTimeAtPosition]);

  const continueTimeSelection = useCallback((position: number) => {
    const time = getTimeAtPosition(position);
    setTimeSelection((selection) => (
      selection === null ? null : [selection[0], time]
    ));
  }, [getTimeAtPosition]);

  const endTimeSelection = useCallback(() => {
    setTimeSelection((selection) => (
      selection !== null
      && Math.abs(selection[1] - selection[0]) < MIN_INTERVAL
        ? null
        : selection
    ));
  }, []);

  const value = useMemo(() => ({
    timeSelection,
    setTimeSelection,
    startTimeSelection,
    continueTimeSelection,
    endTimeSelection,
  }), [
    continueTimeSelection,
    endTimeSelection,
    startTimeSelection,
    timeSelection,
  ]);

  return (
    <TimeSelectionContext.Provider value={value}>
      {children}
    </TimeSelectionContext.Provider>
  );
};

/**
 * Access the time selection shared by the signal viewer.
 */
export function useTimeSelection(): TimeSelectionContextValue {
  const context = useContext(TimeSelectionContext);
  if (context === undefined) {
    throw new Error(
      'useTimeSelection must be used within a TimeSelectionProvider'
    );
  }
  return context;
}
