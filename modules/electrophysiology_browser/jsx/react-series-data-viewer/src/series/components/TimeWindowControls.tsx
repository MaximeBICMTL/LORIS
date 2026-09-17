import React, {useEffect, useState} from 'react';
import {DEFAULT_TIME_WINDOW} from '../../vector';
import {roundTime} from '../../utils';
import {useTranslation} from "react-i18next";
import {useTimeWindow} from '../contexts/TimeWindowContext';
import {TimeRange} from '../contexts/types';
import {normalizeTimeWindow, shiftTimeWindow} from '../timeWindow';
import TimeWindowSlider from './TimeWindowSlider';

type TimeWindowBound = 0 | 1;

/** Control the visible time window shared by the signal viewer. */
export default function TimeWindowControls() {
  const {t} = useTranslation();
  const {
    recordingTimeRange,
    timeWindow,
    setTimeWindow,
  } = useTimeWindow();
  const [inputValues, setInputValues] = useState<[string, string]>([
    String(roundTime(timeWindow[0])),
    String(roundTime(timeWindow[1])),
  ]);

  useEffect(() => {
    setInputValues([
      String(roundTime(timeWindow[0])),
      String(roundTime(timeWindow[1])),
    ]);
  }, [timeWindow]);

  const moveTimeWindowBy = (offset: number) => {
    setTimeWindow(shiftTimeWindow(
      timeWindow,
      offset,
      recordingTimeRange
    ));
  };

  const handleTimeWindowChange = (
    bound: TimeWindowBound,
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const inputValue = event.target.value;
    const nextInputValues: [string, string] = [
      inputValues[0],
      inputValues[1],
    ];
    nextInputValues[bound] = inputValue;
    setInputValues(nextInputValues);

    const value = Number(inputValue);
    if (inputValue === '' || !Number.isFinite(value)) {
      return;
    }

    const nextTimeWindow: TimeRange = [timeWindow[0], timeWindow[1]];
    nextTimeWindow[bound] = roundTime(value);
    setTimeWindow(normalizeTimeWindow(
      nextTimeWindow,
      recordingTimeRange
    ));
  };

  const handleTimeWindowBlur = (
    bound: TimeWindowBound,
    event: React.FocusEvent<HTMLInputElement>
  ) => {
    const value = Number(event.target.value);
    if (event.target.value === '' || !Number.isFinite(value)) {
      const nextInputValues: [string, string] = [
        inputValues[0],
        inputValues[1],
      ];
      nextInputValues[bound] = String(roundTime(timeWindow[bound]));
      setInputValues(nextInputValues);
      return;
    }

    setTimeWindow(normalizeTimeWindow(
      bound === 0
        ? [roundTime(value), timeWindow[1]]
        : [timeWindow[0], roundTime(value)],
      recordingTimeRange
    ));
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
                moveTimeWindowBy(-(timeWindow[1] - timeWindow[0]));
              }}
              value='<<'
            />
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                moveTimeWindowBy(-1);
              }}
              value='<'
            />
            <input
              className='input-interval-bound'
              type='number'
              value={inputValues[0]}
              min={recordingTimeRange[0]}
              max={recordingTimeRange[1]}
              onChange={(event) => handleTimeWindowChange(0, event)}
              onBlur={(event) => handleTimeWindowBlur(0, event)}
              onFocus={(e) => e.target.select()}
              step={0.1}
            />
            <input
              className='input-interval-bound'
              type='number'
              value={inputValues[1]}
              min={recordingTimeRange[0]}
              max={recordingTimeRange[1]}
              onChange={(event) => handleTimeWindowChange(1, event)}
              onBlur={(event) => handleTimeWindowBlur(1, event)}
              onFocus={(e) => e.target.select()}
              step={0.1}
            />
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                moveTimeWindowBy(1);
              }}
              value='>'
            />
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                moveTimeWindowBy(timeWindow[1] - timeWindow[0]);
              }}
              value='>>'
            />
          </div>
          <div style={{marginLeft: '15px'}}>
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                setTimeWindow(normalizeTimeWindow(
                  DEFAULT_TIME_WINDOW,
                  recordingTimeRange
                ));
              }}
              value={t('Reset', {ns: 'loris'})}
            />
            <input
              type='button'
              className='btn btn-primary btn-xs'
              onClick={() => {
                setTimeWindow([recordingTimeRange[0], recordingTimeRange[1]]);
              }}
              value={t('Show All', {ns: 'electrophysiology_browser'})}
            />
          </div>
        </div>
      </div>
      <TimeWindowSlider
        recordingTimeRange={recordingTimeRange}
        timeWindow={timeWindow}
        onTimeWindowChange={setTimeWindow}
      />
    </>
  );
}
