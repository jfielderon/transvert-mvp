import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { env } from '@/config/env';
import { findNearbyAtms, formatDistance, type AtmLocation } from '@/services/atmService';
import { colors } from '@/theme/colors';

type AtmState = 'idle' | 'permission' | 'loading' | 'manual' | 'ready' | 'error';

export default function AtmScreen() {
  const [atms, setAtms] = useState<AtmLocation[]>([]);
  const [provider, setProvider] = useState('local');
  const [status, setStatus] = useState<AtmState>('permission');
  const [manualLocation, setManualLocation] = useState('');
  const [warning, setWarning] = useState('Fee data estimate / community data coming soon.');
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);

  const applyAtmResult = (result: Awaited<ReturnType<typeof findNearbyAtms>>) => {
    setAtms(result.atms);
    setProvider(result.provider);
    setWarning(result.warnings[0] ?? 'Fee data estimate / community data coming soon.');
    setStatus('ready');

    if (!env.googleMapsApiKey || !result.center) {
      setMapImageUrl(null);
      return;
    }

    const markers = result.atms
      .slice(0, 5)
      .filter((atm) => typeof atm.latitude === 'number' && typeof atm.longitude === 'number')
      .map((atm, index) => `markers=color:0x67e8f9%7Clabel:${index + 1}%7C${atm.latitude},${atm.longitude}`)
      .join('&');
    setMapImageUrl(`https://maps.googleapis.com/maps/api/staticmap?center=${result.center.latitude},${result.center.longitude}&zoom=15&size=640x360&scale=2&maptype=roadmap&style=feature:all|element:labels.text.fill|color:0xffffff&style=feature:all|element:geometry|color:0x08111f&style=feature:road|element:geometry|color:0x1c3557&${markers}&key=${env.googleMapsApiKey}`);
  };

  const loadFromDeviceLocation = async () => {
    setStatus('loading');
    setWarning('Finding nearby ATMs...');

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setStatus('manual');
        setWarning('Location denied. Enter a location manually.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({});
      const result = await findNearbyAtms({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      applyAtmResult(result);
    } catch {
      setStatus('manual');
      setWarning('Could not get location. Enter a location manually.');
    }
  };

  const searchManualLocation = async () => {
    if (!manualLocation.trim()) return;
    setStatus('loading');
    setWarning('Finding nearby ATMs...');
    const result = await findNearbyAtms({ query: manualLocation.trim() });
    applyAtmResult(result);
  };

  useEffect(() => {
    loadFromDeviceLocation();
  }, []);

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" color={colors.text} size={22} />
        </Pressable>
        <Text style={styles.topTitle}>ATM</Text>
        <Pressable style={styles.iconButton} onPress={loadFromDeviceLocation}>
          <Ionicons name="locate-outline" color={colors.text} size={19} />
        </Pressable>
      </View>

      <View style={styles.header}>
        <Text style={styles.eyebrow}>ATM FINDER</Text>
        <Text style={styles.title}>Find the fee before you withdraw.</Text>
      </View>

      <View style={styles.map}>
        {status === 'loading' && (
          <View style={styles.mapState}>
            <ActivityIndicator color={colors.cyan} />
            <Text style={styles.mapStateText}>Finding nearby ATMs...</Text>
          </View>
        )}
        {status !== 'loading' && (
          <>
            {mapImageUrl ? (
              <Image source={{ uri: mapImageUrl }} resizeMode="cover" style={styles.mapImage} />
            ) : (
              <>
                <View style={styles.gridLineA} />
                <View style={styles.gridLineB} />
                <View style={styles.gridLineC} />
                {atms.slice(0, 5).map((atm, index) => (
                  <View key={atm.id} style={[styles.pin, { left: `${20 + (index * 14) % 56}%`, top: `${26 + (index * 17) % 48}%` }]}>
                    <Text style={styles.pinText}>{index + 1}</Text>
                  </View>
                ))}
              </>
            )}
            <View style={styles.mapCard}>
              <Text style={styles.mapLabel}>{provider === 'google-maps' ? 'Google Maps area' : 'Map estimate'}</Text>
              <Text style={styles.mapTitle}>{warning}</Text>
              <Text style={styles.mapMeta}>{provider}</Text>
            </View>
          </>
        )}
      </View>

      <GlassCard style={styles.searchCard}>
        <Text style={styles.label}>Manual location</Text>
        <View style={styles.searchRow}>
          <TextInput
            value={manualLocation}
            onChangeText={setManualLocation}
            placeholder="Enter city, area, or postcode"
            placeholderTextColor={colors.dim}
            style={styles.searchInput}
          />
          <Pressable style={styles.searchButton} onPress={searchManualLocation}>
            <Ionicons name="search-outline" color={colors.navy950} size={18} />
          </Pressable>
        </View>
      </GlassCard>

      {status === 'manual' && (
        <Pressable style={styles.allowButton} onPress={loadFromDeviceLocation}>
          <Ionicons name="location-outline" color={colors.navy950} size={18} />
          <Text style={styles.allowText}>Allow location</Text>
        </Pressable>
      )}

      <Text style={styles.sectionTitle}>Nearby ATMs</Text>
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
              <Text style={styles.cardCompat}>{atm.feeDataStatus === 'community-coming-soon' ? 'Community data coming soon' : 'Fee data estimate'}</Text>
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
    marginBottom: 18,
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
  header: {
    marginBottom: 20,
  },
  eyebrow: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
  },
  title: {
    marginTop: 12,
    maxWidth: 330,
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 39,
  },
  map: {
    height: 300,
    overflow: 'hidden',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.14)',
    backgroundColor: '#020713',
  },
  mapState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  mapStateText: {
    color: colors.text,
    fontWeight: '800',
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.84,
  },
  gridLineA: {
    position: 'absolute',
    left: -40,
    top: 110,
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
  pin: {
    position: 'absolute',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: colors.cyan,
  },
  pinText: {
    color: colors.navy950,
    fontSize: 13,
    fontWeight: '900',
  },
  mapCard: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(2,7,19,0.88)',
    padding: 16,
  },
  mapLabel: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  mapTitle: {
    marginTop: 8,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  mapMeta: {
    marginTop: 7,
    color: colors.dim,
    fontSize: 12,
  },
  searchCard: {
    marginTop: 16,
  },
  label: {
    color: colors.dim,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: 14,
  },
  searchButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: colors.cyan,
  },
  allowButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    backgroundColor: colors.cyan,
    marginTop: 12,
  },
  allowText: {
    color: colors.navy950,
    fontWeight: '900',
  },
  sectionTitle: {
    marginTop: 24,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  list: {
    gap: 10,
    marginTop: 12,
  },
  atmCard: {
    padding: 16,
  },
  atmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  atmTitleBlock: {
    flex: 1,
  },
  atmName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  atmMeta: {
    marginTop: 5,
    color: colors.dim,
    fontSize: 12,
  },
  fee: {
    color: colors.cyan,
    fontSize: 13,
    fontWeight: '900',
  },
  feeWarning: {
    color: colors.danger,
  },
  atmFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 14,
    paddingTop: 12,
  },
  risk: {
    color: colors.muted,
    fontSize: 12,
  },
  cardCompat: {
    color: colors.dim,
    fontSize: 12,
    textAlign: 'right',
  },
});
