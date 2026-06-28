import { View, Text } from 'react-native';
import { computeSlotsLeft, isCapacityUrgent } from '@/lib/eventTokens';

interface Props {
  total: number;
  registeredCount: number;
  registrationDeadline?: string;
}

const BG = '#09090b';
const HAIRLINE = 'rgba(255,255,255,0.07)';
const HAIRLINE_2 = 'rgba(255,255,255,0.10)';
const TEXT_0 = '#f4f4f5';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const ORANGE = '#FF6B35';

const PAD = 20;

function relativeDeadline(iso: string): { text: string; passed: boolean } {
  const target = new Date(iso).getTime();
  const ms = target - Date.now();
  const passed = ms <= 0;
  const days = Math.floor(Math.abs(ms) / 86400000);
  if (passed) return { passed: true, text: `Registration closed ${days} day${days === 1 ? '' : 's'} ago` };
  if (days === 0) return { passed: false, text: 'Registration closes today' };
  if (days === 1) return { passed: false, text: 'Registration closes tomorrow' };
  return { passed: false, text: `Registration closes in ${days} days` };
}

export default function EventCapacityBar({ total, registeredCount, registrationDeadline }: Props) {
  const slotsLeft = computeSlotsLeft(total, registeredCount);
  const urgent = isCapacityUrgent(total, registeredCount);
  const isFull = slotsLeft === 0;
  const fillPct = total > 0 ? Math.min(100, (registeredCount / total) * 100) : 0;
  const deadline = registrationDeadline ? relativeDeadline(registrationDeadline) : null;

  return (
    <View style={{
      backgroundColor: BG,
      paddingHorizontal: PAD,
      paddingVertical: 22,
      borderBottomWidth: 1,
      borderColor: HAIRLINE,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 12,
      }}>
        <Text className="font-serif" style={{ color: TEXT_0, fontSize: 22, lineHeight: 22 }}>
          {registeredCount}{' '}
          <Text className="font-serif" style={{ color: TEXT_2, fontSize: 14 }}>
            / {total} seats
          </Text>
        </Text>
        <Text className="font-outfit" style={{
          color: isFull ? TEXT_2 : ORANGE,
          fontSize: 11.5,
          fontWeight: '600',
        }}>
          {isFull
            ? 'Event full'
            : `${slotsLeft} ${slotsLeft === 1 ? 'spot' : 'spots'} left`}
        </Text>
      </View>

      <View style={{
        height: 2,
        backgroundColor: HAIRLINE_2,
        borderRadius: 99,
        overflow: 'hidden',
        marginBottom: 12,
      }}>
        <View
          testID="capacity-bar-fill"
          style={{
            width: `${fillPct}%`,
            height: '100%',
            backgroundColor: isFull ? TEXT_2 : ORANGE,
          }}
        />
      </View>

      {deadline ? (
        <Text className="font-outfit" style={{
          color: deadline.passed ? TEXT_3 : TEXT_2,
          fontSize: 11,
          textDecorationLine: deadline.passed ? 'line-through' : 'none',
        }}>
          {deadline.text}
        </Text>
      ) : null}
    </View>
  );
}
