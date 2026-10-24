export type WalkStatus =
  | 'requested'
  | 'accepted'
  | 'in_progress'
  | 'completed';

export type WalkDuration =
  | 30
  | 45
  | 60;

export type LocationPoint = {
  latitude: number;
  longitude: number;
  recordedAt: string;
};

export type WalkRequest = {
  id: string;
  dogId: string;
  prownerId: string;
  prunnerId: string | null;

  status: WalkStatus;
  durationMinutes: WalkDuration;
  instructions: string;

  pickupLocation: LocationPoint;

  requestedAt: string;
  acceptedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;

  route: LocationPoint[];
  distanceKm: number;

  summaryNote: string | null;
  summaryPhotoUri: string | null;
  rating: number | null;
};
