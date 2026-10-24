import { router } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { useAuth } from '../features/auth/AuthContext';
import { COLORS } from '../theme/colors';
import {
  RADIUS,
  SPACING,
} from '../theme/tokens';
import type { UserRole } from '../types/auth';

type DemoRoleSwitcherProps = {
  targetRole: UserRole;
};

export function DemoRoleSwitcher({
  targetRole,
}: DemoRoleSwitcherProps) {
  const {
    authenticating,
    switchDemoRole,
  } = useAuth();

  async function handleSwitch() {
    const success =
      await switchDemoRole(
        targetRole,
      );

    if (!success) {
      return;
    }

    router.replace(
      targetRole === 'prowner'
        ? '/prowner'
        : '/prunner',
    );
  }

  return (
    <Pressable
      disabled={authenticating}
      onPress={() => {
        void handleSwitch();
      }}
      style={({ pressed }) => [
        styles.button,
        pressed &&
          styles.buttonPressed,
      ]}
    >
      <Text style={styles.text}>
        {authenticating
          ? 'SWITCHING...'
          : targetRole === 'prowner'
            ? 'SWITCH TO PROWNER'
            : 'SWITCH TO PRUNNER'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  buttonPressed: {
    opacity: 0.65,
  },
  text: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.green,
    textAlign: 'center',
  },
});
