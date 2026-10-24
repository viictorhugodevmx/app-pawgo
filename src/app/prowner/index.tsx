import { HomeQuickLinks } from '../../components/HomeQuickLinks';
import { router } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DemoRoleSwitcher } from '../../components/DemoRoleSwitcher';
import { LogoutButton } from '../../components/LogoutButton';
import { useAuth } from '../../features/auth/AuthContext';
import { DEMO_DOG } from '../../features/dogs/mockDog';
import { usePrownerWalks } from '../../features/walks/usePrownerWalks';
import { getDemoUsers } from '../../services/authService';
import { COLORS } from '../../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../../theme/tokens';

export default function PrownerHomeScreen() {
  const { session } = useAuth();

  const {
    walks,
    loading,
  } = usePrownerWalks(
    session?.user.role === 'prowner'
      ? session.user.id
      : undefined,
  );

  const activeWalk =
    walks.find(
      (walk) =>
        (
          walk.status === 'accepted' ||
          walk.status === 'in_progress'
        ) &&
        Boolean(walk.prunnerId),
    ) ??
    walks.find(
      (walk) =>
        walk.status === 'requested',
    ) ??
    walks.find(
      (walk) =>
        walk.status === 'accepted' ||
        walk.status === 'in_progress',
    ) ??
    null;

  const assignedPrunner =
    activeWalk?.prunnerId
      ? getDemoUsers().find(
          (user) =>
            user.id ===
            activeWalk.prunnerId,
        ) ?? null
      : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>
              PAWGO
            </Text>

            <Text style={styles.greeting}>
              Hi, {session?.user.name ?? 'Prowner'}.
            </Text>
          </View>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {session?.user.name
                ?.charAt(0)
                .toUpperCase() ?? 'P'}
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Image
            source={{
              uri: DEMO_DOG.imageUrl,
            }}
            style={styles.heroImage}
          />

          <View style={styles.heroOverlay}>
            <View style={styles.dogBadge}>
              <Text style={styles.dogBadgeText}>
                READY FOR A WALK
              </Text>
            </View>

            <Text style={styles.dogName}>
              {DEMO_DOG.name}
            </Text>

            <Text style={styles.dogMeta}>
              {DEMO_DOG.breed} · {DEMO_DOG.ageYears} YEARS
            </Text>
          </View>
        </View>

        {!loading &&
          activeWalk && (
            <View style={styles.activeWalkCard}>
              <Text style={styles.activeLabel}>
                CURRENT WALK
              </Text>

              <Text style={styles.activeTitle}>
                {activeWalk.status ===
                'requested'
                  ? 'Finding a Prunner...'
                  : `${assignedPrunner?.name ?? 'Prunner'} is assigned ✓`}
              </Text>

              <Text style={styles.activeText}>
                {activeWalk.status ===
                'requested'
                  ? 'Your request is live and waiting to be accepted.'
                  : `${DEMO_DOG.name}'s ${activeWalk.durationMinutes}-minute walk is ready to begin.`}
              </Text>

              <Pressable
                onPress={() => {
                  router.push({
                    pathname:
                      '/prowner/tracking',
                    params: {
                      walkId:
                        activeWalk.id,
                    },
                  });
                }}
                style={({ pressed }) => [
                  styles.statusButton,
                  pressed &&
                    styles.pressed,
                ]}
              >
                <Text style={styles.statusButtonText}>
                  VIEW WALK STATUS
                </Text>

                <Text style={styles.statusArrow}>
                  →
                </Text>
              </Pressable>
            </View>
          )}

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>
            TODAY / DOG WALK
          </Text>

          <Text style={styles.title}>
            Ready for
            {'\n'}
            some fresh air?
          </Text>

          <Text style={styles.description}>
            Request a trusted Prunner and keep track of Milo's walk from start to finish.
          </Text>
        </View>

        <Pressable
          onPress={() =>
            router.push('/prowner/request')
          }
          style={({ pressed }) => [
            styles.primaryButton,
            pressed &&
              styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            REQUEST A WALK
          </Text>

          <Text style={styles.primaryButtonArrow}>
            →
          </Text>
        </Pressable>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>
              ENERGY
            </Text>

            <Text style={styles.infoValue}>
              {DEMO_DOG.energyLevel.toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>
              WEIGHT
            </Text>

            <Text style={styles.infoValue}>
              {DEMO_DOG.weightKg} KG
            </Text>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteLabel}>
            ABOUT MILO
          </Text>

          <Text style={styles.noteText}>
            {DEMO_DOG.notes}
          </Text>
        </View>

        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>
            DEMO CONTROLS
          </Text>

          <DemoRoleSwitcher
            targetRole="prunner"
          />

          <LogoutButton />
        </View>
              <HomeQuickLinks />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: COLORS.coral,
  },
  greeting: {
    marginTop: SPACING.xs,
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.ink,
  },
  avatar: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.greenSoft,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.green,
  },
  hero: {
    minHeight: 360,
    marginTop: SPACING.lg,
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surfaceSoft,
  },
  heroImage: {
    width: '100%',
    height: 360,
  },
  heroOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.lg,
    backgroundColor: 'rgba(45, 42, 38, 0.52)',
  },
  dogBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.yellow,
  },
  dogBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: COLORS.ink,
  },
  dogName: {
    marginTop: SPACING.sm,
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.white,
  },
  dogMeta: {
    marginTop: SPACING.xs,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.white,
  },
  activeWalkCard: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.yellowSoft,
  },
  activeLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.coral,
  },
  activeTitle: {
    marginTop: SPACING.sm,
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.ink,
  },
  activeText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingVertical: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusButtonText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.ink,
  },
  statusArrow: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
  },
  intro: {
    marginTop: SPACING.xl,
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
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 18,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.coral,
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.1,
    color: COLORS.white,
  },
  primaryButtonArrow: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  infoCard: {
    flex: 1,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.muted,
  },
  infoValue: {
    marginTop: SPACING.sm,
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.ink,
  },
  noteCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.greenSoft,
  },
  noteLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.green,
  },
  noteText: {
    marginTop: SPACING.sm,
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.ink,
  },
  demoSection: {
    marginTop: SPACING.xl,
  },
  demoLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COLORS.muted,
  },
  pressed: {
    opacity: 0.7,
  },
});
