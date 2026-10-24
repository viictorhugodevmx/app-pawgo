import { router } from 'expo-router';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useState } from 'react';

import { useAuth } from '../auth/AuthContext';
import { DEMO_DOG } from '../dogs/mockDog';
import { startWalkRequest } from './walkRepository';
import { COLORS } from '../../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../../theme/tokens';
import type { WalkRequest } from '../../types/walk';

type AssignedWalkCardProps = {
  walk: WalkRequest;
};

export function AssignedWalkCard({
  walk,
}: AssignedWalkCardProps) {
  const { session } = useAuth();

  const [
    starting,
    setStarting,
  ] = useState(false);

  const isActive =
    walk.status === 'in_progress';

  const isCompleted =
    walk.status === 'completed';

  function handleOpenWalk() {
    if (isCompleted) {
      router.push({
        pathname: '/prunner/summary',
        params: {
          walkId: walk.id,
        },
      });

      return;
    }

    if (isActive) {
      router.push({
        pathname: '/prunner/active',
        params: {
          walkId: walk.id,
        },
      });

      return;
    }

    router.push({
      pathname: '/prunner/walk/[id]',
      params: {
        id: walk.id,
      },
    });
  }

  async function handleStartWalk() {
    if (
      !session ||
      session.user.role !== 'prunner' ||
      starting ||
      isActive ||
      isCompleted
    ) {
      return;
    }

    try {
      setStarting(true);

      const startedWalk =
        await startWalkRequest(
          walk.id,
          session.user.id,
        );

      router.push({
        pathname: '/prunner/active',
        params: {
          walkId: startedWalk.id,
        },
      });
    } catch {
      Alert.alert(
        'Start walk error',
        'We could not start this walk. Please try again.',
      );
    } finally {
      setStarting(false);
    }
  }

  return (
    <View style={styles.card}>
      <Image
        source={{
          uri: DEMO_DOG.imageUrl,
        }}
        style={styles.image}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>
              {isCompleted
                ? 'COMPLETED WALK'
                : isActive
                  ? 'ACTIVE WALK'
                  : 'ASSIGNED WALK'}
            </Text>

            <Text style={styles.name}>
              {DEMO_DOG.name}
            </Text>

            <Text style={styles.breed}>
              {DEMO_DOG.breed}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              (isActive ||
                isCompleted) &&
                styles.statusBadgeSpecial,
            ]}
          >
            <Text style={styles.statusText}>
              {isCompleted
                ? 'COMPLETED'
                : isActive
                  ? 'IN PROGRESS'
                  : 'ACCEPTED'}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>
              DURATION
            </Text>

            <Text style={styles.metaValue}>
              {walk.durationMinutes} MIN
            </Text>
          </View>

          <View style={styles.metaCard}>
            <Text style={styles.metaLabel}>
              ROUTE
            </Text>

            <Text style={styles.metaValue}>
              {walk.route.length} POINTS
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleOpenWalk}
          style={({ pressed }) => [
            styles.viewButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Text style={styles.viewButtonText}>
            {isCompleted
              ? 'VIEW SUMMARY'
              : isActive
                ? 'CONTINUE WALK'
                : 'VIEW ASSIGNMENT'}
          </Text>

          <Text style={styles.viewArrow}>
            →
          </Text>
        </Pressable>

        {isCompleted && (
          <Pressable
            onPress={() => {
              router.push(
                '/prunner/history',
              );
            }}
            style={({ pressed }) => [
              styles.historyButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={styles.historyButtonText}
            >
              VIEW WALK HISTORY
            </Text>

            <Text
              style={styles.historyArrow}
            >
              →
            </Text>
          </Pressable>
        )}

        {!isActive &&
          !isCompleted && (
            <Pressable
              onPress={() => {
                void handleStartWalk();
              }}
              style={({ pressed }) => [
                styles.startButton,
                pressed &&
                  styles.pressed,
                starting &&
                  styles.starting,
              ]}
            >
              <Text
                style={styles.startButtonText}
              >
                {starting
                  ? 'STARTING...'
                  : 'START WALK'}
              </Text>

              <Text
                style={styles.startArrow}
              >
                →
              </Text>
            </Pressable>
          )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.green,
  },
  name: {
    marginTop: SPACING.xs,
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.ink,
  },
  breed: {
    marginTop: 2,
    fontSize: 11,
    color: COLORS.muted,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.greenSoft,
  },
  statusBadgeSpecial: {
    backgroundColor: COLORS.yellowSoft,
  },
  statusText: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: COLORS.green,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  metaCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSoft,
  },
  metaLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.muted,
  },
  metaValue: {
    marginTop: SPACING.xs,
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.ink,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewButtonText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.green,
  },
  viewArrow: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.green,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 17,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.coral,
  },
  startButtonText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.white,
  },
  startArrow: {
    fontSize: 21,
    fontWeight: '900',
    color: COLORS.white,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 15,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.ink,
  },
  historyButtonText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.white,
  },
  historyArrow: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.yellow,
  },
  pressed: {
    opacity: 0.72,
  },
  starting: {
    opacity: 0.6,
  },
});
