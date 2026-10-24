import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '../features/auth/AuthContext';
import { COLORS } from '../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../theme/tokens';

export function HomeQuickLinks() {
  const { session } = useAuth();

  if (!session) {
    return null;
  }

  function handleOpenHistory() {
    if (!session) {
      return;
    }

    router.push(
      session.user.role === 'prunner'
        ? '/prunner/history'
        : '/prowner/history',
    );
  }

  function handleOpenProfile() {
    router.push('/profile');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        YOUR PAWGO
      </Text>

      <View style={styles.row}>
        <Pressable
          onPress={handleOpenHistory}
          style={({ pressed }) => [
            styles.card,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.icon}>
            🐾
          </Text>

          <Text style={styles.title}>
            Walk history
          </Text>

          <Text style={styles.helper}>
            Completed walks
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>
        </Pressable>

        <Pressable
          onPress={handleOpenProfile}
          style={({ pressed }) => [
            styles.card,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.icon}>
            👤
          </Text>

          <Text style={styles.title}>
            Profile
          </Text>

          <Text style={styles.helper}>
            Activity summary
          </Text>

          <Text style={styles.arrow}>
            →
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xl,
  },
  label: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.muted,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  card: {
    flex: 1,
    minHeight: 145,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },
  icon: {
    fontSize: 24,
  },
  title: {
    marginTop: SPACING.md,
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.ink,
  },
  helper: {
    marginTop: SPACING.xs,
    fontSize: 10,
    color: COLORS.muted,
  },
  arrow: {
    marginTop: SPACING.md,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.coral,
  },
  pressed: {
    opacity: 0.65,
  },
});
