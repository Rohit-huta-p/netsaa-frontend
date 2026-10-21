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
import { Send, CornerUpLeft, X, MessageSquare, ArrowUpRight } from 'lucide-react-native';

const C = {
  well: '#212129', wellb: '#35353F',
  orange: '#FF6B35', orangeTint: '#FFCBB2',
  orangeSoft: 'rgba(255,107,53,0.10)', orangeBorder: 'rgba(255,107,53,0.28)', orange06: 'rgba(255,107,53,0.06)',
  t1: '#FFFFFF', t2: '#D4D4D8', t3: '#A1A1AA', t4: '#8B8B99', t5: '#54545C',
  hair: 'rgba(255,255,255,0.08)', avatarBg: '#24242E', producerBg: '#2A1A12',
};

export interface ThreadComment {
  _id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorImageUrl?: string;
  parentId?: string | null;
  createdAt: string;
  isPinned?: boolean;
  isDeleted?: boolean;
  deletedReason?: 'self' | 'organizer' | 'admin';
}

export interface ReplyingTo { rootId: string; name: string }

/**
 * A commenter who is also in this gig's applicant pipeline. The owner hub
 * passes this so an asker who applied gets a status chip that taps through to
 * their applicant card. Keyed by the commenter's User id (= application.artistId).
 */
export interface ApplicantRef { applicationId: string; status: string }
export type ApplicantsByUserId = Record<string, ApplicantRef>;

/** One-level thread: a root question + its replies, flagged if still unanswered. */
export interface Thread { root: ThreadComment; replies: ThreadComment[]; unanswered: boolean }

// Status → chip label + color. Only pipeline-active statuses get a chip;
// rejected/withdrawn askers show no chip (nothing to tap through to).
const APPLICANT_CHIP: Record<string, { label: string; color: string }> = {
  applied: { label: 'Applied', color: '#5B8DEF' },
  shortlisted: { label: 'Shortlisted', color: '#EAB308' },
  hired: { label: 'Hired', color: '#22C55E' },
};

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
  /** Owner hub only — commenters who are in the pipeline, for the asker→card chip. */
  applicantsByUserId?: ApplicantsByUserId;
  onOpenApplicant?: (applicationId: string) => void;
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

/**
 * Group a flat comment list into one-level threads (root + its replies).
 * `unanswered` flags a question the owner still owes a reply on: a root NOT
 * authored by the owner, with no reply from the owner. The owner hub uses it to
 * float waiting questions up and badge the count; other viewers ignore it.
 */
function buildThreads(comments: ThreadComment[], ownerId?: string): Thread[] {
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
  return roots.sort(byTime).map((root) => {
    const replies = (repliesByRoot.get(root._id) ?? []).sort(byTime);
    const rootByOwner = !!ownerId && String(root.authorId) === String(ownerId);
    const ownerReplied = !!ownerId && replies.some((r) => String(r.authorId) === String(ownerId));
    return { root, replies, unanswered: !rootByOwner && !ownerReplied };
  });
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
  c, size, ownerId, onStartReply, onModerate, onOpenProfile, applicantsByUserId, onOpenApplicant,
}: {
  c: ThreadComment; size: number; ownerId?: string;
  onStartReply: (c: ThreadComment) => void;
  onModerate?: (c: ThreadComment) => void;
  onOpenProfile?: (id: string) => void;
  applicantsByUserId?: ApplicantsByUserId;
  onOpenApplicant?: (applicationId: string) => void;
}) {
  const isProducer = !!ownerId && String(c.authorId) === String(ownerId);
  // The producer never gets an applicant chip (they're the owner, not an
  // applicant). Others get one only if they're in the pipeline with a status
  // that has somewhere to tap through to.
  const applicant = !isProducer && !c.isDeleted ? applicantsByUserId?.[String(c.authorId)] : undefined;
  const chip = applicant && APPLICANT_CHIP[applicant.status]
    ? { ...APPLICANT_CHIP[applicant.status], applicationId: applicant.applicationId }
    : undefined;
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
        {chip && (
          <TouchableOpacity
            onPress={() => onOpenApplicant?.(chip.applicationId)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${chip.label} applicant — open their card`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 3, borderWidth: 1, borderColor: `${chip.color}59`, backgroundColor: `${chip.color}1A`, borderRadius: 999, paddingLeft: 7, paddingRight: 5, paddingVertical: 2 }}
          >
            <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 8, letterSpacing: 0.8, textTransform: 'uppercase', color: chip.color }}>{chip.label}</Text>
            <ArrowUpRight size={10} color={chip.color} />
          </TouchableOpacity>
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
  applicantsByUserId, onOpenApplicant,
  starterPrompts = ['When are rehearsals?', 'Is travel covered?', 'What should I prepare?'],
}: Props) {
  // The owner (producer) gets the triage treatment: unanswered questions float
  // up, a "waiting" badge + nudge appear, and each waiting root is tagged.
  // Everyone else (artist-side gig page) keeps the plain chronological view.
  const isOwner = !!ownerId && !!currentUserId && String(currentUserId) === String(ownerId);
  const built = useMemo(() => buildThreads(comments, ownerId), [comments, ownerId]);
  const unansweredCount = useMemo(() => built.filter((t) => t.unanswered).length, [built]);
  const threads = useMemo(() => {
    if (!isOwner) return built;
    // Pinned first, then still-waiting, then the rest — oldest first within
    // each band so the longest-waiting question sits on top.
    const rank = (t: Thread) => (t.root.isPinned ? 0 : t.unanswered ? 1 : 2);
    const byTime = (a: Thread, b: Thread) =>
      new Date(a.root.createdAt).getTime() - new Date(b.root.createdAt).getTime();
    return [...built].sort((a, b) => rank(a) - rank(b) || byTime(a, b));
  }, [built, isOwner]);
  const isEmpty = !loading && comments.length === 0;
  const commentProps = { onStartReply, onModerate, onOpenProfile, applicantsByUserId, onOpenApplicant };

  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 4, marginBottom: 2 }}>
        <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 17, color: C.t1, letterSpacing: -0.3 }}>Questions &amp; answers</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {isOwner && unansweredCount > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: C.orangeBorder, backgroundColor: C.orangeSoft, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2.5 }}>
              <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.orange }} />
              <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 9.5, letterSpacing: 0.3, color: C.orange }}>{unansweredCount} waiting</Text>
            </View>
          )}
          {threads.length > 0 && (
            <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase', color: C.t5 }}>
              {threads.length} {threads.length === 1 ? 'thread' : 'threads'}
            </Text>
          )}
        </View>
      </View>

      {isOwner && unansweredCount > 0 && !loading && (
        <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 11.5, lineHeight: 16, color: C.orangeTint, marginBottom: 2 }}>
          {unansweredCount === 1
            ? '1 question is waiting for your reply.'
            : `${unansweredCount} questions are waiting for your reply.`}
        </Text>
      )}

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
              <TouchableOpacity key={p} onPress={() => onChangeText(p)} style={{ borderWidth: 1, borderColor: C.wellb, backgroundColor: '#24242E', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}>
                <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 12, color: C.t3 }}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <View>
          {threads.map(({ root, replies, unanswered }, i) => {
            const awaiting = isOwner && unanswered;
            return (
              <View
                key={root._id}
                style={{ paddingVertical: 16, borderBottomWidth: i === threads.length - 1 ? 0 : 1, borderBottomColor: C.hair }}
              >
                {awaiting && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 9 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: C.orange }} />
                    <Text style={{ fontFamily: 'Outfit-SemiBold', fontSize: 9, letterSpacing: 0.9, textTransform: 'uppercase', color: C.orange }}>Awaiting reply</Text>
                  </View>
                )}
                <Comment c={root} size={28} ownerId={ownerId} {...commentProps} />
                {replies.length > 0 && (
                  <View style={{ marginTop: 13, marginLeft: 13, paddingLeft: 15, borderLeftWidth: 1, borderLeftColor: C.hair, gap: 14 }}>
                    {replies.map((r) => (
                      <Comment key={r._id} c={r} size={24} ownerId={ownerId} {...commentProps} />
                    ))}
                  </View>
                )}
              </View>
            );
          })}
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
