/**
 * EditableList — a string list the host edits inline on the "Edit in Preview" surface:
 * each row is an in-place TextInput with a remove (×), and an "Add …" row at the end.
 * Reused for What's-included (the strings themselves) and Day-by-day / Line-up (the
 * item titles, mapped by the caller). Purely presentational; the caller debounces saves.
 */
import { View, Text, TextInput, Pressable, StyleSheet, type TextStyle, type StyleProp } from 'react-native';
import { X, Plus } from 'lucide-react-native';

const ORANGE = '#FF6B35';
const T2 = '#8C857B';
const HAIR = 'rgba(255,255,255,0.10)';

interface Props {
  items: string[];
  onChangeAt: (index: number, value: string) => void;
  onRemoveAt: (index: number) => void;
  onAdd: () => void;
  addLabel: string;
  placeholder?: string;
  itemTextStyle?: StyleProp<TextStyle>;
  /** Prefix per row: a small index chip (Day-by-day) or a dot (What's-included). */
  prefix?: 'dot' | 'index';
  onCommit?: () => void;
}

export default function EditableList({
  items, onChangeAt, onRemoveAt, onAdd, addLabel, placeholder, itemTextStyle, prefix = 'dot', onCommit,
}: Props) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={`li-${i}`} style={styles.row}>
          {prefix === 'index' ? (
            <Text style={styles.idx}>{String(i + 1).padStart(2, '0')}</Text>
          ) : (
            <View style={styles.dot} />
          )}
          <TextInput
            value={item}
            onChangeText={(v) => onChangeAt(i, v)}
            onBlur={onCommit}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={[styles.input, itemTextStyle]}
            multiline
          />
          <Pressable
            onPress={() => onRemoveAt(i)}
            hitSlop={6}
            style={styles.del}
            accessibilityRole="button"
            accessibilityLabel="Remove item"
          >
            <X size={13} color={T2} />
          </Pressable>
        </View>
      ))}
      <Pressable onPress={onAdd} style={styles.add} accessibilityRole="button" accessibilityLabel={addLabel}>
        <Plus size={14} color={ORANGE} />
        <Text style={styles.addTxt}>{addLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderTopWidth: 1, borderTopColor: HAIR },
  idx: { fontFamily: 'SpaceMono-Bold', fontSize: 11, color: ORANGE, letterSpacing: 0.6, width: 26, paddingTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: ORANGE, flexShrink: 0 },
  input: { flex: 1, padding: 0, fontFamily: 'Outfit-Regular', fontSize: 13.5, lineHeight: 20, color: '#F3EFE8' },
  del: { width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: HAIR, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 10, marginTop: 2 },
  addTxt: { fontFamily: 'Outfit-SemiBold', fontSize: 13, color: ORANGE },
});
