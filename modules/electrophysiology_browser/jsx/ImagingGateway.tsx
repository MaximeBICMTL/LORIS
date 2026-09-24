import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {ReactNode} from 'react';

declare const loris: {
  BaseURL: string;
};

export type ImagingGatewayStatus = 'checking' | 'available' | 'unavailable';
export type ImagingFeature = 'meegqc';

type FeatureAvailability = Partial<Record<ImagingFeature, boolean>>;

type ImagingGatewayContextValue = {
  status: ImagingGatewayStatus;
  featureAvailability: Record<number, FeatureAvailability>;
  reportFeatureAvailability: (
    physioFileID: number,
    feature: ImagingFeature,
    available: boolean
  ) => void;
};

const DEFAULT_CONTEXT: ImagingGatewayContextValue = {
  status: 'checking',
  featureAvailability: {},
  /** Ignore availability reports until a provider is mounted. */
  reportFeatureAvailability: () => undefined,
};

export const ImagingGatewayContext =
  createContext<ImagingGatewayContextValue>(DEFAULT_CONTEXT);

/**
 * Check whether the optional Python imaging gateway is available.
 *
 * Individual features determine their own availability from their real data
 * requests; the health check only prevents requests when there is no gateway.
 */
export function ImagingGatewayProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const [status, setStatus] = useState<ImagingGatewayStatus>('checking');
  const [featureAvailability, setFeatureAvailability] = useState<
    Record<number, FeatureAvailability>
  >({});

  useEffect(() => {
    const abortController = new AbortController();

    fetch(`${loris.BaseURL}/imaging_gateway/health`, {
      credentials: 'same-origin',
      headers: {'Accept': 'text/plain'},
      signal: abortController.signal,
    })
      .then((response) => {
        if (!abortController.signal.aborted) {
          setStatus(response.ok ? 'available' : 'unavailable');
        }
      })
      .catch(() => {
        if (!abortController.signal.aborted) {
          setStatus('unavailable');
        }
      });

    return () => abortController.abort();
  }, []);

  const reportFeatureAvailability = useCallback((
    physioFileID: number,
    feature: ImagingFeature,
    available: boolean
  ) => {
    setFeatureAvailability((current) => {
      if (current[physioFileID]?.[feature] === available) {
        return current;
      }

      return {
        ...current,
        [physioFileID]: {
          ...current[physioFileID],
          [feature]: available,
        },
      };
    });
  }, []);

  const value = useMemo<ImagingGatewayContextValue>(() => ({
    status,
    featureAvailability,
    reportFeatureAvailability,
  }), [status, featureAvailability, reportFeatureAvailability]);

  return (
    <ImagingGatewayContext.Provider value={value}>
      {children}
    </ImagingGatewayContext.Provider>
  );
}
