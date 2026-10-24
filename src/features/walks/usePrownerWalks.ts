import {
  useCallback,
  useState,
} from 'react';
import { useFocusEffect } from 'expo-router';

import type { WalkRequest } from '../../types/walk';
import { getPrownerWalkRequests } from './walkRepository';

export function usePrownerWalks(
  prownerId?: string,
) {
  const [
    walks,
    setWalks,
  ] = useState<WalkRequest[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadWalks() {
        if (!prownerId) {
          if (active) {
            setWalks([]);
            setLoading(false);
          }

          return;
        }

        try {
          setLoading(true);

          const storedWalks =
            await getPrownerWalkRequests(
              prownerId,
            );

          if (active) {
            setWalks(storedWalks);
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      void loadWalks();

      return () => {
        active = false;
      };
    }, [prownerId]),
  );

  return {
    walks,
    loading,
  };
}
