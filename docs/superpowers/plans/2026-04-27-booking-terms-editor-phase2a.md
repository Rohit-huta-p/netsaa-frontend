# Booking Terms Editor — Phase 2A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the Hub's Edit + Preview booking-terms buttons. Build a focused editor screen at `/gigs/[id]/booking-terms` covering payment structure, cancellation, and negotiable. Build a read-only preview modal that renders the artist-facing terms panel.

**Architecture:** Backend additive — 2 new optional enum fields on Gig (`paymentStructure`, `cancellationPolicy`); Zod validation extended; PATCH `/v1/gigs/:id` is pass-through. Mobile — new `src/features/booking-terms-editor/` directory with one orchestrator + 4 small components + 1 selector hook + a route file. Hub wiring replaces the existing "Coming soon" Alert handlers with router navigation + modal mount.

**Tech Stack:** Mongoose 8 / Zod 4 (backend); React Native 0.81, Expo 54, Expo Router, @tanstack/react-query, lucide-react-native (mobile); jest-expo + supertest (tests).

**Spec:** `netsa-mobile/docs/superpowers/specs/2026-04-27-booking-terms-editor-phase2a-design.md`
**Mockup:** `DOCS/designs/booking-terms-editor.html`
**Branch:** `develop` on both repos.

---

## File Structure

### Backend
```
netsa-backend/gigs-service/
  src/
    models/Gig.ts                           # MODIFY: add 2 fields to interface + schema
    utils/validation.ts                     # MODIFY: extend updateGigSchema (and createGigSchema)
    tests/gig-booking-terms.test.ts         # NEW: round-trip tests for the 2 new fields
```

### Mobile
```
netsa-mobile/
  src/features/booking-terms-editor/        # NEW directory
    BookingTermsEditor.tsx                  # screen orchestrator (~150 lines)
    components/
      PaymentStructurePicker.tsx
      CancellationPicker.tsx
      NegotiableToggle.tsx
      BookingTermsPreviewModal.tsx
    hooks/
      useBookingTermsEdit.ts                # local form state + dirty tracking + save wrapper
    __tests__/
      PaymentStructurePicker.test.tsx
      CancellationPicker.test.tsx
      BookingTermsPreviewModal.test.tsx
      BookingTermsEditor.behavior.test.tsx
  src/features/hirer-hub/components/
    HubBookingTermsCard.tsx                 # MODIFY: wire Edit + Preview buttons
  src/features/hirer-hub/HirerGigHub.tsx    # MODIFY: thread gigId + termsAndConditions + negotiable into card
  app/(app)/gigs/[id]/
    booking-terms.tsx                       # NEW: expo-router screen file
```

---

## Task 1: Backend — Gig schema additions + Zod + tests

**Files:**
- Modify: `netsa-backend/gigs-service/src/models/Gig.ts`
- Modify: `netsa-backend/gigs-service/src/utils/validation.ts`
- Create: `netsa-backend/gigs-service/src/tests/gig-booking-terms.test.ts`

- [ ] **Step 1.1: Write failing test**

```ts
// netsa-backend/gigs-service/src/tests/gig-booking-terms.test.ts
//
// Phase 2A: round-trip tests for paymentStructure + cancellationPolicy on Gig.
// Verifies the new optional enums save, retrieve, and reject invalid values.

import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import express from 'express';
import gigRoutes from '../routes/gigs';
import { authTokenFor } from './helpers/authToken';
import { gigFactory } from './helpers/gigFactory';
import Gig from '../models/Gig';

let mongo: MongoMemoryServer;
let app: express.Express;

beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    app = express();
    app.use(express.json());
    app.use('/v1', gigRoutes);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

afterEach(async () => {
    await Gig.deleteMany({});
});

describe('Gig booking terms — Phase 2A', () => {
    it('PATCH /v1/gigs/:id accepts paymentStructure: advance_balance', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const token = authTokenFor(userId, 'organizer');
        const gig = await Gig.create(gigFactory({ organizerId: userId }));

        const res = await request(app)
            .patch(`/v1/gigs/${gig._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ paymentStructure: 'advance_balance' });

        expect(res.status).toBe(200);
        const fresh = await Gig.findById(gig._id).lean();
        expect(fresh!.paymentStructure).toBe('advance_balance');
    });

    it('PATCH /v1/gigs/:id accepts cancellationPolicy: 72h', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const token = authTokenFor(userId, 'organizer');
        const gig = await Gig.create(gigFactory({ organizerId: userId }));

        const res = await request(app)
            .patch(`/v1/gigs/${gig._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ cancellationPolicy: '72h' });

        expect(res.status).toBe(200);
        const fresh = await Gig.findById(gig._id).lean();
        expect(fresh!.cancellationPolicy).toBe('72h');
    });

    it('PATCH rejects invalid paymentStructure value', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const token = authTokenFor(userId, 'organizer');
        const gig = await Gig.create(gigFactory({ organizerId: userId }));

        const res = await request(app)
            .patch(`/v1/gigs/${gig._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ paymentStructure: 'foo' });

        expect(res.status).toBe(400);
    });

    it('PATCH rejects invalid cancellationPolicy value', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const token = authTokenFor(userId, 'organizer');
        const gig = await Gig.create(gigFactory({ organizerId: userId }));

        const res = await request(app)
            .patch(`/v1/gigs/${gig._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ cancellationPolicy: 'never' });

        expect(res.status).toBe(400);
    });

    it('GET returns the new fields with their stored values', async () => {
        const userId = new mongoose.Types.ObjectId().toString();
        const token = authTokenFor(userId, 'organizer');
        const gig = await Gig.create(gigFactory({
            organizerId: userId,
            paymentStructure: 'advance_balance',
            cancellationPolicy: '24h',
        }));

        const res = await request(app)
            .get(`/v1/gigs/${gig._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.paymentStructure).toBe('advance_balance');
        expect(res.body.data.cancellationPolicy).toBe('24h');
    });
});
```

- [ ] **Step 1.2: Run test — should fail (fields don't exist yet)**

```bash
cd /Users/rohithutagonna/Documents/Rohit/NETSA/NETSA-React/netsa-backend/gigs-service
npm test -- --testPathPatterns=gig-booking-terms
```

Expected: 4-5 failures because the schema doesn't accept the fields yet (Zod validation strips unknown fields, OR the field never persists).

- [ ] **Step 1.3: Add fields to `IGig` interface + Mongoose schema**

In `src/models/Gig.ts`, find the `IGig` interface. Add (just before the existing `// ── GigForm v2 additions (Plan 4) ──` block, keeping fields grouped semantically):

```ts
  // Booking terms (Phase 2A — master/template terms instantiated into per-hire contracts)
  paymentStructure?: 'full' | 'advance_balance';
  cancellationPolicy?: '24h' | '48h' | '72h';
```

In the schema definition (the `new Schema(...)` block), add:

```ts
  paymentStructure: {
      type: String,
      enum: ['full', 'advance_balance'],
      default: 'full',
  },
  cancellationPolicy: {
      type: String,
      enum: ['24h', '48h', '72h'],
      default: '48h',
  },
```

Place these next to `termsAndConditions: String` so the booking-terms-related fields cluster together.

- [ ] **Step 1.4: Extend Zod validation**

In `src/utils/validation.ts`, find `updateGigSchema` (and `createGigSchema` if both exist). Add the two optional fields to both schemas:

```ts
paymentStructure: z.enum(['full', 'advance_balance']).optional(),
cancellationPolicy: z.enum(['24h', '48h', '72h']).optional(),
```

If the existing schemas use `.partial()` or similar pattern, the fields just need to appear in the base shape.

- [ ] **Step 1.5: Re-run tests — should pass**

```bash
npm test -- --testPathPatterns=gig-booking-terms
```

Expected: 5 tests pass.

- [ ] **Step 1.6: Run full gigs-service test sweep**

```bash
npm test
```

Expected: all existing gig tests still pass (the 2 new fields are additive + optional).

- [ ] **Step 1.7: Commit + push backend**

```bash
cd /Users/rohithutagonna/Documents/Rohit/NETSA/NETSA-React/netsa-backend
git add gigs-service/src/models/Gig.ts \
        gigs-service/src/utils/validation.ts \
        gigs-service/src/tests/gig-booking-terms.test.ts
git commit -m "$(cat <<'EOF'
feat(gigs): paymentStructure + cancellationPolicy enums on Gig

Phase 2A — Booking Terms Editor backend.

  - paymentStructure: 'full' | 'advance_balance' (default 'full')
  - cancellationPolicy: '24h' | '48h' | '72h' (default '48h')

Both optional + additive — existing gigs continue to work without them.
PATCH /v1/gigs/:id accepts the new fields via the existing Zod schema
+ Mongoose pass-through. 5 round-trip tests cover save, retrieve, and
invalid-value rejection.

PRD ref: §8.3.3.6 Booking Terms Editor.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
git push origin develop
```

---

## Task 2: Mobile — PaymentStructurePicker

**Files:**
- Create: `src/features/booking-terms-editor/components/PaymentStructurePicker.tsx`
- Create: `src/features/booking-terms-editor/__tests__/PaymentStructurePicker.test.tsx`

- [ ] **Step 2.1: Write failing test**

```tsx
// src/features/booking-terms-editor/__tests__/PaymentStructurePicker.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { PaymentStructurePicker } from '../components/PaymentStructurePicker';

describe('PaymentStructurePicker', () => {
    it('renders both options with selected card highlighted', () => {
        const { getByText, getByLabelText } = render(
            <PaymentStructurePicker value="advance_balance" amount={50000} onChange={jest.fn()} />
        );
        expect(getByText('Full upfront')).toBeTruthy();
        expect(getByText('30/70 advance')).toBeTruthy();
        expect(getByLabelText(/Payment structure: 30\/70 advance, selected/i)).toBeTruthy();
    });

    it('selecting full fires onChange("full")', () => {
        const onChange = jest.fn();
        const { getByText } = render(
            <PaymentStructurePicker value="advance_balance" amount={50000} onChange={onChange} />
        );
        fireEvent.press(getByText('Full upfront'));
        expect(onChange).toHaveBeenCalledWith('full');
    });

    it('shows Recommended badge when amount >= 50000 and structure is advance_balance', () => {
        const { getByText } = render(
            <PaymentStructurePicker value="advance_balance" amount={75000} onChange={jest.fn()} />
        );
        expect(getByText(/Recommended/i)).toBeTruthy();
    });

    it('hides Recommended badge when amount < 50000', () => {
        const { queryByText } = render(
            <PaymentStructurePicker value="advance_balance" amount={20000} onChange={jest.fn()} />
        );
        expect(queryByText(/Recommended/i)).toBeNull();
    });

    it('shows split math when 30/70 selected and amount > 0', () => {
        const { getByText } = render(
            <PaymentStructurePicker value="advance_balance" amount={50000} onChange={jest.fn()} />
        );
        // ₹15K on sign · ₹35K post-event
        expect(getByText(/₹15K/)).toBeTruthy();
        expect(getByText(/₹35K/)).toBeTruthy();
    });
});
```

- [ ] **Step 2.2: Implement PaymentStructurePicker**

```tsx
// src/features/booking-terms-editor/components/PaymentStructurePicker.tsx
//
// Two radio cards: Full upfront / 30/70 advance. The advance card shows
// the computed split (₹15K → ₹35K) when an amount is provided, plus a
// 'Recommended' badge for amounts >= ₹50K.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35', gold: '#F59E0B',
};

export type PaymentStructure = 'full' | 'advance_balance';

type Props = {
    value: PaymentStructure;
    amount: number;
    onChange: (next: PaymentStructure) => void;
};

function inrShort(amount: number): string {
    if (!Number.isFinite(amount)) return '₹0';
    if (amount >= 99_950) {
        const lakh = Math.floor((amount / 100000) * 10) / 10;
        return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)}L`;
    }
    if (amount >= 1000) {
        const k = Math.floor((amount / 1000) * 10) / 10;
        return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)}K`;
    }
    return `₹${Math.max(0, Math.floor(amount))}`;
}

function OptionCard({
    title, subtitle, selected, onPress, children, recommended,
}: {
    title: string;
    subtitle: string;
    selected: boolean;
    onPress: () => void;
    children?: React.ReactNode;
    recommended?: boolean;
}) {
    return (
        <TouchableOpacity
            onPress={onPress}
            accessibilityLabel={`Payment structure: ${title}${selected ? ', selected' : ''}`}
            style={{
                padding: 16,
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: selected ? COLORS.orange : COLORS.line,
                backgroundColor: selected ? 'rgba(255,107,53,0.06)' : COLORS.bg1,
                marginBottom: 12,
                position: 'relative',
            }}>
            {selected && (
                <View style={{
                    position: 'absolute', top: 14, right: 14,
                    width: 18, height: 18, borderRadius: 9,
                    backgroundColor: COLORS.orange,
                    borderWidth: 4, borderColor: COLORS.bg1,
                }} />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 28 }}>
                <Text style={{ color: COLORS.text0, fontSize: 14, fontWeight: '700' }}>{title}</Text>
                {recommended && (
                    <View style={{
                        paddingVertical: 2, paddingHorizontal: 8, borderRadius: 999,
                        backgroundColor: 'rgba(255,107,53,0.18)',
                    }}>
                        <Text style={{ color: COLORS.orange, fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            Recommended
                        </Text>
                    </View>
                )}
            </View>
            <Text style={{ color: COLORS.text2, fontSize: 12, marginTop: 6, lineHeight: 18 }}>
                {subtitle}
            </Text>
            {children}
        </TouchableOpacity>
    );
}

export function PaymentStructurePicker({ value, amount, onChange }: Props) {
    const advance = Math.floor(amount * 0.3);
    const balance = amount - advance;

    return (
        <View>
            <OptionCard
                title="Full upfront"
                subtitle="Hirer pays 100% on contract signing. Best for one-off short gigs."
                selected={value === 'full'}
                onPress={() => onChange('full')}
            />
            <OptionCard
                title="30/70 advance"
                subtitle="30% on signing, 70% after the gig. Standard for events ≥ ₹50K."
                selected={value === 'advance_balance'}
                onPress={() => onChange('advance_balance')}
                recommended={amount >= 50000}>
                {value === 'advance_balance' && amount > 0 && (
                    <View style={{
                        marginTop: 12,
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                    }}>
                        <Text style={{ color: COLORS.orange, fontSize: 11, fontWeight: '700' }}>
                            {inrShort(advance)}
                        </Text>
                        <Text style={{ color: COLORS.text3, fontSize: 11 }}>on sign  →  </Text>
                        <Text style={{ color: COLORS.gold, fontSize: 11, fontWeight: '700' }}>
                            {inrShort(balance)}
                        </Text>
                        <Text style={{ color: COLORS.text3, fontSize: 11 }}>post-event</Text>
                    </View>
                )}
            </OptionCard>
        </View>
    );
}
```

- [ ] **Step 2.3: Run test — passes**

```bash
cd /Users/rohithutagonna/Documents/Rohit/NETSA/NETSA-React/netsa-mobile
npx jest src/features/booking-terms-editor/__tests__/PaymentStructurePicker.test.tsx
```

Expected: 5 tests pass.

- [ ] **Step 2.4: Commit**

```bash
git add src/features/booking-terms-editor/components/PaymentStructurePicker.tsx \
        src/features/booking-terms-editor/__tests__/PaymentStructurePicker.test.tsx
git commit -m "feat(booking-terms): PaymentStructurePicker

Two radio cards (Full upfront / 30/70 advance). Advance card shows
the computed split + Recommended badge when amount >= ₹50K.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Mobile — CancellationPicker

**Files:**
- Create: `src/features/booking-terms-editor/components/CancellationPicker.tsx`
- Create: `src/features/booking-terms-editor/__tests__/CancellationPicker.test.tsx`

- [ ] **Step 3.1: Write failing test**

```tsx
// src/features/booking-terms-editor/__tests__/CancellationPicker.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CancellationPicker } from '../components/CancellationPicker';

describe('CancellationPicker', () => {
    it('renders 3 chips with the selected one highlighted', () => {
        const { getByLabelText } = render(
            <CancellationPicker value="48h" onChange={jest.fn()} />
        );
        expect(getByLabelText(/Cancellation: 48h, selected/i)).toBeTruthy();
    });

    it('tapping a chip fires onChange with that value', () => {
        const onChange = jest.fn();
        const { getByText } = render(<CancellationPicker value="48h" onChange={onChange} />);
        fireEvent.press(getByText('72h'));
        expect(onChange).toHaveBeenCalledWith('72h');
    });

    it('forfeit preview reflects selection', () => {
        const { getByText } = render(<CancellationPicker value="24h" onChange={jest.fn()} />);
        expect(getByText(/within 24h/i)).toBeTruthy();
        expect(getByText(/100%/)).toBeTruthy();
    });
});
```

- [ ] **Step 3.2: Implement CancellationPicker**

```tsx
// src/features/booking-terms-editor/components/CancellationPicker.tsx
//
// Three chips (24h / 48h / 72h) + a small forfeit-preview card below.

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', bg2: '#16161F', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35',
};

export type CancellationPolicy = '24h' | '48h' | '72h';

const OPTIONS: CancellationPolicy[] = ['24h', '48h', '72h'];

type Props = {
    value: CancellationPolicy;
    onChange: (next: CancellationPolicy) => void;
};

export function CancellationPicker({ value, onChange }: Props) {
    return (
        <View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
                {OPTIONS.map((opt) => {
                    const selected = value === opt;
                    return (
                        <TouchableOpacity
                            key={opt}
                            onPress={() => onChange(opt)}
                            accessibilityLabel={`Cancellation: ${opt}${selected ? ', selected' : ''}`}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 12,
                                borderWidth: 1.5,
                                borderColor: selected ? COLORS.orange : COLORS.line,
                                backgroundColor: selected ? 'rgba(255,107,53,0.10)' : COLORS.bg2,
                                alignItems: 'center',
                            }}>
                            <Text style={{
                                color: selected ? COLORS.orange : COLORS.text2,
                                fontSize: 12, fontWeight: '700',
                            }}>{opt}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <View style={{
                marginTop: 16, padding: 12, borderRadius: 12,
                backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.line,
            }}>
                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                    If cancelled within {value}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: COLORS.orange, fontSize: 14, fontWeight: '700' }}>100%</Text>
                    <Text style={{ color: COLORS.text1, fontSize: 12 }}>forfeit</Text>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.line }} />
                    <Text style={{ color: COLORS.text2, fontSize: 12 }}>artist keeps full advance</Text>
                </View>
            </View>
        </View>
    );
}
```

- [ ] **Step 3.3: Run + commit**

```bash
npx jest src/features/booking-terms-editor/__tests__/CancellationPicker.test.tsx
git add src/features/booking-terms-editor/components/CancellationPicker.tsx \
        src/features/booking-terms-editor/__tests__/CancellationPicker.test.tsx
git commit -m "feat(booking-terms): CancellationPicker — 3-chip selector + forfeit preview

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Mobile — NegotiableToggle

**Files:**
- Create: `src/features/booking-terms-editor/components/NegotiableToggle.tsx`

(No standalone test — covered by `BookingTermsEditor.behavior.test.tsx` later.)

- [ ] **Step 4.1: Implement NegotiableToggle**

```tsx
// src/features/booking-terms-editor/components/NegotiableToggle.tsx
//
// Single row: switch + caption. Wraps RN Switch with brand styling.

import React from 'react';
import { View, Text, Switch } from 'react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6',
    orange: '#FF6B35',
};

type Props = {
    value: boolean;
    onChange: (next: boolean) => void;
};

export function NegotiableToggle({ value, onChange }: Props) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: '#3F3D4A', true: COLORS.orange }}
                thumbColor="#fff"
                accessibilityLabel="Negotiable rate toggle"
            />
            <Text style={{ flex: 1, color: COLORS.text1, fontSize: 14, lineHeight: 20 }}>
                Negotiable — artists can propose a different rate
            </Text>
        </View>
    );
}
```

- [ ] **Step 4.2: Commit**

```bash
git add src/features/booking-terms-editor/components/NegotiableToggle.tsx
git commit -m "feat(booking-terms): NegotiableToggle — switch + label row

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Mobile — BookingTermsPreviewModal

**Files:**
- Create: `src/features/booking-terms-editor/components/BookingTermsPreviewModal.tsx`
- Create: `src/features/booking-terms-editor/__tests__/BookingTermsPreviewModal.test.tsx`

- [ ] **Step 5.1: Write failing test**

```tsx
// src/features/booking-terms-editor/__tests__/BookingTermsPreviewModal.test.tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { BookingTermsPreviewModal } from '../components/BookingTermsPreviewModal';

describe('BookingTermsPreviewModal', () => {
    it('returns null when not visible', () => {
        const { toJSON } = render(
            <BookingTermsPreviewModal
                visible={false}
                paymentStructure="full"
                cancellationPolicy="48h"
                amount={50000}
                negotiable={false}
                onClose={jest.fn()}
            />
        );
        expect(toJSON()).toBeNull();
    });

    it('renders structured fields when visible', () => {
        const { getByText } = render(
            <BookingTermsPreviewModal
                visible={true}
                paymentStructure="advance_balance"
                cancellationPolicy="48h"
                amount={50000}
                negotiable={true}
                termsAndConditions="Show up sober."
                onClose={jest.fn()}
            />
        );
        expect(getByText(/30\/70 advance/i)).toBeTruthy();
        expect(getByText(/48h/i)).toBeTruthy();
        expect(getByText(/Negotiable/i)).toBeTruthy();
        expect(getByText('Show up sober.')).toBeTruthy();
    });

    it('omits the freeform paragraph when termsAndConditions is empty', () => {
        const { queryByText } = render(
            <BookingTermsPreviewModal
                visible={true}
                paymentStructure="full"
                cancellationPolicy="24h"
                amount={10000}
                negotiable={false}
                onClose={jest.fn()}
            />
        );
        expect(queryByText(/Additional terms/i)).toBeNull();
    });
});
```

- [ ] **Step 5.2: Implement BookingTermsPreviewModal**

```tsx
// src/features/booking-terms-editor/components/BookingTermsPreviewModal.tsx
//
// Read-only modal that renders the artist-facing terms exactly as they
// appear in the Apply modal Stage 1 panel. Returns null when !visible.

import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X } from 'lucide-react-native';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg0: '#07070B', bg1: '#0F0F16', bg2: '#16161F',
    line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35',
};

type Props = {
    visible: boolean;
    paymentStructure?: 'full' | 'advance_balance';
    cancellationPolicy?: '24h' | '48h' | '72h';
    amount: number;
    negotiable: boolean;
    termsAndConditions?: string;
    onClose: () => void;
};

const STRUCTURE_LABEL: Record<string, string> = {
    full: 'Full upfront',
    advance_balance: '30/70 advance',
};

function FieldRow({ label, value }: { label: string; value: string }) {
    return (
        <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>{label}</Text>
            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '600', marginTop: 4 }}>{value}</Text>
        </View>
    );
}

export function BookingTermsPreviewModal({
    visible,
    paymentStructure = 'full',
    cancellationPolicy = '48h',
    amount,
    negotiable,
    termsAndConditions,
    onClose,
}: Props) {
    if (!visible) return null;

    const tc = (termsAndConditions ?? '').trim();
    const formattedAmount = `₹${(amount ?? 0).toLocaleString('en-IN')}${negotiable ? ' · negotiable' : ''}`;

    return (
        <Modal visible transparent animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: COLORS.bg0 }}>
                <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: COLORS.text1, fontWeight: '600' }}>Preview</Text>
                    <TouchableOpacity onPress={onClose} accessibilityLabel="Close preview">
                        <X size={20} color={COLORS.text1} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 24 }}>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, color: COLORS.text0, letterSpacing: -0.4, marginBottom: 8 }}>
                        What artists see when they apply
                    </Text>
                    <Text style={{ color: COLORS.text2, fontSize: 13, marginBottom: 24, lineHeight: 18 }}>
                        These are the booking terms attached to your gig. Each applicant signs a copy at hire time.
                    </Text>

                    <View style={{ borderRadius: 16, padding: 20, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line }}>
                        <Text style={{ fontSize: 11, color: COLORS.orange, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>
                            Booking terms
                        </Text>
                        <FieldRow label="Pay" value={`${formattedAmount} · ${STRUCTURE_LABEL[paymentStructure]}`} />
                        <FieldRow label="Cancellation" value={`${cancellationPolicy} notice · 100% forfeit if within window`} />
                        {tc && (
                            <View style={{ marginTop: 8 }}>
                                <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                                    Additional terms
                                </Text>
                                <Text style={{ fontSize: 14, color: COLORS.text1, lineHeight: 22 }}>
                                    {tc}
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            </View>
        </Modal>
    );
}
```

- [ ] **Step 5.3: Run + commit**

```bash
npx jest src/features/booking-terms-editor/__tests__/BookingTermsPreviewModal.test.tsx
git add src/features/booking-terms-editor/components/BookingTermsPreviewModal.tsx \
        src/features/booking-terms-editor/__tests__/BookingTermsPreviewModal.test.tsx
git commit -m "feat(booking-terms): BookingTermsPreviewModal

Read-only modal showing artist-facing terms (pay, cancellation,
optional freeform paragraph). Returns null when !visible — safe
to mount unconditionally and toggle via prop.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Mobile — useBookingTermsEdit hook + BookingTermsEditor screen

**Files:**
- Create: `src/features/booking-terms-editor/hooks/useBookingTermsEdit.ts`
- Create: `src/features/booking-terms-editor/BookingTermsEditor.tsx`
- Create: `src/features/booking-terms-editor/__tests__/BookingTermsEditor.behavior.test.tsx`

- [ ] **Step 6.1: Implement useBookingTermsEdit hook**

```ts
// src/features/booking-terms-editor/hooks/useBookingTermsEdit.ts
//
// Local form state + dirty tracking + save wrapper.
// Save composes a partial Gig payload from dirty fields only.

import { useState, useCallback, useMemo } from 'react';
import { useUpdateGig } from '@/hooks/useGigs';

type PaymentStructure = 'full' | 'advance_balance';
type CancellationPolicy = '24h' | '48h' | '72h';

type Initial = {
    paymentStructure?: PaymentStructure;
    cancellationPolicy?: CancellationPolicy;
    negotiable?: boolean;
};

export function useBookingTermsEdit(gigId: string, initial: Initial) {
    const [paymentStructure, setPaymentStructure] = useState<PaymentStructure>(initial.paymentStructure ?? 'full');
    const [cancellationPolicy, setCancellationPolicy] = useState<CancellationPolicy>(initial.cancellationPolicy ?? '48h');
    const [negotiable, setNegotiable] = useState<boolean>(initial.negotiable ?? false);

    const updateMutation = useUpdateGig();

    const dirtyFields = useMemo(() => {
        const dirty: any = {};
        if (paymentStructure !== (initial.paymentStructure ?? 'full')) dirty.paymentStructure = paymentStructure;
        if (cancellationPolicy !== (initial.cancellationPolicy ?? '48h')) dirty.cancellationPolicy = cancellationPolicy;
        if (negotiable !== (initial.negotiable ?? false)) {
            dirty.compensation = { negotiable };
        }
        return dirty;
    }, [paymentStructure, cancellationPolicy, negotiable, initial]);

    const isDirty = Object.keys(dirtyFields).length > 0;

    const save = useCallback(async () => {
        if (!isDirty) return null;
        return updateMutation.mutateAsync({ id: gigId, payload: dirtyFields });
    }, [isDirty, dirtyFields, gigId, updateMutation]);

    return {
        paymentStructure, setPaymentStructure,
        cancellationPolicy, setCancellationPolicy,
        negotiable, setNegotiable,
        isDirty,
        isSaving: updateMutation.isPending,
        saveError: updateMutation.error as Error | null,
        save,
    };
}
```

- [ ] **Step 6.2: Implement BookingTermsEditor screen**

```tsx
// src/features/booking-terms-editor/BookingTermsEditor.tsx
//
// Focused single-screen editor for the gig's master booking terms.
// Save patches only dirty fields. Cancel-while-dirty triggers a discard
// prompt. Preview link opens BookingTermsPreviewModal.

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useGig } from '@/hooks/useGigs';
import { useBookingTermsEdit } from './hooks/useBookingTermsEdit';
import { PaymentStructurePicker } from './components/PaymentStructurePicker';
import { CancellationPicker } from './components/CancellationPicker';
import { NegotiableToggle } from './components/NegotiableToggle';
import { BookingTermsPreviewModal } from './components/BookingTermsPreviewModal';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878', text3: '#3F3D4A',
    bg0: '#07070B', bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35', purple: '#8B5CF6',
};

type Props = { gigId: string };

export function BookingTermsEditor({ gigId }: Props) {
    const router = useRouter();
    const { data: gig, isLoading } = useGig(gigId);
    const [previewOpen, setPreviewOpen] = useState(false);

    const edit = useBookingTermsEdit(gigId, {
        paymentStructure: gig?.paymentStructure,
        cancellationPolicy: gig?.cancellationPolicy,
        negotiable: gig?.compensation?.negotiable,
    });

    if (isLoading || !gig) {
        return (
            <View style={{ flex: 1, backgroundColor: COLORS.bg0, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator color={COLORS.orange} size="large" />
            </View>
        );
    }

    const handleCancel = () => {
        if (!edit.isDirty) {
            router.back();
            return;
        }
        Alert.alert(
            'Discard changes?',
            'Your edits to the booking terms will be lost.',
            [
                { text: 'Keep editing', style: 'cancel' },
                { text: 'Discard', style: 'destructive', onPress: () => router.back() },
            ]
        );
    };

    const handleSave = async () => {
        try {
            await edit.save();
            Alert.alert('Saved', 'Booking terms updated · applies to new hires.', [
                { text: 'OK', onPress: () => router.back() },
            ]);
        } catch (err: any) {
            Alert.alert('Save failed', err?.message ?? 'Could not update terms. Try again.');
        }
    };

    const compensationAmount = gig.compensation?.amount ?? 0;

    return (
        <View style={{ flex: 1, backgroundColor: COLORS.bg0 }}>
            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: COLORS.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={handleCancel} accessibilityLabel="Cancel">
                    <Text style={{ color: COLORS.text1, fontSize: 14 }}>Cancel</Text>
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Edit</Text>
                    <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', letterSpacing: -0.1 }}>Booking terms</Text>
                </View>
                <TouchableOpacity onPress={handleSave} disabled={!edit.isDirty || edit.isSaving} accessibilityLabel="Save">
                    <Text style={{ color: edit.isDirty ? COLORS.orange : COLORS.text3, fontSize: 14, fontWeight: '700', opacity: edit.isSaving ? 0.5 : 1 }}>
                        {edit.isSaving ? 'Saving…' : 'Save'}
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
                {/* Hero */}
                <View style={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20 }}>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 28, color: COLORS.text0, letterSpacing: -0.5, lineHeight: 32 }}>
                        What every hire agrees to
                    </Text>
                    <Text style={{ marginTop: 8, color: COLORS.text2, fontSize: 13, lineHeight: 20 }}>
                        These are the standard terms. Each artist signs a copy at hire time.
                        <Text style={{ color: COLORS.text1 }}> Edits apply to new hires only.</Text>
                    </Text>
                </View>

                {/* Section: Payment structure */}
                <View style={{ paddingHorizontal: 24, marginBottom: 28 }}>
                    <SectionHeader title="Payment structure" />
                    <PaymentStructurePicker
                        value={edit.paymentStructure}
                        amount={compensationAmount}
                        onChange={edit.setPaymentStructure}
                    />
                </View>

                <Divider />

                {/* Section: Cancellation */}
                <View style={{ paddingHorizontal: 24, paddingTop: 28, marginBottom: 28 }}>
                    <SectionHeader title="Cancellation" />
                    <CancellationPicker
                        value={edit.cancellationPolicy}
                        onChange={edit.setCancellationPolicy}
                    />
                </View>

                <Divider />

                {/* Section: Negotiable */}
                <View style={{ paddingHorizontal: 24, paddingTop: 28, marginBottom: 28 }}>
                    <SectionHeader title="Negotiation" />
                    <NegotiableToggle value={edit.negotiable} onChange={edit.setNegotiable} />
                </View>
            </ScrollView>

            {/* Sticky footer: Preview link */}
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, backgroundColor: COLORS.bg0, borderTopWidth: 1, borderTopColor: COLORS.line }}>
                <TouchableOpacity onPress={() => setPreviewOpen(true)} accessibilityLabel="Preview as artists see">
                    <Text style={{ color: COLORS.purple, fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
                        Preview as artists see →
                    </Text>
                </TouchableOpacity>
            </View>

            <BookingTermsPreviewModal
                visible={previewOpen}
                paymentStructure={edit.paymentStructure}
                cancellationPolicy={edit.cancellationPolicy}
                amount={compensationAmount}
                negotiable={edit.negotiable}
                termsAndConditions={gig.termsAndConditions}
                onClose={() => setPreviewOpen(false)}
            />
        </View>
    );
}

function SectionHeader({ title }: { title: string }) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: COLORS.text0, letterSpacing: -0.2 }}>{title}</Text>
            <Text style={{ fontSize: 9, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Required</Text>
        </View>
    );
}

function Divider() {
    return <View style={{ height: 1, backgroundColor: COLORS.line, marginHorizontal: 24 }} />;
}
```

- [ ] **Step 6.3: Behavior test**

```tsx
// src/features/booking-terms-editor/__tests__/BookingTermsEditor.behavior.test.tsx
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
    useRouter: () => ({ push: jest.fn(), back: mockBack }),
}));

const mockMutateAsync = jest.fn().mockResolvedValue({});
jest.mock('@/hooks/useGigs', () => ({
    useGig: () => ({
        data: {
            _id: 'g1',
            title: 'Sangeet',
            paymentStructure: 'full',
            cancellationPolicy: '48h',
            compensation: { amount: 50000, negotiable: false },
        },
        isLoading: false,
    }),
    useUpdateGig: () => ({ mutateAsync: mockMutateAsync, isPending: false, error: null }),
}));

// Spy on Alert so handleSave / handleCancel don't actually pop modals
import { Alert } from 'react-native';
jest.spyOn(Alert, 'alert').mockImplementation((title, message, buttons) => {
    // Auto-tap the OK / Discard option for tests
    if (Array.isArray(buttons)) {
        const action = buttons.find((b) => b.text === 'OK' || b.text === 'Discard');
        action?.onPress?.();
    }
});

import { BookingTermsEditor } from '../BookingTermsEditor';

describe('BookingTermsEditor', () => {
    beforeEach(() => {
        mockBack.mockClear();
        mockMutateAsync.mockClear();
    });

    it('Save is disabled until a field changes', () => {
        const { getByLabelText } = render(<BookingTermsEditor gigId="g1" />);
        const saveBtn = getByLabelText('Save');
        // Disabled state proxies via opacity / TouchableOpacity props.disabled — fire still works in RTL,
        // but onPress should not invoke mutateAsync because handleSave guards via isDirty.
        fireEvent.press(saveBtn);
        expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('Save fires updateGig with dirty fields only', async () => {
        const { getByText, getByLabelText } = render(<BookingTermsEditor gigId="g1" />);
        // Change payment structure full → advance_balance
        fireEvent.press(getByText('30/70 advance'));
        await act(async () => {
            fireEvent.press(getByLabelText('Save'));
        });
        expect(mockMutateAsync).toHaveBeenCalledWith({
            id: 'g1',
            payload: { paymentStructure: 'advance_balance' },
        });
    });

    it('Cancel without changes routes back immediately (no Alert)', () => {
        const alertSpy = jest.spyOn(Alert, 'alert');
        const { getByLabelText } = render(<BookingTermsEditor gigId="g1" />);
        fireEvent.press(getByLabelText('Cancel'));
        expect(mockBack).toHaveBeenCalled();
    });
});
```

- [ ] **Step 6.4: Run + commit**

```bash
npx jest src/features/booking-terms-editor/__tests__/BookingTermsEditor.behavior.test.tsx
git add src/features/booking-terms-editor/hooks/useBookingTermsEdit.ts \
        src/features/booking-terms-editor/BookingTermsEditor.tsx \
        src/features/booking-terms-editor/__tests__/BookingTermsEditor.behavior.test.tsx
git commit -m "feat(booking-terms): BookingTermsEditor screen + edit hook

Single-purpose editor screen. Tracks dirty fields locally; Save patches
only what changed. Cancel-while-dirty triggers a discard prompt.
Preview link opens BookingTermsPreviewModal with current draft values.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Mobile — Route file at `app/(app)/gigs/[id]/booking-terms.tsx`

**Files:**
- Create: `app/(app)/gigs/[id]/booking-terms.tsx`

The current `/gigs/[id]` is a single file (`app/(app)/gigs/[id].tsx`). We need expo-router to support both `/gigs/[id]` AND `/gigs/[id]/booking-terms`. Expo Router resolves this naturally: when both patterns exist, the file `app/(app)/gigs/[id].tsx` keeps serving the index, and `app/(app)/gigs/[id]/booking-terms.tsx` serves the booking-terms route.

- [ ] **Step 7.1: Create route file**

```tsx
// app/(app)/gigs/[id]/booking-terms.tsx
import React from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { BookingTermsEditor } from '@/features/booking-terms-editor/BookingTermsEditor';

export default function BookingTermsScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!id) return null;
    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <BookingTermsEditor gigId={id} />
        </>
    );
}
```

- [ ] **Step 7.2: Verify route navigation works**

The implementer should not run an e2e here. Just confirm the file compiles and the existing test suite passes:

```bash
cd /Users/rohithutagonna/Documents/Rohit/NETSA/NETSA-React/netsa-mobile
npx jest src/features/booking-terms-editor/
```

Expected: all booking-terms-editor tests pass.

- [ ] **Step 7.3: Commit**

```bash
git add app/\(app\)/gigs/\[id\]/booking-terms.tsx
git commit -m "feat(booking-terms): expo-router screen at /gigs/[id]/booking-terms

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Mobile — Wire HubBookingTermsCard buttons

**Files:**
- Modify: `src/features/hirer-hub/components/HubBookingTermsCard.tsx`
- Modify: `src/features/hirer-hub/HirerGigHub.tsx`

- [ ] **Step 8.1: Update Card props + wiring**

In `src/features/hirer-hub/components/HubBookingTermsCard.tsx`, change the Props type to accept `gigId` + `termsAndConditions` + `negotiable`, and replace the `handleDeferred` with two distinct handlers:

```tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Eye, Edit3, Info } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { BookingTermsPreviewModal } from '@/features/booking-terms-editor/components/BookingTermsPreviewModal';

const COLORS = {
    text0: '#F3EFE8', text1: '#B8B1A6', text2: '#6B6878',
    bg1: '#0F0F16', line: 'rgba(255,255,255,0.05)',
    orange: '#FF6B35', purple: '#8B5CF6',
};

type Props = {
    gigId: string;
    paymentStructure?: 'full' | 'advance_balance';
    cancellationPolicy?: string;
    leadAmount?: number;
    subArtistAmount?: number;
    customClausesCount?: number;
    activeContractsCount: number;
    negotiable?: boolean;
    termsAndConditions?: string;
};

const STRUCTURE_LABEL: Record<string, string> = {
    full: 'Full upfront',
    advance_balance: '30/70 advance',
};

export function HubBookingTermsCard({
    gigId,
    paymentStructure = 'advance_balance',
    cancellationPolicy = '48h',
    leadAmount = 0,
    subArtistAmount,
    customClausesCount = 0,
    activeContractsCount,
    negotiable = false,
    termsAndConditions,
}: Props) {
    const router = useRouter();
    const [previewOpen, setPreviewOpen] = useState(false);

    return (
        <>
            <View style={{ paddingHorizontal: 24, paddingTop: 36 }}>
                <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, color: COLORS.text0, letterSpacing: -0.4 }}>
                        Booking terms
                    </Text>
                    <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                        Template · {activeContractsCount} sealed
                    </Text>
                </View>

                <View style={{ borderRadius: 16, padding: 20, backgroundColor: COLORS.bg1, borderWidth: 1, borderColor: COLORS.line }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        <View style={{ width: '50%', marginBottom: 16 }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Pay structure</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>{STRUCTURE_LABEL[paymentStructure]}</Text>
                        </View>
                        <View style={{ width: '50%', marginBottom: 16 }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Cancellation</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>{cancellationPolicy} notice</Text>
                        </View>
                        <View style={{ width: '50%' }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Compensation</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>
                                ₹{(leadAmount).toLocaleString('en-IN')}{subArtistAmount ? ` · ₹${subArtistAmount.toLocaleString('en-IN')} ea` : ''}
                            </Text>
                        </View>
                        <View style={{ width: '50%' }}>
                            <Text style={{ fontSize: 10, color: COLORS.text2, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Custom clauses</Text>
                            <Text style={{ fontSize: 14, color: COLORS.text0, fontWeight: '700', marginTop: 4 }}>
                                {customClausesCount === 0 ? 'None' : `${customClausesCount} added`}
                            </Text>
                        </View>
                    </View>

                    <View style={{ height: 1, backgroundColor: COLORS.line, marginTop: 4, marginBottom: 16 }} />

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            onPress={() => setPreviewOpen(true)}
                            accessibilityLabel="Preview as artists see"
                            style={{
                                flex: 1, paddingVertical: 10, borderRadius: 8,
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                                backgroundColor: 'rgba(139,92,246,0.08)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.20)',
                            }}>
                            <Eye size={12} color={COLORS.purple} />
                            <Text style={{ color: COLORS.purple, fontSize: 12, fontWeight: '700' }}>Preview as artists see</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => router.push(`/(app)/gigs/${gigId}/booking-terms` as any)}
                            accessibilityLabel="Edit terms"
                            style={{
                                flex: 1, paddingVertical: 10, borderRadius: 8,
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                                backgroundColor: 'rgba(255,107,53,0.08)', borderWidth: 1, borderColor: 'rgba(255,107,53,0.25)',
                            }}>
                            <Edit3 size={12} color={COLORS.orange} />
                            <Text style={{ color: COLORS.orange, fontSize: 12, fontWeight: '700' }}>Edit terms</Text>
                        </TouchableOpacity>
                    </View>

                    {activeContractsCount > 0 && (
                        <View style={{ marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.02)', flexDirection: 'row', gap: 8 }}>
                            <Info size={11} color={COLORS.text2} style={{ marginTop: 2 }} />
                            <Text style={{ flex: 1, fontSize: 11, color: COLORS.text2, lineHeight: 16 }}>
                                Edits apply to <Text style={{ color: COLORS.text1 }}>new hires only</Text>. {activeContractsCount} existing contract{activeContractsCount === 1 ? '' : 's'} keep sealed terms unless you push an amendment.
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <BookingTermsPreviewModal
                visible={previewOpen}
                paymentStructure={paymentStructure}
                cancellationPolicy={cancellationPolicy as any}
                amount={leadAmount}
                negotiable={negotiable}
                termsAndConditions={termsAndConditions}
                onClose={() => setPreviewOpen(false)}
            />
        </>
    );
}
```

- [ ] **Step 8.2: Thread new props through HirerGigHub**

In `src/features/hirer-hub/HirerGigHub.tsx`, find the existing `<HubBookingTermsCard ...>` invocation. Add the new props:

```tsx
<HubBookingTermsCard
    gigId={gigId}
    paymentStructure={gig.paymentStructure || gig.compensation?.structure || gig.compensation?.paymentStructure || 'advance_balance'}
    cancellationPolicy={gig.cancellationPolicy}
    leadAmount={gig.compensation?.amount ?? gig.compensation?.leadAmount ?? 0}
    subArtistAmount={gig.compensation?.subArtistAmount}
    customClausesCount={(gig.customClauses ?? []).length}
    activeContractsCount={data.contracts.filter((c: any) => ['active', 'sent', 'pending_artist_signature'].includes(c.status)).length}
    negotiable={gig.compensation?.negotiable ?? false}
    termsAndConditions={gig.termsAndConditions}
/>
```

The new props (`gigId`, `negotiable`, `termsAndConditions`) flow from the gig object the orchestrator already fetches.

- [ ] **Step 8.3: Verify existing HubBookingTermsCard test still passes**

The existing test at `src/features/hirer-hub/__tests__/HubBookingTermsCard.test.tsx` doesn't pass `gigId` — the test will fail because the prop is now required. Update the test to pass `gigId="g-test"`:

```tsx
// In src/features/hirer-hub/__tests__/HubBookingTermsCard.test.tsx
// Both render() calls — add gigId="g-test" prop.
```

Also wrap the existing test renders in a `jest.mock('expo-router', ...)` that provides `useRouter()` (the card now imports it). Add at the top of that test file if not already present:

```tsx
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
```

- [ ] **Step 8.4: Run all hub + booking-terms tests**

```bash
npx jest src/features/hirer-hub/ src/features/booking-terms-editor/
```

Expected: all tests pass.

- [ ] **Step 8.5: Commit**

```bash
git add src/features/hirer-hub/components/HubBookingTermsCard.tsx \
        src/features/hirer-hub/HirerGigHub.tsx \
        src/features/hirer-hub/__tests__/HubBookingTermsCard.test.tsx
git commit -m "feat(booking-terms): wire Hub Edit + Preview buttons

Edit terms now navigates to /gigs/[id]/booking-terms.
Preview as artists see opens an inline modal showing the
artist-facing terms panel with the gig's current values.

Replaces the 'Coming soon' Alert handlers from Phase 1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Manual smoke + push

- [ ] **Step 9.1: Run full mobile test sweep**

```bash
cd /Users/rohithutagonna/Documents/Rohit/NETSA/NETSA-React/netsa-mobile
npx jest src/
```

Expected: all 220+ tests pass.

- [ ] **Step 9.2: Push mobile to develop**

```bash
git push origin develop
```

- [ ] **Step 9.3: Manual smoke checklist (founder QA on device)**

After dev rebuild:

1. Login as a hirer. Open one of your posted gigs (`/gigs/[id]`).
2. Hub renders. Locate **Booking terms** section between Your team and Applicants.
3. Tap **Preview as artists see** → bottom-sheet modal opens with:
   - "What artists see when they apply" header
   - Pay row (₹X · Full upfront / 30/70 advance · negotiable if true)
   - Cancellation row (Xh notice · 100% forfeit if within window)
   - Optional Additional terms paragraph if `termsAndConditions` is set
   - X button to close
4. Tap **Edit terms** → navigates to `/gigs/[id]/booking-terms`.
5. Editor screen renders:
   - Header: Cancel / Edit · Booking terms / Save
   - Hero: "What every hire agrees to"
   - 3 sections: Payment structure (2 cards) · Cancellation (3 chips) · Negotiation (toggle)
   - Sticky footer: "Preview as artists see →" link
6. Change payment structure → Save button flips to orange. Tap Save. Toast/Alert "Saved · applies to new hires." Routes back to Hub.
7. Hub re-renders with updated value in the Booking terms card.
8. Re-enter editor, change cancellation → cancel without saving → Discard prompt appears. Tap Discard → back to Hub, no changes saved.
9. Open Preview from inside the editor (sticky link) → modal shows the DRAFT values, not the saved ones (until Save is tapped).
10. Existing tests on real device: applicants list still works, hire flow still works, profile edit still works.

---

## Self-Review

**Spec coverage:**
- Backend: 2 enum fields + Zod + 5 round-trip tests — Task 1 ✓
- PaymentStructurePicker — Task 2 ✓
- CancellationPicker — Task 3 ✓
- NegotiableToggle — Task 4 ✓
- BookingTermsPreviewModal — Task 5 ✓
- BookingTermsEditor screen + hook — Task 6 ✓
- Route file — Task 7 ✓
- Hub wiring — Task 8 ✓
- Smoke + push — Task 9 ✓

**Placeholder scan:** every step has full source. The "Coming soon" Alert calls in Phase 1 are explicitly replaced in Task 8.

**Type consistency:**
- `PaymentStructure = 'full' | 'advance_balance'` — defined in Task 2 + reused in hook (Task 6) + modal (Task 5)
- `CancellationPolicy = '24h' | '48h' | '72h'` — Task 3 + Task 6
- Backend Mongoose enums match the frontend literal unions

**Risks revisited:**
- `useUpdateGig` hook signature confirmed: `mutate({ id, payload: Partial<Gig> })` — Task 6 hook uses `mutateAsync` with this exact shape.
- Backend pass-through update — confirmed by reading existing controller; no controller changes needed.
- Existing `HubBookingTermsCard` test needs `gigId` prop + router mock — addressed in Task 8.3.
- Nested compensation update (`compensation: { negotiable }`) — Mongoose's PATCH should handle deep-merge. If not, adjust the hook to either fetch + merge before saving OR use `$set: { 'compensation.negotiable': value }` style. Verify in Task 1 backend test if dirty-merge is needed; otherwise straightforward.

**Out of scope (deferred to Phase 2B):**
- Custom clauses structured array
- Sub-artist amount field
- Push-terms-amendment endpoint + propagation choice
- Compensation amount editing inside this screen
- "Unreasonable clause" flagging
