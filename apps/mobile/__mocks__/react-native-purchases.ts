// Manual mock for react-native-purchases — used in jest tests.
// This mock replaces the native RevenueCat module which cannot run in Node.

export const LOG_LEVEL = {
  VERBOSE: 'VERBOSE',
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

export const PACKAGE_TYPE = {
  MONTHLY: '$rc_monthly',
  ANNUAL: '$rc_annual',
  WEEKLY: '$rc_weekly',
  LIFETIME: '$rc_lifetime',
  CUSTOM: '$rc_custom',
  UNKNOWN: '$rc_unknown',
} as const;

const Purchases = {
  setLogLevel: jest.fn(),
  configure: jest.fn(),
  getOfferings: jest.fn().mockResolvedValue({
    current: { availablePackages: [] },
  }),
  purchasePackage: jest.fn().mockResolvedValue({
    customerInfo: { entitlements: { active: {} } },
  }),
  restorePurchases: jest.fn().mockResolvedValue({
    entitlements: { active: {} },
  }),
  getCustomerInfo: jest.fn().mockResolvedValue({
    entitlements: { active: {} },
  }),
};

export default Purchases;
