// netsa-mobile/src/components/create/pages/DateOfEventField.tsx
//
// GigForm v2.2 — "Date of event" field for Step 2.
//
// Two collapsed cards (Start date · End date). Tapping either makes THAT card
// morph (container-transform: scale + translate from its measured rect) into an
// inline calendar that floats over the form — it is NOT an accordion and does
// not push the form down. The tapped card's label cross-dissolves into the
// calendar at the halfway point.
//
// The calendar has two modes:
//   • Range  — start → end, in-between days filled (single day when start only).
//   • Specific dates — tap toggles each day; header shows removable chips.
// A range expands losslessly into day-chips when you switch to Specific, so a
// user can pick 5–11 and then punch out the 8th. Switching back to Range uses
// the envelope (earliest → latest).
//
// The fortnight strip is Monday-aligned (2 weeks under fixed Mon–Sun columns);
// swipe left/right (or the ‹ › arrows) pages it by exactly 14 days. Month is a
// Jan–Dec row; the year comes from the Year row. minimumDate defaults to today.
//
// Output value shape (see Page2Value / schedule mapping in GigFormV2):
//   { dateMode, startDate?, endDate?, dates? }  — YYYY-MM-DD strings.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, LayoutRectangle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface DateFieldValue {
  dateMode: 'range' | 'dates';
  startDate?: string; // YYYY-MM-DD (range/single) — also the envelope min for 'dates'
  endDate?: string; // YYYY-MM-DD
  dates?: string[]; // YYYY-MM-DD[] when dateMode === 'dates'
}

interface Props {
  value: DateFieldValue;
  onChange: (v: DateFieldValue) => void;
  minimumDate?: Date;
}

// ── date helpers (local, midnight-normalised) ──
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const mid = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addD = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const mondayOf = (d: Date) => {
  const x = mid(d);
  return addD(x, -((x.getDay() + 6) % 7));
};
const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const cmp = (a: Date, b: Date) => mid(a).getTime() - mid(b).getTime();
const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = (k: string) => {
  const [y, m, day] = k.split('-').map(Number);
  return new Date(y, m - 1, day);
};
const fullFmt = (d: Date) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const EASE = Easing.bezier(0.22, 1, 0.36, 1); // shared carousel/slide easing (worklet-safe)

interface Working {
  mode: 'range' | 'dates';
  focus: 'start' | 'end';
  start: Date | null;
  end: Date | null;
  picked: string[]; // keys, unsorted
  anchor: Date; // Monday of the visible fortnight
}

export default function DateOfEventField({ value, onChange, minimumDate }: Props) {
  const today = useMemo(() => mid(minimumDate ?? new Date()), [minimumDate]);
  const minAnchor = useMemo(() => mondayOf(today), [today]);
  const YEARS = useMemo(() => [today.getFullYear(), today.getFullYear() + 1, today.getFullYear() + 2], [today]);
  // compact date for the in-picker Start/End line — hide year in the current year
  const shortDate = (d: Date) =>
    `${pad(d.getDate())} ${MONTHS[d.getMonth()]}${d.getFullYear() !== today.getFullYear() ? ` '${String(d.getFullYear()).slice(2)}` : ''}`;

  const [open, setOpen] = useState(false);
  const [slotsY, setSlotsY] = useState(30); // cards' offset from the field top (below the label)
  const [pageW, setPageW] = useState(0); // carousel page (fortnight) width, measured on layout
  const [w, setW] = useState<Working>({ mode: 'range', focus: 'start', start: null, end: null, picked: [], anchor: minAnchor });

  // ── measurements for the morph ──
  const fieldW = useRef(0);
  const pickerH = useRef(0);
  const slotRects = useRef<Record<string, LayoutRectangle>>({});
  const originField = useRef<'start' | 'end' | 'dates'>('start');

  // ── animation drivers ──
  const p = useSharedValue(0); // morph progress 0→1
  const oSX = useSharedValue(1);
  const oSY = useSharedValue(1);
  const oTX = useSharedValue(0);
  const oTY = useSharedValue(0);
  const trackX = useSharedValue(0); // carousel track offset (rest = -pageW, i.e. centre page)
  const pageWSV = useSharedValue(0); // page width mirrored for the gesture worklets
  const canPrevSV = useSharedValue(0);

  useEffect(() => {
    canPrevSV.value = cmp(w.anchor, minAnchor) > 0 ? 1 : 0;
  }, [w.anchor, minAnchor, canPrevSV]);
  useEffect(() => {
    pageWSV.value = pageW;
  }, [pageW, pageWSV]);
  // snap the strip to the centre page whenever the fortnight or width changes —
  // on open, on a month/year jump, and the instant after a slide commits.
  useEffect(() => {
    if (pageW) trackX.value = -pageW;
  }, [w.anchor, pageW, trackX]);

  // ── derived helpers ──
  const sortedPicks = (ks: string[]) => ks.map(fromKey).sort((a, b) => cmp(a, b));
  const canPrev = cmp(w.anchor, minAnchor) > 0;

  // ── open / close ──
  function openFrom(field: 'start' | 'end' | 'dates') {
    if (open) return;
    originField.current = field;

    const mode = value.dateMode ?? 'range';
    let start: Date | null = null;
    let end: Date | null = null;
    let picked: string[] = [];
    if (mode === 'dates') {
      picked = value.dates ? [...value.dates] : [];
    } else {
      start = value.startDate ? fromKey(value.startDate) : null;
      end = value.endDate ? fromKey(value.endDate) : null;
    }
    const focus: 'start' | 'end' = field === 'end' && start ? 'end' : field === 'end' && !start ? 'start' : field === 'start' ? 'start' : 'start';
    const seed = mode === 'dates' ? (picked.length ? sortedPicks(picked)[0] : null) : start;
    let anchor = seed ? mondayOf(seed) : mondayOf(today);
    if (cmp(anchor, minAnchor) < 0) anchor = minAnchor;
    setW({ mode, focus, start, end, picked, anchor });

    // seed the morph transform from the tapped card's measured rect
    const PW = fieldW.current;
    const PH = pickerH.current;
    const r = slotRects.current[field];
    if (PW && PH && r) {
      oSX.value = r.width / PW;
      oSY.value = r.height / PH;
      oTX.value = r.x + r.width / 2 - PW / 2;
      oTY.value = r.y + r.height / 2 - PH / 2;
    } else {
      oSX.value = 1;
      oSY.value = 1;
      oTX.value = 0;
      oTY.value = 0;
    }
    trackX.value = -pageW;
    setOpen(true);
    p.value = withTiming(1, { duration: 420, easing: Easing.bezier(0.22, 1, 0.36, 1) });
  }

  function collapse() {
    p.value = withTiming(0, { duration: 320, easing: Easing.bezier(0.4, 0, 0.2, 1) }, (fin) => {
      if (fin) runOnJS(setOpen)(false);
    });
  }

  function commitAndClose() {
    if (w.mode === 'dates') {
      const list = sortedPicks(w.picked);
      onChange({
        dateMode: 'dates',
        dates: list.map(keyOf),
        startDate: list[0] ? keyOf(list[0]) : undefined,
        endDate: list.length ? keyOf(list[list.length - 1]) : undefined,
      });
    } else {
      onChange({
        dateMode: 'range',
        startDate: w.start ? keyOf(w.start) : undefined,
        endDate: w.end ? keyOf(w.end) : undefined,
        dates: undefined,
      });
    }
    collapse();
  }

  // ── selection ──
  function tapDate(d: Date) {
    if (cmp(d, today) < 0) return;
    setW((prev) => {
      if (prev.mode === 'dates') {
        const k = keyOf(d);
        const has = prev.picked.includes(k);
        return { ...prev, picked: has ? prev.picked.filter((x) => x !== k) : [...prev.picked, k] };
      }
      let { start, end, focus } = prev;
      if (focus === 'start') {
        start = d;
        if (end && cmp(end, d) <= 0) end = null;
        focus = 'end';
      } else {
        if (!start) {
          start = d;
          focus = 'end';
        } else if (cmp(d, start) < 0) {
          start = d;
          if (end && cmp(end, d) <= 0) end = null;
          focus = 'end';
        } else if (cmp(d, start) === 0) {
          end = null;
        } else {
          end = d;
        }
      }
      return { ...prev, start, end, focus };
    });
  }

  // ── navigation (carousel) ──
  // Swap the fortnight after a slide completes (from a swipe or an arrow). The
  // [w.anchor] effect then snaps the track back to the centre page, which now
  // holds the new dates — seamless because the old neighbour == the new centre.
  function applyCommit(dir: number) {
    setW((prev) => {
      let na = addD(prev.anchor, dir * 14);
      if (cmp(na, minAnchor) < 0) na = minAnchor;
      if (sameDay(na, prev.anchor)) {
        trackX.value = withTiming(-pageW, { duration: 180, easing: EASE }); // nothing to move → settle
        return prev;
      }
      return { ...prev, anchor: na };
    });
  }
  // arrows slide one page then commit — same motion as a completed swipe
  function slide(dir: number) {
    if (dir === -1 && !canPrev) return;
    if (!pageW) {
      applyCommit(dir);
      return;
    }
    trackX.value = withTiming(dir > 0 ? -2 * pageW : 0, { duration: 300, easing: EASE }, (fin) => {
      if (fin) runOnJS(applyCommit)(dir);
    });
  }
  function jumpTo(y: number, mo: number) {
    setW((prev) => {
      let na = mondayOf(new Date(y, mo, 1));
      if (cmp(na, minAnchor) < 0) na = minAnchor;
      return { ...prev, anchor: na };
    });
  }

  // ── mode switch (lossless: range→dates expands; dates→range envelopes) ──
  function switchMode(mode: 'range' | 'dates') {
    setW((prev) => {
      if (mode === prev.mode) return prev;
      if (mode === 'dates') {
        const picked: string[] = [];
        if (prev.start) {
          let d = prev.start;
          const end = prev.end ?? prev.start;
          while (cmp(d, end) <= 0) {
            picked.push(keyOf(d));
            d = addD(d, 1);
          }
        }
        return { ...prev, mode, picked };
      }
      const list = sortedPicks(prev.picked);
      return {
        ...prev,
        mode,
        start: list[0] ?? null,
        end: list.length > 1 ? list[list.length - 1] : null,
        focus: list.length ? 'end' : 'start',
      };
    });
  }

  function clearSel() {
    setW((prev) =>
      prev.mode === 'range' ? { ...prev, start: null, end: null, focus: 'start' } : { ...prev, picked: [] },
    );
  }

  const hasSel = w.mode === 'range' ? !!w.start : w.picked.length > 0;
  const focus = anchorFocus(w.anchor); // dominant month/year of the visible fortnight
  const tileW = pageW > 0 ? Math.floor((pageW - 6 * 6) / 7) : 0; // 7 tiles + 6 gaps of 6px

  // one fortnight's 14 tiles for the carousel page starting at `a`
  function renderTiles(a: Date) {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = addD(a, i);
      const disabled = cmp(d, today) < 0;
      let state: 'disabled' | 'sel' | 'inrange' | 'plain' = 'plain';
      if (disabled) state = 'disabled';
      else if (w.mode === 'dates') state = w.picked.includes(keyOf(d)) ? 'sel' : 'plain';
      else if (sameDay(d, w.start) || sameDay(d, w.end)) state = 'sel';
      else if (w.start && w.end && cmp(d, w.start) > 0 && cmp(d, w.end) < 0) state = 'inrange';
      const isToday = sameDay(d, today);
      return (
        <Pressable
          key={keyOf(d)}
          disabled={disabled}
          onPress={() => tapDate(d)}
          style={[
            styles.tile,
            { width: tileW },
            state === 'plain' && styles.tilePlain,
            state === 'inrange' && styles.tileRange,
            state === 'sel' && styles.tileSel,
          ]}
        >
          {d.getDate() === 1 && <Text style={styles.mm}>{MONTHS[d.getMonth()]}</Text>}
          <Text
            style={[
              styles.tileTxt,
              state === 'sel' && styles.tileTxtSel,
              state === 'inrange' && styles.tileTxtRange,
              state === 'disabled' && styles.tileTxtOff,
            ]}
          >
            {d.getDate()}
          </Text>
          {isToday && <View style={[styles.dot, state === 'sel' && styles.dotOnSel]} />}
        </Pressable>
      );
    });
  }

  // ── carousel swipe: drag the strip, snap at 30% (or a flick), else spring back ──
  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-16, 16])
    .onUpdate((e) => {
      'worklet';
      let d = e.translationX;
      if (d > 0 && canPrevSV.value === 0) d *= 0.3; // rubber-band at today
      trackX.value = -pageWSV.value + d; // neighbour tracks the finger
    })
    .onEnd((e) => {
      'worklet';
      const wdt = pageWSV.value;
      const past = Math.abs(e.translationX) >= wdt * 0.3; // 30% revealed
      const flick = Math.abs(e.velocityX) > 500; // px/s
      if (e.translationX < 0 && (past || (flick && e.velocityX < 0))) {
        trackX.value = withTiming(-2 * wdt, { duration: 260, easing: EASE }, (fin) => {
          if (fin) runOnJS(applyCommit)(1);
        });
      } else if (e.translationX > 0 && canPrevSV.value === 1 && (past || (flick && e.velocityX > 0))) {
        trackX.value = withTiming(0, { duration: 260, easing: EASE }, (fin) => {
          if (fin) runOnJS(applyCommit)(-1);
        });
      } else {
        trackX.value = withTiming(-wdt, { duration: 200, easing: EASE }); // spring back
      }
    });

  // ── animated styles ──
  const pickerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.06], [0, 1], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(p.value, [0, 1], [oTX.value, 0]) },
      { translateY: interpolate(p.value, [0, 1], [oTY.value, 0]) },
      { scaleX: interpolate(p.value, [0, 1], [oSX.value, 1]) },
      { scaleY: interpolate(p.value, [0, 1], [oSY.value, 1]) },
    ],
  }));
  const contentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.5, 1], [0, 0, 1], Extrapolation.CLAMP),
  }));
  const ghostStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.34, 0.55, 1], [1, 1, 0, 0], Extrapolation.CLAMP),
  }));
  const scrimStyle = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0, 1], [0, 1], Extrapolation.CLAMP) }));
  const slotsStyle = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0, 0.15], [1, 0], Extrapolation.CLAMP) }));
  const trackStyle = useAnimatedStyle(() => ({ transform: [{ translateX: trackX.value }] }));

  // ── collapsed cards (source of truth = props.value) ──
  const isDatesCommitted = value.dateMode === 'dates' && !!value.dates && value.dates.length > 0;

  const ghostLabel = (() => {
    const f = originField.current;
    if (isDatesCommitted) return { cap: 'Date of event', val: `${value.dates!.length} date${value.dates!.length > 1 ? 's' : ''}` };
    if (f === 'end')
      return { cap: 'End date', val: value.endDate ? fullFmt(fromKey(value.endDate)) : value.startDate ? 'Add end (optional)' : 'Select' };
    return { cap: 'Start date', val: value.startDate ? fullFmt(fromKey(value.startDate)) : 'Select' };
  })();

  return (
    <View
      style={[styles.field, open && styles.fieldLift]}
      onLayout={(e) => {
        fieldW.current = e.nativeEvent.layout.width;
      }}
    >
      {/* label */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>Date of event</Text>
        <Text style={styles.req}> *</Text>
      </View>

      {/* collapsed cards */}
      <Animated.View
        style={[styles.slots, slotsStyle]}
        pointerEvents={open ? 'none' : 'auto'}
        onLayout={(e) => setSlotsY(e.nativeEvent.layout.y)}
      >
        {isDatesCommitted ? (
          <Pressable
            style={styles.summaryCard}
            onPress={() => openFrom('dates')}
            onLayout={(e) => {
              slotRects.current.dates = e.nativeEvent.layout;
            }}
            accessibilityRole="button"
            accessibilityLabel={`Date of event, ${value.dates!.length} dates. Edit`}
          >
            <Text style={styles.cap}>Date of event</Text>
            <Text style={styles.summaryVal}>
              {value.dates!.length} date{value.dates!.length > 1 ? 's' : ''}
            </Text>
            <Text style={styles.summarySub}>{datesSummary(value.dates!, today)}</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              style={styles.card}
              onPress={() => openFrom('start')}
              onLayout={(e) => {
                slotRects.current.start = e.nativeEvent.layout;
              }}
              accessibilityRole="button"
              accessibilityLabel="Start date"
            >
              <Text style={styles.cap}>Start date</Text>
              <Text style={[styles.cardVal, !value.startDate && styles.ph]}>
                {value.startDate ? fullFmt(fromKey(value.startDate)) : 'Select'}
              </Text>
            </Pressable>
            <Text style={styles.slotDash}>—</Text>
            <Pressable
              style={styles.card}
              onPress={() => openFrom('end')}
              onLayout={(e) => {
                // end card sits after the dash; its x is relative to the row
                slotRects.current.end = e.nativeEvent.layout;
              }}
              accessibilityRole="button"
              accessibilityLabel="End date"
            >
              <Text style={styles.cap}>End date</Text>
              <Text style={[styles.cardVal, !value.endDate && styles.ph]}>
                {value.endDate ? fullFmt(fromKey(value.endDate)) : value.startDate ? 'Add end (optional)' : 'Select'}
              </Text>
            </Pressable>
          </>
        )}
      </Animated.View>

      {/* scrim (dims the form; taps commit + close) */}
      <AnimatedPressable
        style={[styles.scrim, scrimStyle]}
        pointerEvents={open ? 'auto' : 'none'}
        onPress={commitAndClose}
        accessibilityElementsHidden={!open}
      />

      {/* morphing picker overlay */}
      <Animated.View
        style={[styles.picker, { top: slotsY }, pickerStyle]}
        pointerEvents={open ? 'auto' : 'none'}
        onLayout={(e) => {
          if (e.nativeEvent.layout.height) pickerH.current = e.nativeEvent.layout.height;
        }}
      >
        {/* ghost = the tapped card's own label, fades out by ~50% */}
        <Animated.View style={[styles.ghost, ghostStyle]} pointerEvents="none">
          <Text style={styles.cap}>{ghostLabel.cap}</Text>
          <Text style={styles.cardVal}>{ghostLabel.val}</Text>
        </Animated.View>

        <Animated.View style={contentStyle}>
          {/* mode toggle */}
          <View style={styles.modeseg}>
            {(['range', 'dates'] as const).map((m) => (
              <Pressable key={m} style={[styles.seg, w.mode === m && styles.segOn]} onPress={() => switchMode(m)}>
                <Text style={[styles.segTxt, w.mode === m && styles.segTxtOn]}>{m === 'range' ? 'Range' : 'Specific dates'}</Text>
              </Pressable>
            ))}
          </View>

          {/* header line — range tabs OR date chips + Clear */}
          <View style={styles.pcap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recap} contentContainerStyle={styles.recapContent}>
              {w.mode === 'range' ? (
                <>
                  <Pressable
                    style={[styles.rtab, w.focus === 'start' && styles.rtabOn]}
                    onPress={() => setW((p2) => ({ ...p2, focus: 'start' }))}
                  >
                    <Text style={[styles.rtabTxt, w.focus === 'start' && styles.rtabTxtOn]}>
                      Start · {w.start ? shortDate(w.start) : 'Pick'}
                    </Text>
                  </Pressable>
                  <Text style={styles.sep}>—</Text>
                  <Pressable
                    style={[styles.rtab, w.focus === 'end' && styles.rtabOn]}
                    onPress={() => setW((p2) => ({ ...p2, focus: p2.start ? 'end' : 'start' }))}
                  >
                    <Text style={[styles.rtabTxt, w.focus === 'end' && styles.rtabTxtOn]}>
                      End · {w.end ? shortDate(w.end) : 'Pick'}
                    </Text>
                  </Pressable>
                </>
              ) : w.picked.length === 0 ? (
                <Text style={styles.emptyChip}>Tap the days this gig runs</Text>
              ) : (
                sortedPicks(w.picked).map((d) => (
                  <Pressable
                    key={keyOf(d)}
                    style={styles.dchip}
                    onPress={() => setW((p2) => ({ ...p2, picked: p2.picked.filter((x) => x !== keyOf(d)) }))}
                  >
                    <Text style={styles.dchipTxt}>{shortDate(d)}</Text>
                    <X size={12} color="#ff9e7a" />
                  </Pressable>
                ))
              )}
            </ScrollView>
            <Pressable onPress={clearSel} disabled={!hasSel} style={styles.clrBtn}>
              <Text style={[styles.clr, !hasSel && styles.clrOff]}>Clear</Text>
            </Pressable>
          </View>

          {/* weekday header */}
          <View style={styles.wk}>
            {WK.map((d) => (
              <Text key={d} style={styles.wkTxt}>
                {d}
              </Text>
            ))}
          </View>

          {/* fortnight carousel — prev · current · next pages on a sliding track */}
          <View
            style={styles.gridwrap}
            onLayout={(e) => {
              const wdt = e.nativeEvent.layout.width;
              if (wdt && wdt !== pageW) setPageW(wdt);
            }}
          >
            <GestureDetector gesture={pan}>
              <Animated.View style={[styles.track, trackStyle]}>
                <View style={[styles.page, { width: pageW }]}>{canPrev ? renderTiles(addD(w.anchor, -14)) : null}</View>
                <View style={[styles.page, { width: pageW }]}>{renderTiles(w.anchor)}</View>
                <View style={[styles.page, { width: pageW }]}>{renderTiles(addD(w.anchor, 14))}</View>
              </Animated.View>
            </GestureDetector>
          </View>

          {/* arrows + hint */}
          <View style={styles.navRow}>
            <Pressable style={[styles.nav, !canPrev && styles.navOff]} disabled={!canPrev} onPress={() => slide(-1)}>
              <ChevronLeft size={16} color="#D4D4D8" />
            </Pressable>
            <Text style={styles.hint}>swipe for previous · next</Text>
            <Pressable style={styles.nav} onPress={() => slide(1)}>
              <ChevronRight size={16} color="#D4D4D8" />
            </Pressable>
          </View>

          {/* month row (Jan–Dec) */}
          <Text style={styles.rowLbl}>Month</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {MONTHS.map((m, i) => {
              const past = focus.y === today.getFullYear() && i < today.getMonth();
              const on = i === focus.m;
              return (
                <Pressable
                  key={m}
                  disabled={past}
                  onPress={() => jumpTo(focus.y, i)}
                  style={[styles.mchip, on && styles.mchipOn, past && styles.mchipPast]}
                >
                  <Text style={[styles.mchipTxt, on && styles.mchipTxtOn]}>{m}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* year row */}
          <Text style={styles.rowLbl}>Year</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {YEARS.map((y) => {
              const on = y === focus.y;
              return (
                <Pressable key={y} onPress={() => jumpTo(y, focus.m)} style={[styles.mchip, on && styles.mchipOn]}>
                  <Text style={[styles.mchipTxt, on && styles.mchipTxtOn]}>{y}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Done */}
          <Pressable style={[styles.done, !hasSel && styles.doneOff]} disabled={!hasSel} onPress={commitAndClose}>
            <Text style={[styles.doneTxt, !hasSel && styles.doneTxtOff]}>Done</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// dominant month/year of the visible fortnight (matches the mockup's deriveFocus)
function anchorFocus(anchor: Date): { y: number; m: number } {
  const counts: Record<string, number> = {};
  let best = '';
  let bc = -1;
  for (let i = 0; i < 14; i++) {
    const d = addD(anchor, i);
    const k = `${d.getFullYear()}-${d.getMonth()}`;
    counts[k] = (counts[k] ?? 0) + 1;
  }
  for (const k of Object.keys(counts)) {
    if (counts[k] > bc) {
      bc = counts[k];
      best = k;
    }
  }
  const [y, m] = best.split('-').map(Number);
  return { y, m };
}
function datesSummary(keys: string[], today: Date): string {
  const ds = keys.map(fromKey).sort((a, b) => cmp(a, b));
  const yr = ds[0].getFullYear();
  const sameY = ds.every((d) => d.getFullYear() === yr);
  const parts = ds.map(
    (d) => `${pad(d.getDate())} ${MONTHS[d.getMonth()]}${sameY ? '' : ` '${String(d.getFullYear()).slice(2)}`}`,
  );
  let txt = parts.slice(0, 4).join(', ');
  if (parts.length > 4) txt += ` +${parts.length - 4}`;
  if (sameY) txt += ` · ${yr}`;
  return txt;
}

const styles = StyleSheet.create({
  field: { position: 'relative', zIndex: 1 },
  fieldLift: { zIndex: 50 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  label: { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#F0F0F2', letterSpacing: -0.2 },
  req: { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#FF6B35' },

  slots: { flexDirection: 'row', alignItems: 'stretch', gap: 11 },
  card: {
    flex: 1,
    backgroundColor: '#101016',
    borderWidth: 1,
    borderColor: '#262630',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 3,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#101016',
    borderWidth: 1,
    borderColor: '#262630',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 3,
  },
  cap: { fontFamily: 'Outfit-SemiBold', fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: '#8B8B99' },
  cardVal: { fontFamily: 'Outfit-Medium', fontSize: 14.5, color: '#FFFFFF' },
  summaryVal: { fontFamily: 'Outfit-SemiBold', fontSize: 15, color: '#FFFFFF' },
  summarySub: { fontFamily: 'Outfit-Regular', fontSize: 11.5, color: '#8B8B99' },
  ph: { fontFamily: 'Outfit-Regular', color: '#54545c' },
  slotDash: { alignSelf: 'center', color: '#54545c', fontSize: 15 },

  scrim: { position: 'absolute', top: -2000, bottom: -2000, left: -2000, right: -2000, backgroundColor: 'rgba(3,3,5,0.55)', zIndex: 40 },

  picker: {
    position: 'absolute',
    top: 34, // sits just under the label row
    left: 0,
    right: 0,
    backgroundColor: '#0d0d12',
    borderWidth: 1,
    borderColor: '#3a2a22',
    borderRadius: 16,
    padding: 14,
    zIndex: 50,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 30 },
    elevation: 24,
  },
  ghost: { position: 'absolute', top: 14, left: 15, gap: 3 },

  modeseg: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: '#141419',
    borderWidth: 1,
    borderColor: '#26262f',
    borderRadius: 11,
    padding: 3,
    gap: 3,
    marginBottom: 11,
  },
  seg: { paddingVertical: 6, paddingHorizontal: 13, borderRadius: 8 },
  segOn: { backgroundColor: '#FF6B35' },
  segTxt: { fontFamily: 'Outfit-Medium', fontSize: 12, color: '#A1A1AA' },
  segTxtOn: { fontFamily: 'Outfit-SemiBold', color: '#fff' },

  pcap: { flexDirection: 'row', alignItems: 'center', minHeight: 34, gap: 8 },
  recap: { flex: 1 },
  recapContent: { alignItems: 'center', gap: 5, paddingRight: 6 },
  rtab: { paddingVertical: 5, paddingHorizontal: 7, borderRadius: 8 },
  rtabOn: { backgroundColor: 'rgba(255,107,53,0.08)' },
  rtabTxt: { fontFamily: 'Outfit-Regular', fontSize: 12.5, color: '#8B8B99' },
  rtabTxtOn: { fontFamily: 'Outfit-SemiBold', color: '#FF6B35' },
  sep: { color: '#54545c' },
  emptyChip: { fontFamily: 'Outfit-Regular', fontSize: 12, color: '#8B8B99' },
  dchip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,107,53,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,53,0.34)',
    borderRadius: 9,
    paddingLeft: 9,
    paddingRight: 6,
    paddingVertical: 5,
  },
  dchipTxt: { fontFamily: 'Outfit-Medium', fontSize: 12, color: '#FFCBB2' },
  clrBtn: { paddingVertical: 6, paddingHorizontal: 6 },
  clr: { fontFamily: 'Outfit-SemiBold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: '#A1A1AA' },
  clrOff: { opacity: 0.35 },

  wk: { flexDirection: 'row', marginTop: 6, marginBottom: 9 },
  wkTxt: { flex: 1, textAlign: 'center', fontFamily: 'Outfit-SemiBold', fontSize: 9.5, letterSpacing: 0.5, color: '#8B8B99' },

  gridwrap: { overflow: 'hidden' },
  track: { flexDirection: 'row' },
  page: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tilePlain: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#3A3A47' },
  tileRange: { backgroundColor: 'rgba(255,107,53,0.18)' },
  tileSel: { backgroundColor: '#FF6B35' },
  tileTxt: { fontFamily: 'Outfit-Regular', fontSize: 15, color: '#D4D4D8' },
  tileTxtSel: { fontFamily: 'Outfit-Bold', color: '#fff' },
  tileTxtRange: { color: '#FFCBB2' },
  tileTxtOff: { color: '#3F3F46' },
  mm: { position: 'absolute', top: 4, right: 6, fontFamily: 'Outfit-SemiBold', fontSize: 8, color: '#8B8B99' },
  dot: { position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FF6B35' },
  dotOnSel: { backgroundColor: '#fff' },

  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 5, marginBottom: 2 },
  nav: {
    width: 34,
    height: 30,
    borderRadius: 9,
    backgroundColor: '#141419',
    borderWidth: 1,
    borderColor: '#26262f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navOff: { opacity: 0.3 },
  hint: { fontFamily: 'Outfit-Medium', fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: '#54545c' },

  rowLbl: { fontFamily: 'Outfit-SemiBold', fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: '#8B8B99', marginTop: 15, marginBottom: 8 },
  chipRow: { gap: 7, paddingRight: 6 },
  mchip: {
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: '#141419',
    borderWidth: 1,
    borderColor: '#26262f',
  },
  mchipOn: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
  mchipPast: { opacity: 0.3 },
  mchipTxt: { fontFamily: 'Outfit-Regular', fontSize: 13, color: '#A1A1AA' },
  mchipTxtOn: { fontFamily: 'Outfit-SemiBold', color: '#fff' },

  done: {
    marginTop: 16,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneOff: { backgroundColor: '#1a1a20' },
  doneTxt: { fontFamily: 'Outfit-Bold', fontSize: 15, letterSpacing: 0.4, color: '#fff' },
  doneTxtOff: { color: '#54545c' },
});
