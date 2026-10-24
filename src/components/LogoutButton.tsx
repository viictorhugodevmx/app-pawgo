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

export function LogoutButton() {
  const {
    authenticating,
    signOut,
  } = useAuth();

  async function handleLogout() {
    await signOut();

    router.replace('/login');
  }

  return (
    <Pressable
      disabled={authenticating}
      onPress={() => {
        void handleLogout();
      }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={styles.text}>
        LOG OUT DEMO
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.coral,
    borderRadius: RADIUS.md,
  },
  buttonPressed: {
    opacity: 0.6,
  },
  text: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.coral,
    textAlign: 'center',
  },
});
