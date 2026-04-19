import React from "react";
import { Alert } from "react-native";
import { render, screen, fireEvent, waitFor } from "@testing-library/react-native";

// Mock @estoicismo/ui to avoid react-native version conflicts from the UI package
jest.mock("@estoicismo/ui", () => {
  const { Text: RNText, Pressable, ActivityIndicator, View } = require("react-native");
  return {
    Text: ({ children, style }: { children: React.ReactNode; style?: object }) => (
      <RNText style={style}>{children}</RNText>
    ),
    Button: ({
      label,
      onPress,
      loading,
      disabled,
    }: {
      label: string;
      onPress?: () => void;
      loading?: boolean;
      disabled?: boolean;
    }) => (
      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: disabled || loading }}
      >
        {loading && <ActivityIndicator />}
        <RNText>{label}</RNText>
      </Pressable>
    ),
    colors: {
      bg: "#FAFAF8",
      bgAlt: "#F0EEE9",
      ink: "#1A1A18",
      muted: "#8A8A80",
      accent: "#5C4A32",
      line: "#E0DDD6",
      danger: "#C0392B",
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 },
    radius: { sm: 6, md: 10, lg: 16 },
    fontFamilies: { body: "Inter", bodyMedium: "Inter-Medium", display: "Lora" },
    fontSizes: { sm: 12, base: 16, lg: 18, xl: 20, "2xl": 28 },
    touchTarget: { min: 44 },
  };
});

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), back: jest.fn() }),
  useSegments: () => [],
}));

jest.mock("../lib/auth", () => ({
  signIn: jest.fn(),
  signUp: jest.fn(),
  resetPassword: jest.fn(),
}));

jest.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  },
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return {
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    SafeAreaView: View,
  };
});

import SignIn from "../app/(auth)/sign-in";

describe("SignIn screen", () => {
  it("renders email and password inputs", () => {
    render(<SignIn />);
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Contraseña")).toBeTruthy();
  });

  it("shows error when fields are empty", async () => {
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => {});
    render(<SignIn />);
    fireEvent.press(screen.getByLabelText("Iniciar sesión"));
    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        "Campos requeridos",
        expect.any(String)
      )
    );
    alertSpy.mockRestore();
  });
});
