export type Chunk = {
  index: number,
  originalValues: Float32Array,
  values: Float32Array,
  filters: string[],
  downsampling: number,
  interval: [number, number],
  cutoff: number
};

export type Trace = {
  chunks: Chunk[],
  type: 'line'
};

export type ChannelMetadata = {
  index: number,
  name: string,
  seriesRange: [number, number]
};

export type Channel = {
  index: number,
  traces: Trace[]
};

/**
 * Extra column of an event, as provided by the LORIS events API.
 */
export type EventProperty = {
  PropertyName: string,
  PropertyValue: string,
};

export type SeriesEvent = {
  onset: number,
  duration: number,
  type: 'Event',
  label: string,
  value: string,
  trialType: string,
  properties: EventProperty[],
  hed: HEDTag[],
  channels: string[],
  physiologicalTaskEventID?: number,
};

export type EventFilter = {
  plotVisibility: number[],
  columnVisibility: number[],
  searchVisibility: number[],
}

/* The fields below are the raw keys of the LORIS events API response. */
/* eslint-disable camelcase */
export type EventMetadata = {
  instances: Record<string, any>[],
  /*
   * Not necessarily an array: the events API serialises this field straight
   * from a LORIS `Query` object, which has no public properties and therefore
   * encodes as `{}`. See ElectrophysioEvents::__construct.
   */
  extra_columns:
    (EventProperty & Record<string, any>)[] | Record<string, never>,
  hed_tags: Record<string, any>[],
  hed_endorsements: Record<string, any>[],
  channel_delimiter: string,
}
/* eslint-enable camelcase */

export type CoordinateSystem = {
  name: string | 'Other',
  units: string | 'm',
  description: string | 'n/a'
};

export type SensorType = 'electrode' | 'meg-sensor' | 'head-shape-point';

export type Sensor = {
  type: SensorType,
  name: string,
  channelIndex?: number,
  position: [number, number, number],
};

export type HEDSchemaElement = {
  id: number,
  parentID: number | null,
  schemaID: number,
  name: string,
  longName: string,
  description: string,
  schemaName: string,
}

export type EndorsementStatus =
  'Endorsed' |
  'Caveat' |
  'Comment';

// Currently uppercase. DB columns unprocessed
export type HEDTag = {
  schemaElement: HEDSchemaElement | null,
  HEDTagID: number | null, // redundant (in above)
  ID: any,
  PropertyName: string | null,
  PropertyValue: string | null,
  TagValue: string | null,
  Description: string, // Level Description
  HasPairing: string,
  PairRelID: any,
  AdditionalMembers: number,
  TaggedBy: number | null,
  TaggerName: string | null,
  Endorsements: HEDEndorsement[],
};

export type HEDEndorsement = {
  EndorsedBy: string, // Name
  EndorsedByID: number | null,
  EndorsementComment: string | null,
  EndorsementStatus: EndorsementStatus,
  EndorsementTime: string,
}

/**
 * LORIS EEG API acquisition metadata.
 */
export type ChannelInfosMetadata = {
  CandID: string;
  Visit: string;
  File: string;
}

/**
 * Channel information extracted from the BIDS `channels.tsv` file and obtained
 * through the LORIS EEG acquisition channel API.
 */
export type ChannelInfo = {
  ChannelName: string;
  ChannelDescription: string;
  ChannelType: string;
  ChannelTypeDescription: string;
  ChannelStatus: string;
  StatusDescription: string;
  SamplingFrequency: number;
  LowCutoff: string;
  HighCutoff: string;
  ManualFlag: string;
  Notch: string;
  Reference: string;
  Unit: string;
  ChannelFilePath: string;
}

/**
 * LORIS EEG acquisition channels API data.
 */
export type ChannelInfos = {
  Meta: ChannelInfosMetadata;
  Channels: ChannelInfo[];
}
