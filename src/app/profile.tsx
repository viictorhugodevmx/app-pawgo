import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useCallback,
  useState,
} from 'react';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../features/auth/AuthContext';
import {
  getCompletedWalkRequestsForProwner,
  getCompletedWalkRequestsForPrunner,
} from '../features/walks/walkRepository';
import { COLORS } from '../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../theme/tokens';
import type { WalkRequest } from '../types/walk';

export default function ProfileScreen() {
  const { session } = useAuth();

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

      async function loadProfile() {
        try {
          setLoading(true);

          if (!session) {
            if (active) {
              setWalks([]);
            }

            return;
          }

          const completedWalks =
            session.user.role ===
            'prunner'
              ? await getCompletedWalkRequestsForPrunner(
                  session.user.id,
                )
              : await getCompletedWalkRequestsForProwner(
                  session.user.id,
                );

          if (active) {
            setWalks(
              completedWalks,
            );
          }
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      void loadProfile();

      return () => {
        active = false;
      };
    }, [
      session?.user.id,
      session?.user.role,
    ]),
  );

  if (!session) {
    return (
      <SafeAreaView
        style={styles.centered}
      >
        <Text
          style={styles.errorLabel}
        >
          PAWGO / PROFILE
        </Text>

        <Text
          style={styles.errorTitle}
        >
          No active session.
        </Text>
      </SafeAreaView>
    );
  }

  const totalDistanceKm =
    walks.reduce(
      (total, walk) =>
        total +
        walk.distanceKm,
      0,
    );

  const ratedWalks =
    walks.filter(
      (walk) =>
        walk.rating !== null,
    );

  const averageRating =
    ratedWalks.length > 0
      ? ratedWalks.reduce(
          (total, walk) =>
            total +
            (walk.rating ?? 0),
          0,
        ) /
        ratedWalks.length
      : null;

  const isPrunner =
    session.user.role ===
    'prunner';

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <Text style={styles.eyebrow}>
          PAWGO / PROFILE
        </Text>

        <Text style={styles.title}>
          {isPrunner
            ? 'Your Prunner'
            : 'Your Prowner'}
          {'\n'}
          profile.
        </Text>

        <Text
          style={styles.description}
        >
          Demo identity and activity summary for this PawGo role.
        </Text>

        <View
          style={styles.identityCard}
        >
          <View
            style={styles.avatar}
          >
            <Text
              style={styles.avatarText}
            >
              {session.user.name
                .charAt(0)
                .toUpperCase()}
            </Text>
          </View>

          <View
            style={styles.identityContent}
          >
            <Text
              style={styles.roleLabel}
            >
              {isPrunner
                ? 'PRUNNER'
                : 'PROWNER'}
            </Text>

            <Text
              style={styles.name}
            >
              {session.user.name}
            </Text>

            <Text
              style={styles.email}
            >
              {session.user.email}
            </Text>
          </View>
        </View>

        {loading ? (
          <View
            style={styles.loadingCard}
          >
            <ActivityIndicator
              color={COLORS.coral}
            />

            <Text
              style={styles.loadingText}
            >
              LOADING ACTIVITY...
            </Text>
          </View>
        ) : (
          <>
            <Text
              style={styles.sectionLabel}
            >
              ACTIVITY
            </Text>

            <View
              style={styles.metricsRow}
            >
              <View
                style={styles.metricCard}
              >
                <Text
                  style={styles.metricLabel}
                >
                  COMPLETED
                </Text>

                <Text
                  style={styles.metricValue}
                >
                  {walks.length}
                </Text>

                <Text
                  style={styles.metricUnit}
                >
                  WALKS
                </Text>
              </View>

              <View
                style={styles.metricCard}
              >
                <Text
                  style={styles.metricLabel}
                >
                  DISTANCE
                </Text>

                <Text
                  style={styles.metricValue}
                >
                  {totalDistanceKm < 1
                    ? Math.round(
                        totalDistanceKm *
                          1000,
                      )
                    : totalDistanceKm.toFixed(
                        1,
                      )}
                </Text>

                <Text
                  style={styles.metricUnit}
                >
                  {totalDistanceKm < 1
                    ? 'METERS'
                    : 'KM'}
                </Text>
              </View>
            </View>

            <View
              style={styles.ratingCard}
            >
              <Text
                style={styles.ratingLabel}
              >
                {isPrunner
                  ? 'AVERAGE RATING RECEIVED'
                  : 'AVERAGE RATING GIVEN'}
              </Text>

              <Text
                style={styles.ratingValue}
              >
                {averageRating ===
                null
                  ? '—'
                  : `${averageRating.toFixed(
                      1,
                    )}/5 ★`}
              </Text>

              <Text
                style={styles.ratingHelper}
              >
                Based on{' '}
                {ratedWalks.length}{' '}
                rated{' '}
                {ratedWalks.length === 1
                  ? 'walk'
                  : 'walks'}
              </Text>
            </View>
          </>
        )}

        <View
          style={styles.roleCard}
        >
          <Text
            style={styles.roleCardLabel}
          >
            DEMO ROLE
          </Text>

          <Text
            style={styles.roleCardTitle}
          >
            {isPrunner
              ? 'Diego takes care of the walk.'
              : 'Víctor takes care of Milo.'}
          </Text>

          <Text
            style={styles.roleCardText}
          >
            {isPrunner
              ? 'Prunners accept requests, track GPS routes, finish walks and share memories.'
              : 'Prowners request walks, monitor progress, review memories and rate completed walks.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom:
      SPACING.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent:
      'center',
    padding: SPACING.lg,
    backgroundColor:
      COLORS.background,
  },
  errorLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.danger,
  },
  errorTitle: {
    marginTop: SPACING.sm,
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.ink,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.coral,
  },
  title: {
    marginTop: SPACING.sm,
    fontSize: 42,
    lineHeight: 44,
    fontWeight: '900',
    color: COLORS.ink,
  },
  description: {
    marginTop: SPACING.md,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
  },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius:
      RADIUS.lg,
    backgroundColor:
      COLORS.ink,
  },
  avatar: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent:
      'center',
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.coral,
  },
  avatarText: {
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.white,
  },
  identityContent: {
    flex: 1,
    marginLeft: SPACING.lg,
  },
  roleLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.yellow,
  },
  name: {
    marginTop: SPACING.xs,
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
  },
  email: {
    marginTop: SPACING.xs,
    fontSize: 11,
    color: COLORS.border,
  },
  loadingCard: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.muted,
  },
  sectionLabel: {
    marginTop: SPACING.xl,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.muted,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  metricCard: {
    flex: 1,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius:
      RADIUS.lg,
    backgroundColor:
      COLORS.surface,
  },
  metricLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.muted,
  },
  metricValue: {
    marginTop: SPACING.sm,
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.ink,
  },
  metricUnit: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.green,
  },
  ratingCard: {
    marginTop: SPACING.sm,
    padding: SPACING.lg,
    borderRadius:
      RADIUS.lg,
    backgroundColor:
      COLORS.yellowSoft,
  },
  ratingLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.coral,
  },
  ratingValue: {
    marginTop: SPACING.sm,
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.ink,
  },
  ratingHelper: {
    marginTop: SPACING.xs,
    fontSize: 11,
    color: COLORS.muted,
  },
  roleCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius:
      RADIUS.lg,
    backgroundColor:
      COLORS.greenSoft,
  },
  roleCardLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.green,
  },
  roleCardTitle: {
    marginTop: SPACING.sm,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
  },
  roleCardText: {
    marginTop: SPACING.sm,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },
});
