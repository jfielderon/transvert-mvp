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
import { uploadOcrImageToSupabase } from '@/services/supabase/storage';
import { translateMenuText } from '@/services/translate';
import { saveScan } from '@/storage/scans';
import { colors } from '@/theme/colors';

type SelectedImage = {
  uri: string;
  base64?: string;
  mimeType?: string;
  imageUrl?: string;
};

type PipelineSource = 'camera' | 'library' | 'manual';

const scanIdeas = [
  { icon: 'restaurant-outline' as const, label: 'Menu' },
  { icon: 'receipt-outline' as const, label: 'Receipt' },
  { icon: 'trail-sign-outline' as const, label: 'Sign' },
  { icon: 'pricetag-outline' as const, label: 'Label' },
];

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [text, setText] = useState('');
  const [ocrStatus, setOcrStatus] = useState<'success' | 'fallback' | 'failed'>('fallback');
  const [isPicking, setIsPicking] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineState, setPipelineState] = useState('Ready');
  const [notice, setNotice] = useState('Point your camera at a menu, sign, receipt or label.');
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
        setNotice('Scanning, translating and converting...');

        let workingText = manualText?.trim() ?? '';
        let workingOcrStatus: 'success' | 'fallback' | 'failed' = source === 'manual' ? 'fallback' : ocrStatus;
        let savedImageUri = image?.uri ?? imageUri ?? undefined;

        if (image) {
          setPipelineState('Preparing image');
          const upload = await uploadOcrImageToSupabase(image);
          const ocrInput = {
            uri: image.uri,
            imageUrl: upload.input.imageUrl,
            base64: upload.input.imageUrl ? undefined : image.base64,
            mimeType: image.mimeType,
          };
          savedImageUri = upload.input.imageUrl ?? image.uri;
          if (upload.warnings[0]) setNotice(upload.warnings[0]);

          setPipelineState('Reading image');
          const ocr = await prepareImageForManualText(ocrInput);
          workingText = ocr.text.trim();
          workingOcrStatus = ocr.status;
          setText(workingText);
          setOcrStatus(ocr.status);
          setNotice(ocr.warnings[0] ?? (workingText ? 'Text found. Building your result...' : 'No readable text found.'));

          if (ocr.status === 'failed' && !workingText) {
            throw new Error(ocr.warnings[0] ?? 'OCR failed. Try a clearer, closer image.');
          }
        }

        if (!workingText) throw new Error('No readable text found. Try a closer image or paste the text manually.');

        setPipelineState('Building result');
        const scanRecord = await processScanInput({
          text: workingText,
          imageUri: savedImageUri,
          source,
          ocrStatus: workingOcrStatus,
          mode: 'menu',
        });

        setPipelineState('Saving');
        await saveScan(scanRecord);
        router.push({ pathname: '/results', params: { id: scanRecord.id } });
      } catch (processError) {
        setError(processError instanceof Error ? processError.message : 'Could not process scan.');
        setPipelineState('Needs review');
        setNotice('Try a clearer photo, upload again, or paste the text manually.');
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
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, base64: true, quality: 0.65 });
      if (result.canceled || !result.assets[0]?.uri) return;
      const asset = result.assets[0];
      const image = { uri: asset.uri, base64: asset.base64 ?? undefined, mimeType: asset.mimeType ?? undefined };
      setSelectedImage(image);
      setImageUri(image.uri);
      setText('');
      setOcrStatus('fallback');
      setPipelineState('Photo selected');
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
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, base64: true, quality: 0.65 });
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
    setPipelineState('Example ready');
    setNotice('Example loaded. Tap Build result.');
    setError(null);
  };

  const clearText = () => {
    setText('');
    setSelectedImage(null);
    setImageUri(null);
    setOcrStatus('fallback');
    setPipelineState('Ready');
    setNotice('Point your camera at a menu, sign, receipt or label.');
    setError(null);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" color={colors.text} size={20} />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={clearText}>
          <Ionicons name="refresh-outline" color={colors.muted} size={18} />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>Transvert Lens</Text>
        <Text style={styles.heroTitle}>Scan away.</Text>
        <Text style={styles.heroCopy}>See it. Translate it. Know what it costs.</Text>
      </View>

      <View style={styles.preview}>
        {imageUri ? <Image source={{ uri: imageUri }} resizeMode="cover" style={styles.previewImage} /> : <View style={styles.previewBackground} />}
        <View style={styles.focusShade} />
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
        {!imageUri && !isProcessing ? (
          <View style={styles.scanPrompt}>
            <MaterialCommunityIcons name="line-scan" color={colors.cyan} size={34} />
            <Text style={styles.scanPromptTitle}>Point at anything</Text>
            <Text style={styles.scanPromptCopy}>Menus, signs, receipts, prices and labels.</Text>
          </View>
        ) : null}
        {isProcessing ? (
          <View style={styles.processingOverlay}>
            <ActivityIndicator color={colors.cyan} />
            <Text style={styles.processingTitle}>{pipelineState}</Text>
            <Text style={styles.processingCopy}>Turning the photo into something useful.</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.captureDock}>
        <Pressable style={styles.uploadMini} onPress={uploadImage} disabled={isPicking || isProcessing}>
          {isPicking ? <ActivityIndicator color={colors.text} size="small" /> : <Ionicons name="images-outline" color={colors.text} size={20} />}
          <Text style={styles.uploadMiniText}>Upload</Text>
        </Pressable>
        <Pressable style={styles.shutter} onPress={enableCamera} disabled={isCapturing || isProcessing}>
          {isCapturing ? <ActivityIndicator color={colors.navy950} /> : <View style={styles.shutterInner}><Ionicons name="camera" color={colors.navy950} size={26} /></View>}
        </Pressable>
        <Pressable style={styles.uploadMini} onPress={useExample} disabled={isProcessing}>
          <Ionicons name="sparkles-outline" color={colors.text} size={20} />
          <Text style={styles.uploadMiniText}>Demo</Text>
        </Pressable>
      </View>

      <Text style={styles.notice}>{notice}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!text.trim() ? (
        <GlassCard style={styles.inspirationCard}>
          <Text style={styles.label}>What can I scan?</Text>
          <View style={styles.ideaGrid}>
            {scanIdeas.map((idea) => (
              <View key={idea.label} style={styles.ideaTile}>
                <Ionicons name={idea.icon} color={colors.cyan} size={18} />
                <Text style={styles.ideaText}>{idea.label}</Text>
              </View>
            ))}
          </View>
        </GlassCard>
      ) : (
        <GlassCard style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View>
              <Text style={styles.label}>Ready to build</Text>
              <Text style={styles.resultTitle}>{prices.length ? `${prices.length} prices found` : 'Text captured'}</Text>
            </View>
            <View style={styles.totalPill}>
              <Text style={styles.totalLabel}>GBP</Text>
              <Text style={styles.totalValue}>{prices.length ? formatGbp(total) : '—'}</Text>
            </View>
          </View>
          <TextInput
            value={text}
            onChangeText={(value) => {
              setText(value);
              setError(null);
              setPipelineState(value.trim() ? 'Ready to process text' : 'Ready');
            }}
            multiline
            placeholder="Paste text here if you need to fix the scan."
            placeholderTextColor={colors.dim}
            style={styles.input}
          />
          {!!translated && <Text style={styles.translatedText} numberOfLines={4}>{translated}</Text>}
          <Pressable style={styles.processButton} onPress={() => runPipeline({ manualText: text, source: 'manual' })} disabled={isProcessing}>
            {isProcessing ? <ActivityIndicator color={colors.navy950} /> : <Text style={styles.processText}>Build result</Text>}
            <Ionicons name="arrow-forward" color={colors.navy950} size={19} />
          </Pressable>
        </GlassCard>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 28, marginBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  hero: { marginBottom: 20 },
  kicker: { color: colors.cyan, fontSize: 11, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
  heroTitle: { marginTop: 8, color: colors.text, fontSize: 50, lineHeight: 54, fontWeight: '900' },
  heroCopy: { marginTop: 10, color: colors.muted, fontSize: 17, lineHeight: 24, fontWeight: '700' },
  preview: { height: 410, overflow: 'hidden', borderRadius: 34, borderWidth: 1, borderColor: 'rgba(103,232,249,0.18)', backgroundColor: '#020713', shadowColor: colors.cyan, shadowOpacity: 0.12, shadowRadius: 24 },
  previewBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,7,19,0.72)' },
  focusShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,7,19,0.18)' },
  previewImage: { ...StyleSheet.absoluteFillObject, opacity: 0.96 },
  corner: { position: 'absolute', width: 54, height: 54, borderColor: colors.cyan },
  topLeft: { top: 22, left: 22, borderTopWidth: 2, borderLeftWidth: 2 },
  topRight: { top: 22, right: 22, borderTopWidth: 2, borderRightWidth: 2 },
  bottomLeft: { bottom: 22, left: 22, borderBottomWidth: 2, borderLeftWidth: 2 },
  bottomRight: { right: 22, bottom: 22, borderRightWidth: 2, borderBottomWidth: 2 },
  scanPrompt: { position: 'absolute', left: 26, right: 26, bottom: 28, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(103,232,249,0.24)', backgroundColor: 'rgba(2,7,19,0.68)', padding: 18 },
  scanPromptTitle: { marginTop: 10, color: colors.text, fontSize: 24, fontWeight: '900' },
  scanPromptCopy: { marginTop: 6, color: colors.muted, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(2,7,19,0.78)' },
  processingTitle: { marginTop: 12, color: colors.text, fontSize: 22, fontWeight: '900' },
  processingCopy: { marginTop: 6, color: colors.muted, fontSize: 13, fontWeight: '700' },
  captureDock: { marginTop: -36, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 18, borderRadius: 42, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(2,7,19,0.88)', paddingHorizontal: 18, paddingVertical: 12 },
  shutter: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', borderRadius: 38, backgroundColor: colors.cyan, shadowColor: colors.cyan, shadowOpacity: 0.45, shadowRadius: 18 },
  shutterInner: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: 'rgba(255,255,255,0.34)' },
  uploadMini: { width: 76, alignItems: 'center', justifyContent: 'center', gap: 5 },
  uploadMiniText: { color: colors.text, fontSize: 12, fontWeight: '900' },
  notice: { marginTop: 14, color: colors.dim, fontSize: 13, lineHeight: 19, textAlign: 'center', fontWeight: '700' },
  error: { marginTop: 12, color: colors.danger, fontWeight: '900', textAlign: 'center' },
  inspirationCard: { marginTop: 18, marginBottom: 110 },
  label: { color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 2.4, textTransform: 'uppercase' },
  ideaGrid: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  ideaTile: { width: '47.5%', minHeight: 74, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)', padding: 14, justifyContent: 'space-between' },
  ideaText: { color: colors.text, fontSize: 15, fontWeight: '900' },
  resultCard: { marginTop: 18, marginBottom: 110 },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  resultTitle: { marginTop: 6, color: colors.text, fontSize: 24, fontWeight: '900' },
  totalPill: { alignItems: 'flex-end', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(103,232,249,0.26)', paddingHorizontal: 12, paddingVertical: 10 },
  totalLabel: { color: colors.dim, fontSize: 10, fontWeight: '900' },
  totalValue: { marginTop: 4, color: colors.cyan, fontSize: 18, fontWeight: '900' },
  input: { minHeight: 130, marginTop: 16, color: colors.text, fontSize: 16, lineHeight: 24, textAlignVertical: 'top', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  translatedText: { marginTop: 12, color: colors.muted, fontSize: 15, lineHeight: 22, fontWeight: '700' },
  processButton: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 27, backgroundColor: colors.cyan, marginTop: 16 },
  processText: { color: colors.navy950, fontSize: 16, fontWeight: '900' },
});
