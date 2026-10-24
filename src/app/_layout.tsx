import { Stack } from 'expo-router';

import { AuthProvider } from '../features/auth/AuthContext';
import { COLORS } from '../theme/colors';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor:
              COLORS.background,
          },
          headerTintColor: COLORS.ink,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor:
              COLORS.background,
          },
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="login"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="prowner/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="prunner/index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="prowner/request"
          options={{
            title: 'Request a walk',
          }}
        />

        <Stack.Screen
          name="prowner/tracking"
          options={{
            title: 'Live walk',
          }}
        />

        <Stack.Screen
          name="prunner/walk/[id]"
          options={{
            title: 'Walk request',
          }}
        />

        <Stack.Screen
          name="prunner/active"
          options={{
            title: 'Active walk',
          }}
        />

        <Stack.Screen
          name="history"
          options={{
            title: 'My walks',
          }}
        />

        <Stack.Screen
          name="profile"
          options={{
            title: 'Profile',
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
