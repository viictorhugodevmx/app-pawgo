import { Redirect } from 'expo-router';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../features/auth/AuthContext';
import { COLORS } from '../theme/colors';

export default function IndexScreen() {
  const {
    session,
    sessionReady,
  } = useAuth();

  if (!sessionReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color={COLORS.coral}
        />

        <Text style={styles.loadingText}>
          OPENING PAWGO...
        </Text>
      </View>
    );
  }

  if (!session) {
    return (
      <Redirect href="/login" />
    );
  }

  return (
    <Redirect
      href={
        session.user.role === 'prowner'
          ? '/prowner'
          : '/prunner'
      }
    />
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: COLORS.muted,
  },
});
