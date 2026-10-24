import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  router,
  useFocusEffect,
} from 'expo-router';
import {
  useCallback,
  useState,
} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../features/auth/AuthContext';
import { DEMO_DOG } from '../../features/dogs/mockDog';
import { getCompletedWalkRequestsForProwner } from '../../features/walks/walkRepository';
import { getDemoUsers } from '../../services/authService';
import { COLORS } from '../../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../../theme/tokens';
import type { WalkRequest } from '../../types/walk';

function formatWalkDate(
  date: string | null,
): string {
  if (!date) {
    return 'UNKNOWN DATE';
  }

  return new Date(
    date,
  ).toLocaleDateString(
    [],
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  );
}

export default function PrownerHistoryScreen() {
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

      async function loadHistory() {
        try {
          setLoading(true);

          if (
            !session ||
            session.user.role !==
              'prowner'
          ) {
            if (active) {
              setWalks([]);
            }

            return;
          }

          const completedWalks =
            await getCompletedWalkRequestsForProwner(
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

      void loadHistory();

      return () => {
        active = false;
      };
    }, [
      session?.user.id,
      session?.user.role,
    ]),
  );

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
          PAWGO / PROWNER
        </Text>

        <Text style={styles.title}>
          Milo's
          {'\n'}
          walk history.
        </Text>

        <Text style={styles.description}>
          Revisit completed walks, memories, metrics and ratings.
        </Text>

        <Pressable
          onPress={() => {
            router.push('/profile');
          }}
          style={({ pressed }) => [
            styles.profileButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.profileButtonText}>
            VIEW PROFILE
          </Text>

          <Text style={styles.profileArrow}>
            →
          </Text>
        </Pressable>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>
            COMPLETED WALKS
          </Text>

          <Text style={styles.summaryValue}>
            {walks.length}
          </Text>

          <Text style={styles.summaryHelper}>
            Adventures with Milo
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator
              color={COLORS.coral}
            />

            <Text style={styles.loadingText}>
              LOADING HISTORY...
            </Text>
          </View>
        ) : walks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>
              🐾
            </Text>

            <Text style={styles.emptyTitle}>
              No completed walks yet.
            </Text>

            <Text style={styles.emptyText}>
              Milo's completed walks will appear here automatically.
            </Text>
          </View>
        ) : (
          walks.map((walk) => {
            const prunner =
              walk.prunnerId
                ? getDemoUsers().find(
                    (user) =>
                      user.id ===
                      walk.prunnerId,
                  ) ?? null
                : null;

            return (
              <View
                key={walk.id}
                style={styles.walkCard}
              >
                <Image
                  source={{
                    uri:
                      walk.summaryPhotoUri ??
                      DEMO_DOG.imageUrl,
                  }}
                  style={styles.walkImage}
                />

                <View
                  style={styles.walkContent}
                >
                  <View
                    style={styles.walkHeader}
                  >
                    <View>
                      <Text
                        style={styles.walkLabel}
                      >
                        COMPLETED WALK
                      </Text>

                      <Text
                        style={styles.walkName}
                      >
                        {DEMO_DOG.name}
                      </Text>
                    </View>

                    <Text
                      style={styles.walkDate}
                    >
                      {formatWalkDate(
                        walk.completedAt,
                      )}
                    </Text>
                  </View>

                  <Text
                    style={styles.prunnerText}
                  >
                    Walked by{' '}
                    {prunner?.name ??
                      'your Prunner'}
                  </Text>

                  <View
                    style={styles.metricsRow}
                  >
                    <View
                      style={styles.metric}
                    >
                      <Text
                        style={styles.metricLabel}
                      >
                        DISTANCE
                      </Text>

                      <Text
                        style={styles.metricValue}
                      >
                        {walk.distanceKm < 1
                          ? `${Math.round(
                              walk.distanceKm *
                                1000,
                            )} M`
                          : `${walk.distanceKm.toFixed(
                              2,
                            )} KM`}
                      </Text>
                    </View>

                    <View
                      style={styles.metric}
                    >
                      <Text
                        style={styles.metricLabel}
                      >
                        YOUR RATING
                      </Text>

                      <Text
                        style={styles.metricValue}
                      >
                        {walk.rating
                          ? `${walk.rating}/5 ★`
                          : '—'}
                      </Text>
                    </View>
                  </View>

                  {walk.summaryNote ? (
                    <Text
                      numberOfLines={2}
                      style={styles.note}
                    >
                      {walk.summaryNote}
                    </Text>
                  ) : null}

                  <Pressable
                    onPress={() => {
                      router.push({
                        pathname:
                          '/prowner/tracking',
                        params: {
                          walkId:
                            walk.id,
                        },
                      });
                    }}
                    style={({ pressed }) => [
                      styles.detailsButton,
                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={
                        styles.detailsButtonText
                      }
                    >
                      VIEW WALK DETAILS
                    </Text>

                    <Text style={styles.arrow}>
                      →
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
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
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.coral,
  },
  profileButtonText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.white,
  },
  profileArrow: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.white,
  },
  summaryCard: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.ink,
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.yellow,
  },
  summaryValue: {
    marginTop: SPACING.sm,
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.white,
  },
  summaryHelper: {
    marginTop: SPACING.xs,
    fontSize: 11,
    color: COLORS.border,
  },
  loadingCard: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.muted,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    marginTop: SPACING.md,
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  emptyText: {
    marginTop: SPACING.sm,
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.muted,
  },
  walkCard: {
    marginTop: SPACING.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  walkImage: {
    width: '100%',
    height: 180,
  },
  walkContent: {
    padding: SPACING.lg,
  },
  walkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  walkLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.green,
  },
  walkName: {
    marginTop: SPACING.xs,
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.ink,
  },
  walkDate: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.muted,
  },
  prunnerText: {
    marginTop: SPACING.sm,
    fontSize: 11,
    color: COLORS.muted,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  metric: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSoft,
  },
  metricLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.muted,
  },
  metricValue: {
    marginTop: SPACING.xs,
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.ink,
  },
  note: {
    marginTop: SPACING.md,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailsButtonText: {
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
  pressed: {
    opacity: 0.65,
  },
});
