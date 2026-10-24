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
import { router, useLocalSearchParams } from 'expo-router';
import {
  useEffect,
  useState,
} from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../../features/auth/AuthContext';
import { DEMO_DOG } from '../../../features/dogs/mockDog';
import {
  acceptWalkRequest,
  getWalkRequestById,
} from '../../../features/walks/walkRepository';
import { COLORS } from '../../../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../../../theme/tokens';
import type { WalkRequest } from '../../../types/walk';

export default function PrunnerWalkDetailScreen() {
  const { session } = useAuth();

  const { id } =
    useLocalSearchParams<{
      id?: string;
    }>();

  const [walk, setWalk] =
    useState<WalkRequest | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [accepting, setAccepting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadWalk() {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          throw new Error(
            'Walk id is missing.',
          );
        }

        const storedWalk =
          await getWalkRequestById(id);

        if (!storedWalk) {
          throw new Error(
            'Walk request not found.',
          );
        }

        if (mounted) {
          setWalk(storedWalk);
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

    return () => {
      mounted = false;
    };
  }, [id]);

  async function handleAcceptWalk() {
    if (!walk || accepting) {
      return;
    }

    if (walk.status !== 'requested') {
      return;
    }

    try {
      setAccepting(true);

      if (
        !session ||
        session.user.role !== 'prunner'
      ) {
        throw new Error(
          'Prunner session required.',
        );
      }

      const updatedWalk =
        await acceptWalkRequest(
          walk.id,
          session.user.id,
        );

      setWalk(updatedWalk);

      router.back();
    } catch {
      Alert.alert(
        'Accept walk error',
        'We could not accept this walk. Please try again.',
      );
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator
          size="large"
          color={COLORS.green}
        />

        <Text style={styles.loadingText}>
          LOADING WALK...
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

  const isAccepted =
    walk.status === 'accepted';

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>
          PRUNNER / WALK REQUEST
        </Text>

        <Text style={styles.title}>
          Meet Milo.
        </Text>

        <Text style={styles.description}>
          {isAccepted
            ? 'This walk is now accepted and ready for assignment.'
            : 'Review the walk details before accepting the request.'}
        </Text>

        <Image
          source={{
            uri: DEMO_DOG.imageUrl,
          }}
          style={styles.heroImage}
        />

        <View style={styles.dogHeader}>
          <View>
            <Text style={styles.dogName}>
              {DEMO_DOG.name}
            </Text>

            <Text style={styles.dogBreed}>
              {DEMO_DOG.breed}
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

        {isAccepted && (
          <View style={styles.acceptedCard}>
            <View style={styles.acceptedIcon}>
              <Text style={styles.acceptedIconText}>
                ✓
              </Text>
            </View>

            <View style={styles.acceptedContent}>
              <Text style={styles.acceptedLabel}>
                WALK ACCEPTED
              </Text>

              <Text style={styles.acceptedTitle}>
                Milo is yours!
              </Text>

              <Text style={styles.acceptedText}>
                This request is no longer available to other Prunners.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              STATUS
            </Text>

            <Text style={styles.detailValue}>
              {walk.status.toUpperCase()}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              ENERGY
            </Text>

            <Text style={styles.detailValue}>
              {DEMO_DOG.energyLevel.toUpperCase()}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              WEIGHT
            </Text>

            <Text style={styles.detailValue}>
              {DEMO_DOG.weightKg} KG
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>
              PICKUP
            </Text>

            <Text style={styles.detailValue}>
              LOCATION READY ✓
            </Text>
          </View>
        </View>

        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>
            OWNER INSTRUCTIONS
          </Text>

          <Text style={styles.notesText}>
            {walk.instructions ||
              'No special instructions for this walk.'}
          </Text>
        </View>

        <View style={styles.locationCard}>
          <Text style={styles.locationLabel}>
            PICKUP COORDINATES
          </Text>

          <Text style={styles.locationValue}>
            {walk.pickupLocation.latitude.toFixed(5)}
            {' · '}
            {walk.pickupLocation.longitude.toFixed(5)}
          </Text>

          <Text style={styles.locationHelper}>
            PawGo will use this pickup point when the walk begins.
          </Text>
        </View>

        {isAccepted ? (
          <View style={styles.acceptButtonDone}>
            <Text style={styles.acceptButtonText}>
              WALK ACCEPTED ✓
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              void handleAcceptWalk();
            }}
            style={({ pressed }) => [
              styles.acceptButton,
              pressed &&
                styles.pressed,
              accepting &&
                styles.accepting,
            ]}
          >
            <Text style={styles.acceptButtonText}>
              {accepting
                ? 'ACCEPTING...'
                : 'ACCEPT WALK'}
            </Text>

            <Text style={styles.acceptButtonArrow}>
              →
            </Text>
          </Pressable>
        )}

        <Text style={styles.helper}>
          {isAccepted
            ? 'Next we assign Diego as the Prunner for this walk.'
            : 'Accepting removes this request from the available walks list.'}
        </Text>
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
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COLORS.green,
  },
  title: {
    marginTop: SPACING.sm,
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.ink,
  },
  description: {
    marginTop: SPACING.sm,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
  },
  heroImage: {
    width: '100%',
    height: 300,
    marginTop: SPACING.xl,
    borderRadius: RADIUS.lg,
  },
  dogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  dogName: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.ink,
  },
  dogBreed: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.muted,
  },
  durationBadge: {
    minWidth: 66,
    alignItems: 'center',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.yellowSoft,
  },
  durationValue: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink,
  },
  durationUnit: {
    fontSize: 7,
    fontWeight: '900',
    color: COLORS.muted,
  },
  acceptedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.greenSoft,
  },
  acceptedIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.success,
  },
  acceptedIconText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
  },
  acceptedContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  acceptedLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.green,
  },
  acceptedTitle: {
    marginTop: 3,
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.ink,
  },
  acceptedText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.muted,
  },
  detailsCard: {
    marginTop: SPACING.lg,
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
  notesCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.greenSoft,
  },
  notesLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.green,
  },
  notesText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.ink,
  },
  locationCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceSoft,
  },
  locationLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.coral,
  },
  locationValue: {
    marginTop: SPACING.sm,
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.ink,
  },
  locationHelper: {
    marginTop: SPACING.sm,
    fontSize: 11,
    lineHeight: 17,
    color: COLORS.muted,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 18,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.green,
  },
  acceptButtonDone: {
    alignItems: 'center',
    marginTop: SPACING.lg,
    paddingVertical: 18,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.success,
  },
  acceptButtonText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.white,
  },
  acceptButtonArrow: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.white,
  },
  pressed: {
    opacity: 0.7,
  },
  accepting: {
    opacity: 0.6,
  },
  helper: {
    marginTop: SPACING.sm,
    fontSize: 10,
    textAlign: 'center',
    color: COLORS.muted,
  },
});
