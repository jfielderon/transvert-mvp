import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { translateText } from '@/services/translate';
import { colors } from '@/theme/colors';

const sourceLanguages = ['Auto', 'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Polish', 'Turkish', 'Arabic', 'Chinese', 'Japanese'] as const;
const targetLanguages = ['English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Polish', 'Turkish', 'Arabic', 'Chinese', 'Japanese'] as const;

type SourceLanguage = (typeof sourceLanguages)[number];
type TargetLanguage = (typeof targetLanguages)[number];
type OpenSelector = 'source' | 'target' | null;

function LanguageDropdown<T extends readonly string[]>({
  label,
  value,
  options,
  isOpen,
  onToggle,
  onSelect,
}: {
  label: string;
  value: T[number];
  options: T;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (value: T[number]) => void;
}) {
  return (
    <View style={styles.dropdownWrap}>
      <Pressable style={[styles.selector, isOpen && styles.selectorActive]} onPress={onToggle}>
        <Text style={styles.selectorLabel}>{label}</Text>
        <Text style={styles.selectorText}>{value}</Text>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} color={colors.dim} size={15} />
      </Pressable>
      {isOpen && (
        <GlassCard style={styles.dropdownMenu}>
          <ScrollView nestedScrollEnabled style={styles.dropdownScroll}>
            {options.map((option) => (
              <Pressable
                key={option}
                style={[styles.dropdownOption, option === value && styles.dropdownOptionActive]}
                onPress={() => onSelect(option)}
              >
                <Text style={[styles.dropdownOptionText, option === value && styles.dropdownOptionTextActive]}>{option}</Text>
                {option === value && <Ionicons name="checkmark" color={colors.cyan} size={16} />}
              </Pressable>
            ))}
          </ScrollView>
        </GlassCard>
      )}
    </View>
  );
}

export default function TranslateScreen() {
  const [sourceLanguage, setSourceLanguage] = useState<SourceLanguage>('Auto');
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>('English');
  const [openSelector, setOpenSelector] = useState<OpenSelector>(null);
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
          <LanguageDropdown
            label="From"
            value={sourceLanguage}
            options={sourceLanguages}
            isOpen={openSelector === 'source'}
            onToggle={() => setOpenSelector((current) => current === 'source' ? null : 'source')}
            onSelect={(value) => {
              setSourceLanguage(value as SourceLanguage);
              setOpenSelector(null);
            }}
          />
          <Ionicons name="arrow-forward" color={colors.dim} size={17} />
          <LanguageDropdown
            label="To"
            value={targetLanguage}
            options={targetLanguages}
            isOpen={openSelector === 'target'}
            onToggle={() => setOpenSelector((current) => current === 'target' ? null : 'target')}
            onSelect={(value) => {
              setTargetLanguage(value as TargetLanguage);
              setOpenSelector(null);
            }}
          />
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
    overflow: 'visible',
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 14,
    zIndex: 5,
  },
  dropdownWrap: {
    flex: 1,
    position: 'relative',
    zIndex: 10,
  },
  selector: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  selectorActive: {
    borderColor: colors.cyanGlow,
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
  dropdownMenu: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 56,
    padding: 8,
    zIndex: 20,
  },
  dropdownScroll: {
    maxHeight: 250,
  },
  dropdownOption: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  dropdownOptionActive: {
    backgroundColor: 'rgba(103,232,249,0.08)',
  },
  dropdownOptionText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
  },
  dropdownOptionTextActive: {
    color: colors.text,
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
