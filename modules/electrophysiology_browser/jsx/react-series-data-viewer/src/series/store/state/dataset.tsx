import * as R from 'ramda';
import {createAction} from 'redux-actions';
import {
  HEDSchemaElement,
  HEDTag,
} from '../types';

export const SET_HED_SCHEMA_DOCUMENT = 'SET_HED_SCHEMA_DOCUMENT';
export const setHedSchemaDocument = createAction(SET_HED_SCHEMA_DOCUMENT);

export const SET_DATASET_TAGS = 'SET_DATASET_TAGS';
export const setDatasetTags = createAction(SET_DATASET_TAGS);

export const SET_HED_REL_OVERRIDES = 'SET_HED_REL_OVERRIDES';
export const setRelOverrides = createAction(SET_HED_REL_OVERRIDES);

export const SET_ADDED_TAGS = 'SET_ADDED_TAGS';
export const setAddedTags = createAction(SET_ADDED_TAGS);

export const SET_DELETED_TAGS = 'SET_DELETED_TAGS';
export const setDeletedTags = createAction(SET_DELETED_TAGS);

export const SET_TAGS_HAVE_CHANGES = 'SET_TAGS_HAVE_CHANGES';
export const setTagsHaveChanges = createAction(SET_TAGS_HAVE_CHANGES);

export type Action =
  | {type: 'SET_HED_SCHEMA_DOCUMENT', payload: HEDSchemaElement[]}
  | {type: 'SET_DATASET_TAGS', payload: any}
  | {type: 'SET_HED_REL_OVERRIDES', payload: HEDTag[]}
  | {type: 'SET_ADDED_TAGS', payload: HEDTag[]}
  | {type: 'SET_DELETED_TAGS', payload: HEDTag[]}
  | {type: 'SET_TAGS_HAVE_CHANGES', payload: boolean};

export type State = {
  hedSchema: HEDSchemaElement[],
  datasetTags: any,
  hedRelOverrides: HEDTag[],
  addedTags: HEDTag[],
  deletedTags: HEDTag[],
  tagsHaveChanges: boolean,
};

/**
 * datasetReducer
 *
 * @param {State} state - The current state
 * @param {Action} action - The action
 * @returns {State} - The updated state
 */
export const datasetReducer = (
  state: State = {
    hedSchema: [],
    datasetTags: {},
    hedRelOverrides: [],
    addedTags: [],
    deletedTags: [],
    tagsHaveChanges: false,
  },
  action?: Action
): State => {
  if (!action) {
    return state;
  }
  switch (action.type) {
  case SET_HED_SCHEMA_DOCUMENT: {
    return R.assoc('hedSchema', action.payload, state);
  }
  case SET_DATASET_TAGS: {
    return R.assoc('datasetTags', action.payload, state);
  }
  case SET_HED_REL_OVERRIDES: {
    return R.assoc('hedRelOverrides', action.payload, state);
  }
  case SET_ADDED_TAGS: {
    return R.assoc('addedTags', action.payload, state);
  }
  case SET_DELETED_TAGS: {
    return R.assoc('deletedTags', action.payload, state);
  }
  case SET_TAGS_HAVE_CHANGES: {
    return R.assoc('tagsHaveChanges', action.payload, state);
  }
  default: {
    return state;
  }
  }
};
