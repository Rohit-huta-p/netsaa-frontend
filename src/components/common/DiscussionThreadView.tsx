// src/components/common/DiscussionThreadView.tsx
//
// A·Minimal threaded Q&A view for the GIG discussion (see
// DOCS/04-design/mockups/gig-detail-discussion-final.html). Pure presentation:
// DiscussionTab owns the data (fetch / socket / post / moderation) and renders
// this when `threaded` is on. Events keep DiscussionTab's default UI untouched.
//
// Threading is flat one-level: a question is a top-level comment (no parentId);
// replies carry parentId = the thread-root comment id, so every reply in a
// thread groups under the same root. A tiny "Reply" sits on every comment.

import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Send, CornerUpLeft, X, MessageSquare } from 'lucide-react-native';

const C = {
  well: '#101016', wellb: '#262630',
  orange: '#FF6B35', orangeTint: '#FFCBB2',
  orangeSoft: 'rgba(255,107,53,0.10)', orangeBorder: 'rgba(255,107,53,0.28)', orange06: 'rgba(255,107,53,0.06)',
  t1: '#FFFFFF', t2: '#D4D4D8', t3: '#A1A1AA', t4: '#8B8B99', t5: '#54545C',
  hair: 'rgba(255,255,255,0.06)', avatarBg: '#1A1A20', producerBg: '#2A1A12',
};

export interface ThreadComment {
  _id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorImageUrl?: string;
  parentId?: string | null;
  createdAt: string;
  isDeleted?: boolean;
  deletedReason?: 'self' | 'organizer' | 'admin';
}

export interface ReplyingTo { rootId: string; name: string }

interface Props {
  comments: ThreadComment[];
  loading: boolean;
  currentUserId?: string;
  ownerId?: string;
  inputText: string;
  sending: boolean;
  replyingTo: ReplyingTo | null;
  onChangeText: (t: string) => void;
  onSend: () => void;
  onStartReply: (c: ThreadComment) => void;
  onCancelReply: () => void;
  onModerate?: (c: ThreadComment) => void; // long-press → pin/delete (owner/author/admin)
  onOpenProfile?: (authorId: string) => void;
  starterPrompts?: string[];
}

function initials(name?: string) {
  return (name || '?').trim().charAt(0).toUpperCase() || '?';
}
function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(d)) return '';
  const m = Math.floor(d / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}

/** Group a flat comment list into one-level threads (root + its replies). */
function buildThreads(comments: ThreadComment[]) {
  const ids = new Set(comments.map((c) => c._id));
  const roots = comments.filter((c) => !c.parentId || !ids.has(c.parentId));
  const repliesByRoot = new Map<string, ThreadComment[]>();
  for (const c of comments) {
    if (c.parentId && ids.has(c.parentId)) {
      const arr = repliesByRoot.get(c.parentId) ?? [];
      arr.push(c);
      repliesByRoot.set(c.parentId, arr);
    }
  }
  const byTime = (a: ThreadComment, b: ThreadComment) =>
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  return roots
    .sort(byTime)
    .map((root) => ({ root, replies: (repliesByRoot.get(root._id) ?? []).sort(byTime) }));
}

function Avatar({ c, size, isProducer }: { c: ThreadComment; size: number; isProducer: boolean }) {
  if (c.authorImageUrl) {
    return (
      <Image
        source={{ uri: c.authorImageUrl }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.avatarBg, opacity: c.isDeleted ? 0.4 : 1 }}
      />
    );
  }
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center',
        backgroundColor: isProducer ? C.producerBg : C.avatarBg, opacity: c.isDeleted ? 0.4 : 1,
      }}
    >
      <Text style={{ fontFamily: 'Outfit-Bold', fontSize: Math.round(size * 0.4), color: isProducer ? C.orangeTint : C.t3 }}>
        {initials(c.authorName)}
      </Text>
    </View>
  );
}

function Comment({
  c, size, ownerId, onStartReply, onModerate, onOpenProfile,
}: {
  c: ThreadComment; size: number; ownerId?: string;
  onStartReply: (c: ThreadComment) => void;
  onModerate?: (c: ThreadComment) => void;
  onOpenProfile?: (id: string) => void;
}) {
  const isProducer = !!ownerId && String(c.authorId) === String(ownerId);
  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={onModerate ? () => onModerate(c) : undefined}
        delayLongPress={350}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 }}
      >
        <TouchableOpacity onPress={() => !c.isDeleted && onOpenProfile?.(c.authorId)} accessibilityLabel={`Profile of ${c.authorName}`}>
          <Avatar c={c} size={size} isProducer={isProducer} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 12.5, color: c.isDeleted ? C.t5 : C.t1 }}>
          {c.isDeleted ? '—' : c.authorName}
        </Text>
        {isProducer && !c.isDeleted && (
          <View style={{ borderWidth: 1, borderColor: C.orangeBorder, backgroundColor: C.orangeSoft, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 8, letterSpacing: 0.8, textTransform: 'uppercase', color: C.orange }}>Producer</Text>
          </View>
        )}
        <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 10, color: C.t5, marginLeft: 'auto' }}>{timeAgo(c.createdAt)}</Text>
      </TouchableOpacity>

      {c.isDeleted ? (
        <Text style={{ fontFamily: 'Outfit-Regular', fontStyle: 'italic', fontSize: 12.5, color: C.t5 }}>
          {c.deletedReason === 'organizer' ? 'Removed by the producer' : c.deletedReason === 'admin' ? 'Removed by NETSA' : 'Removed by author'}
        </Text>
      ) : (
        <Text style={{ fontFamily: 'Outfit-Light', fontSize: 13.5, lineHeight: 20, color: C.t2 }}>{c.text}</Text>
      )}

      {!c.isDeleted && (
        <TouchableOpacity
          onPress={() => onStartReply(c)}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 }}
          accessibilityRole="button"
          accessibilityLabel={`Reply to ${c.authorName}`}
        >
          <CornerUpLeft size={12} color={C.t5} />
          <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 11, color: C.t4 }}>Reply</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function DiscussionThreadView({
  comments, loading, currentUserId, ownerId, inputText, sending, replyingTo,
  onChangeText, onSend, onStartReply, onCancelReply, onModerate, onOpenProfile,
  starterPrompts = ['When are rehearsals?', 'Is travel covered?', 'What should I prepare?'],
}: Props) {
  const threads = useMemo(() => buildThreads(comments), [comments]);
  const isEmpty = !loading && comments.length === 0;

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4, marginBottom: 2 }}>
        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 17, color: C.t1, letterSpacing: -0.3 }}>Questions &amp; answers</Text>
        {threads.length > 0 && (
          <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase', color: C.t5 }}>
            {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
          </Text>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={C.orange} style={{ marginVertical: 24 }} />
      ) : isEmpty ? (
        <View style={{ alignItems: 'center', paddingVertical: 36, paddingHorizontal: 16 }}>
          <View style={{ width: 58, height: 58, borderRadius: 18, backgroundColor: C.orange06, borderWidth: 1, borderColor: C.orangeBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <MessageSquare size={26} color={C.orange} />
          </View>
          <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 18, color: C.t1, letterSpacing: -0.3 }}>No questions yet</Text>
          <Text style={{ fontFamily: 'Outfit-Light', fontSize: 13, color: C.t4, lineHeight: 20, marginTop: 8, textAlign: 'center', maxWidth: 270 }}>
            Be the first to ask about this gig — the brief, rehearsals, travel, or pay.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginTop: 18 }}>
            {starterPrompts.map((p) => (
              <TouchableOpacity key={p} onPress={() => onChangeText(p)} style={{ borderWidth: 1, borderColor: C.wellb, backgroundColor: '#141419', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
                <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: C.t3 }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View>
          {threads.map(({ root, replies }, i) => (
            <View
              key={root._id}
              style={{ paddingVertical: 16, borderBottomWidth: i === threads.length - 1 ? 0 : 1, borderBottomColor: C.hair }}
            >
              <Comment c={root} size={28} ownerId={ownerId} onStartReply={onStartReply} onModerate={onModerate} onOpenProfile={onOpenProfile} />
              {replies.length > 0 && (
                <View style={{ marginTop: 13, marginLeft: 13, paddingLeft: 15, borderLeftWidth: 1, borderLeftColor: C.hair, gap: 14 }}>
                  {replies.map((r) => (
                    <Comment key={r._id} c={r} size={24} ownerId={ownerId} onStartReply={onStartReply} onModerate={onModerate} onOpenProfile={onOpenProfile} />
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Composer */}
      {replyingTo && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10 }}>
          <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 11, color: C.t4 }}>
            Replying to <Text style={{ fontFamily: 'Outfit-SemiBold', color: C.t2 }}>{replyingTo.name}</Text>
          </Text>
          <TouchableOpacity onPress={onCancelReply} hitSlop={8} style={{ marginLeft: 'auto' }} accessibilityLabel="Cancel reply">
            <X size={14} color={C.t5} />
          </TouchableOpacity>
        </View>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 14 }}>
        <TextInput
          style={{ flex: 1, backgroundColor: C.well, borderWidth: 1, borderColor: C.wellb, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, color: C.t1, fontSize: 13, fontFamily: 'Outfit-Regular', minHeight: 44, outlineStyle: 'none' } as any}
          placeholder={replyingTo ? 'Write a reply…' : 'Ask the producer a question…'}
          placeholderTextColor={C.t5}
          value={inputText}
          onChangeText={onChangeText}
          multiline
        />
        <TouchableOpacity
          onPress={onSend}
          disabled={!inputText.trim() || sending}
          style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: inputText.trim() ? C.orange : '#26262F' }}
          accessibilityRole="button"
          accessibilityLabel={replyingTo ? 'Post reply' : 'Post question'}
        >
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Send size={17} color={inputText.trim() ? '#fff' : C.t5} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}
