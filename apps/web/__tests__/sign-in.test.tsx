import React from "react";
import { render, screen } from "@testing-library/react";
import { SignInForm } from "../app/(auth)/sign-in/SignInForm";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("../lib/supabase-client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
      signInWithOAuth: jest.fn().mockResolvedValue({ error: null }),
      signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
      verifyOtp: jest.fn().mockResolvedValue({ error: null }),
    },
  }),
}));

// next/link mock
jest.mock("next/link", () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

describe("SignInForm", () => {
  it("renders email and password inputs", () => {
    render(<SignInForm />);
    // Labels use htmlFor="email" / htmlFor="password" linking to input id
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    render(<SignInForm />);
    expect(
      screen.getByRole("button", { name: /iniciar sesión/i })
    ).toBeInTheDocument();
  });

  it("renders OAuth buttons (Google + Apple)", () => {
    render(<SignInForm />);
    expect(
      screen.getByRole("button", { name: /continuar con google/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continuar con apple/i })
    ).toBeInTheDocument();
  });

  it("renders email/phone tabs", () => {
    render(<SignInForm />);
    expect(screen.getByRole("tab", { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /teléfono/i })).toBeInTheDocument();
  });
});
