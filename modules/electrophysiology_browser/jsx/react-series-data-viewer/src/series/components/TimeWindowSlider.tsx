import React from 'react';
import {Handles, Rail, Slider, Ticks} from 'react-compound-slider';
import {useTranslation} from 'react-i18next';
import {TimeRange} from '../contexts/types';
import {Handle, Tick} from './components';

type TimeWindowSliderProps = {
  recordingTimeRange: TimeRange,
  timeWindow: TimeRange,
  onTimeWindowChange: (_: TimeRange) => void,
};

/** Select the visible portion of a recording on a time axis. */
export default function TimeWindowSlider({
  recordingTimeRange,
  timeWindow,
  onTimeWindowChange,
}: TimeWindowSliderProps) {
  const {t} = useTranslation();

  return (
    <div style={{height: 20, position: 'relative'}}>
      <Slider
        mode={2}
        rootStyle={{position: 'relative'}}
        domain={[recordingTimeRange[0], recordingTimeRange[1]]}
        values={timeWindow}
        onUpdate={(values) => {
          onTimeWindowChange([values[0], values[1]]);
        }}
      >
        {/* @ts-ignore */}
        <Rail>
          {({getRailProps}) => (
            <div
              style={{
                position: 'absolute',
                width: '100%',
                height: 10,
                marginTop: -9,
                borderBottom: '1px solid #000',
                cursor: 'pointer',
              }}
              {...getRailProps()}
            />
          )}
        </Rail>

        {/* @ts-ignore */}
        <Handles>
          {({handles, getHandleProps}) => (
            <div className="slider-handles">
              {handles.map((handle) => (
                <Handle
                  key={handle.id}
                  handle={handle}
                  domain={recordingTimeRange}
                  getHandleProps={getHandleProps}
                />
              ))}
            </div>
          )}
        </Handles>

        {/* @ts-ignore */}
        <Ticks count={20}>
          {({ticks}) => (
            <div
              className="slider-ticks"
              style={{
                position: 'relative',
                zIndex: 1,
                pointerEvents: 'none',
              }}
            >
              {ticks.map((tick) => (
                <Tick key={tick.id} tick={tick} count={ticks.length} />
              ))}
            </div>
          )}
        </Ticks>
      </Slider>

      <div
        style={{
          fontSize: 10,
          top: '-25px',
          right: '15px',
          position: 'absolute',
        }}
      >
        {t('Time (s)', {ns: 'electrophysiology_browser'})}
      </div>
    </div>
  );
}
