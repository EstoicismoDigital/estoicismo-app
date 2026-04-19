import { useEffect, useState } from "react";
import { View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import {
  useFonts,
  Lora_400Regular,
  Lora_400Regular_Italic,
  Lora_600SemiBold,
  Lora_700Bold,
} from "@expo-google-fonts/lora";
import { Inter_400Regular, Inter_500Medium } from "@expo-google-fonts/inter";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { supabase } from "../lib/supabase";
import { colors } from "@estoicismo/ui";
import type { Session } from "@supabase/supabase-js";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5 } },
});

function AuthGuard({
  session,
  fontsLoaded,
}: {
  session: Session | null;
  fontsLoaded: boolean;
}) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!fontsLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "(onboarding)";

    if (!session && !inAuthGroup && !inOnboarding) {
      router.replace("/(onboarding)");
    } else if (session && (inAuthGroup || inOnboarding)) {
      router.replace("/(tabs)/habitos");
    }
  }, [session, segments, fontsLoaded, router]);

  return null;
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);

  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    Lora_400Regular_Italic,
    Lora_600SemiBold,
    Lora_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    JetBrainsMono_500Medium,
  });

  // Hide splash only after fonts are ready — avoids blank-frame between splash and UI
  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Rely solely on onAuthStateChange — it fires INITIAL_SESSION on subscribe,
  // eliminating the getSession() + onAuthStateChange race condition
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGuard session={session} fontsLoaded={fontsLoaded} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
