const MIN_MEASURABLE_DISTANCE_KM = 0.1;

export function getAverageSpeedKmh(
  distanceKm: number,
  elapsedSeconds: number,
): number | null {
  if (
    distanceKm < MIN_MEASURABLE_DISTANCE_KM ||
    elapsedSeconds <= 0
  ) {
    return null;
  }

  const elapsedHours =
    elapsedSeconds / 3600;

  return distanceKm / elapsedHours;
}

export function getAveragePaceSecondsPerKm(
  distanceKm: number,
  elapsedSeconds: number,
): number | null {
  if (
    distanceKm < MIN_MEASURABLE_DISTANCE_KM ||
    elapsedSeconds <= 0
  ) {
    return null;
  }

  return elapsedSeconds / distanceKm;
}

export function formatPace(
  paceSecondsPerKm: number | null,
): string {
  if (paceSecondsPerKm === null) {
    return '—';
  }

  const totalSeconds =
    Math.round(paceSecondsPerKm);

  const minutes =
    Math.floor(totalSeconds / 60);

  const seconds =
    totalSeconds % 60;

  return `${minutes}:${String(
    seconds,
  ).padStart(2, '0')}`;
}
