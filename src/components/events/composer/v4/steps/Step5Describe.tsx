import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Image, ActivityIndicator } from 'react-native';
import { Image as ImageIcon, Plus, X, Check, Video as VideoIcon, Play } from 'lucide-react-native';
import { useComposerStoreV4 } from '../useComposerStoreV4';
import { useComposerMediaV4 } from '../useComposerMediaV4';
import { presetFor, type DescribeSection } from '../eventTypePresets';
import { Group, TextField, Segmented, Hint } from '../ui';
import { C, F } from '../theme';
import type { LineupItemV4 } from '../composerForm';

const SECTION_META: Record<DescribeSection, { label: string; sub: string }> = {
  lineup: { label: 'Lineup', sub: 'What happens, in order: days, sessions, films or rounds.' },
  bring: { label: 'What to bring', sub: 'Things to bring, wear or prepare.' },
  included: { label: 'What they get', sub: "Anything included: certificates, materials, prizes, food." },
};
const ALL_SECTIONS: DescribeSection[] = ['lineup', 'bring', 'included'];
const MAX_VIDEOS = 2; // keep in sync with useComposerMediaV4

export default function Step5Describe() {
  const form = useComposerStoreV4((s) => s.form);
  const update = useComposerStoreV4((s) => s.update);
  const media = useComposerMediaV4();
  const preset = presetFor(form.eventType);

  const has = (s: DescribeSection) =>
    s === 'lineup' ? form.lineup.length > 0 : s === 'bring' ? form.bring.items.length > 0 : form.included.length > 0;
  const [revealed, setRevealed] = useState<DescribeSection[]>(() => preset.openSections);
  const shown = ALL_SECTIONS.filter((s) => revealed.includes(s) || has(s));
  const missing = ALL_SECTIONS.filter((s) => !shown.includes(s));

  // lineup
  const setLineup = (next: LineupItemV4[]) => update('lineup', next);
  const editLine = (i: number, patch: Partial<LineupItemV4>) => setLineup(form.lineup.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  // included
  const setIncluded = (next: string[]) => update('included', next);

  return (
    <View>
      <Text style={st.sub}>What people read before they sign up.</Text>

      <Group label="Cover / poster" required>
        {form.cover ? (
          <View style={st.coverWrap}>
            <Image source={{ uri: form.cover.thumbnailUrl || form.cover.url }} style={st.coverImg}
              resizeMode={form.coverFit === 'fill' ? 'cover' : 'contain'} />
            <Pressable style={st.coverRemove} onPress={media.removeCover} hitSlop={8}><X size={15} color="#fff" /></Pressable>
            <Pressable style={st.coverChange} onPress={media.addCover}>
              <ImageIcon size={12} color="#fff" /><Text style={st.coverChangeTxt}>Change</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={st.cover} onPress={media.addCover} disabled={media.uploading === 'cover'}>
            {media.uploading === 'cover' ? (
              <ActivityIndicator color={C.orange} />
            ) : (
              <>
                <ImageIcon size={22} color={C.dim} />
                <Text style={st.coverTxt}>Add a poster or photo</Text>
                <Text style={st.coverHint}>Portrait posters keep their text on the “whole poster” fit.</Text>
              </>
            )}
          </Pressable>
        )}
        <View style={st.fitRow}>
          <Text style={st.fitLab}>FIT</Text>
          <View style={{ flex: 1 }}>
            <Segmented value={form.coverFit} onChange={(v) => update('coverFit', v)}
              options={[{ key: 'whole', label: 'Whole poster' }, { key: 'fill', label: 'Fill the frame' }]} />
          </View>
        </View>
      </Group>

      <Group label="About" required>
        <TextField value={form.about} onChangeText={(t) => update('about', t)} multiline
          placeholder="A few lines about the event — who it’s for and what happens." />
        <Hint>Write in the language your people read. You can edit this any time.</Hint>
      </Group>

      <Group label="Tagline" optional>
        <TextField value={form.tagline ?? ''} onChangeText={(t) => update('tagline', t)}
          placeholder="One line for the event page" />
        <Hint>Shown on the event page only when it’s filled.</Hint>
      </Group>

      {shown.map((s) => (
        <Group key={s} label={SECTION_META[s].label} sub={SECTION_META[s].sub} optional>
          {s === 'lineup' ? (
            <View style={{ gap: 7 }}>
              {form.lineup.map((l, i) => (
                <View key={i} style={st.line}>
                  <TextInput value={l.when ?? ''} onChangeText={(t) => editLine(i, { when: t })} placeholder="When" placeholderTextColor={C.dim2} style={st.lineWhen} />
                  <TextInput value={l.title} onChangeText={(t) => editLine(i, { title: t })} placeholder="What happens" placeholderTextColor={C.dim2} style={st.lineTitle} />
                  <Pressable onPress={() => setLineup(form.lineup.filter((_, k) => k !== i))}><X size={15} color={C.dim2} /></Pressable>
                </View>
              ))}
              <Adder label="Add an item" onPress={() => setLineup([...form.lineup, { title: '' }])} />
            </View>
          ) : s === 'bring' ? (
            <View style={{ gap: 7 }}>
              {form.bring.items.map((it, i) => (
                <View key={i} style={st.get}>
                  <View style={st.bringDot} />
                  <TextInput value={it} onChangeText={(t) => update('bring', { ...form.bring, items: form.bring.items.map((x, k) => (k === i ? t : x)) })} placeholder="Ghungroo, water bottle, headshot…" placeholderTextColor={C.dim2} style={st.getTxt} />
                  <Pressable onPress={() => update('bring', { ...form.bring, items: form.bring.items.filter((_, k) => k !== i) })}><X size={15} color={C.dim2} /></Pressable>
                </View>
              ))}
              <Adder label="Add something" onPress={() => update('bring', { ...form.bring, items: [...form.bring.items, ''] })} />
              <TextField value={form.bring.note ?? ''} onChangeText={(t) => update('bring', { ...form.bring, note: t })}
                placeholder="Anything to prepare before coming? (optional)" multiline />
            </View>
          ) : (
            <View style={{ gap: 7 }}>
              {form.included.map((g, i) => (
                <View key={i} style={st.get}>
                  <View style={st.getIc}><Check size={11} color={C.green} strokeWidth={2.6} /></View>
                  <TextInput value={g} onChangeText={(t) => setIncluded(form.included.map((x, k) => (k === i ? t : x)))} placeholder="Certificate, materials, prize, food…" placeholderTextColor={C.dim2} style={st.getTxt} />
                  <Pressable onPress={() => setIncluded(form.included.filter((_, k) => k !== i))}><X size={15} color={C.dim2} /></Pressable>
                </View>
              ))}
              <Adder label="Add something" onPress={() => setIncluded([...form.included, ''])} />
            </View>
          )}
        </Group>
      ))}

      {missing.length ? (
        <View style={st.addSec}>
          <Text style={st.addLab}>ADD A SECTION</Text>
          {missing.map((s) => (
            <Pressable key={s} onPress={() => setRevealed([...revealed, s])} style={st.secPill}>
              <Plus size={11} color={C.orange} strokeWidth={2.6} /><Text style={st.secPillTxt}>{SECTION_META[s].label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Group label="More photos" optional sub="Up to 6, including the cover.">
        <View style={st.thumbs}>
          {form.photos.map((p, i) => (
            <View key={i} style={st.thumbWrap}>
              <Image source={{ uri: p.thumbnailUrl || p.url }} style={st.thumb} />
              <Pressable style={st.thumbRemove} onPress={() => media.removePhoto(i)} hitSlop={6}><X size={11} color="#fff" /></Pressable>
            </View>
          ))}
          <Pressable style={st.thumbAdd} onPress={media.addPhoto} disabled={!!media.uploading}>
            {media.uploading === 'gallery' ? <ActivityIndicator color={C.dim} size="small" /> : <Plus size={18} color={C.dim} />}
          </Pressable>
        </View>
        <Hint>Photos help people choose.</Hint>
      </Group>

      <Group label="Video" optional sub={`Up to ${MAX_VIDEOS} — a promo, trailer or past highlight.`}>
        <View style={{ gap: 8 }}>
          {form.videos.map((v, i) => (
            <View key={v.uploadId || i} style={st.reel}>
              {v.status === 'processing' ? (
                <View style={st.reelCenter}>
                  <ActivityIndicator color={C.orange} />
                  <Text style={st.reelMeta}>Processing…</Text>
                </View>
              ) : v.status === 'errored' ? (
                <View style={st.reelCenter}>
                  <Text style={[st.reelMeta, { color: C.red }]}>Upload failed</Text>
                  <Text style={st.reelSub}>Remove and try another clip.</Text>
                </View>
              ) : (
                <>
                  {v.thumbnailUrl
                    ? <Image source={{ uri: v.thumbnailUrl }} style={st.reelImg} />
                    : <View style={[st.reelImg, { backgroundColor: C.well }]} />}
                  <View style={st.reelPlay}><Play size={15} color="#fff" fill="#fff" /></View>
                </>
              )}
              <Pressable style={st.reelRemove} onPress={() => media.removeVideo(i)} hitSlop={6}><X size={13} color="#fff" /></Pressable>
            </View>
          ))}
          {form.videos.length < MAX_VIDEOS ? (
            <Pressable style={st.reelAdd} onPress={media.addVideo} disabled={!!media.uploading}>
              {media.uploading === 'video'
                ? <ActivityIndicator color={C.dim} />
                : (<><VideoIcon size={18} color={C.dim} /><Text style={st.reelAddTxt}>Add video</Text></>)}
            </Pressable>
          ) : null}
        </View>
        <Hint>Short clips play on your event page — up to 60 seconds each.</Hint>
      </Group>
    </View>
  );
}

const Adder = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={st.adder}><Plus size={13} color={C.orange} strokeWidth={2.6} /><Text style={st.adderTxt}>{label}</Text></Pressable>
);

const st = StyleSheet.create({
  sub: { fontFamily: F.body, fontSize: 13, color: C.dim, marginBottom: 18, lineHeight: 18 },
  cover: { height: 150, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', gap: 5 },
  coverTxt: { fontFamily: F.semibold, fontSize: 13, color: C.t3 },
  coverHint: { fontFamily: F.body, fontSize: 10.5, color: C.dim2 },
  fitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  fitLab: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.dim, width: 22 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 },
  lineWhen: { width: 62, fontFamily: F.semibold, fontSize: 12, color: C.t2, padding: 0 },
  lineTitle: { flex: 1, fontFamily: F.body, fontSize: 12.5, color: C.t2, padding: 0 },
  get: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 7 },
  getIc: { width: 17, height: 17, borderRadius: 9, backgroundColor: C.greenSoft, alignItems: 'center', justifyContent: 'center' },
  bringDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.orange, marginLeft: 5, marginRight: 3 },
  getTxt: { flex: 1, fontFamily: F.body, fontSize: 12.5, color: C.t2, padding: 0 },
  adder: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  adderTxt: { fontFamily: F.semibold, fontSize: 12, color: C.orange },
  addSec: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginBottom: 22, marginTop: -6 },
  addLab: { fontFamily: F.mono, fontSize: 9, letterSpacing: 1.2, color: C.dim },
  secPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: C.border2 },
  secPillTxt: { fontFamily: F.semibold, fontSize: 11.5, color: C.orange },
  coverWrap: { height: 180, borderRadius: 14, overflow: 'hidden', backgroundColor: C.well, position: 'relative' },
  coverImg: { width: '100%', height: '100%' },
  coverRemove: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  coverChange: { position: 'absolute', bottom: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)' },
  coverChangeTxt: { fontFamily: F.semibold, fontSize: 11, color: '#fff' },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  thumbWrap: { width: 72, height: 72, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%', backgroundColor: C.well },
  thumbRemove: { position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  thumbAdd: { width: 72, height: 72, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, alignItems: 'center', justifyContent: 'center' },
  reel: { aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, position: 'relative' },
  reelCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 5 },
  reelMeta: { fontFamily: F.semibold, fontSize: 11, color: C.dim, textTransform: 'uppercase', letterSpacing: 1 },
  reelSub: { fontFamily: F.body, fontSize: 11, color: C.dim2 },
  reelImg: { width: '100%', height: '100%' },
  reelPlay: { position: 'absolute', top: '50%', left: '50%', width: 40, height: 40, borderRadius: 20, marginLeft: -20, marginTop: -20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  reelRemove: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  reelAdd: { aspectRatio: 16 / 9, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: C.border2, backgroundColor: C.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  reelAddTxt: { fontFamily: F.semibold, fontSize: 13, color: C.t3 },
});
