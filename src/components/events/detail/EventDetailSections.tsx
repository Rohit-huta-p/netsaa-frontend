import { View, Text, Pressable, Linking } from 'react-native';
import { MapPin, Calendar, Globe, Clock } from 'lucide-react-native';
import type { EventDoc } from '@/services/eventService';
import { durationKindLabel } from '@/lib/eventTokens';

interface Props {
  event: EventDoc;
}

const DAY_FMT: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' };
const TIME_FMT: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };

function formatDeadline(iso: string): { label: string; relative: string; passed: boolean } {
  const d = new Date(iso);
  const passed = Date.now() > d.getTime();
  const label = d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const ms = d.getTime() - Date.now();
  const days = Math.floor(Math.abs(ms) / 86400000);
  const relative = passed
    ? `${days} day${days === 1 ? '' : 's'} ago`
    : days === 0
      ? 'today'
      : days === 1
        ? 'tomorrow'
        : `in ${days} days`;
  return { label, relative, passed };
}

export default function EventDetailSections({ event }: Props) {
  const startDate = new Date(event.startsAt);
  const organizer = typeof event.organizerId === 'object' ? event.organizerId : null;
  const deadline = event.registrationDeadline ? formatDeadline(event.registrationDeadline) : null;
  const agenda = Array.isArray(event.agenda) ? event.agenda : [];

  return (
    <View className="px-6 pt-6 pb-8 gap-7 bg-event-bg">
      {/* Topic tags */}
      <View className="flex-row flex-wrap gap-2">
        {event.topicTags.map((tag) => (
          <View key={tag} className="px-3 py-1.5 rounded-full bg-event-surface border border-event-border">
            <Text className="font-outfit text-event-textSecondary text-xs">{tag}</Text>
          </View>
        ))}
      </View>

      {/* Tagline */}
      {event.tagline ? (
        <Text className="font-outfit text-event-textSecondary text-base leading-6 italic">
          {event.tagline}
        </Text>
      ) : null}

      {/* Date + time */}
      <View className="flex-row gap-3 items-start">
        <Calendar size={20} color="#FF6B35" />
        <View className="flex-1">
          <Text className="font-outfit text-event-textPrimary text-base">
            {startDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <Text className="font-outfit text-event-textSecondary text-sm mt-1">
            {startDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}
            {' · '}{event.durationKind ? durationKindLabel[event.durationKind] : ''}
          </Text>
        </View>
      </View>

      {/* Registration deadline */}
      {deadline ? (
        <View className="flex-row gap-3 items-start">
          <Clock size={20} color={deadline.passed ? '#71717a' : '#FF6B35'} />
          <View className="flex-1">
            <Text className={`font-outfit text-base ${deadline.passed ? 'text-event-textMuted line-through' : 'text-event-textPrimary'}`}>
              Registration closes {deadline.label}
            </Text>
            <Text className="font-outfit text-event-textSecondary text-sm mt-1">
              {deadline.passed ? `Closed ${deadline.relative}` : `Closes ${deadline.relative}`}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Location */}
      <View className="flex-row gap-3 items-start">
        {event.location.kind === 'online'
          ? <Globe size={20} color="#FF6B35" />
          : <MapPin size={20} color="#FF6B35" />}
        <View className="flex-1">
          {event.location.kind === 'online' ? (
            <>
              <Text className="font-outfit text-event-textPrimary text-base">
                Online · {event.location.onlinePlatform || 'platform shared after register'}
              </Text>
              <Text className="font-outfit text-event-textSecondary text-sm mt-1">
                Join link sent after registration.
              </Text>
            </>
          ) : (
            <>
              <Text className="font-outfit text-event-textPrimary text-base">
                {event.location.venueName || 'Venue TBA'}
              </Text>
              <Text className="font-outfit text-event-textSecondary text-sm mt-1">
                {event.location.address}
                {event.location.landmark ? ` · ${event.location.landmark}` : ''}
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Organizer chip */}
      {organizer ? (
        <Pressable className="flex-row items-center gap-3 p-4 rounded-2xl bg-event-surface border border-event-border">
          <View className="w-12 h-12 rounded-full bg-event-bgAlt items-center justify-center">
            <Text className="font-serif text-event-textPrimary text-base">
              {organizer.name?.[0] ?? 'N'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="font-outfit text-event-textPrimary text-base font-semibold">
              {organizer.name}
              {organizer.verified ? <Text className="text-event-gold"> · ✓</Text> : null}
            </Text>
            <Text className="font-outfit text-event-textSecondary text-xs mt-0.5">
              {organizer.role || 'Organizer'}
            </Text>
          </View>
        </Pressable>
      ) : null}

      {/* About */}
      <View>
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest mb-3">
          About
        </Text>
        <Text className="font-outfit text-event-textPrimary text-base leading-7">
          {event.about}
        </Text>
      </View>

      {/* What to expect */}
      {event.whatToExpect ? (
        <View>
          <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest mb-3">
            What to expect
          </Text>
          <Text className="font-outfit text-event-textPrimary text-base leading-7">
            {event.whatToExpect}
          </Text>
        </View>
      ) : null}

      {/* Day-by-day agenda */}
      {agenda.length ? (
        <View>
          <View className="flex-row items-baseline justify-between mb-3">
            <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
              Day by day
            </Text>
            <Text className="font-mono text-event-textMuted text-xs">
              {agenda.length} {agenda.length === 1 ? 'day' : 'days'}
            </Text>
          </View>
          <View className="rounded-2xl overflow-hidden border border-event-border">
            {agenda.map((item, i) => {
              const d = new Date(item.startsAt || item.date);
              const isLast = i === agenda.length - 1;
              return (
                <View
                  key={`${item.date}-${i}`}
                  className={`flex-row gap-4 px-4 py-4 bg-event-surface ${isLast ? '' : 'border-b border-event-border'}`}
                >
                  <View className="w-12">
                    <Text className="font-serif text-event-textPrimary text-2xl leading-7">
                      {d.toLocaleDateString('en-IN', { day: 'numeric' })}
                    </Text>
                    <Text className="font-mono text-event-textMuted text-[10px] uppercase tracking-widest mt-1">
                      {d.toLocaleDateString('en-IN', { weekday: 'short' })}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-outfit text-event-textPrimary text-base font-semibold">
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text className="font-outfit text-event-textSecondary text-sm mt-1 leading-5">
                        {item.subtitle}
                      </Text>
                    ) : null}
                    {item.startsAt ? (
                      <Text className="font-mono text-event-gold text-[11px] mt-2 tracking-wider">
                        {d.toLocaleTimeString('en-IN', TIME_FMT)}
                        {item.durationMinutes ? ` · ${Math.round(item.durationMinutes / 60 * 10) / 10}h` : ''}
                      </Text>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Skills */}
      {event.skills?.length ? (
        <View>
          <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest mb-3">
            Bring · who's invited
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {event.skills.map((skill) => (
              <View key={skill} className="px-3 py-1.5 rounded-full bg-event-surface border border-event-border">
                <Text className="font-outfit text-event-textSecondary text-xs">{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}
