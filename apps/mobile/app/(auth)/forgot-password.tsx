import { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Button, colors, spacing, radius, fontFamilies, fontSizes } from "@estoicismo/ui";
import { resetPassword } from "../../lib/auth";

export default function ForgotPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset() {
    if (!email) {
      Alert.alert("Campo requerido", "Ingresa tu email.");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No pudimos enviar el email.";
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
      <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
        <Text variant="label" style={{ color: colors.accent }}>RECUPERAR CONTRASEÑA</Text>
        {sent ? (
          <>
            <Text variant="display" style={styles.title}>Revisa tu email.</Text>
            <Text variant="muted">
              Enviamos instrucciones a {email}. Puede tardar unos minutos.
            </Text>
            <Button
              variant="secondary"
              label="Volver al inicio"
              onPress={() => router.replace("/(auth)/sign-in")}
              style={{ marginTop: spacing.xl }}
            />
          </>
        ) : (
          <>
            <Text variant="display" style={styles.title}>¿Olvidaste tu contraseña?</Text>
            <Text variant="muted" style={{ marginBottom: spacing.xl }}>
              Te enviaremos un link para restablecerla.
            </Text>
            <Text variant="label">EMAIL</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="send"
              onSubmitEditing={handleReset}
              accessibilityLabel="Email"
            />
            <Button
              variant="primary"
              label="Enviar instrucciones"
              onPress={handleReset}
              loading={loading}
              style={{ marginTop: spacing.lg }}
            />
            <Button
              variant="ghost"
              label="Cancelar"
              onPress={() => router.back()}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg },
  title: { marginTop: spacing.sm, marginBottom: spacing.sm },
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
    marginTop: spacing.xs,
  },
});
