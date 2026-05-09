import * as Location from 'expo-location';
import { STRINGS } from '@/constants/strings';

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(): Promise<{ lat: number; lng: number }> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error(STRINGS.ERRORS.LOCATION_DENIED);
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
}

export function watchLocation(
  onUpdate: (coords: { lat: number; lng: number }) => void,
  onError: (err: unknown) => void,
): Promise<Location.LocationSubscription> {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 5000,
      distanceInterval: 10,
    },
    (position) =>
      onUpdate({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }),
  ).catch((err) => {
    onError(err);
    return { remove: () => {} } as Location.LocationSubscription;
  });
}
