import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  useEffect,
  useState,
} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../features/auth/AuthContext';
import { DEMO_DOG } from '../../features/dogs/mockDog';
import {
  getWalkRequestById,
  updateWalkSummary,
} from '../../features/walks/walkRepository';
import { getDemoUsers } from '../../services/authService';
import { pickWalkPhoto } from '../../services/photoService';
import { COLORS } from '../../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../../theme/tokens';
import type { WalkRequest } from '../../types/walk';
import {
  formatPace,
  getAveragePaceSecondsPerKm,
  getAverageSpeedKmh,
} from '../../utils/walkMetrics';

function getWalkDurationSeconds(
  walk: WalkRequest,
): number {
  if (
    !walk.startedAt ||
    !walk.completedAt
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.floor(
      (
        new Date(
          walk.completedAt,
        ).getTime() -
        new Date(
          walk.startedAt,
        ).getTime()
      ) / 1000,
    ),
  );
}

function formatDuration(
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

export default function PrunnerWalkSummaryScreen() {
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
  ] = useState<string | null>(null);

  const [
    note,
    setNote,
  ] = useState('');

  const [
    photoUri,
    setPhotoUri,
  ] = useState<string | null>(
    null,
  );

  const [
    selectingPhoto,
    setSelectingPhoto,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    saved,
    setSaved,
  ] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadSummary() {
      try {
        if (!walkId) {
          throw new Error(
            'Walk id is missing.',
          );
        }

        const storedWalk =
          await getWalkRequestById(
            walkId,
          );

        if (
          !storedWalk ||
          storedWalk.status !==
            'completed'
        ) {
          throw new Error(
            'Completed walk not found.',
          );
        }

        if (mounted) {
          setWalk(storedWalk);

          setNote(
            storedWalk.summaryNote ??
              '',
          );

          setPhotoUri(
            storedWalk.summaryPhotoUri,
          );

          setSaved(
            Boolean(
              storedWalk.summaryNote ||
                storedWalk.summaryPhotoUri,
            ),
          );
        }
      } catch {
        if (mounted) {
          setError(
            'We could not load the walk summary.',
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      mounted = false;
    };
  }, [walkId]);

  async function handlePickPhoto() {
    if (selectingPhoto) {
      return;
    }

    try {
      setSelectingPhoto(true);

      const selectedPhoto =
        await pickWalkPhoto();

      if (selectedPhoto) {
        setPhotoUri(
          selectedPhoto,
        );

        setSaved(false);
      }
    } catch {
      Alert.alert(
        'Photo unavailable',
        'PawGo needs photo-library permission to attach a walk photo.',
      );
    } finally {
      setSelectingPhoto(false);
    }
  }

  async function handleSaveMemory() {
    if (
      !walk ||
      !session ||
      session.user.role !==
        'prunner' ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);

      const updatedWalk =
        await updateWalkSummary(
          walk.id,
          session.user.id,
          note,
          photoUri,
        );

      setWalk(updatedWalk);

      setNote(
        updatedWalk.summaryNote ??
          '',
      );

      setPhotoUri(
        updatedWalk.summaryPhotoUri,
      );

      setSaved(true);
    } catch {
      Alert.alert(
        'Save error',
        'We could not save this walk memory.',
      );
    } finally {
      setSaving(false);
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
          BUILDING SUMMARY...
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
          style={styles.errorLabel}
        >
          PAWGO / ERROR
        </Text>

        <Text
          style={styles.errorTitle}
        >
          Summary unavailable.
        </Text>

        <Text
          style={styles.errorText}
        >
          {error}
        </Text>
      </SafeAreaView>
    );
  }

  const durationSeconds =
    getWalkDurationSeconds(
      walk,
    );

  const averageSpeed =
    getAverageSpeedKmh(
      walk.distanceKm,
      durationSeconds,
    );

  const averagePace =
    getAveragePaceSecondsPerKm(
      walk.distanceKm,
      durationSeconds,
    );

  const prunner =
    walk.prunnerId
      ? getDemoUsers().find(
          (user) =>
            user.id ===
            walk.prunnerId,
        ) ?? null
      : null;

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
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.badge}>
          <Text
            style={styles.badgeText}
          >
            WALK COMPLETE ✓
          </Text>
        </View>

        <Text style={styles.title}>
          Milo had a
          {'\n'}
          great walk.
        </Text>

        <Text
          style={styles.description}
        >
          Here is the final PawGo activity summary.
        </Text>

        <Image
          source={{
            uri: DEMO_DOG.imageUrl,
          }}
          style={styles.image}
        />

        <View
          style={styles.heroCard}
        >
          <Text
            style={styles.heroLabel}
          >
            FINAL DURATION
          </Text>

          <Text
            style={styles.heroValue}
          >
            {formatDuration(
              durationSeconds,
            )}
          </Text>

          <Text
            style={styles.heroHelper}
          >
            Completed by{' '}
            {prunner?.name ??
              'your Prunner'}
          </Text>
        </View>

        <View
          style={styles.metricsRow}
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

        <View
          style={styles.metricsRow}
        >
          <View
            style={styles.metricCard}
          >
            <Text
              style={styles.metricLabel}
            >
              AVG SPEED
            </Text>

            <Text
              style={styles.metricValue}
            >
              {averageSpeed === null
                ? '—'
                : averageSpeed.toFixed(
                    1,
                  )}
            </Text>

            <Text
              style={styles.metricUnit}
            >
              KM/H
            </Text>
          </View>

          <View
            style={styles.metricCard}
          >
            <Text
              style={styles.metricLabel}
            >
              AVG PACE
            </Text>

            <Text
              style={styles.metricValue}
            >
              {formatPace(
                averagePace,
              )}
            </Text>

            <Text
              style={styles.metricUnit}
            >
              MIN/KM
            </Text>
          </View>
        </View>

        <View
          style={styles.detailsCard}
        >
          <View
            style={styles.detailRow}
          >
            <Text
              style={styles.detailLabel}
            >
              DOG
            </Text>

            <Text
              style={styles.detailValue}
            >
              {DEMO_DOG.name.toUpperCase()}
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
              PRUNNER
            </Text>

            <Text
              style={styles.detailValue}
            >
              {prunner?.name.toUpperCase() ??
                '—'}
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
              STARTED
            </Text>

            <Text
              style={styles.detailValue}
            >
              {walk.startedAt
                ? new Date(
                    walk.startedAt,
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
        </View>

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
            Add a moment from Milo's walk.
          </Text>

          <Text
            style={styles.memoryText}
          >
            Leave a short note and optionally attach a photo for the Prowner.
          </Text>

          {photoUri ? (
            <Image
              source={{
                uri: photoUri,
              }}
              style={styles.memoryImage}
            />
          ) : (
            <View
              style={styles.photoPlaceholder}
            >
              <Text
                style={styles.photoPlaceholderIcon}
              >
                🐾
              </Text>

              <Text
                style={styles.photoPlaceholderText}
              >
                No walk photo yet
              </Text>
            </View>
          )}

          <Pressable
            onPress={() => {
              void handlePickPhoto();
            }}
            style={({ pressed }) => [
              styles.photoButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={styles.photoButtonText}
            >
              {selectingPhoto
                ? 'OPENING GALLERY...'
                : photoUri
                  ? 'CHANGE PHOTO'
                  : 'ADD PHOTO'}
            </Text>
          </Pressable>

          <TextInput
            value={note}
            onChangeText={(value) => {
              setNote(value);
              setSaved(false);
            }}
            placeholder="Milo had lots of energy today..."
            placeholderTextColor={
              COLORS.muted
            }
            multiline
            maxLength={240}
            textAlignVertical="top"
            style={styles.noteInput}
          />

          <Text
            style={styles.characterCount}
          >
            {note.length}/240
          </Text>

          <Pressable
            onPress={() => {
              void handleSaveMemory();
            }}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveButton,
              pressed &&
                styles.pressed,
              saving &&
                styles.disabled,
            ]}
          >
            <Text
              style={styles.saveButtonText}
            >
              {saving
                ? 'SAVING...'
                : saved
                  ? 'MEMORY SAVED ✓'
                  : 'SAVE WALK MEMORY'}
            </Text>

            <Text
              style={styles.saveArrow}
            >
              ✓
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
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
    badge: {
      alignSelf:
        'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius:
        RADIUS.pill,
      backgroundColor:
        COLORS.greenSoft,
    },
    badgeText: {
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 1,
      color: COLORS.green,
    },
    title: {
      marginTop: SPACING.lg,
      fontSize: 40,
      lineHeight: 43,
      fontWeight: '900',
      color: COLORS.ink,
    },
    description: {
      marginTop: SPACING.md,
      fontSize: 14,
      color: COLORS.muted,
    },
    image: {
      width: '100%',
      height: 230,
      marginTop: SPACING.xl,
      borderRadius:
        RADIUS.lg,
    },
    heroCard: {
      alignItems: 'center',
      marginTop: SPACING.lg,
      padding: SPACING.xl,
      borderRadius:
        RADIUS.lg,
      backgroundColor:
        COLORS.ink,
    },
    heroLabel: {
      fontSize: 8,
      fontWeight: '900',
      letterSpacing: 1,
      color: COLORS.yellow,
    },
    heroValue: {
      marginTop: SPACING.sm,
      fontSize: 38,
      fontWeight: '900',
      color: COLORS.white,
    },
    heroHelper: {
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
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.lg,
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
    detailsCard: {
      marginTop: SPACING.md,
      padding: SPACING.lg,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.lg,
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
      marginVertical:
        SPACING.md,
      backgroundColor:
        COLORS.border,
    },
    memoryCard: {
      marginTop: SPACING.md,
      padding: SPACING.lg,
      borderRadius:
        RADIUS.lg,
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
      fontSize: 20,
      fontWeight: '900',
      color: COLORS.ink,
    },
    memoryText: {
      marginTop: SPACING.sm,
      fontSize: 12,
      lineHeight: 18,
      color: COLORS.muted,
    },
    memoryImage: {
      width: '100%',
      height: 210,
      marginTop: SPACING.lg,
      borderRadius:
        RADIUS.lg,
    },
    photoPlaceholder: {
      height: 160,
      alignItems: 'center',
      justifyContent:
        'center',
      marginTop: SPACING.lg,
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.lg,
      backgroundColor:
        COLORS.surface,
    },
    photoPlaceholderIcon: {
      fontSize: 34,
    },
    photoPlaceholderText: {
      marginTop: SPACING.sm,
      fontSize: 11,
      fontWeight: '800',
      color: COLORS.muted,
    },
    photoButton: {
      alignItems: 'center',
      marginTop: SPACING.sm,
      paddingVertical:
        SPACING.md,
      borderWidth: 1,
      borderColor:
        COLORS.coral,
      borderRadius:
        RADIUS.lg,
      backgroundColor:
        COLORS.surface,
    },
    photoButtonText: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1,
      color: COLORS.coral,
    },
    noteInput: {
      minHeight: 120,
      marginTop: SPACING.md,
      padding: SPACING.md,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.lg,
      backgroundColor:
        COLORS.surface,
      fontSize: 14,
      lineHeight: 20,
      color: COLORS.ink,
    },
    characterCount: {
      marginTop: SPACING.xs,
      textAlign: 'right',
      fontSize: 9,
      color: COLORS.muted,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      marginTop: SPACING.md,
      paddingHorizontal:
        SPACING.lg,
      paddingVertical: 17,
      borderRadius:
        RADIUS.lg,
      backgroundColor:
        COLORS.coral,
    },
    saveButtonText: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 1,
      color: COLORS.white,
    },
    saveArrow: {
      fontSize: 18,
      fontWeight: '900',
      color: COLORS.white,
    },
    pressed: {
      opacity: 0.72,
    },
    disabled: {
      opacity: 0.55,
    },
  });
