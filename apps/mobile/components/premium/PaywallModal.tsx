import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Modal,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Text, colors, spacing, fontFamilies, fontSizes } from '@estoicismo/ui';
import {
  getPremiumOfferings,
  purchasePackage,
  restorePurchases,
} from '../../lib/purchases';
import type { PurchasesPackage } from 'react-native-purchases';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
}

const FEATURES = [
  'Hábitos ilimitados',
  'Historial completo de rachas',
  'Módulos futuros incluidos',
  'Sin publicidad',
] as const;

const ANNUAL_TYPE = '$rc_annual';
const MONTHLY_TYPE = '$rc_monthly';

export function PaywallModal({ visible, onClose }: PaywallModalProps) {
  const queryClient = useQueryClient();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    getPremiumOfferings()
      .then((pkgs) => {
        if (mountedRef.current) setPackages(pkgs);
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false);
      });
  }, [visible]);

  async function handlePurchase(pkg: PurchasesPackage | undefined) {
    if (!pkg) {
      Alert.alert(
        'No disponible',
        'Los planes no están disponibles en este momento. Intenta más tarde.',
      );
      return;
    }
    setPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        onClose();
      }
    } catch (err: unknown) {
      // RevenueCat throws { userCancelled: true } when user cancels — don't show error
      const isCancelled =
        err !== null &&
        typeof err === 'object' &&
        'userCancelled' in err &&
        (err as { userCancelled: boolean }).userCancelled === true;
      if (!isCancelled) {
        Alert.alert('Error', 'No se pudo completar la compra. Intenta de nuevo.');
      }
    } finally {
      if (mountedRef.current) setPurchasing(false);
    }
  }

  async function handleRestore() {
    try {
      const isPremium = await restorePurchases();
      if (isPremium) {
        await queryClient.invalidateQueries({ queryKey: ['profile'] });
        onClose();
      } else {
        Alert.alert(
          'Sin compras',
          'No encontramos compras anteriores para restaurar.',
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo restaurar. Intenta de nuevo.');
    }
  }

  const annualPkg = packages.find((p) => p.packageType === ANNUAL_TYPE);
  const monthlyPkg = packages.find((p) => p.packageType === MONTHLY_TYPE);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        {/* Close button */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Cerrar">
            <Text style={styles.closeText}>✕ Cancelar</Text>
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroIcon}>⭐</Text>
          <Text style={styles.heroTitle}>Estoicismo Premium</Text>
          <Text style={styles.heroSub}>Desbloquea tu potencial completo</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.check}>✓</Text>
              <Text style={styles.featureText}>{f}</Text>
            </View>
          ))}
        </View>

        {/* Pricing */}
        {loading ? (
          <ActivityIndicator
            color={colors.accent}
            style={styles.loader}
            testID="paywall-loading"
          />
        ) : (
          <View style={styles.pricing}>
            {/* Annual — primary, highlighted */}
            <Pressable
              onPress={() => handlePurchase(annualPkg)}
              disabled={purchasing}
              style={[styles.btnPrimary, purchasing && styles.btnDisabled]}
              accessibilityRole="button"
            >
              {purchasing ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  {annualPkg?.product.priceString ?? '$39.99'}/año — AHORRA 33%
                </Text>
              )}
            </Pressable>

            {/* Monthly — secondary */}
            <Pressable
              onPress={() => handlePurchase(monthlyPkg)}
              disabled={purchasing}
              style={[styles.btnSecondary, purchasing && styles.btnDisabled]}
              accessibilityRole="button"
            >
              <Text style={styles.btnSecondaryText}>
                {monthlyPkg?.product.priceString ?? '$4.99'}/mes
              </Text>
            </Pressable>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable onPress={handleRestore} hitSlop={8} accessibilityRole="button">
            <Text style={styles.restore}>Restaurar compra</Text>
          </Pressable>
          <View style={styles.legalRow}>
            <Pressable
              onPress={() =>
                Linking.openURL('https://estoicismodigital.com/terminos')
              }
            >
              <Text style={styles.legal}>Términos</Text>
            </Pressable>
            <Text style={styles.legalDot}> · </Text>
            <Pressable
              onPress={() =>
                Linking.openURL('https://estoicismodigital.com/privacidad')
              }
            >
              <Text style={styles.legal}>Privacidad</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    paddingTop: spacing.lg,
    alignItems: 'flex-end',
  },
  closeText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs,
    color: colors.muted,
  },
  hero: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  heroIcon: {
    fontSize: 44,
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontFamily: fontFamilies.quote,
    fontSize: fontSizes['2xl'],
    color: colors.ink,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  heroSub: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.base,
    color: colors.muted,
    textAlign: 'center',
  },
  features: {
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  check: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.lg,
    color: colors.accent,
    width: 24,
  },
  featureText: {
    fontFamily: fontFamilies.body,
    fontSize: fontSizes.sm + 1,
    color: colors.ink,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  pricing: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  btnPrimary: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  btnPrimaryText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs + 1,
    color: colors.bg,
    letterSpacing: 0.5,
  },
  btnSecondary: {
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.line,
  },
  btnSecondaryText: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs + 1,
    color: colors.ink,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  restore: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 1,
    color: colors.muted,
    textDecorationLine: 'underline',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legal: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 2,
    color: colors.muted,
  },
  legalDot: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.xs - 2,
    color: colors.muted,
  },
});
