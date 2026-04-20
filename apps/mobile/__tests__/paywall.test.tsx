import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock @estoicismo/ui to avoid react-native version conflicts from the UI package
jest.mock('@estoicismo/ui', () => {
  const { Text: RNText } = require('react-native');
  return {
    Text: ({ children, style }: { children: React.ReactNode; style?: object }) => (
      <RNText style={style}>{children}</RNText>
    ),
    colors: {
      bg: '#FFFFFF',
      bgAlt: '#F0EEE9',
      ink: '#0A0A0A',
      muted: '#5E5E5E',
      accent: '#8B6F47',
      line: '#E5E1DA',
      danger: '#C0392B',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 },
    radius: { sm: 6, md: 10, lg: 16 },
    fontFamilies: {
      body: 'Inter_400Regular',
      bodyMedium: 'Inter_500Medium',
      display: 'Lora_700Bold',
      heading: 'Lora_700Bold',
      quote: 'Lora_400Regular_Italic',
      mono: 'JetBrainsMono_500Medium',
    },
    fontSizes: { xs: 12, sm: 14, base: 16, lg: 18, xl: 24, '2xl': 32 },
    touchTarget: { min: 44 },
  };
});

import { PaywallModal } from '../components/premium/PaywallModal';

// Mock purchases lib
jest.mock('../lib/purchases', () => ({
  getPremiumOfferings: jest.fn().mockResolvedValue([
    {
      packageType: '$rc_annual',
      product: { priceString: '$39.99', identifier: 'estoicismo_premium_annual' },
    },
    {
      packageType: '$rc_monthly',
      product: { priceString: '$4.99', identifier: 'estoicismo_premium_monthly' },
    },
  ]),
  purchasePackage: jest.fn().mockResolvedValue(true),
  restorePurchases: jest.fn().mockResolvedValue(false),
}));

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('PaywallModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders annual and monthly pricing', async () => {
    const { findByText } = render(
      <PaywallModal visible={true} onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    // Annual price from RevCat offering
    await findByText(/\$39\.99/);
    // Monthly price from RevCat offering
    await findByText(/\$4\.99/);
  });

  it('renders premium feature list', async () => {
    const { findByText } = render(
      <PaywallModal visible={true} onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    await findByText('Hábitos ilimitados');
    await findByText('Historial completo de rachas');
  });

  it('calls restorePurchases when restore button is pressed', async () => {
    const { restorePurchases } = require('../lib/purchases');
    const { findByText } = render(
      <PaywallModal visible={true} onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    const restoreBtn = await findByText('Restaurar compra');
    fireEvent.press(restoreBtn);
    await waitFor(() => expect(restorePurchases).toHaveBeenCalledTimes(1));
  });

  it('does not render when visible=false', () => {
    const { queryByText } = render(
      <PaywallModal visible={false} onClose={onClose} />,
      { wrapper: makeWrapper() },
    );
    expect(queryByText('Estoicismo Premium')).toBeNull();
  });
});
