import React, {
  Component,
  createContext,
  createRef,
  useCallback,
  useEffect,
  useState,
} from 'react';
import {fetchJSON, fetchText} from '../ajax';
import {
  DEFAULT_CHANNEL_DELIMITER, DEFAULT_MAX_CHANNELS,
} from '../vector';
import {
  ChannelInfo, ChannelInfos, ChannelMetadata, CoordinateSystem, EventMetadata,
  HEDSchemaElement, HEDTag, HEDEndorsement, Sensor, SeriesEvent,
} from '../series/store/types';
import TriggerableModal from 'jsx/TriggerableModal';
import DatasetTagger from '../series/components/DatasetTagger';
import {InfoIcon} from '../series/components/components';
import {
  parseElectrodes, parseMegSensors, parseHeadShapePoints,
} from '../series/store/logic/montage';
import {ViewerStateProviders}
  from '../series/contexts/ViewerStateProviders';
import {RecordingMetadata} from '../series/contexts/RecordingContext';
import {HEDState} from '../series/contexts/HEDContext';


type CProps = {
  channelsURL: string,
  chunksURL: string | string[],
  eventsURL: string,
  electrodesURL: string,
  coordSystemURL: string,
  megSensorsURL?: string,
  megHeadShapeURL?: string,
  hedSchema: HEDSchemaElement[],
  datasetTags: Record<string, Record<string, HEDTag[]>>,
  datasetTagEndorsements: Array<Record<string, any>>,
  events: EventMetadata,
  physioFileID: number,
  limit: number,
  samplingFrequency: string,
  eegMontageName: string,
  recordingHasHED: boolean,
  children: React.ReactNode,
  t: any,
};

const MenuOption: Record<string, string> = {
  'TAG_MODE': 'View/Edit Tags',
  'ENDORSEMENT_MODE': 'Endorse Tags',
  'JSON_MODE': 'View JSON',
};

/**
 * The channel informaton context, which provides the BIDS information about\
 * the channels present in the acquisition, if available.
 */
export const ChannelInfosContext = createContext<ChannelInfo[]>([]);

/**
 * The channel metadata context, which provides the metadata about the channels
 * present in the acquisition.
 */
export const ChannelMetasContext = createContext<ChannelMetadata[]>([]);

/**
 *  The sensors context, which provides the EEG and MEG sensors present in the
 *  acquisition.
 */
export const SensorsContext = createContext<Sensor[]>([]);

/**
 *  The coordinate system context, which provides the coordinate system of the
 *  electrodes, if available.
 */
export const CoordSystemContext = createContext<CoordinateSystem | null>(null);

/**
 * State handler for hovered channels.
 */
export type HoveredChannelsType = {
  hoveredChannels: number[],
  setHoveredChannels: React.Dispatch<React.SetStateAction<number[]>>,
}

/**
 * Ignore setter calls made against the context's default value.
 */
function ignoreSetHoveredChannels(): void {
  console.error('HoveredChannelsContext not initialized');
}

/**
 * The hovered channels context, which provides the IDs of the channels
 * currently hovered in the signal visualizer.
 */
export const HoveredChannelsContext = createContext<HoveredChannelsType>({
  hoveredChannels: [],
  setHoveredChannels: ignoreSetHoveredChannels,
});

/**
 * Function wrapper around the older `EEGLabSeriesProviderClass` class
 * component.
 */
function EEGLabSeriesProvider(props: CProps) {
  const [channelInfos, setChannelInfos] = useState<ChannelInfo[]>([]);
  const [channelMetas, setChannelMetas] = useState<ChannelMetadata[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [coordSystem, setCoordSystem] = useState<CoordinateSystem | null>(null);
  const [hoveredChannels, setHoveredChannels] = useState<number[]>([]);

  // Fetch the channel BIDS information from the API.
  useEffect(() => {
    fetchJSON(props.channelsURL).then((json: ChannelInfos) => {
      setChannelInfos(json.Channels);
    });
  }, [props.channelsURL]);

  /**
   * Update the sensors state by appending new sensors.
   */
  const updateSensors = useCallback((sensors: Sensor[]) => {
    setSensors((prevSensors) => [
      // Re-use the old sensors if they are present, or initialize with an
      // empty list.
      ...prevSensors,
      // Append the new list of sensors.
      ...sensors,
    ]);
  }, []);

  // Fetch the coordinate system associated with that file.
  useEffect(() => {
    fetchJSON(props.coordSystemURL)
      .then(({json}) => {
        if (!json) {
          return;
        }

        setCoordSystem({
          name: json.EEGCoordinateSystem ?? 'Other',
          units: json.EEGCoordinateUnits ?? 'm',
          description: json.EEGCoordinateSystemDescription ?? 'n/a',
        });
      })
      .catch((error) => {
        console.error(error);
      });
  }, [props.coordSystemURL]);

  // Fetch the EEG electrodes associated with that file.
  useEffect(() => {
    fetchText(props.electrodesURL)
      .then((text) => {
        updateSensors(parseElectrodes(text));
      })
      .catch((error) => {
        console.error(error);
      });
  }, [props.electrodesURL]);

  // Fetch the MEG sensors associated with that file.
  useEffect(() => {
    if (!props.megSensorsURL) {
      return;
    }

    fetchJSON(props.megSensorsURL)
      .then((json) => {
        if (!json) {
          return;
        }

        updateSensors(parseMegSensors(json));
      })
      .catch((error) => {
        console.error(error);
      });
  }, [props.megSensorsURL]);

  // Fetch the MEG head shape points associated with that file.
  useEffect(() => {
    if (!props.megHeadShapeURL) {
      return;
    }

    fetchJSON(props.megHeadShapeURL)
      .then((json) => {
        if (json === null) {
          return;
        }

        updateSensors(parseHeadShapePoints(json));
      })
      .catch((error) => {
        console.error(error);
      });
  }, [props.megHeadShapeURL]);

  return (
    <ChannelInfosContext.Provider value={channelInfos}>
      <ChannelMetasContext.Provider value={channelMetas}>
        <SensorsContext.Provider value={sensors}>
          <CoordSystemContext.Provider value={coordSystem}>
            <HoveredChannelsContext.Provider value={{
              hoveredChannels,
              setHoveredChannels,
            }}>
              <EEGLabSeriesProviderClass
                {...props}
                setChannelMetas={setChannelMetas}
              />
            </HoveredChannelsContext.Provider>
          </CoordSystemContext.Provider>
        </SensorsContext.Provider>
      </ChannelMetasContext.Provider>
    </ChannelInfosContext.Provider>
  );
}

/**
 * Props for the `EEGLabSeriesProviderClass` component, which extend the props
 * of the functional component.
 */
type CClassProps = CProps & {
  /**
   * Setter for the channel metadata context lifted to the functional component.
   */
  setChannelMetas: (_: ChannelMetadata[]) => void,
};

type ProviderState = {
  activeMenuOption: string,
  datasetTaggerTabsRef: React.RefObject<HTMLDivElement>,
  events: SeriesEvent[],
  recordingMetadata: RecordingMetadata,
  initialHEDState: HEDState,
};

/**
 * EEGLabSeriesProviderClass component
 */
class EEGLabSeriesProviderClass extends Component<CClassProps, ProviderState> {
  /**
   * @class
   * @param {object} props - React Component properties
   */
  constructor(props: CClassProps) {
    super(props);
    this.state = {
      activeMenuOption: 'TAG_MODE',
      datasetTaggerTabsRef: createRef<HTMLDivElement>(),
      events: [],
      recordingMetadata: {
        chunksURL: '',
        channelDelimiter: '',
        samplingFrequency: props.samplingFrequency,
        eegMontageName: props.eegMontageName,
        physioFileID: props.physioFileID,
        shapes: [],
        validSamples: [],
        timeInterval: [0, 1],
        seriesRange: [-1, 2],
        recordingHasHED: props.recordingHasHED,
      } as RecordingMetadata,
      initialHEDState: {} as HEDState,
    };

    const {
      chunksURL,
      hedSchema,
      datasetTags,
      datasetTagEndorsements,
      events,
      t,
      setChannelMetas,
    } = props;
    const chunksBaseURL = Array.isArray(chunksURL) ? chunksURL[0] : chunksURL;

    const formattedDatasetTags: Record<string, Record<string, HEDTag[]>> = {};
    Object.keys(datasetTags).forEach((column) => {
      formattedDatasetTags[column] = {};
      Object.keys(datasetTags[column]).forEach((value) => {
        formattedDatasetTags[column][value]
          = datasetTags[column][value].map((tag) => {
            const hedEndorsements = datasetTagEndorsements
              .filter((endorsement) => {
                return endorsement.HEDRelID === tag.ID;
              }).map((endorsement) => {
                const endorserName =
                  `${endorsement.FirstName.substring(0, 1)}.` +
                  endorsement.LastName;
                return {
                  EndorsedBy: endorserName,
                  EndorsedByID: endorsement.EndorsedByID,
                  EndorsementComment: endorsement.EndorsementComment,
                  EndorsementStatus: endorsement.EndorsementStatus,
                  EndorsementTime: endorsement.LastUpdate,
                };
              });
            return {
              ...tag,
              AdditionalMembers: parseInt(String(tag.AdditionalMembers)),
              TaggerName: tag.TaggerName === 'Origin'
                ? t('Data Authors', {ns: 'electrophysiology_browser'})
                : tag.TaggerName,
              TaggedBy: tag.TaggedBy,
              Endorsements: hedEndorsements,
            };
          });
      });
    });
    this.state = {
      ...this.state,
      initialHEDState: {
        hedSchema,
        datasetTags: formattedDatasetTags,
        relOverrides: [],
        addedTags: [],
        deletedTags: [],
        tagsHaveChanges: false,
      } as HEDState,
    };

    /**
     *
     * @param {Function} fetcher The fn to collect the type of data
     * @param {string} url - The url
     * @param {string} route - The route
     * @returns {Promise} - The data
     */
    const racers = (
      fetcher: (requestURL: string) => Promise<any>,
      url: string,
      route = ''
    ): Array<Promise<{json: any, url: string} | undefined>> => {
      if (url) {
        return [fetcher(`${url}${route}`)
          .then((json) => ({json, url}))
          // if request fails don't resolve
          .catch((error) => {
            console.error(error);
            return undefined;
          })];
      } else {
        return [Promise.resolve(undefined)];
      }
    };

    Promise.race(racers(fetchJSON, chunksBaseURL, '/index.json')).then(
      (result) => {
        if (!result) return;
        const {json, url} = result;
        if (json) {
          const {
            channelMetadata, shapes, timeInterval, seriesRange, validSamples,
          } = json;
          setChannelMetas(channelMetadata);
          this.setState(({recordingMetadata}: ProviderState) => ({
            recordingMetadata: {
              ...recordingMetadata,
              chunksURL: url,
              shapes,
              validSamples,
              timeInterval,
              seriesRange,
            },
          }));
        }
      }
    ).then(() => {
      const parsedEvents: SeriesEvent[] = [];
      const channelDelimiter = events['channel_delimiter'].length > 0
        ? events['channel_delimiter']
        : DEFAULT_CHANNEL_DELIMITER;
      this.setState(({recordingMetadata}: ProviderState) => ({
        recordingMetadata: {...recordingMetadata, channelDelimiter},
      }));

      // `extra_columns` is not always serialised as an array by the API.
      const extraColumns = Array.isArray(events.extra_columns)
        ? events.extra_columns
        : [];

      events.instances.map((instance) => {
        const eventIndex = parsedEvents.findIndex(
          (e) => e.physiologicalTaskEventID
            === instance.PhysiologicalTaskEventID
        );

        const eventExtraColumns = extraColumns
          .filter((column) => {
            return column['PhysiologicalTaskEventID']
            === instance.PhysiologicalTaskEventID;
          });

        const hedTags = events.hed_tags.filter((column) => {
          return column['PhysiologicalTaskEventID']
            === instance.PhysiologicalTaskEventID;
        }).map((hedTag) => {
          const foundTag = hedSchema.find((tag) => {
            return tag.id === hedTag['HEDTagID'];
          });

          const additionalMembers = parseInt(
            hedTag['AdditionalMembers'] as string
          );

          const hedEndorsements = events['hed_endorsements']
            .filter((endorsement) => {
              return endorsement['HEDRelID'] === hedTag['ID'];
            }).map((endorsement) => {
              const endorserName =
                `${endorsement['FirstName'].substring(0, 1)}.` +
                endorsement['LastName'];
              return {
                EndorsedBy: endorserName,
                EndorsedByID: endorsement['EndorsedByID'],
                EndorsementComment: endorsement['EndorsementComment'],
                EndorsementStatus: endorsement['EndorsementStatus'],
                EndorsementTime: endorsement['LastUpdate'],
              };
            });

          // Currently only supporting schema-defined HED tags
          return {
            // The UI only supports schema-defined HED tags.
            schemaElement: foundTag ?? null,
            HEDTagID: foundTag ? foundTag.id : null,
            ID: hedTag['ID'],
            PropertyName: hedTag['PropertyName'],
            PropertyValue: hedTag['PropertyValue'],
            TagValue: hedTag['TagValue'],
            Description: hedTag['Description'],
            HasPairing: hedTag['HasPairing'],
            PairRelID: hedTag['PairRelID'],
            AdditionalMembers: isNaN(additionalMembers)
              ? 0 : additionalMembers,
            TaggerName: hedTag['TaggerName'] === 'Origin'
              ? t('Data Authors', {ns: 'electrophysiology_browser'})
              : hedTag['TaggerName'],
            TaggedBy: hedTag['TaggedBy'],
            Endorsements: hedEndorsements,
          };
        });

        if (eventIndex === -1) {
          const eventLabel = [null, 'n/a'].includes(instance.TrialType)
            ? null
            : instance.TrialType;
          parsedEvents.push({
            onset: parseFloat(instance.Onset),
            duration: parseFloat(instance.Duration),
            type: 'Event',
            label: eventLabel ?? instance.EventValue,
            value: instance.EventValue,
            trialType: instance.TrialType,
            properties: eventExtraColumns,
            hed: hedTags,
            channels: ['n/a', null].includes(instance.Channel)
              ? []
              : channelDelimiter.length > 0
                ? instance.Channel.split(channelDelimiter)
                : [instance.Channel],
            physiologicalTaskEventID: instance.PhysiologicalTaskEventID,
          });
        } else {
          console.error('ERROR: EVENT EXISTS');
        }
      });
      return parsedEvents;
    }).then((parsedEvents) => {
      const sortedEvents = parsedEvents
        .sort(function(a, b) {
          return a.onset - b.onset;
        });

      this.setState({events: sortedEvents});
    });
  }

  /**
   * Renders the React component.
   *
   * @returns {JSX} - React markup for the component
   */
  render() {
    const t = this.props.t;
    const [signalViewer, ...rest] = React.Children.toArray(this.props.children);
    const hedTagLogo = (
      <img
        src="https://images.loris.ca/HED_logo.png"
        style={{height: '46px'}}
      />
    );
    const chunksBaseURL = Array.isArray(this.props.chunksURL)
      ? this.props.chunksURL[0]
      : this.props.chunksURL;
    const filenamePrefix = chunksBaseURL
      .split('/').slice(-1)[0] // filename
      .split('_').slice(0, -1) // prefix
      .join('_');

    return (
      <ViewerStateProviders
          events={this.state.events}
          recordingMetadata={this.state.recordingMetadata}
          initialLimit={this.props.limit}
          initialHEDState={this.state.initialHEDState}
          unsavedChangesMessage={t(
            'Are you sure you want to leave unsaved changes behind?',
            {ns: 'electrophysiology_browser'}
          )}
        >
            <div id='tag-modal-container'>
            <TriggerableModal
              title={
                <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '440px',
                  }}
                >
                  <div id='dtm-title'>
                    <a href='https://www.hedtags.org' target='_blank'>
                      {hedTagLogo}
                    </a>
                    <span style={{marginLeft: '15px'}}>
                      {t(
                        'Dataset Tag Manager',
                        {ns: 'electrophysiology_browser'}
                      )}
                    </span>
                  </div>
                  <div style={{fontSize: '12px'}}>
                    {t(
                      'More about HED',
                      {ns: 'electrophysiology_browser'}
                    )}

                    <InfoIcon
                      title={t(
                        'Click to view the HED schema',
                        {ns: 'electrophysiology_browser'}
                      )}
                      url='https://www.hedtags.org/display_hed.html'
                    />
                  </div>
                </div>
                <div
                  ref={this.state.datasetTaggerTabsRef}
                  style={{
                    fontSize: '18px',
                    marginBottom: '-30px',
                    marginLeft: 'auto',
                  }}
                >
                  <ul className="nav nav-tabs" role="tablist">
                    {
                      Object.keys(MenuOption).map((menuOption) => {
                        return (
                          <li
                            key={menuOption}
                            role="presentation"
                            className={
                              this.state.activeMenuOption === menuOption
                                ? 'active'
                                : ''
                            }
                            onClick={() => {
                              this.setState({activeMenuOption: menuOption});
                            }}
                          >
                            <a
                              href={'#'}
                              role="tab"
                              data-toggle="tab"
                              onClick={(event) => {
                                event.preventDefault();
                              }}
                            >
                              {
                                t(
                                  MenuOption[menuOption],
                                  {ns: 'electrophysiology_browser'}
                                )
                              }
                            </a>
                          </li>
                        );
                      })
                    }
                  </ul>
                </div>
                </>
              }
              label={t(
                'Open Dataset Tag Manager',
                {ns: 'electrophysiology_browser'}
              )}
            >
              <DatasetTagger
                tabsRef={this.state.datasetTaggerTabsRef}
                activeMenuTab={this.state.activeMenuOption}
                setActiveMenuTab={(menuOption) => {
                  this.setState({activeMenuOption: menuOption});
                }}
                filenamePrefix={filenamePrefix}
              />
            </TriggerableModal>
            </div>
            {signalViewer}
            {rest}
      </ViewerStateProviders>
    );
  }

  static defaultProps = {
    limit: DEFAULT_MAX_CHANNELS,
  };
}

export default EEGLabSeriesProvider;
