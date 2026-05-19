import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { SAMPLE_INPUT_PLACEHOLDER } from '@/services/ocrService';
import { detectPrices } from '@/services/priceParser';
import { translateMenuText, translateText } from '@/services/translation';
import { colors } from '@/theme/colors';

export default function TranslateScreen() {
  const [text, setText] = useState('');
  const [translated, setTranslated] = useState('');
  const [provider, setProvider] = useState('local preview');
  const [isTranslating, setIsTranslating] = useState(false);
  const preview = useMemo(() => translateMenuText(text), [text]);
  const prices = useMemo(() => detectPrices(text), [text]);

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setIsTranslating(true);
    const result = await translateText({ text, targetLanguage: 'English' });
    setTranslated(result.text);
    setProvider(result.provider);
    setIsTranslating(false);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>TRANSLATE</Text>
        <Text style={styles.title}>Make foreign text readable before you pay.</Text>
      </View>

      <GlassCard style={styles.panel}>
        <View style={styles.languageRow}>
          <Text style={styles.language}>Auto</Text>
          <Ionicons name="arrow-forward" color={colors.dim} size={16} />
          <Text style={styles.language}>English</Text>
        </View>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          placeholder={SAMPLE_INPUT_PLACEHOLDER}
          placeholderTextColor={colors.dim}
          style={styles.input}
        />
      </GlassCard>

      <Pressable style={styles.translateButton} onPress={handleTranslate} disabled={isTranslating || !text.trim()}>
        {isTranslating ? <ActivityIndicator color={colors.navy950} /> : <Ionicons name="sparkles-outline" color={colors.navy950} size={18} />}
        <Text style={styles.translateText}>Translate</Text>
      </Pressable>

      <GlassCard style={styles.result}>
        <View style={styles.resultHeader}>
          <Text style={styles.label}>Result</Text>
          <Text style={styles.provider}>{provider}</Text>
        </View>
        <Text style={styles.resultText}>{translated || preview || 'Enter text to generate a local preview.'}</Text>
      </GlassCard>

      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{prices.length}</Text>
          <Text style={styles.metricLabel}>prices detected</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>FX</Text>
          <Text style={styles.metricLabel}>ready for scan</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 52,
    marginBottom: 24,
  },
  eyebrow: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 3,
  },
  title: {
    marginTop: 14,
    maxWidth: 330,
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 39,
  },
  panel: {
    padding: 18,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 14,
  },
  language: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    minHeight: 190,
    marginTop: 14,
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
    textAlignVertical: 'top',
  },
  translateButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 26,
    backgroundColor: colors.cyan,
    marginTop: 16,
  },
  translateText: {
    color: colors.navy950,
    fontSize: 15,
    fontWeight: '800',
  },
  result: {
    marginTop: 16,
    borderColor: colors.cyanGlow,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  provider: {
    color: colors.dim,
    fontSize: 11,
  },
  resultText: {
    marginTop: 14,
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
  },
  metrics: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  metric: {
    flex: 1,
    minHeight: 92,
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
  },
  metricValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  metricLabel: {
    marginTop: 6,
    color: colors.dim,
    fontSize: 12,
  },
});
