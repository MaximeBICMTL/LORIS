import {Slider, Rail, Handles, Ticks} from 'react-compound-slider';
import {Handle, Tick} from './components';
import React, {useEffect, useState, FunctionComponent, useRef} from 'react';
import {DEFAULT_TIME_INTERVAL} from '../../vector';
import {roundTime} from '../../utils';
import {useTranslation} from "react-i18next";
import {useInterval} from '../IntervalContext';

export type IntervalSelectProps = {
  viewerHeight?: number,
  domain: [number, number],
  interval: [number, number],
  onIntervalChange: (_: [number, number]) => void,
};

/**
 *
 * @param root0
 * @param root0.viewerHeight
 * @param root0.domain
 * @param root0.interval
 * @param root0.onIntervalChange
 */
export const IntervalSelect: FunctionComponent<IntervalSelectProps> = ({
  viewerHeight = 20,
  domain,
  interval,
  onIntervalChange,
}) => {
  const {t} = useTranslation();
  const [sliderInterval, setSliderInterval] = useState(interval);

  useEffect(() => {
    setSliderInterval(interval);
  }, [interval]);

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
  const increaseIntervalBy = (increment: number) => {
    const intervalSize = interval[1] - interval[0];
    onIntervalChange([
      Math.min(domain[1] - intervalSize, interval[0] + increment),
      Math.min(domain[1], interval[1] + increment),
    ]);
  };

  /**
   *
   * @param decrement
   */
  const decreaseIntervalBy = (decrement: number) => {
    const intervalSize = interval[1] - interval[0];
    onIntervalChange([
      Math.max(domain[0], interval[0] - decrement),
      Math.max(domain[0] + intervalSize, interval[1] - decrement),
    ]);
  };

  /**
   *
   * @param event
   */
  const handleIntervalChange = (event) => {
    const value = roundTime(parseFloat(event.target.value));

    if (isNaN(value)) {
      if (event.target.value === '') {
        if (event.target === lowerBoundInputRef.current) {
          onIntervalChange([0, interval[1]]);
        } else if (event.target === upperBoundInputRef.current) {
          onIntervalChange([interval[0], 0]);
        }
      }
      return;
    }

    if (event.target === lowerBoundInputRef.current) {
      if (value > interval[1]) { // This condition causes a swap
        upperBoundInputRef.current.focus();
      }

      if (value === roundTime(interval[1])) {
        return;
      } // do nothing if change causes overlap

      // Prevent exceeding max, which causes render
      onIntervalChange([Math.min(value, domain[1]), interval[1]]);
    } else if (event.target === upperBoundInputRef.current) {
      if (value < interval[0]) { // This condition causes a swap
        lowerBoundInputRef.current.focus();
      }

      if (value === roundTime(interval[0])) {
        return;
      } // do nothing if change causes overlap

      onIntervalChange([interval[0], value]);
    }
  };

  /**
   *
   * @param event
   */
  const handleIntervalBlur = (event) => {
    const value = roundTime(parseFloat(event.target.value));

    if (isNaN(value)) {
      onIntervalChange(interval); // Reset
      return;
    }

    if (interval[0] > interval[1] || interval[1] < interval[0]) {
      onIntervalChange([interval[1], interval[0]]); // Invert
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
                decreaseIntervalBy(interval[1] - interval[0]);
              }}
              value='<<'
            />
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                decreaseIntervalBy(1);
              }}
              value='<'
            />
            <input
              ref={lowerBoundInputRef}
              className='input-interval-bound'
              type='number'
              value={roundTime(interval[0])}
              min={domain[0]}
              max={domain[1]}
              onChange={handleIntervalChange}
              onBlur={handleIntervalBlur}
              onFocus={(e) => e.target.select()}
              step={0.1}
            />
            <input
              ref={upperBoundInputRef}
              className='input-interval-bound'
              type='number'
              value={roundTime(interval[1])}
              min={domain[0]}
              max={domain[1]}
              onChange={handleIntervalChange}
              onBlur={handleIntervalBlur}
              onFocus={(e) => e.target.select()}
              step={0.1}
            />
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                increaseIntervalBy(1);
              }}
              value='>'
            />
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                increaseIntervalBy(interval[1] - interval[0]);
              }}
              value='>>'
            />
          </div>
          <div style={{marginLeft: '15px'}}>
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                onIntervalChange(DEFAULT_TIME_INTERVAL);
              }}
              value={t('Reset', {ns: 'loris'})}
            />
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                onIntervalChange([domain[0], domain[1]]);
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
          domain={[domain[0], domain[1]]}
          values={sliderInterval}
          onUpdate={(values) => {
            const nextInterval: [number, number] = [values[0], values[1]];
            setSliderInterval(nextInterval);
            onIntervalChange(nextInterval);
          }}
          onChange={(values) => {
            setSliderInterval([values[0], values[1]]);
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
                    domain={domain}
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

const ContextIntervalSelect: FunctionComponent<{
  viewerHeight?: number,
}> = ({viewerHeight}) => {
  const {domain, interval, setInterval} = useInterval();

  return (
    <IntervalSelect
      viewerHeight={viewerHeight}
      domain={domain}
      interval={interval}
      onIntervalChange={setInterval}
    />
  );
};

export default ContextIntervalSelect;
