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

type SelectedImage = { uri: string; base64?: string; mimeType?: string; imageUrl?: string };
type PipelineSource = 'camera' | 'library' | 'manual';

const scanIdeas = [
  { icon: 'restaurant-outline' as const, label: 'Menu' },
  { icon: 'receipt-outline' as const, label: 'Receipt' },
  { icon: 'trail-sign-outline' as const, label: 'Sign' },
  { icon: 'pricetag-outline' as const, label: 'Label' },
];

export default function ScanScreen() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [ocrStatus, setOcrStatus] = useState<'success' | 'fallback' | 'failed'>('fallback');
  const [isPicking, setIsPicking] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineState, setPipelineState] = useState('Ready');
  const [notice, setNotice] = useState('Take a photo or upload a saved image.');
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<FxRates>(getRateSnapshot().rates);

  useEffect(() => { loadFxRates().then((snapshot) => setRates(snapshot.rates)); }, []);

  const prices = useMemo(() => detectPricesWithRates(text, rates, 'menu'), [rates, text]);
  const total = useMemo(() => totalGbp(prices), [prices]);
  const translated = useMemo(() => translateMenuText(text), [text]);

  const runPipeline = useCallback(async ({ image, manualText, source }: { image?: SelectedImage; manualText?: string; source: PipelineSource }) => {
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

        if (ocr.status === 'failed' && !workingText) throw new Error(ocr.warnings[0] ?? 'OCR failed. Try a clearer, closer image.');
      }

      if (!workingText) throw new Error('No readable text found. Try a closer image or paste the text manually.');

      setPipelineState('Building result');
      const scanRecord = await processScanInput({ text: workingText, imageUri: savedImageUri, source, ocrStatus: workingOcrStatus, mode: 'menu' });
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
  }, [imageUri, ocrStatus]);

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
    setImageUri(null);
    setText(SAMPLE_INPUT_PLACEHOLDER);
    setOcrStatus('fallback');
    setPipelineState('Example ready');
    setNotice('Example text loaded. Tap Build result.');
    setError(null);
  };

  const clearText = () => {
    setText('');
    setImageUri(null);
    setOcrStatus('fallback');
    setPipelineState('Ready');
    setNotice('Take a photo or upload a saved image.');
    setError(null);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}><Ionicons name="chevron-back" color={colors.text} size={20} /></Pressable>
        <Pressable style={styles.iconButton} onPress={clearText}><Ionicons name="refresh-outline" color={colors.muted} size={18} /></Pressable>
      </View>

      <View style={styles.hero}>
        <Text style={styles.kicker}>Transvert Lens</Text>
        <Text style={styles.heroTitle}>Scan away.</Text>
        <Text style={styles.heroCopy}>Translate menus. Understand signs. Convert prices.</Text>
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
            <MaterialCommunityIcons name="line-scan" color={colors.cyan} size={25} />
            <Text style={styles.scanPromptTitle}>Point and scan</Text>
            <Text style={styles.scanPromptCopy}>Menus, signs, receipts and labels.</Text>
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
        <Pressable style={styles.dockButton} onPress={uploadImage} disabled={isPicking || isProcessing}>
          {isPicking ? <ActivityIndicator color={colors.text} size="small" /> : <Ionicons name="images-outline" color={colors.text} size={20} />}
          <Text style={styles.dockText}>Upload</Text>
        </Pressable>
        <Pressable style={styles.shutter} onPress={enableCamera} disabled={isCapturing || isProcessing}>
          {isCapturing ? <ActivityIndicator color={colors.navy950} /> : <Ionicons name="camera" color={colors.navy950} size={27} />}
        </Pressable>
        <Pressable style={styles.dockButton} onPress={useExample} disabled={isProcessing}>
          <Ionicons name="document-text-outline" color={colors.text} size={20} />
          <Text style={styles.dockText}>Example</Text>
        </Pressable>
      </View>

      <Text style={styles.notice}>{notice}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {!text.trim() ? (
        <GlassCard style={styles.inspirationCard}>
          <Text style={styles.label}>What can I scan?</Text>
          <View style={styles.ideaGrid}>{scanIdeas.map((idea) => <View key={idea.label} style={styles.ideaTile}><Ionicons name={idea.icon} color={colors.cyan} size={17} /><Text style={styles.ideaText}>{idea.label}</Text></View>)}</View>
        </GlassCard>
      ) : (
        <GlassCard style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View><Text style={styles.label}>Ready to build</Text><Text style={styles.resultTitle}>{prices.length ? `${prices.length} prices found` : 'Text captured'}</Text></View>
            <View style={styles.totalPill}><Text style={styles.totalLabel}>GBP</Text><Text style={styles.totalValue}>{prices.length ? formatGbp(total) : '—'}</Text></View>
          </View>
          <TextInput value={text} onChangeText={(value) => { setText(value); setError(null); setPipelineState(value.trim() ? 'Ready to process text' : 'Ready'); }} multiline placeholder="Paste text here if you need to fix the scan." placeholderTextColor={colors.dim} style={styles.input} />
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
  header: { paddingTop: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)' },
  hero: { marginBottom: 12 },
  kicker: { color: colors.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 3, textTransform: 'uppercase' },
  heroTitle: { marginTop: 4, color: colors.text, fontSize: 39, lineHeight: 41, fontWeight: '900' },
  heroCopy: { marginTop: 7, color: colors.muted, fontSize: 14, lineHeight: 20, fontWeight: '800' },
  preview: { height: 270, overflow: 'hidden', borderRadius: 26, borderWidth: 1, borderColor: 'rgba(103,232,249,0.18)', backgroundColor: '#020713', shadowColor: colors.cyan, shadowOpacity: 0.1, shadowRadius: 18 },
  previewBackground: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,7,19,0.72)' },
  focusShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,7,19,0.1)' },
  previewImage: { ...StyleSheet.absoluteFillObject, opacity: 0.96 },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: colors.cyan },
  topLeft: { top: 16, left: 16, borderTopWidth: 1.5, borderLeftWidth: 1.5 },
  topRight: { top: 16, right: 16, borderTopWidth: 1.5, borderRightWidth: 1.5 },
  bottomLeft: { bottom: 16, left: 16, borderBottomWidth: 1.5, borderLeftWidth: 1.5 },
  bottomRight: { right: 16, bottom: 16, borderRightWidth: 1.5, borderBottomWidth: 1.5 },
  scanPrompt: { position: 'absolute', left: 28, right: 28, top: 74, bottom: 74, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(103,232,249,0.22)', backgroundColor: 'rgba(2,7,19,0.7)', padding: 18, alignItems: 'center', justifyContent: 'center' },
  scanPromptTitle: { marginTop: 9, color: colors.text, fontSize: 23, fontWeight: '900', textAlign: 'center' },
  scanPromptCopy: { marginTop: 5, color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  processingOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 22, backgroundColor: 'rgba(2,7,19,0.78)' },
  processingTitle: { marginTop: 12, color: colors.text, fontSize: 21, fontWeight: '900' },
  processingCopy: { marginTop: 6, color: colors.muted, fontSize: 13, fontWeight: '700' },
  captureDock: { marginTop: 10, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderRadius: 32, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(2,7,19,0.88)', paddingHorizontal: 18, paddingVertical: 8, minWidth: 270 },
  shutter: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29, backgroundColor: colors.cyan, shadowColor: colors.cyan, shadowOpacity: 0.38, shadowRadius: 14 },
  dockButton: { width: 72, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dockText: { color: colors.text, fontSize: 11, fontWeight: '900' },
  notice: { marginTop: 9, color: colors.dim, fontSize: 12, lineHeight: 17, textAlign: 'center', fontWeight: '700' },
  error: { marginTop: 10, color: colors.danger, fontWeight: '900', textAlign: 'center' },
  inspirationCard: { marginTop: 10, marginBottom: 118, paddingVertical: 14 },
  label: { color: colors.dim, fontSize: 10, fontWeight: '900', letterSpacing: 2.2, textTransform: 'uppercase' },
  ideaGrid: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ideaTile: { width: '48%', minHeight: 58, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, justifyContent: 'space-between' },
  ideaText: { color: colors.text, fontSize: 14, fontWeight: '900' },
  resultCard: { marginTop: 12, marginBottom: 118 },
  resultHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  resultTitle: { marginTop: 6, color: colors.text, fontSize: 22, fontWeight: '900' },
  totalPill: { alignItems: 'flex-end', borderRadius: 17, borderWidth: 1, borderColor: 'rgba(103,232,249,0.26)', paddingHorizontal: 12, paddingVertical: 9 },
  totalLabel: { color: colors.dim, fontSize: 10, fontWeight: '900' },
  totalValue: { marginTop: 4, color: colors.cyan, fontSize: 17, fontWeight: '900' },
  input: { minHeight: 120, marginTop: 14, color: colors.text, fontSize: 16, lineHeight: 23, textAlignVertical: 'top', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12 },
  translatedText: { marginTop: 10, color: colors.muted, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  processButton: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 26, backgroundColor: colors.cyan, marginTop: 14 },
  processText: { color: colors.navy950, fontSize: 15, fontWeight: '900' },
});
