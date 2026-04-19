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
import { signUp } from "../../lib/auth";

export default function SignUp() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password) {
      Alert.alert("Campos requeridos", "Ingresa tu email y contraseña.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Contraseña muy corta", "La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password);
      router.replace("/(tabs)/habitos");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No pudimos crear tu cuenta.";
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
        <Text variant="display" style={styles.title}>Crea tu cuenta.</Text>
        <Text variant="muted" style={{ marginBottom: spacing.xl }}>
          Empieza gratis. Sin tarjeta de crédito.
        </Text>

        <View style={styles.field}>
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
            placeholder="Mínimo 8 caracteres"
            placeholderTextColor={colors.muted}
            secureTextEntry
            returnKeyType="done"
            autoComplete="new-password"
            onSubmitEditing={handleSignUp}
            accessibilityLabel="Contraseña"
          />
        </View>

        <Button
          variant="primary"
          label="Crear cuenta"
          onPress={handleSignUp}
          loading={loading}
          style={{ marginTop: spacing.lg }}
        />

        <Pressable
          onPress={() => router.replace("/(auth)/sign-in")}
          style={{ marginTop: spacing.lg, alignItems: "center" }}
          accessibilityRole="button"
          accessibilityLabel="Ir a iniciar sesión"
        >
          <Text variant="muted">
            ¿Ya tienes cuenta?{" "}
            <Text variant="bodyMedium" style={{ color: colors.accent }}>
              Inicia sesión
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: spacing.lg },
  title: { marginTop: spacing.sm, marginBottom: spacing.sm },
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
