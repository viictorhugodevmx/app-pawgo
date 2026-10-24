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
  useRef,
  useState,
} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../features/auth/AuthContext';
import { DEMO_DOG } from '../../features/dogs/mockDog';
import {
  appendWalkRoutePoint,
  finishWalkRequest,
  getWalkRequestById,
} from '../../features/walks/walkRepository';
import {
  watchForegroundLocation,
  type LocationWatcher,
} from '../../services/locationService';
import { COLORS } from '../../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../../theme/tokens';
import type {
  LocationPoint,
  WalkRequest,
} from '../../types/walk';
import {
  formatPace,
  getAveragePaceSecondsPerKm,
  getAverageSpeedKmh,
} from '../../utils/walkMetrics';

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
      String(value).padStart(2, '0'),
    )
    .join(':');
}

export default function PrunnerActiveWalkScreen() {
  const { session } = useAuth();

  const { walkId } =
    useLocalSearchParams<{
      walkId?: string;
    }>();

  const routeWriteInFlight =
    useRef(false);

  const [
    walk,
    setWalk,
  ] = useState<WalkRequest | null>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    elapsedSeconds,
    setElapsedSeconds,
  ] = useState(0);

  const [
    currentLocation,
    setCurrentLocation,
  ] = useState<LocationPoint | null>(
    null,
  );

  const [
    accuracyMeters,
    setAccuracyMeters,
  ] = useState<number | null>(null);

  const [
    locationStatus,
    setLocationStatus,
  ] = useState<
    'starting' |
    'tracking' |
    'stopped' |
    'error'
  >('starting');

  const [
    locationError,
    setLocationError,
  ] = useState<string | null>(null);

  const [
    finishing,
    setFinishing,
  ] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadWalk() {
      try {
        setLoading(true);
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
            'Walk not found.',
          );
        }

        if (active) {
          setWalk(storedWalk);

          setElapsedSeconds(
            getElapsedSeconds(
              storedWalk.startedAt,
              storedWalk.completedAt,
            ),
          );

          if (
            storedWalk.status ===
            'completed'
          ) {
            setLocationStatus(
              'stopped',
            );
          }
        }
      } catch {
        if (active) {
          setError(
            'We could not load the walk.',
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadWalk();

    return () => {
      active = false;
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

    const intervalId =
      setInterval(() => {
        setElapsedSeconds(
          getElapsedSeconds(
            walk.startedAt,
          ),
        );
      }, 1000);

    return () => {
      clearInterval(
        intervalId,
      );
    };
  }, [
    walk?.startedAt,
    walk?.status,
  ]);

  useEffect(() => {
    if (
      !walk ||
      walk.status !==
        'in_progress' ||
      !session ||
      session.user.role !==
        'prunner'
    ) {
      return;
    }

    let mounted = true;
    let watcher: LocationWatcher | null =
      null;

    async function persistRoutePoint(
      point: LocationPoint,
    ) {
      if (
        routeWriteInFlight.current ||
        !walk ||
        !session
      ) {
        return;
      }

      try {
        routeWriteInFlight.current =
          true;

        const updatedWalk =
          await appendWalkRoutePoint(
            walk.id,
            session.user.id,
            point,
          );

        if (mounted) {
          setWalk(updatedWalk);
        }
      } catch {
        if (mounted) {
          setLocationStatus('error');

          setLocationError(
            'PawGo could not save the latest route point.',
          );
        }
      } finally {
        routeWriteInFlight.current =
          false;
      }
    }

    async function startTracking() {
      try {
        setLocationStatus(
          'starting',
        );
        setLocationError(null);

        const activeWatcher =
          await watchForegroundLocation(
            (
              point,
              accuracy,
            ) => {
              if (!mounted) {
                return;
              }

              setCurrentLocation(
                point,
              );

              setAccuracyMeters(
                accuracy,
              );

              setLocationStatus(
                'tracking',
              );

              void persistRoutePoint(
                point,
              );
            },
            (message) => {
              if (!mounted) {
                return;
              }

              setLocationStatus(
                'error',
              );

              setLocationError(
                message,
              );
            },
          );

        if (!mounted) {
          activeWatcher.remove();
          return;
        }

        watcher = activeWatcher;
      } catch {
        if (mounted) {
          setLocationStatus(
            'error',
          );

          setLocationError(
            'PawGo could not start live location tracking.',
          );
        }
      }
    }

    void startTracking();

    return () => {
      mounted = false;
      watcher?.remove();
    };
  }, [
    walk?.id,
    walk?.status,
    session?.user.id,
    session?.user.role,
  ]);

  async function handleFinishWalk() {
    if (
      !walk ||
      !session ||
      session.user.role !==
        'prunner' ||
      finishing
    ) {
      return;
    }

    try {
      setFinishing(true);

      const completedWalk =
        await finishWalkRequest(
          walk.id,
          session.user.id,
        );

      setWalk(
        completedWalk,
      );

      setElapsedSeconds(
        getElapsedSeconds(
          completedWalk.startedAt,
          completedWalk.completedAt,
        ),
      );

      setLocationStatus(
        'stopped',
      );
    } catch {
      Alert.alert(
        'Finish walk error',
        'We could not finish this walk. Please try again.',
      );
    } finally {
      setFinishing(false);
    }
  }

  function handleOpenSummary() {
    if (!walk) {
      return;
    }

    router.push({
      pathname: '/prunner/summary',
      params: {
        walkId: walk.id,
      },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator
          size="large"
          color={COLORS.coral}
        />

        <Text style={styles.loadingText}>
          OPENING WALK...
        </Text>
      </SafeAreaView>
    );
  }

  if (error || !walk) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorLabel}>
          PAWGO / ERROR
        </Text>

        <Text style={styles.errorTitle}>
          Walk unavailable.
        </Text>

        <Text style={styles.errorText}>
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  const isCompleted =
    walk.status === 'completed';

  const averageSpeedKmh =
    getAverageSpeedKmh(
      walk.distanceKm,
      elapsedSeconds,
    );

  const averagePace =
    getAveragePaceSecondsPerKm(
      walk.distanceKm,
      elapsedSeconds,
    );

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.statusBadge,
            isCompleted &&
              styles.statusBadgeCompleted,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              isCompleted &&
                styles.statusDotCompleted,
            ]}
          />

          <Text style={styles.statusText}>
            {isCompleted
              ? 'WALK COMPLETED'
              : 'WALK IN PROGRESS'}
          </Text>
        </View>

        <Text style={styles.title}>
          {isCompleted
            ? 'Great walk,'
            : 'Milo is'}
          {'\n'}
          {isCompleted
            ? 'Milo.'
            : 'on the move.'}
        </Text>

        <Text style={styles.description}>
          {isCompleted
            ? "Milo's walk is finished. The route and metrics are safely stored."
            : "PawGo is tracking and saving Milo's route while the app remains active."}
        </Text>

        <Image
          source={{
            uri: DEMO_DOG.imageUrl,
          }}
          style={styles.image}
        />

        <View style={styles.timerCard}>
          <Text style={styles.timerLabel}>
            {isCompleted
              ? 'FINAL TIME'
              : 'ELAPSED TIME'}
          </Text>

          <Text style={styles.timerValue}>
            {formatElapsedTime(
              elapsedSeconds,
            )}
          </Text>

          <Text style={styles.timerHelper}>
            {isCompleted
              ? 'Timer stopped at completion'
              : 'Live since the walk started'}
          </Text>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>
              AVG SPEED
            </Text>

            <Text style={styles.metricValue}>
              {averageSpeedKmh === null
                ? '—'
                : averageSpeedKmh.toFixed(
                    1,
                  )}
            </Text>

            <Text style={styles.metricUnit}>
              KM/H
            </Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>
              AVG PACE
            </Text>

            <Text style={styles.metricValue}>
              {formatPace(
                averagePace,
              )}
            </Text>

            <Text style={styles.metricUnit}>
              MIN/KM
            </Text>
          </View>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <View>
              <Text style={styles.locationLabel}>
                LOCATION
              </Text>

              <Text style={styles.locationTitle}>
                {isCompleted
                  ? 'GPS stopped'
                  : locationStatus ===
                      'tracking'
                    ? 'GPS connected'
                    : locationStatus ===
                        'error'
                      ? 'GPS unavailable'
                      : 'Connecting GPS...'}
              </Text>
            </View>

            <View
              style={[
                styles.locationDot,
                locationStatus ===
                  'tracking' &&
                  styles.locationDotActive,
                locationStatus ===
                  'error' &&
                  styles.locationDotError,
                isCompleted &&
                  styles.locationDotStopped,
              ]}
            />
          </View>

          {currentLocation &&
            !isCompleted && (
              <>
                <View style={styles.coordinates}>
                  <View style={styles.coordinateItem}>
                    <Text style={styles.coordinateLabel}>
                      LATITUDE
                    </Text>

                    <Text style={styles.coordinateValue}>
                      {currentLocation.latitude.toFixed(
                        5,
                      )}
                    </Text>
                  </View>

                  <View style={styles.coordinateItem}>
                    <Text style={styles.coordinateLabel}>
                      LONGITUDE
                    </Text>

                    <Text style={styles.coordinateValue}>
                      {currentLocation.longitude.toFixed(
                        5,
                      )}
                    </Text>
                  </View>
                </View>

                <Text style={styles.accuracy}>
                  Accuracy:{' '}
                  {accuracyMeters !== null
                    ? `±${Math.round(
                        accuracyMeters,
                      )} m`
                    : '—'}
                </Text>
              </>
            )}

          {locationError && (
            <Text style={styles.locationError}>
              {locationError}
            </Text>
          )}
        </View>

        <View style={styles.distanceCard}>
          <Text style={styles.distanceLabel}>
            DISTANCE
          </Text>

          <Text style={styles.distanceValue}>
            {walk.distanceKm < 1
              ? Math.round(
                  walk.distanceKm *
                    1000,
                )
              : walk.distanceKm.toFixed(
                  2,
                )}
          </Text>

          <Text style={styles.distanceUnit}>
            {walk.distanceKm < 1
              ? 'METERS'
              : 'KILOMETERS'}
          </Text>
        </View>

        <View style={styles.routeCard}>
          <Text style={styles.routeLabel}>
            ROUTE
          </Text>

          <Text style={styles.routeValue}>
            {walk.route.length}
          </Text>

          <Text style={styles.routeUnit}>
            GPS POINTS SAVED
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              STATUS
            </Text>

            <Text style={styles.detailValue}>
              {walk.status
                .replace('_', ' ')
                .toUpperCase()}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              PLANNED
            </Text>

            <Text style={styles.detailValue}>
              {walk.durationMinutes} MIN
            </Text>
          </View>

          {isCompleted && (
            <>
              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  COMPLETED
                </Text>

                <Text style={styles.detailValue}>
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

        {!isCompleted ? (
          <Pressable
            onPress={() => {
              void handleFinishWalk();
            }}
            style={({ pressed }) => [
              styles.finishButton,
              pressed &&
                styles.pressed,
              finishing &&
                styles.disabled,
            ]}
          >
            <Text style={styles.finishButtonText}>
              {finishing
                ? 'FINISHING...'
                : 'FINISH WALK'}
            </Text>

            <Text style={styles.finishArrow}>
              ✓
            </Text>
          </Pressable>
        ) : (
          <View style={styles.completedCard}>
            <Text style={styles.completedLabel}>
              WALK COMPLETE ✓
            </Text>

            <Text style={styles.completedTitle}>
              Nice work, Diego.
            </Text>

            <Text style={styles.completedText}>
              Milo's route and activity metrics are ready.
            </Text>

            <Pressable
              onPress={handleOpenSummary}
              style={({ pressed }) => [
                styles.summaryButton,
                pressed &&
                  styles.pressed,
              ]}
            >
              <Text style={styles.summaryButtonText}>
                VIEW WALK SUMMARY
              </Text>

              <Text style={styles.summaryArrow}>
                →
              </Text>
            </Pressable>
          </View>
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.muted,
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
    backgroundColor: COLORS.greenSoft,
  },
  statusBadgeCompleted: {
    backgroundColor: COLORS.yellowSoft,
  },
  statusDot: {
    width: 8,
    height: 8,
    marginRight: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.success,
  },
  statusDotCompleted: {
    backgroundColor: COLORS.coral,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.ink,
  },
  title: {
    marginTop: SPACING.lg,
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
  image: {
    width: '100%',
    height: 240,
    marginTop: SPACING.xl,
    borderRadius: RADIUS.lg,
  },
  timerCard: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.ink,
  },
  timerLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.yellow,
  },
  timerValue: {
    marginTop: SPACING.sm,
    fontSize: 42,
    fontWeight: '900',
    color: COLORS.white,
  },
  timerHelper: {
    marginTop: SPACING.sm,
    fontSize: 11,
    color: COLORS.border,
  },
  metricsRow: {
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
    backgroundColor: COLORS.surface,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.muted,
  },
  metricValue: {
    marginTop: SPACING.sm,
    fontSize: 25,
    fontWeight: '900',
    color: COLORS.ink,
  },
  metricUnit: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.green,
  },
  locationCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.greenSoft,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.green,
  },
  locationTitle: {
    marginTop: SPACING.xs,
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.ink,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.yellow,
  },
  locationDotActive: {
    backgroundColor: COLORS.success,
  },
  locationDotError: {
    backgroundColor: COLORS.danger,
  },
  locationDotStopped: {
    backgroundColor: COLORS.muted,
  },
  coordinates: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  coordinateItem: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  coordinateLabel: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.muted,
  },
  coordinateValue: {
    marginTop: SPACING.xs,
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.ink,
  },
  accuracy: {
    marginTop: SPACING.sm,
    fontSize: 10,
    color: COLORS.muted,
  },
  locationError: {
    marginTop: SPACING.md,
    fontSize: 11,
    color: COLORS.danger,
  },
  distanceCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.coral,
  },
  distanceLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.white,
  },
  distanceValue: {
    marginTop: SPACING.sm,
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.white,
  },
  distanceUnit: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.white,
  },
  routeCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  routeLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.coral,
  },
  routeValue: {
    marginTop: SPACING.sm,
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.ink,
  },
  routeUnit: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.green,
  },
  detailsCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    backgroundColor: COLORS.border,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 18,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.coral,
  },
  finishButtonText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.white,
  },
  finishArrow: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
  },
  completedCard: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.yellowSoft,
  },
  completedLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.coral,
  },
  completedTitle: {
    marginTop: SPACING.sm,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
  },
  completedText: {
    marginTop: SPACING.sm,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.ink,
  },
  summaryButtonText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.white,
  },
  summaryArrow: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.yellow,
  },
  pressed: {
    opacity: 0.72,
  },
  disabled: {
    opacity: 0.55,
  },
});
