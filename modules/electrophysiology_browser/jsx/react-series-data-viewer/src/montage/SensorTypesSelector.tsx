import {useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import {SensorType} from '../series/store/types';
import MultiSelectDropdownButton
  from '../series/components/MultiSelectDropdownButton';

type SensorTypeState = {
  visible: boolean;
  sensorsCount: number;
};

type SensorTypeStateMap = Record<SensorType, SensorTypeState>;

type SensorTypesSelectorProps = {
  sensorTypes: SensorTypeStateMap;
  setSensorTypes: React.Dispatch<React.SetStateAction<SensorTypeStateMap>>;
};

/**
 * A dropdown button that allows to select which sensor types to show or hide.
 */
const SensorTypesSelector = ({
  sensorTypes,
  setSensorTypes,
}: SensorTypesSelectorProps) => {
  const {t} = useTranslation();

  const getSensorTypeName = useCallback((sensorType: SensorType) => {
    switch (sensorType) {
    case 'electrode':
      return t('EEG Electrode');
    case 'meg-sensor':
      return t('MEG Sensor');
    case 'head-shape-point':
      return t('Head Shape Point');
    }
  }, [t]);

  const toggleSensorType = useCallback((sensorType: SensorType) => {
    setSensorTypes((sensorTypes) => {
      const sensorTypeState = sensorTypes[sensorType];
      return {
        ...sensorTypes,
        [sensorType]: {
          ...sensorTypeState,
          visible: !sensorTypeState.visible,
        },
      };
    });
  }, [setSensorTypes]);

  return (
    <MultiSelectDropdownButton
      label={t('Sensor Types')}
      className="btn btn-xs btn-default"
      align="right"
      options={Object.entries(sensorTypes).map(([
        sensorType,
        {visible, sensorsCount},
      ]) => ({
        value: sensorType,
        label: (
          `${getSensorTypeName(sensorType as SensorType)} (${sensorsCount})`
        ),
        selected: visible,
      }))}
      onToggle={(value) => toggleSensorType(value as SensorType)}
    />
  );
};

export default SensorTypesSelector;
