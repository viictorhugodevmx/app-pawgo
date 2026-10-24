import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DemoSession } from '../types/auth';

const SESSION_STORAGE_KEY =
  '@pawgo/session:v1';

export async function loadSession(): Promise<
  DemoSession | null
> {
  const storedSession =
    await AsyncStorage.getItem(
      SESSION_STORAGE_KEY,
    );

  if (!storedSession) {
    return null;
  }

  const parsedSession: unknown =
    JSON.parse(storedSession);

  if (
    typeof parsedSession !== 'object' ||
    parsedSession === null ||
    !('user' in parsedSession) ||
    !('createdAt' in parsedSession)
  ) {
    throw new Error(
      'Stored session has an invalid format.',
    );
  }

  return parsedSession as DemoSession;
}

export async function saveSession(
  session: DemoSession,
): Promise<void> {
  await AsyncStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(session),
  );
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(
    SESSION_STORAGE_KEY,
  );
}
