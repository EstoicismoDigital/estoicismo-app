import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import type { PurchasesPackage } from 'react-native-purchases';

/**
 * Call once when user session is established.
 * Uses Supabase user ID as RevenueCat app_user_id so webhook payloads
 * contain the Supabase user ID directly.
 */
export function initializePurchases(userId: string): void {
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({
    apiKey: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY ?? '',
    appUserID: userId,
  });
}

/**
 * Returns available packages from the current RevenueCat offering.
 * Returns [] if RevenueCat is not configured or has no offerings.
 */
export async function getPremiumOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages ?? [];
  } catch {
    return [];
  }
}

/**
 * Purchase a package. Returns true if the 'premium' entitlement is now active.
 * Throws with { userCancelled: true } if user cancelled — caller should swallow this.
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<boolean> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo.entitlements.active['premium'] !== undefined;
}

/**
 * Restore previous purchases. Returns true if 'premium' entitlement is active.
 */
export async function restorePurchases(): Promise<boolean> {
  const customerInfo = await Purchases.restorePurchases();
  return customerInfo.entitlements.active['premium'] !== undefined;
}
