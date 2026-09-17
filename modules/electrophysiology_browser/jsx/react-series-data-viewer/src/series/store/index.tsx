import {combineReducers} from 'redux';
import {datasetReducer} from './state/dataset';

export const rootReducer = combineReducers({
  dataset: datasetReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
