import {Sensor, SensorType} from '../series/store/types';
import * as THREE from 'three';

/**
 * Get the display color of a sensor type.
 */
export function getSensorTypeColor(sensorType: SensorType): string {
  switch (sensorType) {
  case 'electrode':
    return '#B28B00';
  case 'meg-sensor':
    return '#1A3B66';
  case 'head-shape-point':
    return '#8B2A2A';
  }
}

/**
 * Normalize the sensor positions from their original bounding box to [-1, 1].
 * This is done to get similar scaling across different datasets that may use
 * different position units.
 */
export function normalizeSensorPositions(
  boundingBox: THREE.Box3,
  sensors: Sensor[],
): Sensor[] {
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());

  // Find the largest dimension to maintain aspect ratio.
  const maxRange = Math.max(size.x, size.y, size.z);

  // Normalize all sensor positions to range [-1, 1] centered at origin.
  return sensors.map((sensor) => {
    const originalPos = new THREE.Vector3(...sensor.position);
    return {
      ...sensor,
      position: [
        ((originalPos.x - center.x) / maxRange) * 2,
        ((originalPos.y - center.y) / maxRange) * 2,
        ((originalPos.z - center.z) / maxRange) * 2,
      ],
    };
  });
}

/**
 * Compute the camera settings given information about the sensors position.
 */
export function computeCameraSettings(
  center: THREE.Vector3,
  size: THREE.Vector3,
): {
  position: [number, number, number],
  target: [number, number, number],
} {
  const horizontalSize = Math.max(size.x, size.z);
  const verticalSize = size.y;
  const maxDimension = Math.max(horizontalSize, verticalSize);

  const fovRadians = (50 * Math.PI) / 180;
  const distance = (maxDimension / 2) / Math.tan(fovRadians / 2);
  const finalDistance = distance * 1.5;

  return {
    position: [center.x, center.y + finalDistance, center.z],
    target: [center.x, center.y, center.z],
  };
}

/**
 * Get the bounding box for a list of sensors.
 */
export function getSensorsBoundingBox(sensors: Sensor[]): THREE.Box3 {
  const box = new THREE.Box3();
  for (const sensor of sensors) {
    box.expandByPoint(new THREE.Vector3(...sensor.position));
  }

  return box;
}
