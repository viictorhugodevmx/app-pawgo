import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import {
  useEffect,
  useState,
} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DemoRoleSwitcher } from '../../components/DemoRoleSwitcher';
import { useAuth } from '../../features/auth/AuthContext';
import { DEMO_DOG } from '../../features/dogs/mockDog';
import {
  getWalkRequestById,
  rateWalkRequest,
} from '../../features/walks/walkRepository';
import { getDemoUsers } from '../../services/authService';
import { COLORS } from '../../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../../theme/tokens';
import type { WalkRequest } from '../../types/walk';

function getElapsedSeconds(
  startedAt: string | null,
  completedAt?: string | null,
): number {
  if (!startedAt) {
    return 0;
  }

  const endTimestamp =
    completedAt
      ? new Date(
          completedAt,
        ).getTime()
      : Date.now();

  return Math.max(
    0,
    Math.floor(
      (
        endTimestamp -
        new Date(
          startedAt,
        ).getTime()
      ) / 1000,
    ),
  );
}

function formatElapsedTime(
  totalSeconds: number,
): string {
  const hours =
    Math.floor(totalSeconds / 3600);

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60,
    );

  const seconds =
    totalSeconds % 60;

  return [
    hours,
    minutes,
    seconds,
  ]
    .map((value) =>
      String(value).padStart(
        2,
        '0',
      ),
    )
    .join(':');
}

export default function PrownerTrackingScreen() {
  const { session } = useAuth();

  const { walkId } =
    useLocalSearchParams<{
      walkId?: string;
    }>();

  const [
    walk,
    setWalk,
  ] = useState<WalkRequest | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  const [
    ratingSaving,
    setRatingSaving,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadWalk() {
      try {
        setError(null);

        if (!walkId) {
          throw new Error(
            'Walk id is missing.',
          );
        }

        const storedWalk =
          await getWalkRequestById(
            walkId,
          );

        if (!storedWalk) {
          throw new Error(
            'Walk request not found.',
          );
        }

        if (mounted) {
          setWalk(storedWalk);

          setElapsedSeconds(
            getElapsedSeconds(
              storedWalk.startedAt,
              storedWalk.completedAt,
            ),
          );
        }
      } catch {
        if (mounted) {
          setError(
            'We could not load this walk request.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadWalk();

    const refreshInterval =
      setInterval(() => {
        void loadWalk();
      }, 2000);

    return () => {
      mounted = false;

      clearInterval(
        refreshInterval,
      );
    };
  }, [walkId]);

  useEffect(() => {
    if (
      !walk?.startedAt ||
      walk.status !==
        'in_progress'
    ) {
      return;
    }

    const timerInterval =
      setInterval(() => {
        setElapsedSeconds(
          getElapsedSeconds(
            walk.startedAt,
          ),
        );
      }, 1000);

    return () => {
      clearInterval(
        timerInterval,
      );
    };
  }, [
    walk?.startedAt,
    walk?.status,
  ]);

  async function handleRateWalk(
    rating: number,
  ) {
    if (
      !walk ||
      !session ||
      session.user.role !==
        'prowner' ||
      ratingSaving
    ) {
      return;
    }

    try {
      setRatingSaving(true);

      const updatedWalk =
        await rateWalkRequest(
          walk.id,
          session.user.id,
          rating,
        );

      setWalk(updatedWalk);
    } catch {
      Alert.alert(
        'Rating error',
        'We could not save your rating.',
      );
    } finally {
      setRatingSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.centered}
      >
        <ActivityIndicator
          size="large"
          color={COLORS.coral}
        />

        <Text
          style={styles.loadingText}
        >
          OPENING WALK...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !walk) {
    return (
      <SafeAreaView
        style={styles.centered}
      >
        <Text
          style={styles.errorEyebrow}
        >
          PAWGO / ERROR
        </Text>

        <Text
          style={styles.errorTitle}
        >
          Walk unavailable.
        </Text>

        <Text
          style={styles.errorText}
        >
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  const assignedPrunner =
    walk.prunnerId
      ? getDemoUsers().find(
          (user) =>
            user.id ===
            walk.prunnerId,
        ) ?? null
      : null;

  const isRequested =
    walk.status === 'requested';

  const isAccepted =
    walk.status === 'accepted';

  const isInProgress =
    walk.status ===
    'in_progress';

  const isCompleted =
    walk.status === 'completed';

  const latestPoint =
    walk.route.length > 0
      ? walk.route[
          walk.route.length - 1
        ]
      : null;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={[
            styles.statusBadge,
            !isRequested &&
              styles.statusBadgeActive,
            isCompleted &&
              styles.statusBadgeCompleted,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              !isRequested &&
                styles.statusDotActive,
              isCompleted &&
                styles.statusDotCompleted,
            ]}
          />

          <Text
            style={styles.statusText}
          >
            {isRequested
              ? 'REQUEST SENT'
              : isAccepted
                ? 'PRUNNER ASSIGNED'
                : isInProgress
                  ? 'WALK IN PROGRESS'
                  : 'WALK COMPLETED'}
          </Text>
        </View>

        <Text style={styles.title}>
          {isRequested
            ? "Finding Milo's Prunner."
            : isAccepted
              ? `${assignedPrunner?.name ?? 'Your Prunner'} is ready.`
              : isInProgress
                ? `${assignedPrunner?.name ?? 'Your Prunner'} is walking Milo.`
                : 'Milo is back home.'}
        </Text>

        <Text
          style={styles.description}
        >
          {isRequested
            ? "Your request is live. A nearby Prunner can now review and accept Milo's walk."
            : isAccepted
              ? `${assignedPrunner?.name ?? 'Your Prunner'} accepted Milo's walk. Everything is ready to begin.`
              : isInProgress
                ? `Milo's walk is active. PawGo is receiving the latest progress from ${assignedPrunner?.name ?? 'your Prunner'}.`
                : `${assignedPrunner?.name ?? 'Your Prunner'} completed Milo's walk. Here's how it went.`}
        </Text>

        <View
          style={styles.dogCard}
        >
          <Image
            source={{
              uri: DEMO_DOG.imageUrl,
            }}
            style={styles.dogImage}
          />

          <View
            style={styles.dogContent}
          >
            <Text
              style={styles.dogLabel}
            >
              {isRequested
                ? 'WAITING FOR A PRUNNER'
                : isAccepted
                  ? 'WALK ASSIGNED'
                  : isInProgress
                    ? 'LIVE WALK'
                    : 'WALK COMPLETE ✓'}
            </Text>

            <Text
              style={styles.dogName}
            >
              {DEMO_DOG.name}
            </Text>

            <Text
              style={styles.dogMeta}
            >
              {walk.durationMinutes}{' '}
              MIN PLANNED
            </Text>
          </View>
        </View>

        {isRequested && (
          <View
            style={styles.searchCard}
          >
            <View
              style={styles.searchIcon}
            >
              <ActivityIndicator
                size="small"
                color={COLORS.white}
              />
            </View>

            <View
              style={styles.searchContent}
            >
              <Text
                style={styles.searchLabel}
              >
                SEARCHING
              </Text>

              <Text
                style={styles.searchTitle}
              >
                Looking for a Prunner nearby
              </Text>

              <Text
                style={styles.searchText}
              >
                Your request stays available until a Prunner accepts it.
              </Text>
            </View>
          </View>
        )}

        {!isRequested &&
          assignedPrunner && (
            <View
              style={styles.assignedCard}
            >
              <View
                style={styles.assignedAvatar}
              >
                <Text
                  style={
                    styles.assignedAvatarText
                  }
                >
                  {assignedPrunner.name
                    .charAt(0)
                    .toUpperCase()}
                </Text>
              </View>

              <View
                style={styles.assignedContent}
              >
                <Text
                  style={styles.assignedLabel}
                >
                  YOUR PRUNNER
                </Text>

                <Text
                  style={styles.assignedName}
                >
                  {assignedPrunner.name}
                </Text>

                <Text
                  style={styles.assignedText}
                >
                  {isCompleted
                    ? "Completed Milo's walk"
                    : isInProgress
                      ? 'Currently walking Milo'
                      : "Assigned and ready for Milo's walk"}{' '}
                  ✓
                </Text>
              </View>
            </View>
          )}

        {(isInProgress ||
          isCompleted) && (
          <>
            <View
              style={styles.timerCard}
            >
              <Text
                style={styles.timerLabel}
              >
                {isCompleted
                  ? 'FINAL WALK TIME'
                  : 'LIVE ELAPSED TIME'}
              </Text>

              <Text
                style={styles.timerValue}
              >
                {formatElapsedTime(
                  elapsedSeconds,
                )}
              </Text>

              <Text
                style={styles.timerHelper}
              >
                {isCompleted
                  ? 'Final duration'
                  : 'Updating while the walk is active'}
              </Text>
            </View>

            <View
              style={styles.liveMetrics}
            >
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
                  {walk.distanceKm < 1
                    ? Math.round(
                        walk.distanceKm *
                          1000,
                      )
                    : walk.distanceKm.toFixed(
                        2,
                      )}
                </Text>

                <Text
                  style={styles.metricUnit}
                >
                  {walk.distanceKm < 1
                    ? 'METERS'
                    : 'KM'}
                </Text>
              </View>

              <View
                style={styles.metricCard}
              >
                <Text
                  style={styles.metricLabel}
                >
                  ROUTE
                </Text>

                <Text
                  style={styles.metricValue}
                >
                  {walk.route.length}
                </Text>

                <Text
                  style={styles.metricUnit}
                >
                  GPS POINTS
                </Text>
              </View>
            </View>
          </>
        )}

        {isInProgress && (
          <View
            style={styles.liveCard}
          >
            <View
              style={styles.liveHeader}
            >
              <View>
                <Text
                  style={styles.liveLabel}
                >
                  LIVE MONITORING
                </Text>

                <Text
                  style={styles.liveTitle}
                >
                  Receiving updates
                </Text>
              </View>

              <View
                style={styles.liveDot}
              />
            </View>

            {latestPoint ? (
              <>
                <Text
                  style={styles.liveText}
                >
                  Latest known location
                </Text>

                <Text
                  style={styles.coordinates}
                >
                  {latestPoint.latitude.toFixed(
                    5,
                  )}
                  {' · '}
                  {latestPoint.longitude.toFixed(
                    5,
                  )}
                </Text>
              </>
            ) : (
              <Text
                style={styles.liveText}
              >
                Waiting for the first GPS point from Diego.
              </Text>
            )}
          </View>
        )}

        {isCompleted && (
          <View
            style={styles.memoryCard}
          >
            <Text
              style={styles.memoryLabel}
            >
              WALK MEMORY
            </Text>

            <Text
              style={styles.memoryTitle}
            >
              A note from{' '}
              {assignedPrunner?.name ??
                'your Prunner'}
            </Text>

            {walk.summaryPhotoUri ? (
              <Image
                source={{
                  uri: walk.summaryPhotoUri,
                }}
                style={styles.memoryImage}
              />
            ) : null}

            <Text
              style={styles.memoryText}
            >
              {walk.summaryNote ??
                'No note was added for this walk.'}
            </Text>
          </View>
        )}

        <View
          style={styles.detailsCard}
        >
          <View
            style={styles.detailRow}
          >
            <Text
              style={styles.detailLabel}
            >
              STATUS
            </Text>

            <Text
              style={styles.detailValue}
            >
              {walk.status
                .replace('_', ' ')
                .toUpperCase()}
            </Text>
          </View>

          <View
            style={styles.divider}
          />

          <View
            style={styles.detailRow}
          >
            <Text
              style={styles.detailLabel}
            >
              DURATION
            </Text>

            <Text
              style={styles.detailValue}
            >
              {walk.durationMinutes} MIN
            </Text>
          </View>

          <View
            style={styles.divider}
          />

          <View
            style={styles.detailRow}
          >
            <Text
              style={styles.detailLabel}
            >
              LOCATION
            </Text>

            <Text
              style={styles.detailValue}
            >
              {isCompleted
                ? 'COMPLETED ✓'
                : 'READY ✓'}
            </Text>
          </View>

          {assignedPrunner && (
            <>
              <View
                style={styles.divider}
              />

              <View
                style={styles.detailRow}
              >
                <Text
                  style={styles.detailLabel}
                >
                  PRUNNER
                </Text>

                <Text
                  style={styles.detailValue}
                >
                  {assignedPrunner.name.toUpperCase()}{' '}
                  ✓
                </Text>
              </View>
            </>
          )}

          {isCompleted && (
            <>
              <View
                style={styles.divider}
              />

              <View
                style={styles.detailRow}
              >
                <Text
                  style={styles.detailLabel}
                >
                  COMPLETED
                </Text>

                <Text
                  style={styles.detailValue}
                >
                  {walk.completedAt
                    ? new Date(
                        walk.completedAt,
                      ).toLocaleTimeString(
                        [],
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )
                    : '—'}
                </Text>
              </View>
            </>
          )}
        </View>

        {walk.instructions ? (
          <View
            style={styles.instructionsCard}
          >
            <Text
              style={styles.instructionsLabel}
            >
              WALK INSTRUCTIONS
            </Text>

            <Text
              style={styles.instructionsText}
            >
              {walk.instructions}
            </Text>
          </View>
        ) : null}

        {isRequested && (
          <View
            style={styles.demoSection}
          >
            <Text
              style={styles.demoLabel}
            >
              DEMO FLOW
            </Text>

            <Text
              style={styles.demoText}
            >
              Switch roles to let Diego see and accept this request.
            </Text>

            <DemoRoleSwitcher
              targetRole="prunner"
            />
          </View>
        )}

        {isInProgress && (
          <View
            style={styles.demoSection}
          >
            <Text
              style={styles.demoLabel}
            >
              DEMO FLOW
            </Text>

            <Text
              style={styles.demoText}
            >
              Switch to Diego to continue generating live GPS updates.
            </Text>

            <DemoRoleSwitcher
              targetRole="prunner"
            />
          </View>
        )}

        {isCompleted && (
          <Pressable
            onPress={() => {
              router.push(
                '/prowner/history',
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

        {isCompleted && (
          <View
            style={styles.ratingPreviewCard}
          >
            <Text
              style={styles.ratingPreviewLabel}
            >
              YOUR EXPERIENCE
            </Text>

            <Text
              style={styles.ratingPreviewTitle}
            >
              {walk.rating
                ? 'Thanks for your rating!'
                : "Rate Diego's walk"}
            </Text>

            <Text
              style={styles.ratingPreviewText}
            >
              Tap a star to rate Milo's completed walk.
            </Text>

            <View
              style={styles.starsRow}
            >
              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <Pressable
                    key={star}
                    disabled={ratingSaving}
                    onPress={() => {
                      void handleRateWalk(
                        star,
                      );
                    }}
                    style={({ pressed }) => [
                      styles.starButton,
                      pressed &&
                        styles.starPressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.star,
                        walk.rating !== null &&
                          star <=
                            walk.rating &&
                          styles.starActive,
                      ]}
                    >
                      ★
                    </Text>
                  </Pressable>
                ),
              )}
            </View>

            <Text
              style={styles.ratingResult}
            >
              {ratingSaving
                ? 'SAVING...'
                : walk.rating
                  ? `${walk.rating}/5 SAVED ✓`
                  : 'NOT RATED YET'}
            </Text>
          </View>
        )}
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
  container: {
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
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.muted,
  },
  errorEyebrow: {
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
  errorText: {
    marginTop: SPACING.sm,
    color: COLORS.muted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor:
      COLORS.yellowSoft,
  },
  statusBadgeActive: {
    backgroundColor:
      COLORS.greenSoft,
  },
  statusBadgeCompleted: {
    backgroundColor:
      COLORS.yellowSoft,
  },
  statusDot: {
    width: 7,
    height: 7,
    marginRight: 7,
    borderRadius: RADIUS.pill,
    backgroundColor:
      COLORS.yellow,
  },
  statusDotActive: {
    backgroundColor:
      COLORS.success,
  },
  statusDotCompleted: {
    backgroundColor:
      COLORS.coral,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.ink,
  },
  title: {
    marginTop: SPACING.lg,
    fontSize: 38,
    lineHeight: 41,
    fontWeight: '900',
    letterSpacing: -1.2,
    color: COLORS.ink,
  },
  description: {
    marginTop: SPACING.md,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
  },
  dogCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xl,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor:
      COLORS.surface,
  },
  dogImage: {
    width: 88,
    height: 88,
    borderRadius: RADIUS.md,
  },
  dogContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  dogLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.coral,
  },
  dogName: {
    marginTop: SPACING.xs,
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.ink,
  },
  dogMeta: {
    marginTop: SPACING.xs,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.muted,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor:
      COLORS.greenSoft,
  },
  searchIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent:
      'center',
    borderRadius: RADIUS.pill,
    backgroundColor:
      COLORS.green,
  },
  searchContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  searchLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.green,
  },
  searchTitle: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ink,
  },
  searchText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.muted,
  },
  assignedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor:
      COLORS.greenSoft,
  },
  assignedAvatar: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent:
      'center',
    borderRadius: RADIUS.pill,
    backgroundColor:
      COLORS.green,
  },
  assignedAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
  },
  assignedContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  assignedLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.green,
  },
  assignedName: {
    marginTop: 3,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
  },
  assignedText: {
    marginTop: 3,
    fontSize: 11,
    color: COLORS.muted,
  },
  timerCard: {
    alignItems: 'center',
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor:
      COLORS.ink,
  },
  timerLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.yellow,
  },
  timerValue: {
    marginTop: SPACING.sm,
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.white,
  },
  timerHelper: {
    marginTop: SPACING.xs,
    fontSize: 10,
    color: COLORS.border,
  },
  liveMetrics: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  metricCard: {
    flex: 1,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor:
      COLORS.surface,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.muted,
  },
  metricValue: {
    marginTop: SPACING.sm,
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.ink,
  },
  metricUnit: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.green,
  },
  liveCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor:
      COLORS.yellowSoft,
  },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
  },
  liveLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.coral,
  },
  liveTitle: {
    marginTop: SPACING.xs,
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  liveDot: {
    width: 11,
    height: 11,
    borderRadius: RADIUS.pill,
    backgroundColor:
      COLORS.success,
  },
  liveText: {
    marginTop: SPACING.md,
    fontSize: 11,
    color: COLORS.muted,
  },
  coordinates: {
    marginTop: SPACING.xs,
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.ink,
  },
  memoryCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor:
      COLORS.yellowSoft,
  },
  memoryLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.coral,
  },
  memoryTitle: {
    marginTop: SPACING.sm,
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.ink,
  },
  memoryImage: {
    width: '100%',
    height: 220,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.lg,
  },
  memoryText: {
    marginTop: SPACING.md,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.ink,
  },
  detailsCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor:
      COLORS.surface,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
  },
  detailLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.muted,
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.ink,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
    backgroundColor:
      COLORS.border,
  },
  instructionsCard: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor:
      COLORS.surfaceSoft,
  },
  instructionsLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.coral,
  },
  instructionsText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.ink,
  },
  demoSection: {
    marginTop: SPACING.xl,
  },
  demoLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.muted,
  },
  demoText: {
    marginTop: SPACING.xs,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.muted,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 16,
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
  ratingPreviewCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor:
      COLORS.greenSoft,
  },
  ratingPreviewLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.green,
  },
  ratingPreviewTitle: {
    marginTop: SPACING.sm,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
  },
  ratingPreviewText: {
    marginTop: SPACING.sm,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },
  starsRow: {
    flexDirection: 'row',
    marginTop: SPACING.lg,
  },
  starButton: {
    marginRight: SPACING.sm,
  },
  pressed: {
    opacity: 0.72,
  },
  starPressed: {
    opacity: 0.6,
  },
  star: {
    fontSize: 35,
    color: COLORS.border,
  },
  starActive: {
    color: COLORS.yellow,
  },
  ratingResult: {
    marginTop: SPACING.md,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.green,
  },
});
