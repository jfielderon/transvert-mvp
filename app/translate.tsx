import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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
  const [sourceLanguage, setSourceLanguage] = useState<(typeof languages)[number]>('Auto');
  const [targetLanguage, setTargetLanguage] = useState<(typeof targetLanguages)[number]>('English');
  const [text, setText] = useState('');
  const [translated, setTranslated] = useState('');
  const [provider, setProvider] = useState('ready');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text.trim()) {
      setTranslated('');
      setProvider('ready');
      setError(null);
      setIsTranslating(false);
      return undefined;
    }

    let active = true;
    const timer = setTimeout(async () => {
    setIsTranslating(true);
      setError(null);

      try {
        const result = await translateText({
          text,
          sourceLanguage: sourceLanguage === 'Auto' ? undefined : sourceLanguage,
          targetLanguage,
        });

        if (!active) return;

        if (result.provider === 'local-fallback') {
          setTranslated('');
          setProvider('translation unavailable');
          setError(result.warnings[0] ?? 'Translation API unavailable. Add an OpenAI or DeepL key for real translation.');
          return;
        }

        setTranslated(result.text);
        setProvider(result.provider);
      } catch (translationError) {
        if (!active) return;
        setTranslated('');
        setProvider('error');
        setError(translationError instanceof Error ? translationError.message : 'Translation failed. Check your translation API settings.');
      } finally {
        if (active) setIsTranslating(false);
      }
    }, 450);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [sourceLanguage, targetLanguage, text]);

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
            setError(null);
          }}
          multiline
          placeholder="Type or paste text to translate."
          placeholderTextColor={colors.dim}
          style={styles.input}
        />
        <View style={styles.inlineResult}>
          <View style={styles.resultHeader}>
            <Text style={[styles.label, styles.cyanLabel]}>Translated</Text>
            <View style={styles.providerRow}>
              {isTranslating && <ActivityIndicator color={colors.cyan} size="small" />}
              <Text style={styles.provider}>{provider}</Text>
            </View>
          </View>
          <Text style={styles.resultText}>{translated || (error ? 'Translation unavailable.' : 'Start typing to translate automatically.')}</Text>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </GlassCard>
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
  inlineResult: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 16,
    paddingTop: 16,
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
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultText: {
    marginTop: 14,
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
  },
  errorText: {
    marginTop: 10,
    color: colors.danger,
    fontSize: 13,
    lineHeight: 19,
  },
});
