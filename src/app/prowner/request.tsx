import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../features/auth/AuthContext';
import { DEMO_DOG } from '../../features/dogs/mockDog';
import { createWalkRequest } from '../../features/walks/walkRepository';
import {
  getCurrentLocationPoint,
  requestForegroundLocationPermission,
} from '../../services/locationService';
import { COLORS } from '../../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../../theme/tokens';
import type {
  LocationPoint,
  WalkDuration,
} from '../../types/walk';

const DURATIONS: WalkDuration[] = [
  30,
  45,
  60,
];

export default function RequestWalkScreen() {
  const { session } = useAuth();

  const [
    durationMinutes,
    setDurationMinutes,
  ] = useState<WalkDuration>(30);

  const [
    instructions,
    setInstructions,
  ] = useState('');

  const [
    locationPermissionGranted,
    setLocationPermissionGranted,
  ] = useState(false);

  const [
    pickupLocation,
    setPickupLocation,
  ] = useState<LocationPoint | null>(null);

  const [
    locationBusy,
    setLocationBusy,
  ] = useState(false);

  const [
    creatingRequest,
    setCreatingRequest,
  ] = useState(false);

  async function handleEnableLocation() {
    try {
      setLocationBusy(true);

      const granted =
        await requestForegroundLocationPermission();

      setLocationPermissionGranted(granted);

      if (!granted) {
        Alert.alert(
          'Location permission needed',
          'PawGo needs your location to create the pickup point for the walk.',
        );

        return;
      }

      const point =
        await getCurrentLocationPoint();

      setPickupLocation(point);
    } catch {
      Alert.alert(
        'Location error',
        'We could not get your current location. Please try again.',
      );
    } finally {
      setLocationBusy(false);
    }
  }

  async function handleRefreshLocation() {
    try {
      setLocationBusy(true);

      const point =
        await getCurrentLocationPoint();

      setPickupLocation(point);
    } catch {
      Alert.alert(
        'Location error',
        'We could not refresh your current location.',
      );
    } finally {
      setLocationBusy(false);
    }
  }

  async function handleCreateRequest() {
    if (!session) {
      Alert.alert(
        'Session required',
        'Please sign in again before requesting a walk.',
      );

      return;
    }

    if (!pickupLocation) {
      Alert.alert(
        'Location required',
        'Capture your pickup location before requesting a walk.',
      );

      return;
    }

    try {
      setCreatingRequest(true);

      const walk =
        await createWalkRequest({
          dogId: DEMO_DOG.id,
          prownerId: session.user.id,
          durationMinutes,
          instructions,
          pickupLocation,
        });

      router.replace({
        pathname: '/prowner/tracking',
        params: {
          walkId: walk.id,
        },
      });
    } catch {
      Alert.alert(
        'Request error',
        'We could not create the walk request. Please try again.',
      );
    } finally {
      setCreatingRequest(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>
            PROWNER / REQUEST
          </Text>

          <Text style={styles.title}>
            Let's get Milo
            {'\n'}
            outside.
          </Text>

          <Text style={styles.description}>
            Choose the walk duration and leave any instructions your Prunner should know.
          </Text>

          <View style={styles.dogCard}>
            <Image
              source={{
                uri: DEMO_DOG.imageUrl,
              }}
              style={styles.dogImage}
            />

            <View style={styles.dogContent}>
              <Text style={styles.cardLabel}>
                WALKING
              </Text>

              <Text style={styles.dogName}>
                {DEMO_DOG.name}
              </Text>

              <Text style={styles.dogMeta}>
                {DEMO_DOG.breed}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              DURATION
            </Text>

            <View style={styles.durationRow}>
              {DURATIONS.map((duration) => {
                const selected =
                  durationMinutes === duration;

                return (
                  <Pressable
                    key={duration}
                    onPress={() =>
                      setDurationMinutes(
                        duration,
                      )
                    }
                    style={({ pressed }) => [
                      styles.durationButton,
                      selected &&
                        styles.durationButtonSelected,
                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.durationValue,
                        selected &&
                          styles.durationValueSelected,
                      ]}
                    >
                      {duration}
                    </Text>

                    <Text
                      style={[
                        styles.durationUnit,
                        selected &&
                          styles.durationUnitSelected,
                      ]}
                    >
                      MIN
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              INSTRUCTIONS
            </Text>

            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              placeholder="Anything the Prunner should know about Milo?"
              placeholderTextColor={COLORS.muted}
              multiline
              maxLength={240}
              textAlignVertical="top"
              style={styles.input}
            />

            <Text style={styles.counter}>
              {instructions.length}/240
            </Text>
          </View>

          <View style={styles.locationCard}>
            <View style={styles.locationContent}>
              <Text style={styles.locationLabel}>
                PICKUP LOCATION
              </Text>

              <Text style={styles.locationTitle}>
                {pickupLocation
                  ? 'Pickup location ready'
                  : locationPermissionGranted
                    ? 'Location enabled'
                    : 'Current location'}
              </Text>

              <Text style={styles.locationText}>
                {pickupLocation
                  ? 'Your current coordinates are ready for the walk request.'
                  : locationPermissionGranted
                    ? 'Permission granted. Capture your current pickup point.'
                    : 'Allow PawGo to use your location while the app is open.'}
              </Text>

              {pickupLocation && (
                <Text style={styles.coordinates}>
                  {pickupLocation.latitude.toFixed(
                    5,
                  )}
                  {' · '}
                  {pickupLocation.longitude.toFixed(
                    5,
                  )}
                </Text>
              )}
            </View>

            <View
              style={[
                styles.locationIcon,
                pickupLocation &&
                  styles.locationIconReady,
              ]}
            >
              <Text style={styles.locationIconText}>
                {pickupLocation ? '✓' : '◎'}
              </Text>
            </View>
          </View>

          <Pressable
            disabled={locationBusy}
            onPress={() => {
              void (
                locationPermissionGranted
                  ? handleRefreshLocation()
                  : handleEnableLocation()
              );
            }}
            style={({ pressed }) => [
              styles.locationButton,
              pressed && styles.pressed,
              locationBusy && styles.disabled,
            ]}
          >
            <Text style={styles.locationButtonText}>
              {locationBusy
                ? 'GETTING LOCATION...'
                : pickupLocation
                  ? 'REFRESH LOCATION'
                  : locationPermissionGranted
                    ? 'CAPTURE CURRENT LOCATION'
                    : 'ENABLE & GET LOCATION'}
            </Text>
          </Pressable>

          <Pressable
            disabled={
              !pickupLocation ||
              creatingRequest
            }
            onPress={() => {
              void handleCreateRequest();
            }}
            style={({ pressed }) => [
              styles.submitButton,
              pickupLocation
                ? styles.submitButtonReady
                : styles.submitButtonDisabled,
              pressed &&
                pickupLocation &&
                styles.pressed,
              creatingRequest &&
                styles.disabled,
            ]}
          >
            <Text
              style={[
                styles.submitText,
                pickupLocation &&
                  styles.submitTextReady,
              ]}
            >
              {creatingRequest
                ? 'CREATING REQUEST...'
                : pickupLocation
                  ? 'REQUEST WALK'
                  : 'WAITING FOR LOCATION'}
            </Text>

            <Text
              style={[
                styles.submitArrow,
                pickupLocation &&
                  styles.submitTextReady,
              ]}
            >
              →
            </Text>
          </Pressable>

          <Text style={styles.helper}>
            {pickupLocation
              ? 'Your request will be saved locally for the Prunner demo flow.'
              : 'A pickup location is required before requesting a walk.'}
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: COLORS.green,
  },
  title: {
    marginTop: SPACING.sm,
    fontSize: 40,
    lineHeight: 43,
    fontWeight: '900',
    letterSpacing: -1.4,
    color: COLORS.ink,
  },
  description: {
    marginTop: SPACING.md,
    fontSize: 15,
    lineHeight: 22,
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
    backgroundColor: COLORS.surface,
  },
  dogImage: {
    width: 86,
    height: 86,
    borderRadius: RADIUS.md,
  },
  dogContent: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  cardLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.coral,
  },
  dogName: {
    marginTop: SPACING.xs,
    fontSize: 23,
    fontWeight: '900',
    color: COLORS.ink,
  },
  dogMeta: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.muted,
  },
  section: {
    marginTop: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COLORS.ink,
  },
  durationRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  durationButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 17,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  durationButtonSelected: {
    borderColor: COLORS.coral,
    backgroundColor: COLORS.coral,
  },
  durationValue: {
    fontSize: 23,
    fontWeight: '900',
    color: COLORS.ink,
  },
  durationValueSelected: {
    color: COLORS.white,
  },
  durationUnit: {
    marginTop: 2,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: COLORS.muted,
  },
  durationUnitSelected: {
    color: COLORS.white,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.5,
  },
  input: {
    minHeight: 130,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.ink,
  },
  counter: {
    marginTop: SPACING.xs,
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'right',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.greenSoft,
  },
  locationContent: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  locationLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.green,
  },
  locationTitle: {
    marginTop: SPACING.xs,
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  locationText: {
    marginTop: SPACING.xs,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.muted,
  },
  coordinates: {
    marginTop: SPACING.sm,
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.green,
  },
  locationIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.green,
  },
  locationIconReady: {
    backgroundColor: COLORS.success,
  },
  locationIconText: {
    fontSize: 23,
    fontWeight: '900',
    color: COLORS.white,
  },
  locationButton: {
    alignItems: 'center',
    marginTop: SPACING.md,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: COLORS.green,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  locationButtonText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.green,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 18,
    borderRadius: RADIUS.lg,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  submitButtonReady: {
    backgroundColor: COLORS.coral,
  },
  submitText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.muted,
  },
  submitTextReady: {
    color: COLORS.white,
  },
  submitArrow: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.muted,
  },
  helper: {
    marginTop: SPACING.sm,
    fontSize: 10,
    color: COLORS.muted,
    textAlign: 'center',
  },
});
