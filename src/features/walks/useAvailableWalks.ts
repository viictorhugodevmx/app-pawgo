import {
  useCallback,
  useState,
} from 'react';
import { useFocusEffect } from 'expo-router';

import type { WalkRequest } from '../../types/walk';
import { getAvailableWalkRequests } from './walkRepository';

export function useAvailableWalks() {
  const [
    walks,
    setWalks,
  ] = useState<WalkRequest[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const loadWalks =
    useCallback(async () => {
      try {
        setLoading(true);
        setError(null);

        const availableWalks =
          await getAvailableWalkRequests();

        setWalks(availableWalks);
      } catch {
        setError(
          'We could not load available walks.',
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useFocusEffect(
    useCallback(() => {
      void loadWalks();
    }, [loadWalks]),
  );

  return {
    walks,
    loading,
    error,
    refresh: loadWalks,
  };
}
