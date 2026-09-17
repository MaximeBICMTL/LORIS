import {combineReducers} from 'redux';
import {combineEpics} from 'redux-observable';
import {boundsReducer} from './state/bounds';
import {filtersReducer} from './state/filters';
import {datasetReducer} from './state/dataset';
import {currentAnnotationReducer} from './state/currentAnnotation';
import {cursorReducer} from './state/cursor';
import {panelReducer} from './state/rightPanel';
import {channelsReducer} from './state/channels';
import {createFetchChunksEpic} from './logic/fetchChunks';
import {
  createActiveEpochEpic,
  createFilterEpochsEpic,
  createToggleEpochEpic,
} from './logic/filterEpochs';
import {
  createLowPassFilterEpic,
  createHighPassFilterEpic,
} from './logic/highLowPass';
import {createCursorInteractionEpic} from './logic/cursorInteraction';

export const rootReducer = combineReducers({
  bounds: boundsReducer,
  filters: filtersReducer,
  dataset: datasetReducer,
  currentAnnotation: currentAnnotationReducer,
  cursor: cursorReducer,
  rightPanel: panelReducer,
  channels: channelsReducer,
});

export const rootEpic = combineEpics(
  createFetchChunksEpic(({dataset, channels}) => ({
    dataset,
    channels,
  })),
  createLowPassFilterEpic(),
  createHighPassFilterEpic(),
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
