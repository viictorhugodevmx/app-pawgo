import type { LocationPoint } from '../types/walk';

const EARTH_RADIUS_METERS = 6_371_000;

function degreesToRadians(
  degrees: number,
): number {
  return (
    degrees *
    (Math.PI / 180)
  );
}

export function getDistanceMeters(
  from: LocationPoint,
  to: LocationPoint,
): number {
  const latitudeDelta =
    degreesToRadians(
      to.latitude -
        from.latitude,
    );

  const longitudeDelta =
    degreesToRadians(
      to.longitude -
        from.longitude,
    );

  const fromLatitude =
    degreesToRadians(
      from.latitude,
    );

  const toLatitude =
    degreesToRadians(
      to.latitude,
    );

  const haversine =
    Math.sin(
      latitudeDelta / 2,
    ) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(
        longitudeDelta / 2,
      ) ** 2;

  const angularDistance =
    2 *
    Math.atan2(
      Math.sqrt(haversine),
      Math.sqrt(
        1 - haversine,
      ),
    );

  return (
    EARTH_RADIUS_METERS *
    angularDistance
  );
}
