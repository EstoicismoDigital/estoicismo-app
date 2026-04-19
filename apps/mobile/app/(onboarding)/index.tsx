import { useState, useRef } from "react";
import {
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, Button, colors, spacing } from "@estoicismo/ui";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    bg: colors.bgDeep,
    label: "FILOSOFÍA",
    title: "Los estoicos no esperaban motivación para actuar.",
    subtitle: "Construían sistemas.",
    textColor: colors.bgAlt,
  },
  {
    bg: colors.bgAlt,
    label: "4 PILARES",
    title: "Todo en un sistema.\nSin excusas.",
    subtitle: "Hábitos · Finanzas · Mentalidad · Emprendimiento",
    textColor: colors.ink,
  },
  {
    bg: colors.accent,
    label: "EMPIEZA HOY",
    title: "Gratis.\nSin tarjeta.",
    subtitle: "3 hábitos · Historial 7 días · Siempre gratis.",
    textColor: colors.bg,
  },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  function goNext() {
    if (currentIndex < SLIDES.length - 1) {
      const next = currentIndex + 1;
      setCurrentIndex(next);
      scrollRef.current?.scrollTo({ x: width * next, animated: true });
    } else {
      router.replace("/(auth)/sign-up");
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
      >
        {SLIDES.map((slide) => (
          <View
            key={slide.label}
            style={[styles.slide, { width, backgroundColor: slide.bg }]}
          >
            <View style={[styles.content, { paddingTop: insets.top + spacing.xl }]}>
              <Text
                variant="label"
                style={{ color: slide.textColor, opacity: 0.7 }}
              >
                {slide.label}
              </Text>
              <Text
                variant="display"
                style={[styles.title, { color: slide.textColor }]}
              >
                {slide.title}
              </Text>
              <Text
                variant="body"
                style={{ color: slide.textColor, opacity: 0.8, marginTop: spacing.md }}
              >
                {slide.subtitle}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <View
              key={slide.label}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <Button
          variant="primary"
          label={currentIndex < SLIDES.length - 1 ? "Siguiente" : "Crear cuenta"}
          onPress={goNext}
          style={styles.cta}
        />

        {currentIndex === SLIDES.length - 1 && (
          <Pressable
            onPress={() => router.replace("/(auth)/sign-in")}
            accessibilityRole="button"
            accessibilityLabel="Ya tengo cuenta, ir a iniciar sesión"
            style={styles.secondaryAction}
          >
            <Text variant="muted" style={{ textAlign: "center" }}>
              Ya tengo cuenta
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: { flex: 1 },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
    gap: spacing.sm,
  },
  title: { marginTop: spacing.sm },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    backgroundColor: "transparent",
  },
  dots: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.line },
  dotActive: { width: 20, backgroundColor: colors.accent },
  cta: { width: "100%" },
  secondaryAction: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.sm,
  },
});
