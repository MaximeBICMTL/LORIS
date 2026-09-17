import React from 'react';
import {AmplitudeProvider} from './AmplitudeContext';
import {PassFilterProvider} from './PassFilterContext';
import {TimeSelectionProvider} from './TimeSelectionContext';
import {TimeWindowProvider} from './TimeWindowContext';
import {RightPanelProvider} from './RightPanelContext';
import {CursorProvider} from './CursorContext';
import {CurrentAnnotationProvider} from './CurrentAnnotationContext';
import {EventProvider} from './EventContext';

/**
 * Compose the React state providers used by the signal viewer.
 */
export function ViewerStateProviders({
  children,
}: {
  children: React.ReactNode,
}) {
  return (
    <RightPanelProvider>
      <CursorProvider>
        <CurrentAnnotationProvider>
          <PassFilterProvider>
            <AmplitudeProvider>
              <TimeWindowProvider>
                <EventProvider>
                  <TimeSelectionProvider>
                    {children}
                  </TimeSelectionProvider>
                </EventProvider>
              </TimeWindowProvider>
            </AmplitudeProvider>
          </PassFilterProvider>
        </CurrentAnnotationProvider>
      </CursorProvider>
    </RightPanelProvider>
  );
}
