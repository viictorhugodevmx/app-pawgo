import { router } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../features/auth/AuthContext';
import { getDemoUsers } from '../services/authService';
import { COLORS } from '../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../theme/tokens';
import type { User } from '../types/auth';

const DEMO_USERS = getDemoUsers();

export default function LoginScreen() {
  const {
    authenticating,
    authError,
    signInDemo,
  } = useAuth();

  async function handleLogin(
    user: User,
  ) {
    const success =
      await signInDemo(user.email);

    if (!success) {
      return;
    }

    router.replace(
      user.role === 'prowner'
        ? '/prowner'
        : '/prunner',
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>
              PG
            </Text>
          </View>

          <Text style={styles.brand}>
            PAWGO
          </Text>

          <Text style={styles.eyebrow}>
            DOG WALKING / DEMO
          </Text>

          <Text style={styles.title}>
            Walks made
            {'\n'}
            simple.
          </Text>

          <Text style={styles.description}>
            Choose a demo role to explore the full PawGo experience.
          </Text>
        </View>

        <View style={styles.cards}>
          {DEMO_USERS.map((user) => (
            <Pressable
              key={user.id}
              disabled={authenticating}
              onPress={() => {
                void handleLogin(user);
              }}
              style={({ pressed }) => [
                styles.roleCard,
                user.role === 'prunner' &&
                  styles.prunnerCard,
                pressed &&
                  styles.roleCardPressed,
              ]}
            >
              <View>
                <Text style={styles.roleLabel}>
                  {user.role === 'prowner'
                    ? 'PROWNER'
                    : 'PRUNNER'}
                </Text>

                <Text style={styles.roleName}>
                  {user.name}
                </Text>

                <Text style={styles.roleEmail}>
                  {user.email}
                </Text>
              </View>

              <Text style={styles.arrow}>
                →
              </Text>
            </Pressable>
          ))}
        </View>

        {authError && (
          <Text style={styles.error}>
            {authError}
          </Text>
        )}

        {authenticating && (
          <View style={styles.loading}>
            <ActivityIndicator
              color={COLORS.coral}
            />

            <Text style={styles.loadingText}>
              OPENING DEMO SESSION...
            </Text>
          </View>
        )}

        <Text style={styles.footer}>
          No real account required.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  brandMark: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.coral,
  },
  brandMarkText: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.white,
  },
  brand: {
    marginTop: SPACING.md,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.4,
    color: COLORS.ink,
  },
  eyebrow: {
    marginTop: SPACING.xl,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: COLORS.green,
  },
  title: {
    marginTop: SPACING.sm,
    fontSize: 48,
    lineHeight: 51,
    fontWeight: '900',
    letterSpacing: -2,
    color: COLORS.ink,
  },
  description: {
    marginTop: SPACING.md,
    maxWidth: 320,
    fontSize: 15,
    lineHeight: 22,
    color: COLORS.muted,
  },
  cards: {
    gap: SPACING.md,
  },
  roleCard: {
    minHeight: 122,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.coral,
  },
  prunnerCard: {
    backgroundColor: COLORS.green,
  },
  roleCardPressed: {
    opacity: 0.72,
  },
  roleLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
    color: COLORS.white,
  },
  roleName: {
    marginTop: SPACING.sm,
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.white,
  },
  roleEmail: {
    marginTop: SPACING.xs,
    fontSize: 12,
    color: COLORS.white,
  },
  arrow: {
    fontSize: 30,
    fontWeight: '900',
    color: COLORS.white,
  },
  error: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.danger,
    textAlign: 'center',
  },
  loading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  loadingText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.muted,
  },
  footer: {
    fontSize: 11,
    color: COLORS.muted,
    textAlign: 'center',
  },
});
