import React, {useContext} from 'react';
import {vec2} from 'gl-matrix';
import {MIN_EVENT_WIDTH} from '../../vector';
import {ScaleLinear} from 'd3-scale';
import {Channel} from "../store/types";
import {ChannelMetasContext} from '../../eeglab/EEGLabSeriesProvider';

type CProps = {
  key: string,
  parentHeight: number,
  onset: number,
  duration: number,
  scales: [
    ScaleLinear<number, number, never>,
    ScaleLinear<number, number, never>,
  ],
  color: string,
  opacity: number,
  minWidth: number,
  eventChannels?: string[],
  displayedChannels: Channel[],
};

/**
 *
 * @param root0
 * @param root0.parentHeight
 * @param root0.onset
 * @param root0.duration
 * @param root0.scales
 * @param root0.color
 * @param root0.opacity
 * @param root0.minWidth
 * @param root0.eventChannels
 * @param root0.displayedChannels
 */
const EventHighlight = (
  {
    key,
    parentHeight,
    onset,
    duration,
    scales,
    color,
    opacity,
    minWidth,
    eventChannels,
    displayedChannels,
  }: CProps) => {
  const channelMetadata = useContext(ChannelMetasContext);

  onset = isNaN(onset) ? 0 : onset;
  duration = isNaN(duration) ? 0 : duration;

  const start = vec2.fromValues(
    scales[0](onset),
    scales[1](-parentHeight/2),
  );

  const end = vec2.fromValues(
    scales[0](onset + Math.max(duration, minWidth)),
    scales[1](parentHeight/2)
  );

  const width = Math.abs(end[0] - start[0]);
  const height = Math.abs(end[1] - start[1]);
  const center = (start[0] + end[0]) / 2;

  if (eventChannels && eventChannels.length > 0) {
    const indicesToDraw = eventChannels.map((channelName) => {
      return displayedChannels.findIndex((channel) => {
        return channel.index === channelMetadata.findIndex((channel) => {
          return channel.name === channelName;
        });
      })
    }).filter(index => index !== -1);

    const rectHeight = height / displayedChannels.length;

    return (
      <React.Fragment key={key}>
        {
          indicesToDraw.map((channelIndex) => {
            return (
              <rect
                key={`rect-${key}-${channelIndex}`}
                fill={color}
                fillOpacity={opacity}
                width={width}
                height={rectHeight}
                x={center - width / 2}
                y={(-height / 2) + (channelIndex * rectHeight)}
              />
            );
          })
        }
      </React.Fragment>
    );
  }

  return (
    <rect
      fill={color}
      fillOpacity={opacity}
      width={width}
      height={height}
      x={center - width/2}
      y={-height/2}
    />
  );
};

EventHighlight.defaultProps = {
  color: '#dae5f2',
  opacity: 1,
  minWidth: MIN_EVENT_WIDTH,
};

export default EventHighlight;
