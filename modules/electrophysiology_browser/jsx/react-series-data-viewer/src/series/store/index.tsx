import {combineReducers} from 'redux';
import {combineEpics} from 'redux-observable';
import {datasetReducer} from './state/dataset';
import {currentAnnotationReducer} from './state/currentAnnotation';
import {cursorReducer} from './state/cursor';
import {
  createActiveEpochEpic,
  createFilterEpochsEpic,
  createToggleEpochEpic,
} from './logic/filterEpochs';
import {createCursorInteractionEpic} from './logic/cursorInteraction';

export const rootReducer = combineReducers({
  dataset: datasetReducer,
  currentAnnotation: currentAnnotationReducer,
  cursor: cursorReducer,
});

export const rootEpic = combineEpics(
  createFilterEpochsEpic(({dataset}) => {
    const {epochs} = dataset;
    const {filteredEpochs} = dataset;
    return {epochs, filteredEpochs};
  }),
  createToggleEpochEpic(({dataset}) => {
    const {epochs, filteredEpochs} = dataset;
    return {filteredEpochs, epochs};
  }),
  createActiveEpochEpic(({dataset}) => {
    const {epochs} = dataset;
    return {epochs};
  }),
  createCursorInteractionEpic(({cursor}) => {
    const {hoveredChannels, setHoveredChannels} = cursor;
    return {hoveredChannels, setHoveredChannels};
  }),
);

export type RootState = ReturnType<typeof rootReducer>;
