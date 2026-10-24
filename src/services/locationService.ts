import * as Location from 'expo-location';

import type { LocationPoint } from '../types/walk';

export type LocationWatcher = {
  remove: () => void;
};

export async function requestForegroundLocationPermission(): Promise<boolean> {
  const { status } =
    await Location.requestForegroundPermissionsAsync();

  return status === 'granted';
}

export async function getCurrentLocationPoint(): Promise<LocationPoint> {
  const permission =
    await Location.getForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    throw new Error(
      'Location permission not granted.',
    );
  }

  const location =
    await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    recordedAt: new Date().toISOString(),
  };
}

export async function watchForegroundLocation(
  onLocation: (
    point: LocationPoint,
    accuracyMeters: number | null,
  ) => void,
  onError?: (message: string) => void,
): Promise<LocationWatcher> {
  const permission =
    await Location.getForegroundPermissionsAsync();

  if (permission.status !== 'granted') {
    throw new Error(
      'Location permission not granted.',
    );
  }

  const subscription =
    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 3000,
        distanceInterval: 3,
      },
      (location) => {
        onLocation(
          {
            latitude:
              location.coords.latitude,
            longitude:
              location.coords.longitude,
            recordedAt:
              new Date().toISOString(),
          },
          location.coords.accuracy,
        );
      },
      (reason) => {
        onError?.(reason);
      },
    );

  return {
    remove: () => {
      subscription.remove();
    },
  };
}
