import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { LANDING } from '@/constants/landingTheme';

const MESSAGES = [
  { type: 'out', text: 'Hi Rajesh sir, following up on the sangeet performance for Saturday?', time: '11:23 AM', ticks: 'blue' },
  { type: 'in', text: 'Yes yes, 8 artists needed. Rs 5000 each. Come to Lavasa resort by 6pm', time: '2:14 PM' },
  { type: 'out', text: 'Sir, we discussed Rs 8000 per artist on call?', time: '2:16 PM', ticks: 'grey' },
  { type: 'date', text: 'Today' },
  { type: 'out', text: 'Rajesh sir?', time: '10:30 AM', ticks: 'grey' },
  { type: 'out', text: 'Sir the team is asking about confirmation', time: '12:45 PM', ticks: 'grey' },
  { type: 'out', text: 'Hello?', time: '4:02 PM', ticks: 'grey' },
];

const PUNCHES = [
  { num: '01', title: 'No written agreement. No proof.', sub: 'The rate was "discussed on call." Good luck proving that in a WhatsApp chat.' },
  { num: '02', title: 'Blue ticks. No reply. No recourse.', sub: '8 artists blocked their Saturday for a gig that may or may not happen. Zero compensation either way.' },
  { num: '03', title: 'If the gig happens, payment is cash.', sub: 'No invoice. No receipt. No record that this performance ever happened. Your career stays invisible.' },
];

function WaMessage({ msg, index }: { msg: typeof MESSAGES[0]; index: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, delay: index * 400, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: index * 400, useNativeDriver: true }),
    ]).start();
  }, []);

  if (msg.type === 'date') {
    return (
      <Animated.View style={[styles.waDate, { opacity: fadeAnim }]}>
        <Text style={styles.waDateText}>{msg.text}</Text>
      </Animated.View>
    );
  }

  const isOut = msg.type === 'out';

  return (
    <Animated.View style={[
      styles.waMsg,
      isOut ? styles.waMsgOut : styles.waMsgIn,
      { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      <Text style={styles.waMsgText}>
        {msg.text}
        <Text style={styles.waMsgTime}>  {msg.time}</Text>
        {isOut && (
          <Text style={[styles.waTicks, msg.ticks === 'grey' && styles.waTicksGrey]}>  {'\u2713\u2713'}</Text>
        )}
      </Text>
    </Animated.View>
  );
}

export default function WhatsAppSection() {
  return (
    <View style={styles.section}>
      {/* Section label */}
      <MaskedView maskElement={<Text style={styles.label}>SOUND FAMILIAR?</Text>}>
        <LinearGradient colors={[...LANDING.gradient.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <Text style={[styles.label, { opacity: 0 }]}>SOUND FAMILIAR?</Text>
        </LinearGradient>
      </MaskedView>

      {/* Heading */}
      <Text style={styles.heading}>
        This is what "getting a gig"{' '}
        <MaskedView maskElement={<Text style={[styles.heading, styles.headingAccent]}>actually looks like.</Text>}>
          <LinearGradient colors={[...LANDING.gradient.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[styles.heading, styles.headingAccent, { opacity: 0 }]}>actually looks like.</Text>
          </LinearGradient>
        </MaskedView>
      </Text>

      {/* WhatsApp Phone */}
      <View style={styles.waPhone}>
        <View style={styles.waStatusBar}>
          <Text style={styles.waStatusText}>9:41</Text>
          <Text style={styles.waStatusText}>5G</Text>
        </View>
        <View style={styles.waHeader}>
          <Text style={styles.waBack}>{'\u2190'}</Text>
          <View style={styles.waAvatar}>
            <Text style={styles.waAvatarText}>RS</Text>
          </View>
          <View>
            <Text style={styles.waContactName}>Rajesh (Event Organizer)</Text>
            <Text style={styles.waContactStatus}>last seen today at 2:14 PM</Text>
          </View>
        </View>
        <View style={styles.waChat}>
          <View style={styles.waDate}>
            <Text style={styles.waDateText}>Yesterday</Text>
          </View>
          {MESSAGES.map((msg, i) => (
            <WaMessage key={i} msg={msg} index={i} />
          ))}
          <Text style={styles.waNoReply}>No reply</Text>
        </View>
      </View>

      {/* Punchlines */}
      <View style={styles.punches}>
        {PUNCHES.map((p, i) => (
          <View key={i} style={[styles.punch, i === PUNCHES.length - 1 && { borderBottomWidth: 0 }]}>
            <MaskedView maskElement={<Text style={styles.punchNum}>{p.num}</Text>}>
              <LinearGradient colors={[...LANDING.gradient.colors]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={[styles.punchNum, { opacity: 0 }]}>{p.num}</Text>
              </LinearGradient>
            </MaskedView>
            <Text style={styles.punchTitle}>{p.title}</Text>
            <Text style={styles.punchSub}>{p.sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: LANDING.spacing.sectionVertical,
    paddingHorizontal: LANDING.spacing.px,
    backgroundColor: LANDING.bg.primary,
  },
  label: {
    fontFamily: LANDING.fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  heading: {
    fontFamily: LANDING.fonts.serif,
    fontSize: 28,
    lineHeight: 34,
    color: LANDING.text.primary,
    marginBottom: 40,
  },
  headingAccent: {
    // Masked with gradient
  },
  waPhone: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: LANDING.wa.bg,
    marginBottom: 32,
  },
  waStatusBar: {
    backgroundColor: LANDING.wa.header,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waStatusText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: LANDING.fonts.sans,
  },
  waHeader: {
    backgroundColor: LANDING.wa.header,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  waBack: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.4)',
  },
  waAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A3942',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waAvatarText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontFamily: LANDING.fonts.sans,
  },
  waContactName: {
    fontSize: 13,
    fontFamily: LANDING.fonts.sansSemiBold,
    color: LANDING.wa.text,
  },
  waContactStatus: {
    fontSize: 10,
    color: LANDING.wa.textDim,
    fontFamily: LANDING.fonts.sans,
  },
  waChat: {
    padding: 12,
    minHeight: 280,
    backgroundColor: LANDING.wa.bg,
  },
  waDate: {
    alignItems: 'center',
    marginVertical: 8,
  },
  waDateText: {
    fontSize: 10,
    color: LANDING.wa.textDim,
    backgroundColor: LANDING.wa.dateBg,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 6,
    overflow: 'hidden',
    fontFamily: LANDING.fonts.sans,
  },
  waMsg: {
    maxWidth: '80%',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  waMsgIn: {
    backgroundColor: LANDING.wa.msgIn,
    alignSelf: 'flex-start',
    borderTopLeftRadius: 2,
  },
  waMsgOut: {
    backgroundColor: LANDING.wa.msgOut,
    alignSelf: 'flex-end',
    borderTopRightRadius: 2,
  },
  waMsgText: {
    fontSize: 12,
    lineHeight: 18,
    color: LANDING.wa.text,
    fontFamily: LANDING.fonts.sans,
  },
  waMsgTime: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.25)',
  },
  waTicks: {
    fontSize: 10,
    color: LANDING.wa.ticks,
  },
  waTicksGrey: {
    color: 'rgba(255,255,255,0.25)',
  },
  waNoReply: {
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: 10,
    color: 'rgba(255,255,255,0.2)',
    fontStyle: 'italic',
    fontFamily: LANDING.fonts.sans,
  },
  punches: {
    marginTop: 8,
  },
  punch: {
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  punchNum: {
    fontFamily: LANDING.fonts.sansBold,
    fontSize: 32,
    opacity: 0.4,
    marginBottom: 4,
  },
  punchTitle: {
    fontFamily: LANDING.fonts.sansSemiBold,
    fontSize: 18,
    color: LANDING.text.primary,
    marginBottom: 6,
  },
  punchSub: {
    fontFamily: LANDING.fonts.sans,
    fontSize: 13,
    color: LANDING.text.dim,
    lineHeight: 21,
  },
});
