import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { env } from '@/config/env';
import { findNearbyAtms, formatDistance, suggestAtmPlaces, type AtmLocation, type AtmPlaceSuggestion } from '@/services/atmService';
import { saveAtmFeeReport } from '@/services/userData';
import { colors } from '@/theme/colors';

type AtmState = 'idle' | 'permission' | 'loading' | 'manual' | 'ready' | 'error';
type Coords = { latitude: number; longitude: number };
type ReportValue = 'free' | '3.50' | '4.99' | 'other';

function withTimeout<T>(promise: Promise<T>, message: string, ms = 10000) {
  return Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error(message)), ms))]);
}

function feeAmount(value: ReportValue) {
  if (value === 'free') return 0;
  if (value === 'other') return null;
  return Number(value);
}

export default function AtmScreen() {
  const [atms, setAtms] = useState<AtmLocation[]>([]);
  const [provider, setProvider] = useState('local');
  const [status, setStatus] = useState<AtmState>('permission');
  const [manualLocation, setManualLocation] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AtmPlaceSuggestion[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [warning, setWarning] = useState('Fee data estimate / community data coming soon.');
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reports, setReports] = useState<Record<string, ReportValue>>({});

  const reportFee = async (atm: AtmLocation, value: ReportValue) => {
    setReports((current) => ({ ...current, [atm.id]: value }));
    await saveAtmFeeReport({
      atmName: atm.name,
      atmProvider: provider,
      latitude: atm.latitude,
      longitude: atm.longitude,
      feeLabel: value === 'free' ? 'Free' : value === 'other' ? 'Other' : `€${value}`,
      feeAmount: feeAmount(value),
      wasFree: value === 'free',
    });
  };

  const applyAtmResult = (result: Awaited<ReturnType<typeof findNearbyAtms>>) => {
    setAtms(result.atms);
    setProvider(result.provider);
    setWarning(result.warnings[0] ?? 'Fee data estimate / community data coming soon.');
    setError(result.error ?? null);
    setStatus('ready');

    if (!env.googleMapsApiKey || !result.center) {
      setMapImageUrl(null);
      return;
    }

    const markers = result.atms.slice(0, 5).filter((atm) => typeof atm.latitude === 'number' && typeof atm.longitude === 'number').map((atm, index) => `markers=color:0x67e8f9%7Clabel:${index + 1}%7C${atm.latitude},${atm.longitude}`).join('&');
    setMapImageUrl(`https://maps.googleapis.com/maps/api/staticmap?center=${result.center.latitude},${result.center.longitude}&zoom=15&size=640x360&scale=2&maptype=roadmap&${markers}&key=${env.googleMapsApiKey}`);
  };

  const getBrowserLocation = () => new Promise<Coords>((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Browser geolocation is unavailable.'));
      return;
    }
    navigator.geolocation.getCurrentPosition((position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }), (geoError) => reject(new Error(geoError.message || 'Location permission was denied.')), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
  });

  const getDeviceLocation = async () => {
    if (Platform.OS === 'web') return getBrowserLocation();
    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) throw new Error('Location denied. Enter a location manually.');
    const position = await Location.getCurrentPositionAsync({});
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  };

  const loadFromDeviceLocation = async () => {
    setStatus('loading');
    setWarning('Finding nearby ATMs...');
    setError(null);
    setSuggestions([]);
    setSelectedPlaceId(null);
    try {
      const coords = await withTimeout(getDeviceLocation(), 'Location request timed out. Enter a location manually.');
      const result = await withTimeout(findNearbyAtms(coords), 'ATM search timed out. Try manual search.');
      applyAtmResult(result);
    } catch (locationError) {
      setStatus('manual');
      setError(locationError instanceof Error ? locationError.message : 'Could not get location.');
      setWarning('Enter a location manually or try location again.');
    }
  };

  const searchManualLocation = async (placeId = selectedPlaceId) => {
    if (!manualLocation.trim() && !placeId) return;
    setStatus('loading');
    setWarning('Finding nearby ATMs...');
    setError(null);
    setSuggestions([]);
    try {
      const result = await withTimeout(findNearbyAtms(placeId ? { placeId, query: manualLocation.trim() } : { query: manualLocation.trim() }), 'Manual ATM search timed out. Try a more specific location.');
      applyAtmResult(result);
    } catch (searchError) {
      setStatus('error');
      setError(searchError instanceof Error ? searchError.message : 'Could not search that location.');
      setWarning('Try a more specific city, area, or postcode.');
    }
  };

  const selectSuggestion = (suggestion: AtmPlaceSuggestion) => {
    setManualLocation(suggestion.description);
    setSelectedPlaceId(suggestion.placeId);
    setSuggestions([]);
    void searchManualLocation(suggestion.placeId);
  };

  useEffect(() => { loadFromDeviceLocation(); }, []);

  useEffect(() => {
    const query = manualLocation.trim();
    if (selectedPlaceId || query.length < 2) { setSuggestions([]); return; }
    let cancelled = false;
    setIsSuggesting(true);
    const timeout = setTimeout(async () => {
      const nextSuggestions = await suggestAtmPlaces(query);
      if (!cancelled) { setSuggestions(nextSuggestions); setIsSuggesting(false); }
    }, 300);
    return () => { cancelled = true; clearTimeout(timeout); };
  }, [manualLocation, selectedPlaceId]);

  return (
    <Screen>
      <View style={styles.topBar}><Pressable style={styles.iconButton} onPress={() => router.back()}><Ionicons name="chevron-back" color={colors.text} size={22} /></Pressable><Text style={styles.topTitle}>ATM</Text><Pressable style={styles.iconButton} onPress={loadFromDeviceLocation}><Ionicons name="locate-outline" color={colors.text} size={19} /></Pressable></View>
      <View style={styles.header}><Text style={styles.eyebrow}>ATM FINDER</Text><Text style={styles.title}>Find the fee before you withdraw.</Text></View>
      <View style={styles.map}>{status === 'loading' ? <View style={styles.mapState}><ActivityIndicator color={colors.cyan} /><Text style={styles.mapStateText}>Finding nearby ATMs...</Text></View> : <>{mapImageUrl ? <Image source={{ uri: mapImageUrl }} resizeMode="cover" style={styles.mapImage} /> : <>{atms.slice(0, 5).map((atm, index) => <View key={atm.id} style={[styles.pin, { left: `${20 + (index * 14) % 56}%`, top: `${26 + (index * 17) % 48}%` }]}><Text style={styles.pinText}>{index + 1}</Text></View>)}</>}<View style={styles.mapCard}><Text style={styles.mapLabel}>{provider === 'google-maps' ? 'Google Maps area' : 'Map estimate'}</Text><Text style={styles.mapTitle}>{warning}</Text><Text style={styles.mapMeta}>{provider}</Text></View></>}</View>
      <GlassCard style={styles.searchCard}><Text style={styles.label}>Search exact location</Text><View style={styles.searchRow}><TextInput value={manualLocation} onChangeText={(value) => { setManualLocation(value); setSelectedPlaceId(null); }} placeholder="Type town, resort, hotel or postcode" placeholderTextColor={colors.dim} style={styles.searchInput} autoCorrect={false} returnKeyType="search" onSubmitEditing={() => searchManualLocation()} /><Pressable style={styles.searchButton} onPress={() => searchManualLocation()}>{isSuggesting ? <ActivityIndicator color={colors.navy950} size="small" /> : <Ionicons name="search-outline" color={colors.navy950} size={18} />}</Pressable></View>{suggestions.length > 0 && <View style={styles.suggestions}>{suggestions.map((suggestion) => <Pressable key={suggestion.placeId} style={styles.suggestionRow} onPress={() => selectSuggestion(suggestion)}><Ionicons name="location-outline" color={colors.cyan} size={17} /><View style={styles.suggestionTextBlock}><Text style={styles.suggestionTitle}>{suggestion.title}</Text>{!!suggestion.subtitle && <Text style={styles.suggestionSubtitle}>{suggestion.subtitle}</Text>}</View></Pressable>)}</View>}<Text style={styles.searchHelp}>Pick a suggestion for exact ATM results. This avoids wrong towns with the same name.</Text></GlassCard>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {status === 'manual' && <Pressable style={styles.allowButton} onPress={loadFromDeviceLocation}><Ionicons name="location-outline" color={colors.navy950} size={18} /><Text style={styles.allowText}>Allow location</Text></Pressable>}
      <Text style={styles.sectionTitle}>Nearby ATMs</Text>
      <View style={styles.list}>{atms.map((atm) => <GlassCard key={atm.id} style={styles.atmCard}><View style={styles.atmHeader}><View style={styles.atmTitleBlock}><Text style={styles.atmName}>{atm.name}</Text><Text style={styles.atmMeta}>{formatDistance(atm.distanceMeters)} - {atm.openLabel}</Text></View><Text style={[styles.fee, atm.risk === 'high' && styles.feeWarning]}>{reports[atm.id] === 'free' ? 'Reported free' : reports[atm.id] ? `Reported €${reports[atm.id]}` : atm.feeLabel}</Text></View><View style={styles.atmFooter}><Text style={styles.risk}>{atm.riskLabel}</Text><Pressable onPress={() => Linking.openURL(atm.mapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(atm.name)}`)}><Text style={styles.cardCompat}>Open in Maps</Text></Pressable></View><Text style={styles.feeData}>{atm.feeDataStatus === 'community-coming-soon' ? 'Community fee data coming soon' : 'Fee data estimate'}</Text><Text style={styles.reportLabel}>Report what the screen charged</Text><View style={styles.reportRow}><Pressable style={[styles.reportButton, reports[atm.id] === 'free' && styles.reportActive]} onPress={() => reportFee(atm, 'free')}><Text style={[styles.reportText, reports[atm.id] === 'free' && styles.reportTextActive]}>Free</Text></Pressable><Pressable style={[styles.reportButton, reports[atm.id] === '3.50' && styles.reportActive]} onPress={() => reportFee(atm, '3.50')}><Text style={[styles.reportText, reports[atm.id] === '3.50' && styles.reportTextActive]}>€3.50</Text></Pressable><Pressable style={[styles.reportButton, reports[atm.id] === '4.99' && styles.reportActive]} onPress={() => reportFee(atm, '4.99')}><Text style={[styles.reportText, reports[atm.id] === '4.99' && styles.reportTextActive]}>€4.99</Text></Pressable><Pressable style={[styles.reportButton, reports[atm.id] === 'other' && styles.reportActive]} onPress={() => reportFee(atm, 'other')}><Text style={[styles.reportText, reports[atm.id] === 'other' && styles.reportTextActive]}>Other</Text></Pressable></View></GlassCard>)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { paddingTop: 30, marginBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, borderWidth: 1, borderColor: colors.border },
  topTitle: { color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 2.4, textTransform: 'uppercase' },
  header: { marginBottom: 20 }, eyebrow: { color: colors.cyan, fontSize: 10, fontWeight: '700', letterSpacing: 3 }, title: { marginTop: 12, maxWidth: 330, color: colors.text, fontSize: 34, fontWeight: '700', lineHeight: 39 },
  map: { height: 300, overflow: 'hidden', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(103,232,249,0.14)', backgroundColor: '#020713' }, mapState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, mapStateText: { color: colors.text, fontWeight: '800' }, mapImage: { ...StyleSheet.absoluteFillObject, opacity: 0.84 }, pin: { position: 'absolute', width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colors.cyan }, pinText: { color: colors.navy950, fontSize: 13, fontWeight: '900' },
  mapCard: { position: 'absolute', left: 18, right: 18, bottom: 18, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(2,7,19,0.88)', padding: 16 }, mapLabel: { color: colors.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' }, mapTitle: { marginTop: 8, color: colors.text, fontSize: 16, fontWeight: '800', lineHeight: 22 }, mapMeta: { marginTop: 7, color: colors.dim, fontSize: 12 },
  searchCard: { marginTop: 16 }, label: { color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 2.4, textTransform: 'uppercase' }, searchRow: { flexDirection: 'row', gap: 10, marginTop: 12 }, searchInput: { flex: 1, height: 48, borderRadius: 16, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 14 }, searchButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: colors.cyan },
  suggestions: { marginTop: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(2,7,19,0.7)' }, suggestionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }, suggestionTextBlock: { flex: 1 }, suggestionTitle: { color: colors.text, fontSize: 14, fontWeight: '800' }, suggestionSubtitle: { marginTop: 3, color: colors.dim, fontSize: 12, fontWeight: '600' }, searchHelp: { marginTop: 10, color: colors.dim, fontSize: 11, lineHeight: 16 },
  allowButton: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 24, backgroundColor: colors.cyan, marginTop: 12 }, allowText: { color: colors.navy950, fontWeight: '900' }, errorText: { marginTop: 12, color: colors.danger, fontSize: 13, fontWeight: '700', lineHeight: 19 }, sectionTitle: { marginTop: 24, color: colors.text, fontSize: 18, fontWeight: '800' }, list: { gap: 10, marginTop: 12 }, atmCard: { padding: 16 }, atmHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 }, atmTitleBlock: { flex: 1 }, atmName: { color: colors.text, fontSize: 16, fontWeight: '800' }, atmMeta: { marginTop: 5, color: colors.dim, fontSize: 12 }, fee: { color: colors.cyan, fontSize: 13, fontWeight: '900' }, feeWarning: { color: colors.danger }, atmFooter: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 14, paddingTop: 12 }, risk: { flex: 1, color: colors.muted, fontSize: 12 }, cardCompat: { color: colors.cyan, fontSize: 12, fontWeight: '800', textAlign: 'right' }, feeData: { marginTop: 10, color: colors.dim, fontSize: 11 }, reportLabel: { marginTop: 12, color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }, reportRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }, reportButton: { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(103,232,249,0.32)', paddingHorizontal: 10, paddingVertical: 7 }, reportActive: { backgroundColor: colors.cyan, borderColor: colors.cyan }, reportText: { color: colors.cyan, fontSize: 11, fontWeight: '900' }, reportTextActive: { color: colors.navy950 },
});
