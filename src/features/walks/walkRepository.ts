import AsyncStorage from '@react-native-async-storage/async-storage';

import type {
  LocationPoint,
  WalkDuration,
  WalkRequest,
} from '../../types/walk';
import { getDistanceMeters } from '../../utils/geo';

const WALKS_STORAGE_KEY = '@pawgo/walks:v1';

const MIN_ROUTE_SEGMENT_METERS = 2;
const MAX_ROUTE_SEGMENT_METERS = 200;

type CreateWalkRequestInput = {
  dogId: string;
  prownerId: string;
  durationMinutes: WalkDuration;
  instructions: string;
  pickupLocation: LocationPoint;
};

async function saveWalkRequests(
  walks: WalkRequest[],
): Promise<void> {
  await AsyncStorage.setItem(
    WALKS_STORAGE_KEY,
    JSON.stringify(walks),
  );
}

export async function getWalkRequests(): Promise<WalkRequest[]> {
  const raw =
    await AsyncStorage.getItem(
      WALKS_STORAGE_KEY,
    );

  if (!raw) {
    return [];
  }

  const parsed: unknown =
    JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed as WalkRequest[];
}

export async function getAvailableWalkRequests(): Promise<WalkRequest[]> {
  const walks =
    await getWalkRequests();

  return walks.filter(
    (walk) =>
      walk.status === 'requested',
  );
}

export async function getAssignedWalkRequests(
  prunnerId: string,
): Promise<WalkRequest[]> {
  const walks =
    await getWalkRequests();

  return walks.filter(
    (walk) =>
      (
        walk.status === 'accepted' ||
        walk.status === 'in_progress'
      ) &&
      walk.prunnerId === prunnerId,
  );
}

export async function getPrownerWalkRequests(
  prownerId: string,
): Promise<WalkRequest[]> {
  const walks =
    await getWalkRequests();

  return walks.filter(
    (walk) =>
      walk.prownerId === prownerId,
  );
}

export async function getWalkRequestById(
  walkId: string,
): Promise<WalkRequest | null> {
  const walks =
    await getWalkRequests();

  return (
    walks.find(
      (walk) =>
        walk.id === walkId,
    ) ?? null
  );
}

export async function createWalkRequest(
  input: CreateWalkRequestInput,
): Promise<WalkRequest> {
  const walks =
    await getWalkRequests();

  const walk: WalkRequest = {
    id: `walk-${Date.now()}`,
    dogId: input.dogId,
    prownerId: input.prownerId,
    prunnerId: null,

    status: 'requested',
    durationMinutes:
      input.durationMinutes,
    instructions:
      input.instructions.trim(),

    pickupLocation:
      input.pickupLocation,

    requestedAt:
      new Date().toISOString(),
    acceptedAt: null,
    startedAt: null,
    completedAt: null,

    route: [],
    distanceKm: 0,

    summaryNote: null,
    summaryPhotoUri: null,
    rating: null,
  };

  await saveWalkRequests([
    walk,
    ...walks,
  ]);

  return walk;
}

export async function acceptWalkRequest(
  walkId: string,
  prunnerId: string,
): Promise<WalkRequest> {
  const walks =
    await getWalkRequests();

  const walkIndex =
    walks.findIndex(
      (walk) =>
        walk.id === walkId,
    );

  if (walkIndex === -1) {
    throw new Error(
      'Walk request not found.',
    );
  }

  const currentWalk =
    walks[walkIndex];

  if (
    currentWalk.status !==
    'requested'
  ) {
    throw new Error(
      'Only requested walks can be accepted.',
    );
  }

  const updatedWalk: WalkRequest = {
    ...currentWalk,
    status: 'accepted',
    prunnerId,
    acceptedAt:
      new Date().toISOString(),
  };

  const updatedWalks = [
    ...walks,
  ];

  updatedWalks[walkIndex] =
    updatedWalk;

  await saveWalkRequests(
    updatedWalks,
  );

  return updatedWalk;
}

export async function startWalkRequest(
  walkId: string,
  prunnerId: string,
): Promise<WalkRequest> {
  const walks =
    await getWalkRequests();

  const walkIndex =
    walks.findIndex(
      (walk) =>
        walk.id === walkId,
    );

  if (walkIndex === -1) {
    throw new Error(
      'Walk request not found.',
    );
  }

  const currentWalk =
    walks[walkIndex];

  if (
    currentWalk.status !==
    'accepted'
  ) {
    throw new Error(
      'Only accepted walks can be started.',
    );
  }

  if (
    currentWalk.prunnerId !==
    prunnerId
  ) {
    throw new Error(
      'This walk belongs to another Prunner.',
    );
  }

  const updatedWalk: WalkRequest = {
    ...currentWalk,
    status: 'in_progress',
    startedAt:
      new Date().toISOString(),
  };

  const updatedWalks = [
    ...walks,
  ];

  updatedWalks[walkIndex] =
    updatedWalk;

  await saveWalkRequests(
    updatedWalks,
  );

  return updatedWalk;
}

export async function appendWalkRoutePoint(
  walkId: string,
  prunnerId: string,
  point: LocationPoint,
): Promise<WalkRequest> {
  const walks =
    await getWalkRequests();

  const walkIndex =
    walks.findIndex(
      (walk) =>
        walk.id === walkId,
    );

  if (walkIndex === -1) {
    throw new Error(
      'Walk request not found.',
    );
  }

  const currentWalk =
    walks[walkIndex];

  if (
    currentWalk.status !==
    'in_progress'
  ) {
    throw new Error(
      'Route points can only be added to an active walk.',
    );
  }

  if (
    currentWalk.prunnerId !==
    prunnerId
  ) {
    throw new Error(
      'This walk belongs to another Prunner.',
    );
  }

  const lastPoint =
    currentWalk.route[
      currentWalk.route.length - 1
    ];

  if (!lastPoint) {
    const updatedWalk: WalkRequest = {
      ...currentWalk,
      route: [point],
    };

    const updatedWalks = [
      ...walks,
    ];

    updatedWalks[walkIndex] =
      updatedWalk;

    await saveWalkRequests(
      updatedWalks,
    );

    return updatedWalk;
  }

  const segmentMeters =
    getDistanceMeters(
      lastPoint,
      point,
    );

  if (
    segmentMeters <
      MIN_ROUTE_SEGMENT_METERS ||
    segmentMeters >
      MAX_ROUTE_SEGMENT_METERS
  ) {
    return currentWalk;
  }

  const updatedWalk: WalkRequest = {
    ...currentWalk,
    route: [
      ...currentWalk.route,
      point,
    ],
    distanceKm:
      currentWalk.distanceKm +
      segmentMeters / 1000,
  };

  const updatedWalks = [
    ...walks,
  ];

  updatedWalks[walkIndex] =
    updatedWalk;

  await saveWalkRequests(
    updatedWalks,
  );

  return updatedWalk;
}

export async function finishWalkRequest(
  walkId: string,
  prunnerId: string,
): Promise<WalkRequest> {
  const walks =
    await getWalkRequests();

  const walkIndex =
    walks.findIndex(
      (walk) =>
        walk.id === walkId,
    );

  if (walkIndex === -1) {
    throw new Error(
      'Walk request not found.',
    );
  }

  const currentWalk =
    walks[walkIndex];

  if (
    currentWalk.status !==
    'in_progress'
  ) {
    throw new Error(
      'Only active walks can be completed.',
    );
  }

  if (
    currentWalk.prunnerId !==
    prunnerId
  ) {
    throw new Error(
      'This walk belongs to another Prunner.',
    );
  }

  const updatedWalk: WalkRequest = {
    ...currentWalk,
    status: 'completed',
    completedAt:
      new Date().toISOString(),
  };

  const updatedWalks = [
    ...walks,
  ];

  updatedWalks[walkIndex] =
    updatedWalk;

  await saveWalkRequests(
    updatedWalks,
  );

  return updatedWalk;
}

export async function updateWalkSummary(
  walkId: string,
  prunnerId: string,
  summaryNote: string,
  summaryPhotoUri: string | null,
): Promise<WalkRequest> {
  const walks =
    await getWalkRequests();

  const walkIndex =
    walks.findIndex(
      (walk) =>
        walk.id === walkId,
    );

  if (walkIndex === -1) {
    throw new Error(
      'Walk request not found.',
    );
  }

  const currentWalk =
    walks[walkIndex];

  if (
    currentWalk.status !==
    'completed'
  ) {
    throw new Error(
      'Only completed walks can have a summary.',
    );
  }

  if (
    currentWalk.prunnerId !==
    prunnerId
  ) {
    throw new Error(
      'This walk belongs to another Prunner.',
    );
  }

  const updatedWalk: WalkRequest = {
    ...currentWalk,
    summaryNote:
      summaryNote.trim() || null,
    summaryPhotoUri,
  };

  const updatedWalks = [
    ...walks,
  ];

  updatedWalks[walkIndex] =
    updatedWalk;

  await saveWalkRequests(
    updatedWalks,
  );

  return updatedWalk;
}

export async function rateWalkRequest(
  walkId: string,
  prownerId: string,
  rating: number,
): Promise<WalkRequest> {
  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error(
      'Rating must be between 1 and 5.',
    );
  }

  const walks =
    await getWalkRequests();

  const walkIndex =
    walks.findIndex(
      (walk) =>
        walk.id === walkId,
    );

  if (walkIndex === -1) {
    throw new Error(
      'Walk request not found.',
    );
  }

  const currentWalk =
    walks[walkIndex];

  if (
    currentWalk.status !==
    'completed'
  ) {
    throw new Error(
      'Only completed walks can be rated.',
    );
  }

  if (
    currentWalk.prownerId !==
    prownerId
  ) {
    throw new Error(
      'Only the Prowner can rate this walk.',
    );
  }

  const updatedWalk: WalkRequest = {
    ...currentWalk,
    rating,
  };

  const updatedWalks = [
    ...walks,
  ];

  updatedWalks[walkIndex] =
    updatedWalk;

  await saveWalkRequests(
    updatedWalks,
  );

  return updatedWalk;
}

export async function getCompletedWalkRequestsForPrunner(
  prunnerId: string,
): Promise<WalkRequest[]> {
  const walks =
    await getWalkRequests();

  return walks
    .filter(
      (walk) =>
        walk.status === 'completed' &&
        walk.prunnerId === prunnerId,
    )
    .sort((a, b) => {
      const aTime =
        a.completedAt
          ? new Date(
              a.completedAt,
            ).getTime()
          : 0;

      const bTime =
        b.completedAt
          ? new Date(
              b.completedAt,
            ).getTime()
          : 0;

      return bTime - aTime;
    });
}

export async function getCompletedWalkRequestsForProwner(
  prownerId: string,
): Promise<WalkRequest[]> {
  const walks =
    await getWalkRequests();

  return walks
    .filter(
      (walk) =>
        walk.status === 'completed' &&
        walk.prownerId === prownerId,
    )
    .sort((a, b) => {
      const aTime =
        a.completedAt
          ? new Date(
              a.completedAt,
            ).getTime()
          : 0;

      const bTime =
        b.completedAt
          ? new Date(
              b.completedAt,
            ).getTime()
          : 0;

      return bTime - aTime;
    });
}
