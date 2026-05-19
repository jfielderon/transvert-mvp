import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

type GlobalBackdropProps = {
  compact?: boolean;
};

export function GlobalBackdrop({ compact = false }: GlobalBackdropProps) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={['rgba(90,141,255,0.2)', 'rgba(103,232,249,0.06)', 'transparent']}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.25, y: 0.9 }}
        style={[styles.aurora, compact && styles.auroraCompact]}
      />
      <View style={[styles.globe, compact && styles.globeCompact]}>
        <View style={[styles.orbit, styles.orbitOuter]} />
        <View style={[styles.orbit, styles.orbitMid]} />
        <View style={[styles.orbit, styles.orbitInner]} />
        <View style={[styles.arc, styles.arcA]} />
        <View style={[styles.arc, styles.arcB]} />
        <View style={[styles.connection, styles.connectionA]} />
        <View style={[styles.connection, styles.connectionB]} />
        <View style={[styles.node, styles.nodeA]} />
        <View style={[styles.node, styles.nodeB]} />
        <View style={[styles.node, styles.nodeC]} />
      </View>
      <View style={styles.vignette} />
    </View>
  );
}

const styles = StyleSheet.create({
  aurora: {
    position: 'absolute',
    top: -140,
    right: -170,
    width: 430,
    height: 560,
    borderRadius: 215,
    opacity: 0.9,
  },
  auroraCompact: {
    top: -190,
    right: -220,
    opacity: 0.62,
  },
  globe: {
    position: 'absolute',
    top: 44,
    right: -92,
    width: 292,
    height: 292,
    borderRadius: 146,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.16)',
    shadowColor: colors.blue,
    shadowOpacity: 0.34,
    shadowRadius: 42,
  },
  globeCompact: {
    top: -42,
    right: -120,
    opacity: 0.55,
  },
  orbit: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 999,
  },
  orbitOuter: {
    inset: 20,
  },
  orbitMid: {
    top: 38,
    left: 74,
    right: 74,
    bottom: 38,
    transform: [{ rotate: '18deg' }],
  },
  orbitInner: {
    top: 76,
    left: 26,
    right: 26,
    bottom: 76,
    transform: [{ rotate: '-14deg' }],
  },
  arc: {
    position: 'absolute',
    height: 1,
    backgroundColor: 'rgba(103,232,249,0.18)',
  },
  arcA: {
    left: 24,
    right: 34,
    top: 108,
    transform: [{ rotate: '-16deg' }],
  },
  arcB: {
    left: 48,
    right: 20,
    top: 178,
    transform: [{ rotate: '21deg' }],
  },
  connection: {
    position: 'absolute',
    height: 1,
    backgroundColor: colors.cyanGlow,
  },
  connectionA: {
    left: 70,
    top: 84,
    width: 132,
    transform: [{ rotate: '32deg' }],
  },
  connectionB: {
    left: 92,
    top: 188,
    width: 118,
    transform: [{ rotate: '-25deg' }],
  },
  node: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.cyan,
    shadowColor: colors.cyan,
    shadowOpacity: 0.85,
    shadowRadius: 12,
  },
  nodeA: {
    left: 76,
    top: 82,
  },
  nodeB: {
    right: 74,
    top: 154,
  },
  nodeC: {
    left: 138,
    bottom: 82,
  },
  vignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 260,
    backgroundColor: 'rgba(1,4,11,0.32)',
  },
});
