import React from 'react';
import {AmplitudeProvider} from './AmplitudeContext';
import {PassFilterProvider} from './PassFilterContext';
import {TimeSelectionProvider} from './TimeSelectionContext';
import {TimeWindowProvider} from './TimeWindowContext';

/**
 * Compose the React state providers used by the signal viewer.
 */
export function ViewerStateProviders({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <PassFilterProvider>
      <AmplitudeProvider>
        <TimeWindowProvider>
          <TimeSelectionProvider>
            {children}
          </TimeSelectionProvider>
        </TimeWindowProvider>
      </AmplitudeProvider>
    </PassFilterProvider>
  );
}
