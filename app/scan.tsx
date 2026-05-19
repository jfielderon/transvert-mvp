import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { formatGbp, getRateSnapshot, loadFxRates, type FxRates } from '@/services/conversion';
import { createId } from '@/services/ids';
import { SAMPLE_INPUT_PLACEHOLDER, prepareImageForManualText } from '@/services/ocrService';
import { detectPricesWithRates, totalGbp } from '@/services/priceParser';
import { saveScan } from '@/services/scanStorage';
import { translateMenuText, translateText } from '@/services/translation';
import { colors } from '@/theme/colors';
import type { ScanRecord } from '@/types/scan';

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [isPicking, setIsPicking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notice, setNotice] = useState('Camera preview unavailable in Expo Go. Upload an image or paste text.');
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<FxRates>(getRateSnapshot().rates);

  useEffect(() => {
    loadFxRates().then((snapshot) => setRates(snapshot.rates));
  }, []);

  const prices = useMemo(() => detectPricesWithRates(text, rates), [rates, text]);
  const total = useMemo(() => totalGbp(prices), [prices]);
  const translated = useMemo(() => translateMenuText(text), [text]);

  const uploadImage = useCallback(async () => {
    setError(null);
    setIsPicking(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Photo library permission was denied.');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      const uri = result.assets[0].uri;
      const fallback = await prepareImageForManualText(uri);
      setImageUri(uri);
      setNotice(fallback.warnings[0]);
      if (fallback.text) setText(fallback.text);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload image.');
    } finally {
      setIsPicking(false);
    }
  }, []);

  const processText = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Paste or enter text before processing.');
      return;
    }

    setIsProcessing(true);
    const translation = await translateText({ text: trimmed, targetLanguage: 'English' });
    const detectedPrices = detectPricesWithRates(trimmed, rates);
    const scanRecord: ScanRecord = {
      id: createId('scan'),
      createdAt: new Date().toISOString(),
      imageUri: imageUri ?? undefined,
      originalText: trimmed,
      translatedText: translation.text,
      prices: detectedPrices,
      estimatedTotalGbp: totalGbp(detectedPrices),
      source: imageUri ? 'library' : 'manual',
      ocrStatus: 'fallback',
    };

    await saveScan(scanRecord);
    setIsProcessing(false);
    router.push({ pathname: '/results', params: { id: scanRecord.id } });
  }, [imageUri, rates, text]);

  const useExample = () => {
    setText(SAMPLE_INPUT_PLACEHOLDER);
    setNotice('Example text loaded. Edit it and Transvert will process your current text.');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" color={colors.text} size={20} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Vision Scan</Text>
          <Text style={styles.subtitle}>Translate, detect prices, convert instantly.</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={() => setNotice('Camera preview unavailable in Expo Go. Upload or paste text instead.')}>
          <Ionicons name="camera-outline" color={colors.muted} size={18} />
        </Pressable>
      </View>

      <View style={styles.preview}>
        <View style={styles.scanGlow} />
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.previewEmpty}>
            <MaterialCommunityIcons name="camera-iris" color={colors.cyan} size={36} />
            <Text style={styles.previewTitle}>Precision capture</Text>
            <Text style={styles.previewCopy}>Upload an image or paste text while Expo Go uses fallback input.</Text>
          </View>
        )}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      <Text style={styles.notice}>{notice}</Text>

      <View style={styles.actionRow}>
        <Pressable style={styles.primaryAction} onPress={uploadImage} disabled={isPicking}>
          {isPicking ? <ActivityIndicator color={colors.navy950} /> : <Ionicons name="image-outline" color={colors.navy950} size={18} />}
          <Text style={styles.primaryActionText}>Upload image</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={useExample}>
          <Text style={styles.secondaryActionText}>Use example</Text>
        </Pressable>
      </View>

      <GlassCard style={styles.editor}>
        <View style={styles.editorHeader}>
          <Text style={styles.label}>Text input</Text>
          <Text style={styles.editorMeta}>Auto to English - FX to GBP</Text>
        </View>
        <TextInput
          value={text}
          onChangeText={(value) => {
            setText(value);
            setError(null);
          }}
          multiline
          placeholder={SAMPLE_INPUT_PLACEHOLDER}
          placeholderTextColor={colors.dim}
          style={styles.input}
        />
        <View style={styles.metrics}>
          <View>
            <Text style={styles.metricLabel}>Detected</Text>
            <Text style={styles.metricValue}>{prices.length}</Text>
          </View>
          <View style={styles.metricRight}>
            <Text style={styles.metricLabel}>Estimate</Text>
            <Text style={styles.metricValue}>{formatGbp(total)}</Text>
          </View>
        </View>
      </GlassCard>

      {!!translated && (
        <GlassCard style={styles.translationPreview}>
          <Text style={[styles.label, styles.cyanLabel]}>Translation preview</Text>
          <Text style={styles.translatedText} numberOfLines={4}>{translated}</Text>
        </GlassCard>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable style={styles.processButton} onPress={processText} disabled={isProcessing}>
        {isProcessing ? <ActivityIndicator color={colors.navy950} /> : <Text style={styles.processText}>Process scan</Text>}
        <Ionicons name="arrow-forward" color={colors.navy950} size={19} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 30,
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleBlock: {
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 3,
    color: colors.dim,
    fontSize: 11,
  },
  preview: {
    height: 286,
    overflow: 'hidden',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.18)',
    backgroundColor: '#020713',
    shadowColor: colors.cyan,
    shadowOpacity: 0.22,
    shadowRadius: 26,
  },
  scanGlow: {
    position: 'absolute',
    left: 42,
    right: 42,
    top: 52,
    bottom: 52,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.cyanGlow,
    backgroundColor: 'rgba(103,232,249,0.035)',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.82,
  },
  previewEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 34,
  },
  previewTitle: {
    marginTop: 16,
    color: colors.text,
    fontSize: 21,
    fontWeight: '700',
  },
  previewCopy: {
    marginTop: 8,
    color: colors.muted,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  corner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderColor: colors.cyan,
  },
  topLeft: {
    top: 22,
    left: 22,
    borderTopWidth: 1,
    borderLeftWidth: 1,
  },
  topRight: {
    top: 22,
    right: 22,
    borderTopWidth: 1,
    borderRightWidth: 1,
  },
  bottomLeft: {
    bottom: 22,
    left: 22,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
  },
  bottomRight: {
    right: 22,
    bottom: 22,
    borderRightWidth: 1,
    borderBottomWidth: 1,
  },
  notice: {
    marginTop: 13,
    color: colors.dim,
    fontSize: 12,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  primaryAction: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 24,
    backgroundColor: colors.cyan,
  },
  primaryActionText: {
    color: colors.navy950,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryAction: {
    width: 118,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryActionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  editor: {
    marginTop: 16,
  },
  editorHeader: {
    gap: 6,
  },
  label: {
    color: colors.dim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  editorMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  input: {
    minHeight: 168,
    marginTop: 14,
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
    textAlignVertical: 'top',
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 14,
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricLabel: {
    color: colors.dim,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  metricValue: {
    marginTop: 5,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  translationPreview: {
    marginTop: 12,
    borderColor: colors.cyanGlow,
  },
  cyanLabel: {
    color: colors.cyan,
  },
  translatedText: {
    marginTop: 12,
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  error: {
    marginTop: 12,
    color: colors.danger,
    fontWeight: '700',
  },
  processButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 26,
    backgroundColor: colors.cyan,
    marginTop: 16,
  },
  processText: {
    color: colors.navy950,
    fontSize: 16,
    fontWeight: '800',
  },
});
