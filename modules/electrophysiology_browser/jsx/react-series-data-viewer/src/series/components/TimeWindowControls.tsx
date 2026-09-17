import {Slider, Rail, Handles, Ticks} from 'react-compound-slider';
import {Handle, Tick} from './components';
import React, {useEffect, useState, FunctionComponent, useRef} from 'react';
import {DEFAULT_TIME_WINDOW} from '../../vector';
import {roundTime} from '../../utils';
import {useTranslation} from "react-i18next";
import {useTimeWindow} from '../contexts/TimeWindowContext';
import {TimeRange} from '../contexts/types';

export type TimeWindowControlsProps = {
  viewerHeight?: number,
  recordingTimeRange: TimeRange,
  timeWindow: TimeRange,
  onTimeWindowChange: (_: TimeRange) => void,
};

/**
 *
 * @param root0
 * @param root0.viewerHeight
 * @param root0.recordingTimeRange
 * @param root0.timeWindow
 * @param root0.onTimeWindowChange
 */
export const TimeWindowControls: FunctionComponent<
  TimeWindowControlsProps
> = ({
  viewerHeight = 20,
  recordingTimeRange,
  timeWindow,
  onTimeWindowChange,
}) => {
  const {t} = useTranslation();
  const [sliderTimeWindow, setSliderTimeWindow] = useState(timeWindow);

  useEffect(() => {
    setSliderTimeWindow(timeWindow);
  }, [timeWindow]);

  const sliderStyle = {
    position: 'relative',
  };

  const railStyle = {
    position: 'absolute',
    width: '100%',
    height: 10,
    marginTop: -9,
    borderBottom: '1px solid #000',
    cursor: 'pointer',
  };

  const lowerBoundInputRef = useRef(null);
  const upperBoundInputRef = useRef(null);

  /**
   *
   * @param increment
   */
  const moveTimeWindowForwardBy = (increment: number) => {
    const timeWindowSize = timeWindow[1] - timeWindow[0];
    onTimeWindowChange([
      Math.min(recordingTimeRange[1] - timeWindowSize, timeWindow[0] + increment),
      Math.min(recordingTimeRange[1], timeWindow[1] + increment),
    ]);
  };

  /**
   *
   * @param decrement
   */
  const moveTimeWindowBackwardBy = (decrement: number) => {
    const timeWindowSize = timeWindow[1] - timeWindow[0];
    onTimeWindowChange([
      Math.max(recordingTimeRange[0], timeWindow[0] - decrement),
      Math.max(recordingTimeRange[0] + timeWindowSize, timeWindow[1] - decrement),
    ]);
  };

  /**
   *
   * @param event
   */
  const handleTimeWindowChange = (event) => {
    const value = roundTime(parseFloat(event.target.value));

    if (isNaN(value)) {
      if (event.target.value === '') {
        if (event.target === lowerBoundInputRef.current) {
          onTimeWindowChange([0, timeWindow[1]]);
        } else if (event.target === upperBoundInputRef.current) {
          onTimeWindowChange([timeWindow[0], 0]);
        }
      }
      return;
    }

    if (event.target === lowerBoundInputRef.current) {
      if (value > timeWindow[1]) { // This condition causes a swap
        upperBoundInputRef.current.focus();
      }

      if (value === roundTime(timeWindow[1])) {
        return;
      } // do nothing if change causes overlap

      // Prevent exceeding max, which causes render
      onTimeWindowChange([Math.min(value, recordingTimeRange[1]), timeWindow[1]]);
    } else if (event.target === upperBoundInputRef.current) {
      if (value < timeWindow[0]) { // This condition causes a swap
        lowerBoundInputRef.current.focus();
      }

      if (value === roundTime(timeWindow[0])) {
        return;
      } // do nothing if change causes overlap

      onTimeWindowChange([timeWindow[0], value]);
    }
  };

  /**
   *
   * @param event
   */
  const handleTimeWindowBlur = (event) => {
    const value = roundTime(parseFloat(event.target.value));

    if (isNaN(value)) {
      onTimeWindowChange(timeWindow); // Reset
      return;
    }

    if (timeWindow[0] > timeWindow[1] || timeWindow[1] < timeWindow[0]) {
      onTimeWindowChange([timeWindow[1], timeWindow[0]]); // Invert
    }
  };

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          className='col-xs-offset-1 col-xs-11'
          style={{
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'center',
            zIndex: '1',
          }}
        >
          <div className='btn-group'>
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                moveTimeWindowBackwardBy(timeWindow[1] - timeWindow[0]);
              }}
              value='<<'
            />
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                moveTimeWindowBackwardBy(1);
              }}
              value='<'
            />
            <input
              ref={lowerBoundInputRef}
              className='input-interval-bound'
              type='number'
              value={roundTime(timeWindow[0])}
              min={recordingTimeRange[0]}
              max={recordingTimeRange[1]}
              onChange={handleTimeWindowChange}
              onBlur={handleTimeWindowBlur}
              onFocus={(e) => e.target.select()}
              step={0.1}
            />
            <input
              ref={upperBoundInputRef}
              className='input-interval-bound'
              type='number'
              value={roundTime(timeWindow[1])}
              min={recordingTimeRange[0]}
              max={recordingTimeRange[1]}
              onChange={handleTimeWindowChange}
              onBlur={handleTimeWindowBlur}
              onFocus={(e) => e.target.select()}
              step={0.1}
            />
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                moveTimeWindowForwardBy(1);
              }}
              value='>'
            />
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                moveTimeWindowForwardBy(timeWindow[1] - timeWindow[0]);
              }}
              value='>>'
            />
          </div>
          <div style={{marginLeft: '15px'}}>
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                onTimeWindowChange(DEFAULT_TIME_WINDOW);
              }}
              value={t('Reset', {ns: 'loris'})}
            />
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                onTimeWindowChange([recordingTimeRange[0], recordingTimeRange[1]]);
              }}
              value={t('Show All', {ns: 'electrophysiology_browser'})}
            />
          </div>
        </div>
      </div>
      <div style={{height: viewerHeight, position: 'relative'}}>
        <Slider
          mode={2}
          rootStyle={sliderStyle}
          domain={[recordingTimeRange[0], recordingTimeRange[1]]}
          values={sliderTimeWindow}
          onUpdate={(values) => {
            const nextTimeWindow: TimeRange = [values[0], values[1]];
            setSliderTimeWindow(nextTimeWindow);
            onTimeWindowChange(nextTimeWindow);
          }}
          onChange={(values) => {
            setSliderTimeWindow([values[0], values[1]]);
          }}
        >
          {/* @ts-ignore */}
          <Rail>
            {({getRailProps}) => (
              <div style={railStyle} {...getRailProps()} />
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
    </>
  );
};

const ContextTimeWindowControls: FunctionComponent<{
  viewerHeight?: number,
}> = ({viewerHeight}) => {
  const {
    recordingTimeRange,
    timeWindow,
    setTimeWindow,
  } = useTimeWindow();

  return (
    <TimeWindowControls
      viewerHeight={viewerHeight}
      recordingTimeRange={recordingTimeRange}
      timeWindow={timeWindow}
      onTimeWindowChange={setTimeWindow}
    />
  );
};

export default ContextTimeWindowControls;
