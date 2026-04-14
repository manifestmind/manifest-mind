import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 300 }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(app)/splash"        options={{ animation: 'fade' }} />
      <Stack.Screen name="(app)/home"          options={{ animation: 'fade' }} />
      <Stack.Screen name="(app)/affirmation"   options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="(app)/action"        options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="(app)/visualisation" options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="(app)/journal"       options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="(app)/vision-board"  options={{ animation: 'slide_from_right', animationDuration: 280 }} />
      <Stack.Screen name="(app)/celebration"   options={{ animation: 'slide_from_bottom', animationDuration: 400 }} />
      <Stack.Screen name="(app)/profil"        options={{ animation: 'fade' }} />
      <Stack.Screen name="(app)/parametres"    options={{ animation: 'fade' }} />
      <Stack.Screen name="(app)/name"          options={{ animation: 'fade' }} />
    </Stack>
  );
}
