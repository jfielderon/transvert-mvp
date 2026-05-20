import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { formatGbp, getRateSnapshot, loadFxRates } from '@/services/fx';
import type { FxRates } from '@/services/fx/types';
import { SAMPLE_INPUT_PLACEHOLDER, prepareImageForManualText } from '@/services/ocr';
import { detectPricesWithRates, totalGbp } from '@/services/priceParser';
import { saveScan } from '@/storage/scans';
import { processScanInput } from '@/services/scan/processScan';
import { translateMenuText } from '@/services/translate';
import { colors } from '@/theme/colors';
import type { ScanMode } from '@/types/scan';

type SelectedImage = {
  uri: string;
  base64?: string;
  mimeType?: string;
};

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [text, setText] = useState('');
  const [ocrStatus, setOcrStatus] = useState<'success' | 'fallback' | 'failed'>('fallback');
  const [isPicking, setIsPicking] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notice, setNotice] = useState('Camera preview unavailable in Expo Go. Upload an image or paste text.');
  const [pipelineState, setPipelineState] = useState('Upload image');
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<FxRates>(getRateSnapshot().rates);
  const [mode, setMode] = useState<ScanMode>('menu');

  useEffect(() => {
    loadFxRates().then((snapshot) => setRates(snapshot.rates));
  }, []);

  const prices = useMemo(() => detectPricesWithRates(text, rates, mode), [mode, rates, text]);
  const total = useMemo(() => totalGbp(prices), [prices]);
  const translated = useMemo(() => translateMenuText(text), [text]);

  const selectImage = useCallback((image: SelectedImage) => {
    setSelectedImage(image);
    setImageUri(image.uri);
    setText('');
    setOcrStatus('fallback');
    setError(null);
    setPipelineState('Upload image');
    setNotice('Image ready. Tap Process scan to extract text with OCR.Space.');
  }, []);

  const applyOcrResult = useCallback((result: Awaited<ReturnType<typeof prepareImageForManualText>>) => {
    setOcrStatus(result.status);
    setNotice(result.warnings[0] ?? (result.status === 'success' ? 'OCR extracted text. Review and edit before processing.' : 'Review or enter text before processing.'));
    setText(result.text);
  }, []);

  const uploadImage = useCallback(async () => {
    setError(null);
    setIsPicking(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Photo library permission was denied.');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      const asset = result.assets[0];
      selectImage({ uri: asset.uri, base64: asset.base64 ?? undefined, mimeType: asset.mimeType ?? undefined });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload image.');
    } finally {
      setIsPicking(false);
    }
  }, [applyOcrResult]);

  const enableCamera = useCallback(async () => {
    setError(null);

    try {
      setIsCapturing(true);
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setNotice('Camera permission is unavailable. Upload an image or paste text instead.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        base64: true,
        quality: 1,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      const asset = result.assets[0];
      selectImage({ uri: asset.uri, base64: asset.base64 ?? undefined, mimeType: asset.mimeType ?? undefined });
    } catch (cameraError) {
      setError(cameraError instanceof Error ? cameraError.message : 'Could not capture image.');
    } finally {
      setIsCapturing(false);
    }
  }, [selectImage]);

  const processText = useCallback(async () => {
    try {
      setIsProcessing(true);
      setError(null);

      let workingText = text.trim();
      let workingOcrStatus = ocrStatus;

      if (selectedImage) {
        setPipelineState('1/5 OCR');
        setNotice('Extracting text with OCR.Space...');
        const ocr = await prepareImageForManualText(selectedImage);
        applyOcrResult(ocr);
        workingText = ocr.text.trim();
        workingOcrStatus = ocr.status;

        if (ocr.status === 'failed') {
          throw new Error(ocr.warnings[0] ?? 'OCR failed. Try another image or enter text manually.');
        }

        setPipelineState('2/5 Cleaning text');
      }

      if (!workingText) {
        throw new Error('No text found. Edit the text box manually or upload a clearer image.');
      }

      setPipelineState('3/5 Translating');
      const scanRecord = await processScanInput({
        text: workingText,
        imageUri: imageUri ?? undefined,
        source: imageUri ? 'library' : 'manual',
        ocrStatus: workingOcrStatus,
        mode,
      });

      setPipelineState('4/5 Detecting prices');
      setRates(getRateSnapshot().rates);
      setPipelineState('5/5 EUR to GBP complete');
      await saveScan(scanRecord);
      router.push({ pathname: '/results', params: { id: scanRecord.id } });
    } catch (processError) {
      setError(processError instanceof Error ? processError.message : 'Could not process scan.');
      setPipelineState('Error');
    } finally {
      setIsProcessing(false);
    }
  }, [applyOcrResult, imageUri, mode, ocrStatus, selectedImage, text]);

  const useExample = () => {
    setSelectedImage(null);
    setImageUri(null);
    setText(SAMPLE_INPUT_PLACEHOLDER);
    setOcrStatus('fallback');
    setPipelineState('Text extracted');
    setNotice('Example text loaded. Edit it or process it through the pipeline.');
    setError(null);
  };

  const clearText = () => {
    setText('');
    setSelectedImage(null);
    setImageUri(null);
    setOcrStatus('fallback');
    setPipelineState('Upload image');
    setNotice('Input cleared. Upload an image or paste the text you want Transvert to process.');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" color={colors.text} size={20} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>See the world your way.</Text>
          <Text style={styles.subtitle}>OCR, translate, detect prices, convert.</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={enableCamera}>
          <Ionicons name="camera-outline" color={colors.muted} size={18} />
        </Pressable>
      </View>

      <View style={styles.preview}>
        <View style={styles.scanGlow} />
        {imageUri ? (
          <Image source={{ uri: imageUri }} resizeMode="contain" style={styles.previewImage} />
        ) : (
          <View style={styles.previewEmpty}>
            <MaterialCommunityIcons name="camera-iris" color={colors.cyan} size={36} />
            <Text style={styles.previewTitle}>Precision capture</Text>
            <Text style={styles.previewCopy}>Upload from iPhone Safari. Native live scanner is a native app feature coming soon.</Text>
          </View>
        )}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusText}>{pipelineState}</Text>
        {isProcessing && <ActivityIndicator color={colors.cyan} size="small" />}
      </View>
      <Text style={styles.notice}>{notice}</Text>

      <View style={styles.modeRow}>
        {(['menu', 'receipt', 'document'] as const).map((item) => (
          <Pressable key={item} style={[styles.modeButton, mode === item && styles.modeButtonActive]} onPress={() => setMode(item)}>
            <Text style={[styles.modeText, mode === item && styles.modeTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.primaryAction} onPress={uploadImage} disabled={isPicking}>
          {isPicking ? <ActivityIndicator color={colors.navy950} /> : <Ionicons name="image-outline" color={colors.navy950} size={18} />}
          <Text style={styles.primaryActionText}>Upload image</Text>
        </Pressable>
        <Pressable style={styles.cameraAction} onPress={enableCamera} disabled={isCapturing}>
          {isCapturing ? <ActivityIndicator color={colors.text} /> : <Ionicons name="camera-outline" color={colors.text} size={18} />}
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={clearText}>
          <Text style={styles.secondaryActionText}>Clear text</Text>
        </Pressable>
      </View>
      <Pressable style={styles.exampleAction} onPress={useExample}>
        <Text style={styles.exampleText}>Use example</Text>
      </Pressable>

      <GlassCard style={styles.editor}>
        <View style={styles.editorHeader}>
          <Text style={styles.label}>Text input</Text>
          <Text style={styles.editorMeta}>Auto to English - EUR to GBP - {mode}</Text>
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
            <Text style={styles.metricLabel}>{mode === 'receipt' ? 'Estimate' : 'Items'}</Text>
            <Text style={styles.metricValue}>{mode === 'receipt' ? formatGbp(total) : prices.length}</Text>
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
    height: 232,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.18)',
    backgroundColor: 'rgba(2, 7, 19, 0.72)',
    shadowColor: colors.cyan,
    shadowOpacity: 0.16,
    shadowRadius: 18,
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
    opacity: 0.92,
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
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  modeButton: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  modeButtonActive: {
    borderColor: colors.cyanGlow,
    backgroundColor: 'rgba(103,232,249,0.12)',
  },
  modeText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'capitalize',
  },
  modeTextActive: {
    color: colors.cyan,
  },
  statusRow: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginTop: 14,
    paddingHorizontal: 14,
  },
  statusText: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '700',
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
  cameraAction: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  secondaryActionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  exampleAction: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  exampleText: {
    color: colors.dim,
    fontSize: 12,
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
