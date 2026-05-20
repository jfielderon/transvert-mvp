import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { translateText } from '@/services/translate';
import { colors } from '@/theme/colors';

const languages = ['Auto', 'Spanish', 'French', 'Italian', 'German', 'Portuguese', 'English', 'Dutch'] as const;
const targetLanguages = ['English', 'Spanish', 'French', 'Italian', 'German', 'Portuguese', 'Dutch'] as const;

function nextValue<T extends readonly string[]>(items: T, current: T[number]): T[number] {
  const index = items.indexOf(current);
  return items[(index + 1) % items.length];
}

export default function TranslateScreen() {
  const { width } = useWindowDimensions();
  const [sourceLanguage, setSourceLanguage] = useState<(typeof languages)[number]>('Auto');
  const [targetLanguage, setTargetLanguage] = useState<(typeof targetLanguages)[number]>('English');
  const [text, setText] = useState('');
  const [translated, setTranslated] = useState('');
  const [provider, setProvider] = useState('ready');
  const [isTranslating, setIsTranslating] = useState(false);
  const isWide = width >= 720;

  const handleTranslate = async () => {
    if (!text.trim()) return;
    setIsTranslating(true);
    const result = await translateText({
      text,
      sourceLanguage: sourceLanguage === 'Auto' ? undefined : sourceLanguage,
      targetLanguage,
    });
    setTranslated(result.text);
    setProvider(result.provider);
    setIsTranslating(false);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>TRANSLATE</Text>
        <Text style={styles.title}>Read it your way.</Text>
      </View>

      <GlassCard style={styles.panel}>
        <View style={styles.languageRow}>
          <Pressable style={styles.selector} onPress={() => setSourceLanguage(nextValue(languages, sourceLanguage))}>
            <Text style={styles.selectorLabel}>From</Text>
            <Text style={styles.selectorText}>{sourceLanguage}</Text>
            <Ionicons name="chevron-down" color={colors.dim} size={15} />
          </Pressable>
          <Ionicons name="arrow-forward" color={colors.dim} size={17} />
          <Pressable style={styles.selector} onPress={() => setTargetLanguage(nextValue(targetLanguages, targetLanguage))}>
            <Text style={styles.selectorLabel}>To</Text>
            <Text style={styles.selectorText}>{targetLanguage}</Text>
            <Ionicons name="chevron-down" color={colors.dim} size={15} />
          </Pressable>
        </View>

        <TextInput
          value={text}
          onChangeText={(value) => {
            setText(value);
            setTranslated('');
          }}
          multiline
          placeholder="Type or paste text to translate."
          placeholderTextColor={colors.dim}
          style={styles.input}
        />
      </GlassCard>

      <Pressable style={styles.translateButton} onPress={handleTranslate} disabled={isTranslating || !text.trim()}>
        {isTranslating ? <ActivityIndicator color={colors.navy950} /> : <Ionicons name="language-outline" color={colors.navy950} size={18} />}
        <Text style={styles.translateText}>Translate</Text>
      </Pressable>

      <View style={[styles.resultsGrid, isWide && styles.resultsGridWide]}>
        <GlassCard style={[styles.result, isWide && styles.resultWide]}>
          <Text style={styles.label}>Original</Text>
          <Text style={styles.resultText}>{text || 'Original text will appear here.'}</Text>
        </GlassCard>
        <GlassCard style={[styles.result, styles.translatedCard, isWide && styles.resultWide]}>
          <View style={styles.resultHeader}>
            <Text style={[styles.label, styles.cyanLabel]}>Translated</Text>
            <Text style={styles.provider}>{provider}</Text>
          </View>
          <Text style={styles.resultText}>{translated || 'Translation will appear here.'}</Text>
        </GlassCard>
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
  selector: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  selectorLabel: {
    color: colors.dim,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  selectorText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
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
    fontSize: 16,
    fontWeight: '800',
  },
  resultsGrid: {
    gap: 12,
    marginTop: 16,
  },
  resultsGridWide: {
    flexDirection: 'row',
  },
  result: {
    minHeight: 180,
  },
  resultWide: {
    flex: 1,
  },
  translatedCard: {
    borderColor: colors.cyanGlow,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  label: {
    color: colors.dim,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  cyanLabel: {
    color: colors.cyan,
  },
  provider: {
    color: colors.dim,
    fontSize: 11,
    fontWeight: '700',
  },
  resultText: {
    marginTop: 14,
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
  },
});
