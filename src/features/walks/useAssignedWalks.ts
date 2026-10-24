import {
  useCallback,
  useState,
} from 'react';
import { useFocusEffect } from 'expo-router';

import type { WalkRequest } from '../../types/walk';
import { getAssignedWalkRequests } from './walkRepository';

export function useAssignedWalks(
  prunnerId?: string,
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
        if (!prunnerId) {
          if (active) {
            setWalks([]);
            setLoading(false);
          }

          return;
        }

        try {
          setLoading(true);

          const assignedWalks =
            await getAssignedWalkRequests(
              prunnerId,
            );

          if (active) {
            setWalks(assignedWalks);
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
    }, [prunnerId]),
  );

  return {
    walks,
    loading,
  };
}
