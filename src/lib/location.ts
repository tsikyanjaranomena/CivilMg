import * as Location from 'expo-location';

/** Retourne les coordonnées GPS actuelles, ou lève une erreur si la permission est refusée. */
export async function obtenirPositionActuelle(): Promise<{ latitude: number; longitude: number }> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permission de localisation refusée.');
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}
