import {combineReducers} from 'redux';
import {combineEpics} from 'redux-observable';
import {datasetReducer} from './state/dataset';
import {
  createActiveEpochEpic,
  createFilterEpochsEpic,
  createToggleEpochEpic,
} from './logic/filterEpochs';

export const rootReducer = combineReducers({
  dataset: datasetReducer,
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
);

export type RootState = ReturnType<typeof rootReducer>;
