import React from "react";
import { render, screen } from "@testing-library/react";
import SignInPage from "../app/(auth)/sign-in/page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}));

jest.mock("../lib/supabase-client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({ error: null }),
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

describe("SignInPage", () => {
  it("renders email and password inputs", () => {
    render(<SignInPage />);
    // Labels use htmlFor="email" / htmlFor="password" linking to input id
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    render(<SignInPage />);
    expect(
      screen.getByRole("button", { name: /iniciar sesión/i })
    ).toBeInTheDocument();
  });
});
