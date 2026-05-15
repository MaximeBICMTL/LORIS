import React, { useContext, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { Sensor } from '../series/store/types';
import { computeCameraSettings, getSensorsBoundingBox, getSensorTypeColor, normalizeSensorPositions } from './utils';
import * as THREE from 'three';
import { HoveredChannelsContext } from '../eeglab/EEGLabSeriesProvider';

function Sensor3D({ sensor }: { sensor: Sensor }) {
  // The hovered channels in the signal visualizer.
  const {hoveredChannels} = useContext(HoveredChannelsContext);

  const hoveredChannel = (
    sensor.channelIndex !== undefined
    && hoveredChannels.includes(sensor.channelIndex)
  );

  // Whether the sensor is hovered or not.
  const [hovered, setHovered] = useState(false);
  const color = getSensorTypeColor(sensor.type);

  return (
    <group>
      <mesh
        position={sensor.position}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {(hovered || hoveredChannel) && (
        <Html
          position={sensor.position}
          center
          style={{ pointerEvents: 'none' }}
          distanceFactor={2}
        >
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'sans-serif',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            transform: 'translateY(-20px)'
          }}>
            {sensor.name}
          </div>
        </Html>
      )}
    </group>
  );
}

function Montage3D({ visibleSensors, allSensors }: {
  visibleSensors: Sensor[],
  allSensors: Sensor[],
}) {
  // Compute the bounding box of all sensors.
  const boundingBox = useMemo(() =>
    getSensorsBoundingBox(allSensors)
  , [allSensors]);

  const { sensors, cameraSettings } = useMemo(() => {
    // Normalize all sensor positions to range [-1, 1].
    const sensors = normalizeSensorPositions(boundingBox, visibleSensors);

    // With [-1, 1] range, center is at origin and size is 2 in each dimension.
    const normalizedCenter = new THREE.Vector3(0, 0, 0);
    const normalizedSize = new THREE.Vector3(2, 2, 2);

    return {
      sensors,
      cameraSettings: computeCameraSettings(normalizedCenter, normalizedSize),
    };
  }, [visibleSensors, boundingBox]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Canvas
        camera={{
          position: cameraSettings.position,
          fov: 30,
          up: [0, 0, 1] // Set Z as up vector
        }}
      >
        {/* <axesHelper args={[5]} /> */}
        {sensors.map((sensor, idx) => <Sensor3D key={idx} sensor={sensor} />)}
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}

export default Montage3D;
