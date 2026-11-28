/**
 * The per-field bodies for the host "Edit in Preview" focused sheets (P2). Each one
 * reuses the composer v4 `ui/*` primitives and lifts the matching step's handlers 1:1
 * (Step1Event for type/details, Step4Register for questions/age, Step6Publish for
 * visibility, Step3Spots for refund) so "edit" and "create" stay the same inputs.
 *
 * All of them mutate the shared composer store (useComposerStoreV4) directly and then
 * call `scheduleSave` — the host zone's commit into useEventEdit's debounced diff save.
 * Routing (eventType/topicTags → composer path) and the blank-title guard live in
 * buildEventPatch, so these bodies only ever worry about the form.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Switch } from 'react-native';
import { Check, ChevronDown, Plus, X, Calendar, MapPin, Video, Link as LinkIcon, Tag, Users } from 'lucide-react-native';
import { useComposerStoreV4 } from '../../composer/v4/useComposerStoreV4';
import { EVENT_TYPE_PRESETS, EVENT_TYPE_KEYS, presetFor } from '../../composer/v4/eventTypePresets';
import { Group, TagInput, ChipsMulti, Segmented, TextField, Hint, Pills, Field, Chips, ToggleRow, Card } from '../../composer/v4/ui';
import type { QuestionV4, SkillLevelV4, OfferV4 } from '../../composer/v4/composerForm';
import { C, F, R } from '../../composer/v4/theme';
import { formatRupees } from '@/lib/eventPricing';
import { CalendarModal } from '@/components/ui/CalendarModal';

export interface SheetBodyProps {
  /** Commit: debounced diff save in useEventEdit (idempotent). */
  scheduleSave: () => void;
}

const WHO_SUGGEST = ['Dancer', 'Actor', 'Musician', 'Singer', 'DJ', 'Model', 'Photographer', 'Director'];
const LEVELS: { label: string; v: 'all' | SkillLevelV4 }[] = [
  { label: 'Any', v: 'all' }, { label: 'Beginner', v: 'beginner' }, { label: 'Intermediate', v: 'intermediate' }, { label: 'Advanced', v: 'advanced' },
];
const STYLE_SUGGEST = ['Kathak', 'Classical', 'Hip-hop', 'Contemporary'];
const LANG_SUGGEST = ['Hindi', 'English', 'Marathi'];
const AGES: { label: string; v: number }[] = [
  { label: 'Any age', v: 0 }, { label: '16+', v: 16 }, { label: '18+', v: 18 }, { label: '21+', v: 21 },
];
const Q_TYPES: { k: QuestionV4['type']; label: string }[] = [
  { k: 'text', label: 'Short answer' }, { k: 'choice', label: 'Choice' },
  { k: 'link', label: 'Link' }, { k: 'photo', label: 'Photo' }, { k: 'yes_no', label: 'Yes / no' },
];
const MAX_Q = 3;
const SELECTABLE = EVENT_TYPE_KEYS.filter((k) => k !== 'other');

/* ───────────────────────────── Event type ───────────────────────────── */
// A flat list of presets + a "type your own" row (the composer's EventTypeField is an
// anchored dropdown; a list is the idiomatic sheet form and avoids an absolutely-
// positioned overlay inside a Modal). Same store writes as EventTypeField.
export function TypeSheetBody({ scheduleSave }: SheetBodyProps) {
  const form = useComposerStoreV4((s) => s.form);
  const setEventType = useComposerStoreV4((s) => s.setEventType);
  const update = useComposerStoreV4((s) => s.update);
  const [custom, setCustom] = useState('');
  const isCustom = !!form.eventTypeLabel;

  const pickPreset = (key: string) => {
    setEventType(key);
    update('eventTypeLabel', undefined);
    setCustom('');
    scheduleSave();
  };
  const commitCustom = () => {
    const t = custom.trim();
    if (!t) return;
    setEventType(t);
    update('eventTypeLabel', t);
    setCustom('');
    scheduleSave();
  };

  return (
    <View style={{ gap: 8 }}>
      {SELECTABLE.map((k) => {
        const on = !isCustom && form.eventType === k;
        return (
          <Pressable key={k} onPress={() => pickPreset(k)} style={[s.typeRow, on && s.typeRowOn]} accessibilityRole="radio" accessibilityState={{ selected: on }}>
            <Text style={[s.typeTxt, on && s.typeTxtOn]}>{EVENT_TYPE_PRESETS[k].label}</Text>
            {on ? <Check size={16} color={C.orange} strokeWidth={2.6} /> : null}
          </Pressable>
        );
      })}
      <View style={s.customWrap}>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          placeholder={isCustom ? form.eventTypeLabel : 'Or type your own…'}
          placeholderTextColor={isCustom ? C.orangeInk : C.dim2}
          style={s.customInput}
          returnKeyType="done"
          onSubmitEditing={commitCustom}
        />
        <Pressable onPress={commitCustom} disabled={!custom.trim()} style={[s.addBtn, !custom.trim() && s.addBtnOff]}>
          <Text style={s.addBtnTxt}>Add</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ─────────────────────── Audience & details (public) ─────────────────── */
export function DetailsSheetBody({ scheduleSave }: SheetBodyProps) {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);

  const addWho = (t: string) => {
    if (!t) return;
    const base = form.openToAll ? [] : form.whoFor;
    if (base.includes(t) || base.length >= 3) return;
    if (form.openToAll) update('openToAll', false);
    update('whoFor', [...base, t]);
    scheduleSave();
  };
  const removeWho = (t: string) => { update('whoFor', form.whoFor.filter((x) => x !== t)); scheduleSave(); };
  const chooseAllCreatives = () => { if (form.whoFor.length) update('whoFor', []); update('openToAll', true); scheduleSave(); };
  const addStyle = (t: string) => { if (t && !form.styles.includes(t)) { update('styles', [...form.styles, t]); scheduleSave(); } };
  const addLang = (t: string) => { if (t && !form.languages.includes(t)) { update('languages', [...form.languages, t]); scheduleSave(); } };
  const toggleLevel = (v: string) => {
    if (v === 'all') { update('levels', []); scheduleSave(); return; }
    const lv = v as SkillLevelV4;
    update('levels', form.levels.includes(lv) ? form.levels.filter((x) => x !== lv) : [...form.levels, lv]);
    scheduleSave();
  };

  return (
    <View>
      <Group label="Who's it for" required sub="Up to 3. We suggest the event to these artists.">
        <TagInput
          tags={form.openToAll ? ['All creatives'] : form.whoFor}
          onRemove={(t) => (t === 'All creatives' ? (update('openToAll', false), scheduleSave()) : removeWho(t))}
          placeholder={form.openToAll ? '' : form.whoFor.length < 3 ? 'Pick or type an artist type…' : '3 of 3'}
          suggestions={[...(form.openToAll ? [] : ['All creatives']), ...WHO_SUGGEST].filter((w) => !form.whoFor.includes(w))}
          onAddSuggestion={(w) => (w === 'All creatives' ? chooseAllCreatives() : addWho(w))}
        />
        <View style={s.lvl}>
          <Text style={s.lvlLab}>LEVEL · pick any</Text>
          <ChipsMulti
            options={LEVELS.map((l) => ({ label: l.label, key: l.v }))}
            values={form.levels.length ? form.levels : ['all']}
            onToggle={toggleLevel}
          />
        </View>
      </Group>

      <Group label="Style / genre" optional>
        <TagInput tags={form.styles} onRemove={(t) => { update('styles', form.styles.filter((x) => x !== t)); scheduleSave(); }}
          placeholder="Add a style…" suggestions={STYLE_SUGGEST.filter((x) => !form.styles.includes(x))} onAddSuggestion={addStyle} />
      </Group>

      <Group label="Language" optional>
        <TagInput tags={form.languages} onRemove={(t) => { update('languages', form.languages.filter((x) => x !== t)); scheduleSave(); }}
          placeholder="Add a language…" suggestions={LANG_SUGGEST.filter((x) => !form.languages.includes(x))} onAddSuggestion={addLang} />
      </Group>
    </View>
  );
}

/* ───────────────────────────── Age limit ────────────────────────────── */
export function AgeSheetBody({ scheduleSave }: SheetBodyProps) {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const ageVal = form.ageRestriction ?? 0;
  return (
    <View style={s.chips}>
      {AGES.map((a) => {
        const on = a.v === ageVal;
        return (
          <Pressable key={a.v} onPress={() => { update('ageRestriction', a.v); scheduleSave(); }} style={[s.chip, on && s.chipOn]}
            accessibilityRole="radio" accessibilityState={{ selected: on }}>
            <Text style={[s.chipTxt, on && s.chipTxtOn]}>{a.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ───────────────────────────── Visibility ───────────────────────────── */
export function VisibilitySheetBody({ scheduleSave }: SheetBodyProps) {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const vis = form.visibility === 'public' ? 'public' : 'unlisted';
  return (
    <View style={{ gap: 10 }}>
      <Segmented<'public' | 'unlisted'>
        value={vis}
        onChange={(v) => { update('visibility', v); scheduleSave(); }}
        options={[{ key: 'public', label: 'Public' }, { key: 'unlisted', label: 'Only people with the link' }]}
      />
      <Hint>{vis === 'public' ? 'Anyone can find it in search and on your profile.' : 'Hidden from search — only people you send the link to can open it.'}</Hint>
    </View>
  );
}

/* ───────────────────────────── Refund policy ─────────────────────────── */
export function RefundSheetBody({ scheduleSave }: SheetBodyProps) {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  return (
    <View style={{ gap: 10 }}>
      <Segmented<'flex_24h' | 'firm' | 'custom'>
        value={form.refundPolicy}
        onChange={(v) => { update('refundPolicy', v); scheduleSave(); }}
        options={[{ key: 'flex_24h', label: 'Flexible' }, { key: 'firm', label: 'Firm' }, { key: 'custom', label: 'Custom' }]}
      />
      {form.refundPolicy === 'flex_24h' ? <Hint>Full refund up to 24h before the event.</Hint> : null}
      {form.refundPolicy === 'firm' ? <Hint>No refunds once registered.</Hint> : null}
      {form.refundPolicy === 'custom' ? (
        <TextField
          multiline
          placeholder="Describe your refund policy — e.g. Full refund up to 7 days before, then 50%."
          value={form.refundNote}
          onChangeText={(t) => { update('refundNote', t); scheduleSave(); }}
        />
      ) : null}
    </View>
  );
}

/* ─────────────────────── Registration questions ─────────────────────── */
export function QuestionsSheetBody({ scheduleSave }: SheetBodyProps) {
  const form = useComposerStoreV4((s) => s.form);
  const { addQuestion, updateQuestion, removeQuestion } = useComposerStoreV4.getState();
  const preset = presetFor(form.eventType);
  const [typeOpenFor, setTypeOpenFor] = useState<string | null>(null);

  // A bare "add" doesn't save (no label yet → the backend would strip it); typing the
  // label, or any edit to a question that has one, commits.
  const editQ = (q: QuestionV4, patch: Partial<QuestionV4>) => {
    updateQuestion(q.id, patch);
    const label = (patch.label ?? q.label).trim();
    if (label) scheduleSave();
  };
  const setOption = (q: QuestionV4, i: number, v: string) =>
    editQ(q, { options: (q.options ?? ['', '']).map((o, k) => (k === i ? v : o)) });

  return (
    <View>
      <Text style={s.footTxt}>You&apos;ll always get their <Text style={s.footB}>name</Text> and <Text style={s.footB}>phone</Text>. Add up to {MAX_Q} questions asked at sign-up.</Text>

      {form.questions.map((q, i) => (
        <View key={q.id} style={s.qcard}>
          <View style={s.qHead}>
            <Text style={s.qEyebrow}>QUESTION {i + 1}</Text>
            <Pressable onPress={() => { removeQuestion(q.id); setTypeOpenFor((o) => (o === q.id ? null : o)); scheduleSave(); }} hitSlop={8}>
              <X size={15} color={C.dim2} />
            </Pressable>
          </View>
          <TextInput value={q.label} onChangeText={(t) => editQ(q, { label: t })}
            placeholder="What do you want to ask?" placeholderTextColor={C.dim2} style={s.qInput} />

          <View style={s.qMeta}>
            <Pressable onPress={() => setTypeOpenFor(typeOpenFor === q.id ? null : q.id)} style={s.sel}>
              <Text style={s.selTxt}>{Q_TYPES.find((t) => t.k === q.type)?.label ?? 'Short answer'}</Text>
              <ChevronDown size={14} color={C.dim} />
            </Pressable>
            <View style={s.reqWrap}>
              <Text style={[s.reqLab, q.required && s.reqLabOn]}>Required</Text>
              <Switch value={q.required} onValueChange={(v) => editQ(q, { required: v })}
                trackColor={{ true: C.orange, false: '#2A2A34' }} thumbColor="#fff" />
            </View>
          </View>

          {typeOpenFor === q.id ? (
            <View style={s.menu}>
              {Q_TYPES.map((t) => {
                const sel = t.k === q.type;
                return (
                  <Pressable key={t.k} onPress={() => { editQ(q, { type: t.k }); setTypeOpenFor(null); }} style={s.menuItem}>
                    <Text style={[s.menuTxt, sel && s.menuTxtOn]}>{t.label}</Text>
                    {sel ? <Check size={14} color={C.orange} /> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {q.type === 'choice' ? (
            <View style={{ gap: 6 }}>
              {(q.options ?? ['', '']).map((opt, i2) => (
                <View key={i2} style={s.opt}>
                  <View style={s.oDot} />
                  <TextInput value={opt} onChangeText={(t) => setOption(q, i2, t)} placeholder={`Option ${i2 + 1}`}
                    placeholderTextColor={C.dim2} style={s.optInput} />
                </View>
              ))}
              <Pressable onPress={() => editQ(q, { options: [...(q.options ?? ['', '']), ''] })} style={s.optAdd}>
                <Plus size={11} color={C.orange} strokeWidth={2.6} /><Text style={s.optAddTxt}>Add a choice</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ))}

      {form.questions.length < MAX_Q ? (
        <>
          <Pressable onPress={() => addQuestion()} style={s.addRow}>
            <View style={s.addPlus}><Plus size={13} color={C.orange} strokeWidth={2.6} /></View>
            <Text style={s.addTxt}>Ask a question</Text>
            {form.questions.length === 0 ? <Text style={s.addMeta}>optional</Text> : null}
          </Pressable>
          {form.questions.length >= 1 ? (
            <Pills options={preset.questionSuggestions.map((x) => ({ label: x }))}
              onPress={(lbl) => { addQuestion({ label: lbl, type: lbl.toLowerCase().includes('link') ? 'link' : 'text' }); scheduleSave(); }} />
          ) : null}
        </>
      ) : null}
    </View>
  );
}

/* ──────────────────────── Date & location (P3) ──────────────────────── */
const DURATIONS: { label: string; v: string }[] = [
  { label: '1 hour', v: 'h1' }, { label: '2 hours', v: 'h2' }, { label: '3 hours', v: 'h3' }, { label: 'Half day', v: 'half' }, { label: 'Full day', v: 'full' },
];
const fmtDateLong = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : undefined);
const fmtDM = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');

export function DateLocationSheetBody({ scheduleSave }: SheetBodyProps) {
  const form = useComposerStoreV4((st) => st.form);
  const update = useComposerStoreV4((st) => st.update);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [showEnd, setShowEnd] = useState(!!form.endsAt);
  const online = form.format === 'online';
  const setLoc = (patch: Partial<typeof form.location>) => { update('location', { ...form.location, ...patch }); scheduleSave(); };

  return (
    <View>
      <Group label="Date" required>
        <Field icon={Calendar} value={fmtDateLong(form.startsAt)} placeholder="Pick a start date" onPress={() => setStartOpen(true)} right={null} />
        {showEnd || form.endsAt ? (
          <Field icon={Calendar} value={fmtDateLong(form.endsAt)} placeholder="Pick an end date (multi-day)" onPress={() => setEndOpen(true)} right={null} />
        ) : (
          <Pressable onPress={() => setShowEnd(true)}><Text style={s.addEnd}>+ End date</Text></Pressable>
        )}
      </Group>

      <Group label="How long" optional sub="Leave blank if the time isn't fixed yet.">
        <Chips options={DURATIONS.map((d) => d.label)} value={DURATIONS.find((d) => d.v === form.durationKind)?.label}
          onChange={(lbl) => { update('durationKind', DURATIONS.find((d) => d.label === lbl)!.v); scheduleSave(); }} />
        <ToggleRow label="Time to be announced" value={form.timeTbd} onChange={(v) => { update('timeTbd', v); scheduleSave(); }} />
      </Group>

      <Group label="Format" required>
        <Segmented value={form.format} onChange={(v) => { update('format', v); scheduleSave(); }}
          options={[{ key: 'in_person', label: 'In person', icon: MapPin }, { key: 'online', label: 'Online', icon: Video }]} />
      </Group>

      {!online ? (
        <>
          <Group label="Location" required>
            <TextField icon={MapPin} placeholder="Venue name" value={form.location.venueName} onChangeText={(t) => setLoc({ venueName: t })} />
            <TextField placeholder="Address" value={form.location.address} onChangeText={(t) => setLoc({ address: t })} />
            <View style={s.row2}>
              <View style={{ flex: 1 }}><TextField placeholder="City" value={form.location.city} onChangeText={(t) => setLoc({ city: t })} /></View>
              <View style={{ flex: 1 }}><TextField placeholder="State" value={form.location.state} onChangeText={(t) => setLoc({ state: t })} /></View>
            </View>
            <TextField placeholder="Landmark (optional)" value={form.location.landmark} onChangeText={(t) => setLoc({ landmark: t })} />
          </Group>
          <Group label="Hide the exact address" optional>
            <ToggleRow label="Show the address only after they register" sub="For house concerts, home studios and secret gigs"
              value={!!form.location.hideAddress} onChange={(v) => setLoc({ hideAddress: v })} />
          </Group>
        </>
      ) : (
        <>
          <Group label="Platform" optional>
            <Chips options={['Zoom', 'Google Meet', 'YouTube Live', 'Other']} value={form.location.onlinePlatform} onChange={(t) => setLoc({ onlinePlatform: t })} />
          </Group>
          <Group label="Join link" optional sub="Add it now or any time before the event.">
            <TextField icon={LinkIcon} placeholder="https://…" autoCapitalize="none" value={form.location.meetingLink} onChangeText={(t) => setLoc({ meetingLink: t })} />
          </Group>
          <Group label="When attendees see the link">
            <Chips options={['On registering', '24h before', '1h before']}
              value={{ on_register: 'On registering', 'T-24h': '24h before', 'T-1h': '1h before' }[form.location.meetingLinkRevealAt ?? 'T-24h']}
              onChange={(lbl) => setLoc({ meetingLinkRevealAt: ({ 'On registering': 'on_register', '24h before': 'T-24h', '1h before': 'T-1h' } as const)[lbl] })} />
          </Group>
        </>
      )}

      <CalendarModal visible={startOpen} onClose={() => setStartOpen(false)} minDate={new Date()} date={form.startsAt ? new Date(form.startsAt) : undefined}
        onSelect={(d) => { update('startsAt', d.toISOString()); scheduleSave(); setStartOpen(false); }} />
      <CalendarModal visible={endOpen} onClose={() => setEndOpen(false)} minDate={form.startsAt ? new Date(form.startsAt) : new Date()} date={form.endsAt ? new Date(form.endsAt) : undefined}
        onSelect={(d) => { update('endsAt', d.toISOString()); scheduleSave(); setEndOpen(false); }} />
    </View>
  );
}

/* ──────────────────── Discounts + group rates (P3, paid) ─────────────── */
const MAX_DISCOUNTS = 3, MAX_TIERS = 3;

const Num = ({ value, onChange, prefix, suffix, placeholder = '0' }: {
  value: number; onChange: (n: number) => void; prefix?: string; suffix?: string; placeholder?: string;
}) => (
  <View style={s.num}>
    {prefix ? <Text style={s.prefix}>{prefix}</Text> : null}
    <TextInput keyboardType="number-pad" value={value ? String(value) : ''} placeholder={placeholder} placeholderTextColor={C.dim2}
      onChangeText={(t) => onChange(parseInt(t.replace(/[^0-9]/g, ''), 10) || 0)} style={s.numInput} />
    {suffix ? <Text style={s.prefix}>{suffix}</Text> : null}
  </View>
);

export function DiscountsSheetBody({ scheduleSave }: SheetBodyProps) {
  const form = useComposerStoreV4((st) => st.form);
  const update = useComposerStoreV4((st) => st.update);
  const { addOffer, updateOffer, removeOffer } = useComposerStoreV4.getState();
  const [deadlineFor, setDeadlineFor] = useState<string | null>(null);
  const [openDiscount, setOpenDiscount] = useState<string | null>(null);

  const basePrice = form.spots[0]?.price ?? 0;
  const discounts = form.offers.filter((o) => o.audience === 'everyone');
  const groupTiers = form.offers.filter((o) => o.audience === 'group');
  const upd = (id: string, patch: Partial<OfferV4>) => { updateOffer(id, patch); scheduleSave(); };

  // Adding a blank-name offer doesn't save (the backend strips nameless offers); naming it does.
  const addDiscount = () => {
    if (discounts.length >= MAX_DISCOUNTS) return;
    addOffer({ name: '', audience: 'everyone', price: basePrice });
    const all = useComposerStoreV4.getState().form.offers;
    setOpenDiscount(all[all.length - 1]?.id ?? null);
  };
  const removeDiscount = (id: string) => { removeOffer(id); setOpenDiscount((c) => (c === id ? null : c)); scheduleSave(); };
  const toggleGroup = () => {
    if (groupTiers.length) update('offers', form.offers.filter((o) => o.audience !== 'group'));
    else addOffer({ name: 'Group rate', audience: 'group', minSeats: 2, price: basePrice });
    scheduleSave();
  };
  const addTier = () => {
    if (groupTiers.length >= MAX_TIERS) return;
    const nextMin = groupTiers.length ? Math.max(...groupTiers.map((t) => t.minSeats ?? 2)) + 1 : 2;
    addOffer({ name: 'Group rate', audience: 'group', minSeats: nextMin, price: basePrice });
    scheduleSave();
  };

  return (
    <View>
      <Group label="Discounts" optional sub="A lower price for everyone — each with its own deadline.">
        {discounts.map((o) => (
          <OfferDiscountCard key={o.id} o={o} open={openDiscount === o.id}
            onToggle={() => setOpenDiscount((c) => (c === o.id ? null : o.id))}
            onRemove={() => removeDiscount(o.id)} onPickDeadline={() => setDeadlineFor(o.id)} updateOffer={upd} />
        ))}
        {discounts.length < MAX_DISCOUNTS ? (
          <Pressable onPress={addDiscount} style={s.add}><Plus size={16} color={C.orange} /><Text style={s.addDiscTxt}>Add a discount</Text></Pressable>
        ) : <Hint>{MAX_DISCOUNTS} of {MAX_DISCOUNTS} used. Remove one to add another.</Hint>}
      </Group>

      <Group label="Group rates" optional sub="Cheaper when people book together.">
        <View style={[s.disc, groupTiers.length > 0 && s.discOn]}>
          <View style={s.discHead}>
            <View style={s.discIc}><Users size={15} color={C.orange} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.discName}>Group pricing</Text>
              <Text style={s.discMeta}>Set a lower price for bigger groups.</Text>
            </View>
            <Switch value={groupTiers.length > 0} onValueChange={toggleGroup} trackColor={{ true: C.orange, false: '#2A2A34' }} thumbColor="#fff" />
          </View>
          {groupTiers.length > 0 ? (
            <View style={{ gap: 7, marginTop: 12 }}>
              {groupTiers.map((o) => (
                <View key={o.id} style={s.tier}>
                  <View style={s.tierMinBox}><Num value={o.minSeats ?? 2} onChange={(n) => upd(o.id, { minSeats: n || 2 })} placeholder="2" /></View>
                  <Text style={s.tierLbl}>+ people</Text>
                  <View style={{ flex: 1 }}><Num prefix="₹" value={o.price} onChange={(n) => upd(o.id, { price: n })} /></View>
                  <Pressable onPress={() => { removeOffer(o.id); scheduleSave(); }} hitSlop={6}><X size={15} color={C.dim2} /></Pressable>
                </View>
              ))}
              {groupTiers.length < MAX_TIERS ? (
                <Pressable onPress={addTier} style={s.add}><Plus size={15} color={C.orange} /><Text style={s.addDiscTxt}>Add a tier</Text></Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </Group>

      {discounts.length > 0 || groupTiers.length > 0 ? (
        <View style={s.ruleBar}><Text style={s.ruleTxt}>Each person pays the best price they qualify for — a group of 6 gets the 5+ rate, or a discount if it's lower and still running. They don't stack.</Text></View>
      ) : null}

      <CalendarModal visible={!!deadlineFor} onClose={() => setDeadlineFor(null)} minDate={new Date()}
        onSelect={(d) => { if (deadlineFor) { updateOffer(deadlineFor, { endsAt: d.toISOString() }); scheduleSave(); } setDeadlineFor(null); }} />
    </View>
  );
}

const OfferDiscountCard = ({ o, open, onToggle, onRemove, onPickDeadline, updateOffer }: {
  o: OfferV4; open: boolean; onToggle: () => void; onRemove: () => void; onPickDeadline: () => void;
  updateOffer: (id: string, patch: Partial<OfferV4>) => void;
}) => {
  const meta = [o.price ? formatRupees(o.price) : null, o.endsAt ? `till ${fmtDM(o.endsAt)}` : null, o.seatLimit ? `first ${o.seatLimit}` : null].filter(Boolean).join('   ·   ');
  return (
    <Card style={s.accCard}>
      <View style={s.accHeadRow}>
        <Pressable style={s.accHead} onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }}>
          <View style={s.accIc}><Tag size={13} color={C.orange} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[s.accName, !o.name && { color: C.dim2 }]} numberOfLines={1}>{o.name || 'New discount'}</Text>
            {meta ? <Text style={s.accMeta} numberOfLines={1}>{meta}</Text> : null}
          </View>
          <ChevronDown size={18} color={C.dim2} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
        </Pressable>
        <Pressable onPress={onRemove} hitSlop={8} style={s.accX} accessibilityRole="button" accessibilityLabel="Remove discount"><X size={16} color={C.dim2} /></Pressable>
      </View>
      {open ? (
        <View style={s.accBody}>
          <View>
            <Text style={s.miniLab}>Name</Text>
            <View style={s.nameField}><TextInput value={o.name} onChangeText={(t) => updateOffer(o.id, { name: t })} placeholder="e.g. Early bird" placeholderTextColor={C.dim2} style={s.offerNameInput} /></View>
          </View>
          <View style={s.row}>
            <View style={{ flex: 1 }}><Text style={s.miniLab}>Price each</Text><Num prefix="₹" value={o.price} onChange={(n) => updateOffer(o.id, { price: n })} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.miniLab}>Ends on</Text>
              <View style={s.dateBox}>
                <Pressable style={s.dateMain} onPress={onPickDeadline}><Calendar size={13} color={C.dim} /><Text style={[s.dateTxt, !o.endsAt && { color: C.dim2 }]} numberOfLines={1}>{o.endsAt ? fmtDM(o.endsAt) : 'No deadline'}</Text></Pressable>
                {o.endsAt ? <Pressable onPress={() => updateOffer(o.id, { endsAt: null })} hitSlop={6}><X size={13} color={C.dim2} /></Pressable> : null}
              </View>
            </View>
          </View>
          <View>
            <Text style={s.miniLab}>First N tickets (optional)</Text>
            <Num value={o.seatLimit ?? 0} onChange={(n) => updateOffer(o.id, { seatLimit: n || null } as Partial<OfferV4>)} placeholder="No cap" />
          </View>
        </View>
      ) : null}
    </Card>
  );
};

const s = StyleSheet.create({
  // date & location
  addEnd: { fontFamily: F.semibold, fontSize: 12.5, color: C.orange, paddingVertical: 4 },
  row2: { flexDirection: 'row', gap: 10 },
  // discounts
  num: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 11, paddingHorizontal: 12, height: 46 },
  prefix: { fontFamily: F.body, fontSize: 14, color: C.dim },
  numInput: { flex: 1, fontFamily: F.body, fontSize: 14, color: C.t1, padding: 0, minWidth: 0 },
  accCard: { padding: 0, gap: 0, overflow: 'hidden' },
  accHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 14 },
  accHead: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  accIc: { width: 28, height: 28, borderRadius: 8, backgroundColor: C.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  accName: { fontFamily: F.semibold, fontSize: 14, color: C.t1 },
  accMeta: { fontFamily: F.body, fontSize: 11.5, color: C.dim, marginTop: 2 },
  accX: { padding: 4 },
  accBody: { borderTopWidth: 1, borderTopColor: C.border, padding: 14, gap: 11 },
  nameField: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 11, height: 46, paddingHorizontal: 12, justifyContent: 'center' },
  offerNameInput: { flex: 1, fontFamily: F.body, fontSize: 14, color: C.t1, padding: 0 },
  dateBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 11, height: 46, paddingHorizontal: 12 },
  dateMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateTxt: { flex: 1, fontFamily: F.body, fontSize: 14, color: C.t2 },
  disc: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 15 },
  discOn: { borderColor: C.orangeBorder, backgroundColor: 'rgba(255,107,53,0.05)' },
  discHead: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  discIc: { width: 30, height: 30, borderRadius: 9, backgroundColor: C.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  discName: { fontFamily: F.serif, fontSize: 16, color: C.t1, letterSpacing: -0.2 },
  discMeta: { fontFamily: F.body, fontSize: 10.5, color: C.dim, marginTop: 1 },
  tier: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierMinBox: { width: 68 },
  tierLbl: { fontFamily: F.semibold, fontSize: 12, color: C.dim },
  ruleBar: { backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.22)', borderRadius: 12, padding: 12, marginBottom: 4 },
  ruleTxt: { fontFamily: F.body, fontSize: 11, color: C.t4, lineHeight: 16 },
  row: { flexDirection: 'row', gap: 12 },
  miniLab: { fontFamily: F.semibold, fontSize: 11, color: C.t3, marginBottom: 5 },
  add: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.well, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, borderRadius: 11, paddingVertical: 11, paddingHorizontal: 12, justifyContent: 'center' },
  addDiscTxt: { fontFamily: F.semibold, fontSize: 13, color: C.orange },
  // type
  typeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: 14, paddingVertical: 14 },
  typeRowOn: { backgroundColor: C.orangeSoft, borderColor: C.orangeBorder },
  typeTxt: { fontFamily: F.semibold, fontSize: 14.5, color: C.t3 },
  typeTxtOn: { color: C.orangeInk },
  customWrap: { flexDirection: 'row', gap: 8, marginTop: 4 },
  customInput: { flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.sm, paddingHorizontal: 12, paddingVertical: 12, color: C.t2, fontFamily: F.body, fontSize: 14 },
  addBtn: { paddingHorizontal: 18, borderRadius: R.sm, backgroundColor: C.orange, alignItems: 'center', justifyContent: 'center' },
  addBtnOff: { opacity: 0.4 },
  addBtnTxt: { fontFamily: F.labelHeavy, fontSize: 13, color: '#fff' },
  // details
  lvl: { gap: 8, marginTop: 12 },
  lvlLab: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.dim },
  // age chips
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 15, paddingVertical: 11, borderRadius: R.pill, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border2 },
  chipOn: { backgroundColor: C.orangeSoft, borderColor: C.orangeBorder },
  chipTxt: { fontFamily: F.medium, fontSize: 13.5, color: C.t4 },
  chipTxtOn: { fontFamily: F.semibold, color: C.orangeInk },
  // questions
  footTxt: { fontFamily: F.body, fontSize: 12, color: C.dim, lineHeight: 17, marginBottom: 14 },
  footB: { fontFamily: F.semibold, color: C.t4 },
  qcard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.orangeBorder, borderRadius: R.xl, padding: 13, gap: 11, marginBottom: 9 },
  qHead: { flexDirection: 'row', alignItems: 'center' },
  qEyebrow: { flex: 1, fontFamily: F.mono, fontSize: 9, letterSpacing: 1.3, color: C.orangeInk },
  qInput: { fontFamily: F.semibold, fontSize: 15, color: C.t2, padding: 0 },
  qMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sel: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: C.card2, borderWidth: 1, borderColor: C.border2, borderRadius: R.md, paddingHorizontal: 12, paddingVertical: 9 },
  selTxt: { fontFamily: F.semibold, fontSize: 12.5, color: C.t3 },
  reqWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  reqLab: { fontFamily: F.semibold, fontSize: 12.5, color: C.dim },
  reqLabOn: { color: C.t3 },
  menu: { backgroundColor: C.card2, borderWidth: 1, borderColor: C.border2, borderRadius: R.md, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  menuTxt: { fontFamily: F.medium, fontSize: 13, color: C.t4 },
  menuTxtOn: { fontFamily: F.semibold, color: C.orangeInk },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  oDot: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.5, borderColor: C.border2 },
  optInput: { flex: 1, fontFamily: F.body, fontSize: 12.5, color: C.t2, padding: 0 },
  optAdd: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  optAddTxt: { fontFamily: F.semibold, fontSize: 11.5, color: C.orange },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: R.lg, paddingHorizontal: 14, paddingVertical: 14 },
  addPlus: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.orangeSoft, alignItems: 'center', justifyContent: 'center' },
  addTxt: { flex: 1, fontFamily: F.semibold, fontSize: 14, color: C.t2 },
  addMeta: { fontFamily: F.medium, fontSize: 11, color: C.dim2 },
});
