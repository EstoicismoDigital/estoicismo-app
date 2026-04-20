/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// Mock Stripe lib BEFORE importing the route (stripe.ts throws if STRIPE_SECRET_KEY is missing)
const stripeCustomersCreate = jest.fn();
const stripeCheckoutSessionsCreate = jest.fn();

jest.mock("@/lib/stripe", () => ({
  stripe: {
    customers: { create: stripeCustomersCreate },
    checkout: { sessions: { create: stripeCheckoutSessionsCreate } },
  },
  STRIPE_PRICE_MONTHLY: "price_monthly_test",
  STRIPE_PRICE_ANNUAL: "price_annual_test",
}));

// Mock the Supabase server client factory
const supabaseGetUser = jest.fn();
const profileSingle = jest.fn();
const profileUpdateEq = jest.fn().mockResolvedValue({ error: null });

// Builder that returns the same shape the route expects
const supabaseMock = {
  auth: { getUser: supabaseGetUser },
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: profileSingle,
      })),
    })),
    update: jest.fn(() => ({
      eq: profileUpdateEq,
    })),
  })),
};

jest.mock("@/lib/supabase-server", () => ({
  createSupabaseServer: jest.fn(async () => supabaseMock),
}));

// Import AFTER mocks are declared
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { POST } = require("@/app/api/stripe/create-checkout/route");

function buildRequest(body: unknown): NextRequest {
  return {
    json: async () => body,
  } as unknown as NextRequest;
}

describe("POST /api/stripe/create-checkout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    profileUpdateEq.mockResolvedValue({ error: null });
  });

  it("returns 401 if unauthenticated", async () => {
    supabaseGetUser.mockResolvedValue({ data: { user: null } });

    const res = await POST(buildRequest({ plan: "monthly" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthenticated");
  });

  it("returns 400 if plan is invalid", async () => {
    supabaseGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "u@test.com" } },
    });

    const res = await POST(buildRequest({ plan: "weekly" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid plan");
  });

  it("creates a new Stripe customer when stripe_customer_id is null and persists it", async () => {
    supabaseGetUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "u@test.com" } },
    });
    profileSingle.mockResolvedValue({ data: { stripe_customer_id: null } });
    stripeCustomersCreate.mockResolvedValue({ id: "cus_new_123" });
    stripeCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/sess_abc",
    });

    const res = await POST(buildRequest({ plan: "monthly" }));
    expect(res.status).toBe(200);

    expect(stripeCustomersCreate).toHaveBeenCalledWith({
      email: "u@test.com",
      metadata: { supabase_user_id: "user-1" },
    });

    // profiles.update should have been called to persist the new customer id
    expect(profileUpdateEq).toHaveBeenCalledWith("id", "user-1");

    expect(stripeCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_new_123" })
    );
  });

  it("reuses existing stripe_customer_id when already present", async () => {
    supabaseGetUser.mockResolvedValue({
      data: { user: { id: "user-2", email: "v@test.com" } },
    });
    profileSingle.mockResolvedValue({
      data: { stripe_customer_id: "cus_existing_456" },
    });
    stripeCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/sess_xyz",
    });

    const res = await POST(buildRequest({ plan: "monthly" }));
    expect(res.status).toBe(200);

    expect(stripeCustomersCreate).not.toHaveBeenCalled();
    expect(stripeCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing_456" })
    );
  });

  it("creates a monthly checkout session when plan is 'monthly'", async () => {
    supabaseGetUser.mockResolvedValue({
      data: { user: { id: "user-3", email: "m@test.com" } },
    });
    profileSingle.mockResolvedValue({
      data: { stripe_customer_id: "cus_m" },
    });
    stripeCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/sess_m",
    });

    await POST(buildRequest({ plan: "monthly" }));

    expect(stripeCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_monthly_test", quantity: 1 }],
      })
    );
  });

  it("creates an annual checkout session when plan is 'annual'", async () => {
    supabaseGetUser.mockResolvedValue({
      data: { user: { id: "user-4", email: "a@test.com" } },
    });
    profileSingle.mockResolvedValue({
      data: { stripe_customer_id: "cus_a" },
    });
    stripeCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/sess_a",
    });

    await POST(buildRequest({ plan: "annual" }));

    expect(stripeCheckoutSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [{ price: "price_annual_test", quantity: 1 }],
      })
    );
  });

  it("returns { url } on success", async () => {
    supabaseGetUser.mockResolvedValue({
      data: { user: { id: "user-5", email: "s@test.com" } },
    });
    profileSingle.mockResolvedValue({
      data: { stripe_customer_id: "cus_s" },
    });
    stripeCheckoutSessionsCreate.mockResolvedValue({
      url: "https://checkout.stripe.com/sess_success",
    });

    const res = await POST(buildRequest({ plan: "monthly" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ url: "https://checkout.stripe.com/sess_success" });
  });
});
