import React from 'react';
import {AmplitudeProvider} from './AmplitudeContext';
import {PassFilterProvider} from './PassFilterContext';
import {TimeSelectionProvider} from './TimeSelectionContext';
import {TimeWindowProvider} from './TimeWindowContext';
import {RightPanelProvider} from './RightPanelContext';
import {CursorProvider} from './CursorContext';
import {CurrentAnnotationProvider} from './CurrentAnnotationContext';
import {EventProvider} from './EventContext';
import {SeriesEvent} from '../store/types';
import {RecordingMetadata, RecordingProvider} from './RecordingContext';

/**
 * Compose the React state providers used by the signal viewer.
 */
export function ViewerStateProviders({
  children,
  events,
  recordingMetadata,
  initialLimit,
}: {
  children: React.ReactNode,
  events: SeriesEvent[],
  recordingMetadata: RecordingMetadata,
  initialLimit: number,
}) {
  return (
    <RecordingProvider metadata={recordingMetadata} initialLimit={initialLimit}>
      <RightPanelProvider>
      <CursorProvider>
        <CurrentAnnotationProvider>
          <PassFilterProvider>
            <AmplitudeProvider>
              <TimeWindowProvider>
                <EventProvider initialEvents={events}>
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
    </RecordingProvider>
  );
}
