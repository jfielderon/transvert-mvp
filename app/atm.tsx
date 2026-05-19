import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { findNearbyAtms, formatDistance, type AtmLocation } from '@/services/atmService';
import { colors } from '@/theme/colors';

export default function AtmScreen() {
  const [atms, setAtms] = useState<AtmLocation[]>([]);
  const [provider, setProvider] = useState('local');

  useEffect(() => {
    findNearbyAtms().then((result) => {
      setAtms(result.atms);
      setProvider(result.provider);
    });
  }, []);

  const best = atms[0];

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" color={colors.text} size={22} />
        </Pressable>
        <Text style={styles.topTitle}>ATM Intelligence</Text>
        <View style={styles.iconButton}>
          <Ionicons name="filter-outline" color={colors.text} size={19} />
        </View>
      </View>

      <View style={styles.map}>
        <View style={styles.gridLineA} />
        <View style={styles.gridLineB} />
        <View style={styles.gridLineC} />
        <View style={styles.routeLine} />
        <View style={[styles.pin, styles.pinOne]}>
          <Text style={styles.pinText}>0</Text>
        </View>
        <View style={[styles.pin, styles.pinTwo]}>
          <Text style={styles.pinText}>1.5</Text>
        </View>
        <View style={[styles.pin, styles.pinThree, styles.pinWarning]}>
          <Text style={styles.pinText}>!</Text>
        </View>
        <View style={styles.mapCard}>
          <Text style={styles.mapLabel}>Low-fee route</Text>
          <Text style={styles.mapTitle}>Find the ATM that costs less before you withdraw.</Text>
          <Text style={styles.mapMeta}>{provider}</Text>
        </View>
      </View>

      <View style={styles.insightRow}>
        <GlassCard style={styles.insight}>
          <Text style={styles.label}>Best nearby</Text>
          <Text style={styles.insightValue}>{best?.feeLabel ?? 'Scanning'}</Text>
          <Text style={styles.meta}>{best?.name ?? 'Waiting for map layer'}</Text>
        </GlassCard>
        <GlassCard style={styles.insight}>
          <Text style={styles.label}>DCC risk</Text>
          <Text style={styles.insightValue}>Low</Text>
          <Text style={styles.meta}>Pay in local currency</Text>
        </GlassCard>
      </View>

      <Text style={styles.sectionTitle}>Nearby network</Text>
      <View style={styles.list}>
        {atms.map((atm) => (
          <GlassCard key={atm.id} style={styles.atmCard}>
            <View style={styles.atmHeader}>
              <View style={styles.atmTitleBlock}>
                <Text style={styles.atmName}>{atm.name}</Text>
                <Text style={styles.atmMeta}>{formatDistance(atm.distanceMeters)} - {atm.openLabel}</Text>
              </View>
              <Text style={[styles.fee, atm.risk === 'high' && styles.feeWarning]}>{atm.feeLabel}</Text>
            </View>
            <View style={styles.atmFooter}>
              <Text style={styles.risk}>{atm.riskLabel}</Text>
              <Text style={styles.cardCompat}>{atm.cardNetworks.join(' / ')}</Text>
            </View>
          </GlassCard>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 30,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.border,
  },
  topTitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  map: {
    height: 344,
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.14)',
    backgroundColor: '#020713',
  },
  gridLineA: {
    position: 'absolute',
    left: -40,
    top: 120,
    width: 520,
    height: 1,
    backgroundColor: colors.border,
    transform: [{ rotate: '-22deg' }],
  },
  gridLineB: {
    position: 'absolute',
    left: 80,
    top: -80,
    width: 1,
    height: 520,
    backgroundColor: colors.border,
    transform: [{ rotate: '32deg' }],
  },
  gridLineC: {
    position: 'absolute',
    right: 88,
    top: -70,
    width: 1,
    height: 500,
    backgroundColor: 'rgba(90,141,255,0.12)',
    transform: [{ rotate: '-18deg' }],
  },
  routeLine: {
    position: 'absolute',
    left: 104,
    top: 110,
    width: 178,
    height: 1,
    backgroundColor: colors.cyanGlow,
    transform: [{ rotate: '25deg' }],
  },
  pin: {
    position: 'absolute',
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.cyanGlow,
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.42,
    shadowRadius: 18,
  },
  pinOne: {
    left: 88,
    top: 112,
  },
  pinTwo: {
    right: 92,
    top: 178,
  },
  pinThree: {
    right: 54,
    top: 76,
  },
  pinWarning: {
    borderColor: 'rgba(212, 184, 106, 0.42)',
    backgroundColor: colors.warning,
  },
  pinText: {
    color: colors.navy950,
    fontSize: 12,
    fontWeight: '800',
  },
  mapCard: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(2, 7, 19, 0.82)',
    padding: 16,
  },
  mapLabel: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  mapTitle: {
    marginTop: 8,
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  mapMeta: {
    marginTop: 8,
    color: colors.dim,
    fontSize: 12,
  },
  insightRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  insight: {
    flex: 1,
  },
  label: {
    color: colors.dim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  insightValue: {
    marginTop: 16,
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  meta: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13,
  },
  sectionTitle: {
    marginTop: 28,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
  list: {
    gap: 12,
    marginTop: 14,
  },
  atmCard: {
    gap: 18,
  },
  atmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  atmTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  atmName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  atmMeta: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 13,
  },
  fee: {
    color: colors.success,
    fontSize: 15,
    fontWeight: '700',
  },
  feeWarning: {
    color: colors.warning,
  },
  atmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  risk: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '700',
  },
  cardCompat: {
    color: colors.dim,
    fontSize: 13,
  },
});
