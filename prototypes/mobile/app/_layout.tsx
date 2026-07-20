import { Stack } from "expo-router";

import { LocaleProvider } from "../src/locale";

export default function RootLayout() {
  return (
    <LocaleProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#f5f6f8" } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="article/[slug]" />
      </Stack>
    </LocaleProvider>
  );
}
