import { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Button, colors, spacing, radius, fontFamilies, fontSizes } from "@estoicismo/ui";
import { signIn } from "../../lib/auth";

export default function SignIn() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      Alert.alert("Campos requeridos", "Ingresa tu email y contraseña.");
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
      router.replace("/(tabs)/habitos");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Email o contraseña incorrectos.";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="label" style={{ color: colors.accent }}>ESTOICISMO DIGITAL</Text>
        <Text variant="display" style={styles.title}>Bienvenido de vuelta.</Text>

        <View style={[styles.field, { marginTop: spacing.xl }]}>
          <Text variant="label">EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            placeholderTextColor={colors.muted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            autoComplete="email"
            accessibilityLabel="Email"
          />
        </View>

        <View style={styles.field}>
          <Text variant="label">CONTRASEÑA</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Tu contraseña"
            placeholderTextColor={colors.muted}
            secureTextEntry
            returnKeyType="done"
            autoComplete="current-password"
            onSubmitEditing={handleSignIn}
            accessibilityLabel="Contraseña"
          />
        </View>

        <Pressable
          onPress={() => router.push("/(auth)/forgot-password")}
          accessibilityRole="button"
          accessibilityLabel="Olvidé mi contraseña"
        >
          <Text variant="muted" style={{ textAlign: "right" }}>
            ¿Olvidaste tu contraseña?
          </Text>
        </Pressable>

        <Button
          variant="primary"
          label="Iniciar sesión"
          onPress={handleSignIn}
          loading={loading}
          style={{ marginTop: spacing.xl }}
        />

        <Pressable
          onPress={() => router.replace("/(auth)/sign-up")}
          style={{ marginTop: spacing.lg, alignItems: "center" }}
          accessibilityRole="button"
        >
          <Text variant="muted">
            ¿No tienes cuenta?{" "}
            <Text variant="bodyMedium" style={{ color: colors.accent }}>
              Regístrate gratis
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: spacing.lg },
  title: { marginTop: spacing.sm },
  field: { marginBottom: spacing.md, gap: spacing.xs },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.ink,
    backgroundColor: colors.bgAlt,
  },
});
