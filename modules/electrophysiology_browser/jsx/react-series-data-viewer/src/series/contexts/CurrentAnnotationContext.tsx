import React, {
  createContext,
  FunctionComponent,
  useContext,
  useMemo,
  useState,
} from 'react';
import {Epoch} from '../store/types';

type CurrentAnnotationContextValue = {
  currentAnnotation: Epoch | null,
  setCurrentAnnotation: React.Dispatch<React.SetStateAction<Epoch | null>>,
};

const CurrentAnnotationContext =
  createContext<CurrentAnnotationContextValue | null>(null);

export const CurrentAnnotationProvider: FunctionComponent<{
  children: React.ReactNode,
}> = ({children}) => {
  const [currentAnnotation, setCurrentAnnotation] = useState<Epoch | null>(null);
  const value = useMemo(() => ({
    currentAnnotation,
    setCurrentAnnotation,
  }), [currentAnnotation]);

  return (
    <CurrentAnnotationContext.Provider value={value}>
      {children}
    </CurrentAnnotationContext.Provider>
  );
};

export const useCurrentAnnotation = (): CurrentAnnotationContextValue => {
  const context = useContext(CurrentAnnotationContext);
  if (!context) {
    throw new Error(
      'useCurrentAnnotation must be used within a CurrentAnnotationProvider'
    );
  }
  return context;
};
