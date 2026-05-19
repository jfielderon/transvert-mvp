import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

type ScanButtonProps = {
  isLoading: boolean;
  onPress: () => void;
};

export function ScanButton({ isLoading, onPress }: ScanButtonProps) {
  return (
    <View style={styles.glowOuter}>
      <View style={styles.glowMiddle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scan price image"
          onPress={onPress}
          disabled={isLoading}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.navy900} size="large" />
          ) : (
            <>
              <Text style={styles.scan}>SCAN</Text>
              <Text style={styles.sub}>camera</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.cyan,
    shadowOpacity: 0.85,
    shadowRadius: 42,
    shadowOffset: { width: 0, height: 0 },
    elevation: 22,
  },
  glowMiddle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 224,
    height: 224,
    borderRadius: 112,
    backgroundColor: colors.cyanSoft,
    borderWidth: 1,
    borderColor: colors.cyanGlow,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: colors.cyan,
    borderWidth: 8,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  scan: {
    color: colors.navy900,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
  },
  sub: {
    marginTop: 4,
    color: colors.navy800,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
