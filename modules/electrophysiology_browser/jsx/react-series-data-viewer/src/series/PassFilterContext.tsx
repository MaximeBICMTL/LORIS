import React, {
  createContext,
  FunctionComponent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {useSelector} from 'react-redux';
import {RootState} from './store';
import {
  applyFilter,
  getHighPassFilterKey,
  getLowPassFilterKey,
  HIGH_PASS_FILTERS,
  LOW_PASS_FILTERS,
  FilterCoefficients,
  SignalFilter,
} from './store/logic/highLowPass';

type PassFilterContextValue = {
  highPass?: number,
  lowPass?: number,
  filters: Record<string, SignalFilter>,
  setHighPass: (_?: number) => void,
  setLowPass: (_?: number) => void,
};

const PassFilterContext = createContext<PassFilterContextValue | undefined>(
  undefined
);

/**
 * Own the high-pass and low-pass filters used by the signal viewer.
 */
export const PassFilterProvider: FunctionComponent<{
  children: React.ReactNode,
}> = ({children}) => {
  const samplingFrequency = useSelector(
    (state: RootState) => state.dataset.samplingFrequency
  );
  const [highPass, setHighPass] = useState<number | undefined>();
  const [lowPass, setLowPass] = useState<number | undefined>();

  const filters = useMemo(() => {
    const nextFilters: Record<string, SignalFilter> = {};

    if (highPass !== undefined) {
      const key = getHighPassFilterKey(highPass);
      const coefficientMap = HIGH_PASS_FILTERS[key].coefficients as Record<
        string,
        FilterCoefficients | null
      >;
      const coefficients = coefficientMap[samplingFrequency];
      nextFilters.highPass = {
        name: key,
        fn: (input) => applyFilter(coefficients, input),
      };
    }

    if (lowPass !== undefined) {
      const key = getLowPassFilterKey(lowPass);
      const coefficientMap = LOW_PASS_FILTERS[key].coefficients as Record<
        string,
        FilterCoefficients | null
      >;
      const coefficients = coefficientMap[samplingFrequency];
      nextFilters.lowPass = {
        name: key,
        fn: (input) => applyFilter(coefficients, input),
      };
    }

    return nextFilters;
  }, [highPass, lowPass, samplingFrequency]);

  const updateHighPass = useCallback((frequency?: number) => {
    setHighPass(frequency);
  }, []);

  const updateLowPass = useCallback((frequency?: number) => {
    setLowPass(frequency);
  }, []);

  const value = useMemo(() => ({
    highPass,
    lowPass,
    filters,
    setHighPass: updateHighPass,
    setLowPass: updateLowPass,
  }), [filters, highPass, lowPass, updateHighPass, updateLowPass]);

  return (
    <PassFilterContext.Provider value={value}>
      {children}
    </PassFilterContext.Provider>
  );
};

/**
 * Access the pass filters shared by the signal viewer.
 */
export function usePassFilters(): PassFilterContextValue {
  const context = useContext(PassFilterContext);
  if (context === undefined) {
    throw new Error('usePassFilters must be used within a PassFilterProvider');
  }
  return context;
}
