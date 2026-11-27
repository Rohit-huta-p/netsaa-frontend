/**
 * InlineEdit — an in-place editable text field for the event "Edit in Preview"
 * surface. Unlike the composer's card-styled `TextField` (used by the P2/P3 focused
 * sheets), this keeps the section's OWN typography: the title stays serif, About stays
 * body copy — only a faint editable hairline and a small pencil appear. The pencil
 * focuses the input. Purely presentational; saving is the caller's (debounced) job via
 * `onChangeText`.
 */
import { useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, type TextStyle, type StyleProp } from 'react-native';
import { Pencil } from 'lucide-react-native';

const ORANGE = '#FF6B35';
const HAIR = 'rgba(255,255,255,0.14)';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  /** The read-only text style this field replaces — inherited so edit looks like view. */
  textStyle?: StyleProp<TextStyle>;
  placeholder?: string;
  multiline?: boolean;
  /** White pencil + light hairline for use over the dark hero photo. */
  onHero?: boolean;
  accessibilityLabel?: string;
  /** Fired on blur so the caller can flush a pending save immediately. */
  onCommit?: () => void;
}

export default function InlineEdit({
  value, onChangeText, textStyle, placeholder, multiline, onHero, accessibilityLabel, onCommit,
}: Props) {
  const ref = useRef<TextInput>(null);
  // Multiline inputs don't auto-grow on web (RN clips to the initial height), so track
  // the content height and apply it — otherwise long About copy is cut to ~2 rows.
  const [height, setHeight] = useState(0);
  const penColor = onHero ? 'rgba(255,255,255,0.92)' : ORANGE;
  const hairColor = onHero ? 'rgba(255,255,255,0.28)' : HAIR;

  return (
    <View style={[styles.row, multiline && styles.rowMultiline]}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChangeText}
        onBlur={onCommit}
        placeholder={placeholder}
        placeholderTextColor={onHero ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.3)'}
        multiline={multiline}
        onContentSizeChange={multiline ? (e) => setHeight(e.nativeEvent.contentSize.height) : undefined}
        style={[textStyle, styles.input, { borderBottomColor: hairColor }, multiline && height ? { height } : null]}
        accessibilityLabel={accessibilityLabel}
      />
      <Pressable
        onPress={() => ref.current?.focus()}
        hitSlop={8}
        style={styles.pen}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ? `Edit ${accessibilityLabel}` : 'Edit'}
      >
        <Pencil size={14} color={penColor} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowMultiline: { alignItems: 'flex-start' },
  input: {
    flex: 1,
    padding: 0,
    paddingBottom: 3,
    borderBottomWidth: 1,
    // color/font inherited from textStyle; borderBottomColor set inline
  },
  pen: { paddingTop: 2, paddingHorizontal: 2, flexShrink: 0 },
});
