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
import { processScanInput } from '@/services/scan/processScan';
import { translateMenuText } from '@/services/translate';
import { saveScan } from '@/storage/scans';
import { colors } from '@/theme/colors';

type SelectedImage = {
  uri: string;
  base64?: string;
  mimeType?: string;
};

type PipelineSource = 'camera' | 'library' | 'manual';

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [text, setText] = useState('');
  const [ocrStatus, setOcrStatus] = useState<'success' | 'fallback' | 'failed'>('fallback');
  const [isPicking, setIsPicking] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineState, setPipelineState] = useState('Ready');
  const [notice, setNotice] = useState('Use Lens or Upload. Transvert will extract, translate, detect prices and convert automatically.');
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<FxRates>(getRateSnapshot().rates);

  useEffect(() => {
    loadFxRates().then((snapshot) => setRates(snapshot.rates));
  }, []);

  const prices = useMemo(() => detectPricesWithRates(text, rates, 'menu'), [rates, text]);
  const total = useMemo(() => totalGbp(prices), [prices]);
  const translated = useMemo(() => translateMenuText(text), [text]);

  const runPipeline = useCallback(
    async ({ image, manualText, source }: { image?: SelectedImage; manualText?: string; source: PipelineSource }) => {
      try {
        setIsProcessing(true);
        setError(null);
        setPipelineState(source === 'manual' ? 'Reading text' : 'Reading image');
        setNotice('Scanning text, translating and checking prices...');

        let workingText = manualText?.trim() ?? '';
        let workingOcrStatus: 'success' | 'fallback' | 'failed' = source === 'manual' ? 'fallback' : ocrStatus;

        if (image) {
          const ocr = await prepareImageForManualText(image);
          workingText = ocr.text.trim();
          workingOcrStatus = ocr.status;
          setText(workingText);
          setOcrStatus(ocr.status);
          setNotice(ocr.warnings[0] ?? (workingText ? 'Text found. Preparing result...' : 'No readable text found.'));

          if (ocr.status === 'failed') {
            throw new Error(ocr.warnings[0] ?? 'OCR failed. Try a clearer, closer image.');
          }
        }

        if (!workingText) {
          throw new Error('No readable text found. Try a closer image or paste the text manually.');
        }

        setPipelineState('Translating');
        const scanRecord = await processScanInput({
          text: workingText,
          imageUri: image?.uri ?? imageUri ?? undefined,
          source,
          ocrStatus: workingOcrStatus,
          mode: 'menu',
        });

        setPipelineState('Saving result');
        await saveScan(scanRecord);
        router.push({ pathname: '/results', params: { id: scanRecord.id } });
      } catch (processError) {
        setError(processError instanceof Error ? processError.message : 'Could not process scan.');
        setPipelineState('Needs review');
        setNotice('Edit the text box manually, upload a clearer image, or try Lens again.');
      } finally {
        setIsProcessing(false);
      }
    },
    [imageUri, ocrStatus]
  );

  const uploadImage = useCallback(async () => {
    setError(null);
    setIsPicking(true);

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Photo library permission was denied.');

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.65,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      const asset = result.assets[0];
      const image = { uri: asset.uri, base64: asset.base64 ?? undefined, mimeType: asset.mimeType ?? undefined };
      setSelectedImage(image);
      setImageUri(image.uri);
      setText('');
      setOcrStatus('fallback');
      setPipelineState('Image selected');
      await runPipeline({ image, source: 'library' });
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Could not upload image.');
    } finally {
      setIsPicking(false);
    }
  }, [runPipeline]);

  const enableCamera = useCallback(async () => {
    setError(null);
    setIsCapturing(true);

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) throw new Error('Camera permission was denied.');

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        base64: true,
        quality: 0.65,
      });

      if (result.canceled || !result.assets[0]?.uri) return;

      const asset = result.assets[0];
      const image = { uri: asset.uri, base64: asset.base64 ?? undefined, mimeType: asset.mimeType ?? undefined };
      setSelectedImage(image);
      setImageUri(image.uri);
      setText('');
      setOcrStatus('fallback');
      setPipelineState('Photo captured');
      await runPipeline({ image, source: 'camera' });
    } catch (cameraError) {
      setError(cameraError instanceof Error ? cameraError.message : 'Could not capture image.');
    } finally {
      setIsCapturing(false);
    }
  }, [runPipeline]);

  const useExample = () => {
    setSelectedImage(null);
    setImageUri(null);
    setText(SAMPLE_INPUT_PLACEHOLDER);
    setOcrStatus('fallback');
    setPipelineState('Example loaded');
    setNotice('Example loaded. Tap Process text to create a result.');
    setError(null);
  };

  const clearText = () => {
    setText('');
    setSelectedImage(null);
    setImageUri(null);
    setOcrStatus('fallback');
    setPipelineState('Ready');
    setNotice('Use Lens or Upload. Transvert will process automatically.');
    setError(null);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" color={colors.text} size={20} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Lens scan</Text>
          <Text style={styles.subtitle}>Capture, translate, convert.</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={clearText}>
          <Ionicons name="refresh-outline" color={colors.muted} size={18} />
        </Pressable>
      </View>

      <View style={styles.preview}>
        <View style={styles.scanGlow} />
        {imageUri ? (
          <Image source={{ uri: imageUri }} resizeMode="contain" style={styles.previewImage} />
        ) : (
          <View style={styles.previewEmpty}>
            <MaterialCommunityIcons name="google-lens" color={colors.cyan} size={44} />
            <Text style={styles.previewTitle}>Point, capture, know.</Text>
            <Text style={styles.previewCopy}>Use Lens for a fresh photo or Upload for a saved menu, receipt, sign or label.</Text>
          </View>
        )}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color={colors.cyan} />
            <Text style={styles.processingText}>{pipelineState}</Text>
          </View>
        )}
      </View>

      <View style={styles.primaryRow}>
        <Pressable style={styles.lensButton} onPress={enableCamera} disabled={isCapturing || isProcessing}>
          {isCapturing ? <ActivityIndicator color={colors.navy950} /> : <MaterialCommunityIcons name="google-lens" color={colors.navy950} size={22} />}
          <Text style={styles.lensButtonText}>Live Lens</Text>
        </Pressable>
        <Pressable style={styles.uploadButton} onPress={uploadImage} disabled={isPicking || isProcessing}>
          {isPicking ? <ActivityIndicator color={colors.text} /> : <Ionicons name="image-outline" color={colors.text} size={20} />}
          <Text style={styles.uploadButtonText}>Upload</Text>
        </Pressable>
      </View>

      <Text style={styles.notice}>{notice}</Text>
      {error && <Text style={styles.error}>{error}</Text>}

      <GlassCard style={styles.editor}>
        <View style={styles.editorHeader}>
          <Text style={styles.label}>Manual review</Text>
          <Text style={styles.editorMeta}>Auto-detect type • Auto to English • EUR to GBP</Text>
        </View>
        <TextInput
          value={text}
          onChangeText={(value) => {
            setText(value);
            setError(null);
            setPipelineState(value.trim() ? 'Ready to process text' : 'Ready');
          }}
          multiline
          placeholder={SAMPLE_INPUT_PLACEHOLDER}
          placeholderTextColor={colors.dim}
          style={styles.input}
        />
        <View style={styles.metrics}>
          <View>
            <Text style={styles.metricLabel}>Prices</Text>
            <Text style={styles.metricValue}>{prices.length}</Text>
          </View>
          <View style={styles.metricRight}>
            <Text style={styles.metricLabel}>GBP estimate</Text>
            <Text style={styles.metricValue}>{prices.length ? formatGbp(total) : '—'}</Text>
          </View>
        </View>
      </GlassCard>

      {!!translated && (
        <GlassCard style={styles.translationPreview}>
          <Text style={[styles.label, styles.cyanLabel]}>Translation preview</Text>
          <Text style={styles.translatedText} numberOfLines={5}>{translated}</Text>
        </GlassCard>
      )}

      <View style={styles.secondaryRow}>
        <Pressable style={styles.secondaryAction} onPress={useExample}>
          <Text style={styles.secondaryActionText}>Use example</Text>
        </Pressable>
        <Pressable style={styles.secondaryAction} onPress={clearText}>
          <Text style={styles.secondaryActionText}>Clear</Text>
        </Pressable>
      </View>

      {!!text.trim() && !selectedImage && (
        <Pressable style={styles.processButton} onPress={() => runPipeline({ manualText: text, source: 'manual' })} disabled={isProcessing}>
          {isProcessing ? <ActivityIndicator color={colors.navy950} /> : <Text style={styles.processText}>Process text</Text>}
          <Ionicons name="arrow-forward" color={colors.navy950} size={19} />
        </Pressable>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 28,
    marginBottom: 18,
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
    fontSize: 19,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 3,
    color: colors.dim,
    fontSize: 11,
  },
  preview: {
    height: 265,
    overflow: 'hidden',
    borderRadius: 24,
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
    top: 62,
    bottom: 62,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.cyanGlow,
    backgroundColor: 'rgba(103,232,249,0.035)',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.96,
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
    fontSize: 23,
    fontWeight: '800',
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
  topLeft: { top: 22, left: 22, borderTopWidth: 1, borderLeftWidth: 1 },
  topRight: { top: 22, right: 22, borderTopWidth: 1, borderRightWidth: 1 },
  bottomLeft: { bottom: 22, left: 22, borderBottomWidth: 1, borderLeftWidth: 1 },
  bottomRight: { right: 22, bottom: 22, borderRightWidth: 1, borderBottomWidth: 1 },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'rgba(2,7,19,0.72)',
  },
  processingText: {
    color: colors.cyan,
    fontWeight: '800',
  },
  primaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  lensButton: {
    flex: 1.2,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 27,
    backgroundColor: colors.cyan,
  },
  lensButtonText: {
    color: colors.navy950,
    fontSize: 16,
    fontWeight: '900',
  },
  uploadButton: {
    flex: 1,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  uploadButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  notice: {
    marginTop: 13,
    color: colors.dim,
    fontSize: 12,
    lineHeight: 18,
  },
  error: {
    marginTop: 12,
    color: colors.danger,
    fontWeight: '800',
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
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  editorMeta: {
    color: colors.muted,
    fontSize: 12,
  },
  input: {
    minHeight: 142,
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
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  metricValue: {
    marginTop: 5,
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
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
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  secondaryAction: {
    flex: 1,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryActionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
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
    fontWeight: '900',
  },
});
