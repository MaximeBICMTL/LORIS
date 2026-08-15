import React, {
  createContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {ReactNode} from 'react';

declare const loris: {
  BaseURL: string;
};

export type ImagingGatewayCapabilities = {
  meegqc: boolean;
  megGeometry: boolean;
  topographicMap: boolean;
};

const NO_CAPABILITIES: ImagingGatewayCapabilities = {
  meegqc: false,
  megGeometry: false,
  topographicMap: false,
};

const ROUTES = {
  meegqc: '/meegqc/{physio_file_id}/files',
  megHeadShape: '/ephys/{physio_file_id}/meg/headshape',
  megSensors: '/ephys/{physio_file_id}/meg/sensors',
  topographicMap: '/ephys/{physio_file_id}/topographic-map',
};

export const ImagingGatewayCapabilitiesContext
  = createContext<ImagingGatewayCapabilities>(NO_CAPABILITIES);

/**
 * Discover optional routes exposed by the Python imaging server.
 *
 * Capabilities intentionally default to disabled. This hides dependent UI
 * when the LORIS gateway, Python server, or an optional Python module is not
 * available.
 */
export function ImagingGatewayCapabilitiesProvider({
  children,
}: {
  children: ReactNode;
}): React.ReactElement {
  const [paths, setPaths] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const abortController = new AbortController();

    fetch(`${loris.BaseURL}/imaging_gateway/openapi.json`, {
      credentials: 'same-origin',
      headers: {'Accept': 'application/json'},
      signal: abortController.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(response.statusText);
        }
        return response.json();
      })
      .then((openAPI: unknown) => {
        if (!isOpenAPIDocument(openAPI)) {
          return;
        }
        setPaths(openAPI.paths);
      })
      .catch(() => {
        // An unavailable gateway is an expected deployment configuration.
        // Keep all optional capabilities disabled.
      });

    return () => abortController.abort();
  }, []);

  const capabilities = useMemo<ImagingGatewayCapabilities>(() => ({
    meegqc: ROUTES.meegqc in paths,
    megGeometry:
      ROUTES.megSensors in paths && ROUTES.megHeadShape in paths,
    topographicMap: ROUTES.topographicMap in paths,
  }), [paths]);

  return (
    <ImagingGatewayCapabilitiesContext.Provider value={capabilities}>
      {children}
    </ImagingGatewayCapabilitiesContext.Provider>
  );
}

/**
 * Check the portion of an OpenAPI document used for capability discovery.
 */
function isOpenAPIDocument(
  value: unknown
): value is {paths: Record<string, unknown>} {
  if (typeof value !== 'object' || value === null || !('paths' in value)) {
    return false;
  }

  const {paths} = value as {paths?: unknown};
  return typeof paths === 'object' && paths !== null && !Array.isArray(paths);
}
