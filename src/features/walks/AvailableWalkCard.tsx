import { router } from 'expo-router';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DEMO_DOG } from '../dogs/mockDog';
import { COLORS } from '../../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../../theme/tokens';
import type { WalkRequest } from '../../types/walk';

type AvailableWalkCardProps = {
  walk: WalkRequest;
};

export function AvailableWalkCard({
  walk,
}: AvailableWalkCardProps) {
  function handleOpenRequest() {
    router.push({
      pathname: '/prunner/walk/[id]',
      params: {
        id: walk.id,
      },
    });
  }

  return (
    <Pressable
      onPress={handleOpenRequest}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
      ]}
    >
      <Image
        source={{
          uri: DEMO_DOG.imageUrl,
        }}
        style={styles.image}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <View>
            <Text style={styles.eyebrow}>
              AVAILABLE WALK
            </Text>

            <Text style={styles.name}>
              {DEMO_DOG.name}
            </Text>
          </View>

          <View style={styles.durationBadge}>
            <Text style={styles.durationValue}>
              {walk.durationMinutes}
            </Text>

            <Text style={styles.durationUnit}>
              MIN
            </Text>
          </View>
        </View>

        <Text style={styles.breed}>
          {DEMO_DOG.breed}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>
              PICKUP
            </Text>

            <Text style={styles.metaValue}>
              LOCATION READY ✓
            </Text>
          </View>

          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>
              STATUS
            </Text>

            <Text style={styles.metaValue}>
              REQUESTED
            </Text>
          </View>
        </View>

        {walk.instructions ? (
          <View style={styles.note}>
            <Text style={styles.noteLabel}>
              OWNER NOTE
            </Text>

            <Text
              numberOfLines={2}
              style={styles.noteText}
            >
              {walk.instructions}
            </Text>
          </View>
        ) : null}

        <View style={styles.viewButton}>
          <Text style={styles.viewButtonText}>
            VIEW REQUEST
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>
        </View>
      </View>
    </Pressable>
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
  pressed: {
    opacity: 0.75,
  },
  image: {
    width: '100%',
    height: 190,
  },
  content: {
    padding: SPACING.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
    color: COLORS.coral,
  },
  name: {
    marginTop: SPACING.xs,
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.ink,
  },
  durationBadge: {
    minWidth: 58,
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.yellowSoft,
  },
  durationValue: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
  },
  durationUnit: {
    marginTop: 1,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: COLORS.muted,
  },
  breed: {
    marginTop: 2,
    fontSize: 12,
    color: COLORS.muted,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  metaItem: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSoft,
  },
  metaLabel: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.9,
    color: COLORS.muted,
  },
  metaValue: {
    marginTop: SPACING.xs,
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.ink,
  },
  note: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.greenSoft,
  },
  noteLabel: {
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.9,
    color: COLORS.green,
  },
  noteText: {
    marginTop: SPACING.xs,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.ink,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewButtonText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.green,
  },
  arrow: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.green,
  },
});
