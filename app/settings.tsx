import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { clearScans } from '@/storage/scans';
import { colors } from '@/theme/colors';

export default function SettingsScreen() {
  const [autoSave, setAutoSave] = useState(false);
  const [clearedAt, setClearedAt] = useState<string | null>(null);

  const handleClear = useCallback(() => {
    Alert.alert('Clear saved scans?', 'This removes local scan history from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearScans();
          setClearedAt(new Date().toLocaleTimeString());
        },
      },
    ]);
  }, []);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.copy}>Currency, language and privacy controls for travel spending.</Text>
      </View>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Currency</Text>
        <SettingRow label="Home currency" value="GBP - British Pound" />
        <SettingRow label="Detected currency" value="EUR - Euro" />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Language</Text>
        <SettingRow label="Target language" value="English" />
        <SettingRow label="Source language" value="Auto detect" />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Preferences</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Auto-save scans</Text>
          <Switch
            value={autoSave}
            onValueChange={setAutoSave}
            trackColor={{ false: colors.navy700, true: colors.cyanGlow }}
            thumbColor={autoSave ? colors.cyan : colors.text}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Dark mode</Text>
          <View style={styles.locked}>
            <Ionicons name="lock-closed-outline" color={colors.dim} size={16} />
            <Text style={styles.lockedText}>Always on</Text>
          </View>
        </View>
      </GlassCard>

      <GlassCard style={styles.privacy}>
        <View style={styles.privacyHeader}>
          <Ionicons name="shield-checkmark-outline" color={colors.cyan} size={18} />
          <Text style={styles.privacyTitle}>Privacy</Text>
        </View>
        <Text style={styles.privacyCopy}>Images use the editable Expo Go OCR fallback. Saved scans remain local to this device.</Text>
      </GlassCard>

      <Pressable style={styles.clearButton} onPress={handleClear}>
        <Text style={styles.clearText}>Clear saved scans</Text>
      </Pressable>
      {clearedAt && <Text style={styles.cleared}>Cleared at {clearedAt}</Text>}
    </Screen>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.selector}>
        <Text style={styles.selectorText}>{value}</Text>
        <Ionicons name="chevron-down" color={colors.dim} size={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    marginBottom: 26,
  },
  title: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '900',
  },
  copy: {
    marginTop: 12,
    maxWidth: 320,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    marginBottom: 16,
    paddingBottom: 0,
  },
  label: {
    marginBottom: 8,
    color: colors.dim,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.8,
    textTransform: 'uppercase',
  },
  row: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 23,
  },
  selector: {
    maxWidth: 190,
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  selectorText: {
    color: colors.muted,
    fontSize: 13,
  },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  lockedText: {
    color: colors.dim,
    fontSize: 13,
  },
  privacy: {
    marginTop: 6,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  privacyTitle: {
    color: colors.cyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.8,
    textTransform: 'uppercase',
  },
  privacyCopy: {
    marginTop: 14,
    color: colors.muted,
    fontSize: 15,
    lineHeight: 23,
  },
  clearButton: {
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 18,
  },
  clearText: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: '800',
  },
  cleared: {
    marginTop: 12,
    color: colors.success,
    textAlign: 'center',
    fontWeight: '800',
  },
});
