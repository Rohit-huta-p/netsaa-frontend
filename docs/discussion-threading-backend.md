# Backend change — gig discussion threading (`parentId`)

Companion to the frontend PR that adds the A·Minimal **threaded** gig discussion
(`DiscussionThreadView` + `DiscussionTab threaded`). The frontend is already
wired to **send and render `parentId`** — this spec is the gig backend
(`gigs-service`) change needed to make replies actually thread. Until it lands,
replies post as normal top-level comments (the `parentId` is simply dropped).

**Model:** flat, **one level**. A question is a top-level comment
(`parentId = null`); every reply in a thread stores `parentId = <root comment
id>`. Replying to a reply attaches to the same root (the frontend already
resolves this, so the backend only ever receives a root id).

---

## 1. Model — `GigComment` (Mongoose)

Add one field. (Per house rule, the **Mongoose model is the source of validation**
for gigs-service, so add it here even if a Zod schema also exists.)

```js
// models/GigComment.js  (adjust to the actual filename)
parentId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'GigComment',
  default: null,
  index: true,            // threads are fetched/grouped by parentId
},
```

No migration needed — existing comments default to `null` (top-level), which is
correct.

## 2. `POST /gigs/:gigId/discussion`

Body is currently `{ text }`. Accept an optional `{ text, parentId }`.

```js
const { text, parentId } = req.body;

let resolvedParentId = null;
if (parentId) {
  const parent = await GigComment.findOne({ _id: parentId, gigId });   // same gig
  if (!parent || parent.isDeleted) {
    return res.status(400).json({ error: 'Parent comment not found' });
  }
  // Enforce ONE level: a reply always attaches to the thread root.
  resolvedParentId = parent.parentId ?? parent._id;
}

const comment = await GigComment.create({
  gigId,
  text: text.trim(),
  authorId: req.user.id,
  // …existing author snapshot fields…
  parentId: resolvedParentId,
});
```

- Auth / rate-limit / text validation: unchanged.
- Return the created comment **including `parentId`** (the frontend swaps its
  optimistic row for this).

## 3. `GET /gigs/:gigId/discussion`

Return `parentId` on every comment (automatic once it's on the schema — just make
sure it isn't projected out). Ordering can stay as-is (the frontend groups into
threads and sorts each thread by `createdAt`); pinned-first still applies to
top-level comments.

## 4. Socket — `discussion:new`

Include `parentId` in the emitted payload so live replies drop into the right
thread:

```js
io.to(room).emit('discussion:new', { ...comment.toObject() }); // already has parentId
```

Pin/delete socket events are unchanged.

## 5. Constraints & edge cases

- **One level only** — never store a `parentId` that points at a reply (coerced
  to the root above). The frontend also flattens defensively.
- **Same gig** — reject a `parentId` from another gig.
- **Deleted parent** — reject replying to a deleted comment.
- **Moderation** — delete/pin logic is per-comment and unchanged. A soft-deleted
  root keeps its replies (the thread stays; the root shows `[removed]`).

## 6. Optional (nice-to-have)

On a new reply, notify (a) the root comment's author and (b) the gig producer
(`gig.organizerId`), unless they're the replier. Not required for the UI to work.

---

### Frontend contract (already shipped)

- Sends: `POST /gigs/:id/discussion { text, parentId? }` via
  `gigService.postGigDiscussion(id, text, parentId?)`.
- Expects each comment to carry `parentId?: string | null`.
- Renders top-level comments as questions; comments with `parentId` nest under
  their root; every comment has a Reply action; a "Replying to…" composer posts
  with the root's id.

The event discussion (`type="event"`) is intentionally left flat — this change is
gig-only.
