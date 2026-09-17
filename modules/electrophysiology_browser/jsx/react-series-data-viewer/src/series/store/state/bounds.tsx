import {createAction} from 'redux-actions';
import {DEFAULT_VIEWER_HEIGHT} from '../../../vector';

export const SET_AMPLITUDE_SCALE = 'SET_AMPLITUDE_SCALE';
export const setAmplitudeScale = createAction(SET_AMPLITUDE_SCALE);

export const SET_VIEWER_WIDTH = 'SET_VIEWER_WIDTH';
export const setViewerWidth = createAction(SET_VIEWER_WIDTH);

export const SET_VIEWER_HEIGHT = 'SET_VIEWER_HEIGHT';
export const setViewerHeight = createAction(SET_VIEWER_HEIGHT);

export type Action =
  | {type: 'SET_AMPLITUDE_SCALE', payload: number}
  | {type: 'SET_VIEWER_WIDTH', payload: number}
  | {type: 'SET_VIEWER_HEIGHT', payload: number}

export type State = {
  amplitudeScale: number,
  viewerWidth: number,
  viewerHeight: number,
};

/**
 * amplitudeScale reducer
 *
 * @param {State} state - The current state
 * @param {Action} action - The action
 * @returns {State} - The updated state
 */
const amplitudeScale = (state = 1, action?: Action): number => {
  if (action && action.type === 'SET_AMPLITUDE_SCALE') {
    return action.payload;
  }
  return state;
};

/**
 * viewerWidth reducer
 *
 * @param {State} state - The current state
 * @param {Action} action - The action
 * @returns {State} - The updated state
 */
const viewerWidth = (state = 400, action?: Action): number => {
  if (action && action.type === 'SET_VIEWER_WIDTH') {
    return action.payload;
  }
  return state;
};

/**
 * viewerHeight reducer
 *
 * @param {State} state - The current state
 * @param {Action} action - The action
 * @returns {State} - The updated state
 */
const viewerHeight = (
  state = DEFAULT_VIEWER_HEIGHT,
  action?: Action
): number => {
  if (action && action.type === 'SET_VIEWER_HEIGHT') {
    return action.payload;
  }
  return state;
};

/**
 * boundsReducer
 *
 * @param {State} state - The current state
 * @param {Action} action - The action
 * @returns {State} - The updated state
 */
export const boundsReducer: (State, Action) => State = (
  state = {
    amplitudeScale: amplitudeScale(),
    viewerWidth: viewerWidth(),
    viewerHeight: viewerHeight(),
  },
  action
) => ({
  amplitudeScale: amplitudeScale(state.amplitudeScale, action),
  viewerWidth: viewerWidth(state.viewerWidth, action),
  viewerHeight: viewerHeight(state.viewerHeight, action),
});
