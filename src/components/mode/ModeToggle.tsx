// netsa-mobile/src/components/mode/ModeToggle.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useMode } from '../../hooks/useMode';
import { useAuthStore } from '../../stores/authStore';
import { UserMode } from '../../lib/modeInference';

/**
 * Phase 1 mode toggle — pill at top of Home. Spec §10.1.
 */
export default function ModeToggle() {
  const { mode, switchMode } = useMode();
  const role = useAuthStore((s) => s.role);

  // Three-role model: only creative_leads have two faces (apply up / hire down).
  // Clients and artists each have a single fixed surface — no toggle.
  if (role !== 'creative_lead') return null;

  return (
    <View
      style={styles.container}
      accessibilityRole="switch"
      accessibilityLabel={`Mode selector, currently ${mode === 'artist' ? 'Apply' : 'Hire'} mode`}
      accessibilityHint={`Double tap to switch to ${mode === 'artist' ? 'Hire' : 'Apply'} mode`}
      accessibilityState={{ checked: mode === 'hirer' }}
    >
      <ToggleHalf
        label="Apply"
        active={mode === 'artist'}
        gradient={['#8B5CF6', '#6D23B6']}
        onPress={() => switchMode('artist')}
      />
      <ToggleHalf
        label="Hire"
        active={mode === 'hirer'}
        gradient={['#FF6B35', '#E8613A']}
        onPress={() => switchMode('hirer')}
      />
    </View>
  );
}

function ToggleHalf({
  label, active, gradient, onPress,
}: { label: string; active: boolean; gradient: [string, string]; onPress: () => void }) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.halfTouch}
      accessibilityRole="button"
    >
      {active ? (
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.halfActive}
        >
          <Text style={[styles.label, styles.labelActive]}>{label}</Text>
        </LinearGradient>
      ) : (
        <View style={styles.halfInactive}>
          <Text style={[styles.label, styles.labelInactive]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'center',
    width: 220,
    height: 42,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  halfTouch: { flex: 1 },
  halfActive: { flex: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 24 },
  halfInactive: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  labelActive: { color: '#FFFFFF' },
  labelInactive: { color: 'rgba(245, 240, 235, 0.55)' },
});
