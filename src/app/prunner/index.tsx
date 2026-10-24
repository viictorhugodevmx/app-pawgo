import { HomeQuickLinks } from '../../components/HomeQuickLinks';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DemoRoleSwitcher } from '../../components/DemoRoleSwitcher';
import { LogoutButton } from '../../components/LogoutButton';
import { useAuth } from '../../features/auth/AuthContext';
import { AssignedWalkCard } from '../../features/walks/AssignedWalkCard';
import { AvailableWalkCard } from '../../features/walks/AvailableWalkCard';
import { useAssignedWalks } from '../../features/walks/useAssignedWalks';
import { useAvailableWalks } from '../../features/walks/useAvailableWalks';
import { COLORS } from '../../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../../theme/tokens';

export default function PrunnerHomeScreen() {
  const { session } = useAuth();

  const {
    walks,
    loading,
    error,
  } = useAvailableWalks();

  const {
    walks: assignedWalks,
    loading: assignedLoading,
  } = useAssignedWalks(
    session?.user.role === 'prunner'
      ? session.user.id
      : undefined,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.brand}>
          PAWGO / PRUNNER
        </Text>

        <Text style={styles.title}>
          Hi, {session?.user.name ?? 'Prunner'}.
        </Text>

        <Text style={styles.description}>
          Find nearby walks and help a dog get some fresh air.
        </Text>

        <View style={styles.assignedCard}>
          <Text style={styles.assignedLabel}>
            ASSIGNED TO YOU
          </Text>

          <Text style={styles.assignedValue}>
            {assignedLoading
              ? '...'
              : assignedWalks.length}
          </Text>

          <Text style={styles.assignedText}>
            {assignedWalks.length === 1
              ? 'accepted walk'
              : 'accepted walks'}
          </Text>
        </View>

        {!assignedLoading &&
          assignedWalks.length > 0 && (
            <View style={styles.assignedSection}>
              <Text style={styles.sectionLabel}>
                YOUR ASSIGNED WALKS
              </Text>

              {assignedWalks.map((walk) => (
                <AssignedWalkCard
                  key={walk.id}
                  walk={walk}
                />
              ))}
            </View>
          )}

        <View style={styles.availabilityCard}>
          <Text style={styles.availabilityLabel}>
            AVAILABLE NOW
          </Text>

          {loading ? (
            <ActivityIndicator
              size="small"
              color={COLORS.green}
              style={styles.loader}
            />
          ) : error ? (
            <Text style={styles.errorText}>
              {error}
            </Text>
          ) : (
            <>
              <Text style={styles.availabilityValue}>
                {walks.length}
              </Text>

              <Text style={styles.availabilityText}>
                {walks.length === 1
                  ? 'walk request nearby'
                  : 'walk requests nearby'}
              </Text>
            </>
          )}
        </View>

        {!loading &&
          !error &&
          walks.length > 0 && (
            <View style={styles.walksSection}>
              <Text style={styles.sectionLabel}>
                NEARBY REQUESTS
              </Text>

              {walks.map((walk) => (
                <AvailableWalkCard
                  key={walk.id}
                  walk={walk}
                />
              ))}
            </View>
          )}

        {!loading &&
          !error &&
          walks.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEyebrow}>
                ALL QUIET
              </Text>

              <Text style={styles.emptyTitle}>
                No walks right now.
              </Text>

              <Text style={styles.emptyText}>
                New Prowner requests will appear here automatically.
              </Text>
            </View>
          )}

        <View style={styles.demoSection}>
          <Text style={styles.demoLabel}>
            DEMO CONTROLS
          </Text>

          <DemoRoleSwitcher
            targetRole="prowner"
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
  brand: {
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
  assignedCard: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.yellowSoft,
  },
  assignedLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    color: COLORS.ink,
  },
  assignedValue: {
    marginTop: SPACING.sm,
    fontSize: 38,
    fontWeight: '900',
    color: COLORS.ink,
  },
  assignedText: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.muted,
  },
  assignedSection: {
    marginTop: SPACING.xl,
  },
  availabilityCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.greenSoft,
  },
  availabilityLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    color: COLORS.green,
  },
  availabilityValue: {
    marginTop: SPACING.sm,
    fontSize: 54,
    lineHeight: 58,
    fontWeight: '900',
    color: COLORS.ink,
  },
  availabilityText: {
    marginTop: SPACING.xs,
    fontSize: 14,
    color: COLORS.muted,
  },
  loader: {
    alignSelf: 'flex-start',
    marginTop: SPACING.lg,
  },
  errorText: {
    marginTop: SPACING.md,
    fontSize: 13,
    color: COLORS.danger,
  },
  walksSection: {
    marginTop: SPACING.xl,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: COLORS.ink,
  },
  emptyCard: {
    marginTop: SPACING.md,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  emptyEyebrow: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.coral,
  },
  emptyTitle: {
    marginTop: SPACING.sm,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.ink,
  },
  emptyText: {
    marginTop: SPACING.sm,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
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
});
