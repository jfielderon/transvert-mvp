import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { getCachedRate } from '@/services/fx';
import { buildRebuiltMenu } from '@/services/menu/rebuildMenu';
import { speakLocalPhrase } from '@/services/speech/speak';
import { translateMenuText } from '@/services/translate';
import { saveScanFeedback } from '@/services/userData';
import { saveScan } from '@/storage/scans';
import { useScans } from '@/hooks/useScans';
import { colors } from '@/theme/colors';

function qualityFallback(text: string) {
  const words = text.split(/\s+/).filter(Boolean);
  let score = words.length < 12 ? 40 : 76;
  score = Math.max(0, Math.min(100, score));
  if (score >= 72) return { score, label: 'good', reason: 'Readable scan.' };
  if (score >= 48) return { score, label: 'fair', reason: 'Usable scan, but check details.' };
  return { score, label: 'poor', reason: 'Retake closer, flatter and without glare.' };
}

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width } = useWindowDimensions();
  const { scans, isLoading, refresh } = useScans();
  const [savedMessage, setSavedMessage] = useState(false);
  const [showRawOcr, setShowRawOcr] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [spokenId, setSpokenId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<'right' | 'wrong' | null>(null);
  const scan = useMemo(() => scans.find((item) => item.id === id), [id, scans]);
  const isWide = width >= 760;

  useEffect(() => {
    refresh();
  }, [id, refresh]);

  if (isLoading) return <Screen><Text style={styles.loading}>Loading scan...</Text></Screen>;
  if (!scan) {
    return (
      <Screen>
        <Text style={styles.loading}>Result loading...</Text>
        <Text style={styles.copy}>The result may still be saving. Try refreshing, or scan again if it does not appear.</Text>
        <Pressable style={styles.primaryActionSingle} onPress={refresh}><Text style={styles.primaryText}>Refresh result</Text></Pressable>
        <Pressable style={styles.secondaryActionSingle} onPress={() => router.replace('/scan')}><Text style={styles.secondaryText}>Scan again</Text></Pressable>
      </Screen>
    );
  }

  const mode = scan.mode ?? 'menu';
  const scanAny = scan as any;
  const translatedText = scan.translatedText ?? translateMenuText(scan.originalText);
  const ocrQuality = scanAny.ocrQuality ?? qualityFallback(scan.originalText);
  const ocrLines = Array.isArray(scanAny.ocrLines) ? scanAny.ocrLines : [];
  const rebuiltMenu = scan.rebuiltMenu ?? (mode === 'menu' ? buildRebuiltMenu(scan.originalText, scan.prices) : undefined);
  const qualityTone = ocrQuality.label === 'poor' ? styles.qualityPoor : ocrQuality.label === 'fair' ? styles.qualityFair : styles.qualityGood;

  const handleSave = async () => {
    await saveScan({ ...scan, translatedText, rebuiltMenu, userFeedback: feedback } as any);
    await refresh();
    setSavedMessage(true);
  };

  const handleFeedback = async (verdict: 'right' | 'wrong') => {
    setFeedback(verdict);
    await saveScanFeedback({ scanId: scan.id, verdict, mode, originalText: scan.originalText, detectedPriceCount: scan.prices.length });
    await saveScan({ ...scan, translatedText, rebuiltMenu, userFeedback: verdict } as any);
  };

  const speakItem = (item: any) => {
    setSpokenId(item.id);
    speakLocalPhrase(`${item.originalName}, por favor`, 'es-ES');
    setTimeout(() => setSpokenId(null), 1600);
  };
