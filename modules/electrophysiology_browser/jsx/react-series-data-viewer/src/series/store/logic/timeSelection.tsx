import * as R from 'ramda';
import {Observable, merge} from 'rxjs';
import * as Rx from 'rxjs/operators';
import {ofType} from 'redux-observable';
import {createAction} from 'redux-actions';
import {setTimeSelection} from '../state/timeSelection';
import {MIN_INTERVAL} from '../../../vector';
import {roundTime} from '../../../utils';

export const START_DRAG_SELECTION = 'START_DRAG_SELECTION';
export const startDragSelection = createAction(START_DRAG_SELECTION);

export const CONTINUE_DRAG_SELECTION = 'CONTINUE_DRAG_SELECTION';
export const continueDragSelection = createAction(CONTINUE_DRAG_SELECTION);

export const END_DRAG_SELECTION = 'END_DRAG_SELECTION';
export const endDragSelection = createAction(END_DRAG_SELECTION);

type SelectionUpdate = {
  position: number,
  interval: [number, number],
};

/**
 * createTimeSelectionEpic
 *
 * @returns {Observable<Action>} - A stream of actions
 */
export const createTimeSelectionEpic = () => (
  action$: Observable<any>,
  state$: Observable<any>
): Observable<any> => {
  const startDrag$ = action$.pipe(
    ofType(START_DRAG_SELECTION),
    Rx.map(R.prop('payload')),
  );

  const continueDrag$ = action$.pipe(
    ofType(CONTINUE_DRAG_SELECTION),
    Rx.map(R.prop('payload'))
  );

  /**
   * initInterval
   *
   * @param {SelectionUpdate} update - The selection position and interval
   * @returns {Function} - Action creator for dispatching actions
   */
  const initInterval = ({position, interval}: SelectionUpdate) => {
    const x = roundTime(interval[0] + position * (interval[1] - interval[0]));
    return setTimeSelection([x, x]);
  };

  /**
   * updateInterval
   *
   * @param {Array} root - The update and current selection state
   * @returns {Function} - Action creator for dispatching actions
   */
  const updateInterval = ([update, state]) => {
    const {position, interval} = update as SelectionUpdate;
    const timeSelection = R.clone(state.timeSelection);
    const x = interval[0] + position * (interval[1] - interval[0]);
    timeSelection[1] = roundTime(x);
    return setTimeSelection(timeSelection);
  };

  const endDrag$ = action$.pipe(
    ofType(END_DRAG_SELECTION),
    Rx.withLatestFrom(state$),
    Rx.map(([, state]) => {
      if (
        state.timeSelection
        && (
          Math.abs(state.timeSelection[1] - state.timeSelection[0]
          ) < MIN_INTERVAL)
      ) {
        return setTimeSelection(null);
      } else {
        return setTimeSelection(state.timeSelection);
      }
    })
  );

  const startUpdates$ = startDrag$.pipe(Rx.map(initInterval));

  const dragUpdates$ = startDrag$.pipe(
    Rx.switchMap(() =>
      continueDrag$.pipe(
        Rx.withLatestFrom(state$),
        Rx.map(updateInterval),
        Rx.takeUntil(endDrag$)
      )
    )
  );

  return merge(startUpdates$, dragUpdates$, endDrag$);
};
