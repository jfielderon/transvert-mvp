import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '@/components/GlassCard';
import { Screen } from '@/components/Screen';
import { formatGbp } from '@/services/fx';
import { colors } from '@/theme/colors';
import { useScans } from '@/hooks/useScans';
import { clearScans } from '@/storage/scans';

export default function SavedScreen() {
  const { scans, refresh, removeScan } = useScans();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleClearAll = useCallback(() => {
    Alert.alert('Clear all saved scans?', 'This removes local scan history from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await clearScans();
          await refresh();
        },
      },
    ]);
  }, [refresh]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert('Delete saved scan?', 'This removes this scan from local history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeScan(id) },
    ]);
  }, [removeScan]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Saved</Text>
            <Text style={styles.copy}>Your translated scans and converted totals stay local to this device.</Text>
          </View>
          {scans.length > 0 && (
            <Pressable style={styles.clearIcon} onPress={handleClearAll}>
              <Ionicons name="trash-outline" color={colors.dim} size={18} />
            </Pressable>
          )}
        </View>
      </View>

      {scans.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bookmark-outline" color={colors.cyan} size={28} />
          </View>
          <Text style={styles.emptyTitle}>No saved scans yet.</Text>
          <Text style={styles.emptyCopy}>Upload an image or paste text, then save the result here.</Text>
          <Pressable style={styles.emptyButton} onPress={() => router.push('/scan')}>
            <Text style={styles.emptyButtonText}>Start scan</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.list}>
          {scans.map((scan) => (
            <Pressable
              key={scan.id}
              onPress={() => router.push({ pathname: '/results', params: { id: scan.id } })}
            >
              <GlassCard style={styles.savedCard}>
                <View style={styles.thumbnail}>
                  {scan.imageUri ? (
                    <Image source={{ uri: scan.imageUri }} style={styles.thumbnailImage} />
                  ) : (
                    <Ionicons name="document-text-outline" color={colors.dim} size={22} />
                  )}
                </View>
                <View style={styles.savedBody}>
                  <View style={styles.metaRow}>
                    <Text style={styles.routeText}>EUR to GBP</Text>
                    <Text style={styles.dateText}>{new Date(scan.createdAt).toLocaleDateString('en-GB')}</Text>
                  </View>
                  <Text style={styles.savedTitle} numberOfLines={1}>
                    {scan.translatedText?.split('\n')[0] || scan.originalText.split('\n')[0] || 'Saved scan'}
                  </Text>
                  <Text style={styles.savedTotal}>{formatGbp(scan.estimatedTotalGbp)}</Text>
                </View>
                <Pressable style={styles.deleteButton} onPress={() => handleDelete(scan.id)}>
                  <Ionicons name="trash-outline" color={colors.dim} size={17} />
                </Pressable>
              </GlassCard>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 56,
    marginBottom: 30,
  },
  title: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  clearIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copy: {
    marginTop: 12,
    maxWidth: 320,
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
  },
  empty: {
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 31,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.glass,
  },
  emptyTitle: {
    marginTop: 24,
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  emptyCopy: {
    marginTop: 10,
    maxWidth: 280,
    color: colors.muted,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 23,
  },
  emptyButton: {
    marginTop: 24,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.cyan,
    paddingHorizontal: 22,
  },
  emptyButtonText: {
    color: colors.navy950,
    fontSize: 15,
    fontWeight: '900',
  },
  list: {
    gap: 12,
  },
  savedCard: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  thumbnail: {
    width: 58,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.035)',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  savedBody: {
    flex: 1,
    minWidth: 0,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  routeText: {
    color: colors.dim,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
  },
  dateText: {
    color: colors.dim,
    fontSize: 11,
  },
  savedTitle: {
    marginTop: 13,
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  savedTotal: {
    marginTop: 6,
    color: colors.cyan,
    fontSize: 14,
    fontWeight: '900',
  },
  deleteButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
