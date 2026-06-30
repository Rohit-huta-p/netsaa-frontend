import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { ChevronLeft, X, Shield, CreditCard, Landmark, Lock, Info } from 'lucide-react-native';
import { usePayoutWizardStore, type PayoutDraft } from '@/stores/payoutWizardStore';
import { payoutService } from '@/services/payoutService';
import type { PayoutStatus, PayoutAccount } from '@/services/payoutService';
import { useAuthStore } from '@/stores/authStore';
import PayoutResultScreen from './PayoutResultScreen';

/* ─── Palette ─────────────────────────────────────────────── */
const BG = '#09090b';
const SURFACE = 'rgba(255,255,255,0.04)';
const SURFACE_HI = 'rgba(255,255,255,0.07)';
const HAIRLINE = 'rgba(255,255,255,0.1)';
const TEXT_0 = '#F3EFE8';
const TEXT_1 = '#A1A1AA';
const TEXT_2 = '#71717a';
const TEXT_3 = '#52525b';
const TEXT_4 = '#3f3f46';
const ORANGE = '#FF6B35';
const ORANGE_SOFT = 'rgba(255,107,53,0.16)';
const ORANGE_LINE = 'rgba(255,107,53,0.32)';
const ORANGE_INK = '#1A0D06';
const GREEN = '#22C55E';
const GREEN_SOFT = 'rgba(34,197,94,0.14)';
const BLUE = '#5B8DEF';
const BLUE_SOFT = 'rgba(91,141,239,0.14)';
const RED = '#EF4444';

/* ─── Regexes ────────────────────────────────────────────── */
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ─── Business types ─────────────────────────────────────── */
const BUSINESS_TYPES: { value: 'individual' | 'sole_prop' | 'partnership' | 'llp' | 'pvt_ltd'; label: string; sub: string }[] = [
  { value: 'individual', label: 'Just me', sub: 'individual' },
  { value: 'sole_prop', label: 'Sole proprietor', sub: 'business under your own name' },
  { value: 'partnership', label: 'Partnership', sub: 'two or more individuals' },
  { value: 'llp', label: 'LLP', sub: 'limited liability partnership' },
  { value: 'pvt_ltd', label: 'Pvt Ltd · company', sub: 'running under a business name' },
];

/* ─── Props ──────────────────────────────────────────────── */
interface Props {
  visible: boolean;
  onClose: () => void;
  onDone?: (status: PayoutStatus) => void;
}

/* ─── IFSC lookup result ─────────────────────────────────── */
interface IfscInfo {
  BANK: string;
  BRANCH: string;
  [key: string]: string;
}

/* ─── Main component ─────────────────────────────────────── */
export default function PayoutSetupWizard({ visible, onClose, onDone }: Props) {
  const { step, draft, setStep, patch, reset } = usePayoutWizardStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<PayoutAccount | null>(null);

  const handleClose = () => {
    setResult(null);
    setSubmitError(null);
    onClose();
  };

  const handleDone = () => {
    if (result) {
      if (result.status === 'verified') {
        reset();
      }
      onDone?.(result.status);
    }
    setResult(null);
    setSubmitError(null);
    onClose();
  };

  const handleRetry = () => {
    setResult(null);
    setSubmitError(null);
    setStep(3);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const account = await payoutService.submit({
        businessType: draft.businessType!,
        pan: draft.pan,
        accountHolderName: draft.accountHolderName,
        bankAccount: draft.bankAccount,
        ifsc: draft.ifsc,
        gstin: draft.gstin || undefined,
        email: draft.email,
      });
      setResult(account);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Submission failed. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    if (result) {
      return (
        <PayoutResultScreen
          status={result.status}
          rejectionReason={result.rejectionReason}
          account={result}
          onPrimary={handleDone}
          onRetry={handleRetry}
        />
      );
    }

    switch (step) {
      case 1:
        return <StepIntro onNext={() => setStep(2)} onClose={handleClose} />;
      case 2:
        return <StepBusinessType draft={draft} patch={patch} onNext={() => setStep(3)} onBack={() => setStep(1)} />;
      case 3:
        return <StepPAN draft={draft} patch={patch} onNext={() => setStep(4)} onBack={() => setStep(2)} />;
      case 4:
        return <StepBank draft={draft} patch={patch} onNext={() => setStep(5)} onBack={() => setStep(3)} />;
      case 5:
        return <StepGST draft={draft} patch={patch} onNext={() => setStep(6)} onBack={() => setStep(4)} />;
      case 6:
        return (
          <StepReview
            draft={draft}
            patch={patch}
            submitting={submitting}
            submitError={submitError}
            onSubmit={handleSubmit}
            onBack={() => setStep(5)}
            onEditStep={setStep}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.shell}
      >
        {/* Header */}
        <View style={styles.header}>
          {step > 1 && !result ? (
            <Pressable onPress={() => setStep(step - 1)} style={styles.headerBtn} hitSlop={8}>
              <ChevronLeft size={22} color={TEXT_1} />
            </Pressable>
          ) : (
            <Pressable onPress={handleClose} style={styles.headerBtn} hitSlop={8}>
              <X size={20} color={TEXT_1} />
            </Pressable>
          )}
          <Text style={styles.headerTitle}>Payouts</Text>
          {step > 1 && !result ? (
            <Pressable onPress={handleClose} style={styles.headerBtn} hitSlop={8}>
              <X size={20} color={TEXT_1} />
            </Pressable>
          ) : (
            <View style={styles.headerBtn} />
          )}
        </View>

        {/* Wizard dots */}
        {!result && (
          <View style={styles.dotsRow}>
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <View
                key={s}
                style={[
                  styles.dot,
                  s < step ? styles.dotDone : s === step ? styles.dotCurrent : styles.dotFuture,
                ]}
              />
            ))}
          </View>
        )}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Step 1: Intro ─────────────────────────────────────── */
function StepIntro({ onNext, onClose }: { onNext: () => void; onClose: () => void }) {
  return (
    <View style={{ gap: 28 }}>
      {/* Eyebrow */}
      <Text style={styles.eyebrow}>Step 1 of 6</Text>

      {/* Title + sub */}
      <View style={{ gap: 10 }}>
        <Text style={styles.title}>Quick payout setup.</Text>
        <Text style={styles.sub}>
          Three minutes. Razorpay verifies live. After this, every paid event you host just works.
        </Text>
      </View>

      {/* Have these ready */}
      <View style={{ gap: 10 }}>
        <Text style={styles.monoLabel}>Have these ready</Text>
        <ReadyRow
          iconBg={BLUE_SOFT}
          iconColor={BLUE}
          icon={<CreditCard size={16} color={BLUE} />}
          title="PAN card"
          sub="required by Razorpay"
        />
        <ReadyRow
          iconBg={GREEN_SOFT}
          iconColor={GREEN}
          icon={<Landmark size={16} color={GREEN} />}
          title="Bank account + IFSC"
          sub="we test it with a ₹1 penny drop"
        />
        <ReadyRow
          iconBg="rgba(139,92,246,0.14)"
          iconColor="#8B5CF6"
          icon={<Shield size={16} color="#8B5CF6" />}
          title="GST number"
          sub="optional · unlocks GST invoices"
        />
      </View>

      {/* Security note */}
      <View style={[styles.noteCard, { borderColor: `${BLUE}44`, backgroundColor: BLUE_SOFT }]}>
        <Shield size={14} color={BLUE} style={{ marginTop: 1 }} />
        <Text style={[styles.noteText, { color: TEXT_1 }]}>
          PAN and bank account number are encrypted. We only show masked values after setup.
        </Text>
      </View>

      {/* CTAs */}
      <View style={styles.navRow}>
        <Pressable onPress={onClose} style={styles.backBtn}>
          <Text style={styles.backText}>Maybe later</Text>
        </Pressable>
        <Pressable onPress={onNext} style={styles.continueBtn}>
          <Text style={styles.continueText}>Start →</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ReadyRow({
  iconBg,
  iconColor,
  icon,
  title,
  sub,
}: {
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <View style={[styles.readyRow, { borderColor: `${iconColor}26` }]}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.readyTitle}>{title}</Text>
        <Text style={styles.readySub}>{sub}</Text>
      </View>
    </View>
  );
}

/* ─── Step 2: Business type ──────────────────────────────── */
function StepBusinessType({
  draft,
  patch,
  onNext,
  onBack,
}: {
  draft: PayoutDraft;
  patch: (p: Partial<PayoutDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const canContinue = !!draft.businessType;

  return (
    <View style={{ gap: 24 }}>
      <Text style={styles.eyebrow}>Step 2 of 6</Text>
      <View style={{ gap: 8 }}>
        <Text style={styles.title}>Who's running this?</Text>
        <Text style={styles.sub}>Pick how Razorpay should treat your account.</Text>
      </View>

      <View style={{ gap: 8 }}>
        {BUSINESS_TYPES.map((bt) => {
          const active = draft.businessType === bt.value;
          return (
            <Pressable
              key={bt.value}
              onPress={() => patch({ businessType: bt.value })}
              style={[styles.pickRow, active && styles.pickRowOn]}
            >
              <RadioDot on={active} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.pickTitle, { color: active ? TEXT_0 : TEXT_1 }]}>{bt.label}</Text>
                <Text style={[styles.pickSub, { color: active ? TEXT_2 : TEXT_3 }]}>{bt.sub}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.navRow}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          onPress={onNext}
          disabled={!canContinue}
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
        >
          <Text style={[styles.continueText, !canContinue && { color: TEXT_3 }]}>Continue →</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Step 3: PAN ───────────────────────────────────────── */
function StepPAN({
  draft,
  patch,
  onNext,
  onBack,
}: {
  draft: PayoutDraft;
  patch: (p: Partial<PayoutDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const user = useAuthStore((s) => s.user);
  const panValid = PAN_REGEX.test(draft.pan);
  const nameValid = draft.accountHolderName.trim().length >= 2;
  const canContinue = panValid && nameValid;
  const showPanHint = draft.pan.length > 0 && !panValid;

  // GAP: name-match against profile
  const profileName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
    || user?.displayName?.trim()
    || '';
  const enteredName = draft.accountHolderName.trim();
  const nameMatches =
    profileName.length > 0 &&
    enteredName.length >= 2 &&
    enteredName.toLowerCase().includes(profileName.toLowerCase().split(' ')[0]);

  return (
    <View style={{ gap: 24 }}>
      <Text style={styles.eyebrow}>Step 3 of 6</Text>
      <View style={{ gap: 8 }}>
        <Text style={styles.title}>Your PAN.</Text>
        <Text style={styles.sub}>10 characters — the name has to match exactly.</Text>
      </View>

      {/* PAN input */}
      <View style={{ gap: 6 }}>
        <Text style={styles.fieldLabel}>PAN number</Text>
        <TextInput
          value={draft.pan}
          onChangeText={(t) => patch({ pan: t.toUpperCase() })}
          placeholder="ABCDE1234F"
          placeholderTextColor={TEXT_3}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          style={[styles.input, styles.monoInput, showPanHint && styles.inputError]}
        />
        {showPanHint && (
          <Text style={styles.hintRed}>PAN must be 10 characters · e.g. ABCDE1234F</Text>
        )}
      </View>

      {/* Name input */}
      <View style={{ gap: 6 }}>
        <Text style={styles.fieldLabel}>Full name on PAN card</Text>
        <TextInput
          value={draft.accountHolderName}
          onChangeText={(t) => patch({ accountHolderName: t })}
          placeholder="Full legal name"
          placeholderTextColor={TEXT_3}
          autoCorrect={false}
          style={styles.input}
        />
        {/* GAP: profile name match */}
        {nameMatches && (
          <View style={styles.matchPill}>
            <View style={styles.matchDot} />
            <Text style={styles.matchText}>Matches your profile name</Text>
          </View>
        )}
      </View>

      {/* Encryption note */}
      <View style={[styles.noteCard, { borderColor: HAIRLINE, backgroundColor: SURFACE }]}>
        <Lock size={13} color={TEXT_2} style={{ marginTop: 1 }} />
        <Text style={[styles.noteText, { color: TEXT_2 }]}>
          Encrypted at rest. We show only ABCDE★★★★F after setup.
        </Text>
      </View>

      <View style={styles.navRow}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          onPress={onNext}
          disabled={!canContinue}
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
        >
          <Text style={[styles.continueText, !canContinue && { color: TEXT_3 }]}>Continue →</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Step 4: Bank ──────────────────────────────────────── */
function StepBank({
  draft,
  patch,
  onNext,
  onBack,
}: {
  draft: PayoutDraft;
  patch: (p: Partial<PayoutDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [ifscInfo, setIfscInfo] = useState<IfscInfo | null>(null);
  const fetchIdRef = useRef(0);

  const ifscValid = IFSC_REGEX.test(draft.ifsc);
  const accountFilled = draft.bankAccount.length > 0;
  const confirmFilled = draft.bankConfirm.length > 0;
  const accountMatch = accountFilled && confirmFilled && draft.bankAccount === draft.bankConfirm;
  const showMismatch = confirmFilled && draft.bankAccount !== draft.bankConfirm;
  const showMatchOk = accountMatch;
  const showIfscHint = draft.ifsc.length > 0 && !ifscValid;
  const canContinue = accountMatch && ifscValid;

  // GAP: IFSC live-lookup
  useEffect(() => {
    if (!ifscValid) {
      setIfscInfo(null);
      return;
    }
    const id = ++fetchIdRef.current;
    fetch(`https://ifsc.razorpay.com/${draft.ifsc}`)
      .then((r) => {
        if (!r.ok) throw new Error('non-200');
        return r.json();
      })
      .then((data: IfscInfo) => {
        if (fetchIdRef.current === id) setIfscInfo(data);
      })
      .catch(() => {
        if (fetchIdRef.current === id) setIfscInfo(null);
      });
  }, [draft.ifsc, ifscValid]);

  return (
    <View style={{ gap: 24 }}>
      <Text style={styles.eyebrow}>Step 4 of 6</Text>
      <View style={{ gap: 8 }}>
        <Text style={styles.title}>Where the rupees land.</Text>
        <Text style={styles.sub}>Verified live by Razorpay with a ₹1 penny drop.</Text>
      </View>

      {/* Account number */}
      <View style={{ gap: 6 }}>
        <Text style={styles.fieldLabel}>Account number</Text>
        <TextInput
          value={draft.bankAccount}
          onChangeText={(t) => patch({ bankAccount: t.replace(/\D/g, '') })}
          placeholder="Enter account number"
          placeholderTextColor={TEXT_3}
          keyboardType="number-pad"
          autoCorrect={false}
          style={[styles.input, styles.monoInput]}
        />
      </View>

      {/* Confirm account */}
      <View style={{ gap: 6 }}>
        <Text style={styles.fieldLabel}>Confirm account number</Text>
        <TextInput
          value={draft.bankConfirm}
          onChangeText={(t) => patch({ bankConfirm: t.replace(/\D/g, '') })}
          placeholder="Re-enter account number"
          placeholderTextColor={TEXT_3}
          keyboardType="number-pad"
          autoCorrect={false}
          contextMenuHidden={true}
          style={[styles.input, styles.monoInput, showMismatch && styles.inputError]}
        />
        {showMismatch && (
          <Text style={styles.hintRed}>Account numbers don't match</Text>
        )}
        {showMatchOk && (
          <View style={styles.matchPill}>
            <View style={styles.matchDot} />
            <Text style={styles.matchText}>Numbers match · paste blocked</Text>
          </View>
        )}
      </View>

      {/* IFSC */}
      <View style={{ gap: 6 }}>
        <Text style={styles.fieldLabel}>IFSC code</Text>
        <TextInput
          value={draft.ifsc}
          onChangeText={(t) => patch({ ifsc: t.toUpperCase() })}
          placeholder="HDFC0001234"
          placeholderTextColor={TEXT_3}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={11}
          style={[styles.input, styles.monoInput, showIfscHint && styles.inputError]}
        />
        {showIfscHint && (
          <Text style={styles.hintRed}>Invalid IFSC · format HDFC0001234 (4 letters, 0, 6 alphanumeric)</Text>
        )}

        {/* GAP: IFSC live-lookup result card */}
        {ifscInfo && (
          <View style={styles.ifscCard}>
            <View style={styles.ifscBadge}>
              <Text style={styles.ifscBadgeText}>{ifscInfo.BANK?.charAt(0) ?? 'B'}</Text>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.ifscBank}>{ifscInfo.BANK}</Text>
              <Text style={styles.ifscBranch}>{ifscInfo.BRANCH}</Text>
            </View>
            <View style={styles.matchDot} />
          </View>
        )}
      </View>

      <View style={styles.navRow}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          onPress={onNext}
          disabled={!canContinue}
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
        >
          <Text style={[styles.continueText, !canContinue && { color: TEXT_3 }]}>Continue →</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Step 5: GST ───────────────────────────────────────── */
type GstChoice = 'registered' | 'skip';

function StepGST({
  draft,
  patch,
  onNext,
  onBack,
}: {
  draft: PayoutDraft;
  patch: (p: Partial<PayoutDraft>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // GAP: checkbox picker — default skip
  const [gstChoice, setGstChoice] = useState<GstChoice>(
    draft.gstin.trim().length > 0 ? 'registered' : 'skip'
  );

  const gstinValid = GSTIN_REGEX.test(draft.gstin);
  const showHint = gstChoice === 'registered' && draft.gstin.length > 0 && !gstinValid;
  const canContinue = gstChoice === 'skip' || (gstChoice === 'registered' && gstinValid);

  const handleChoiceChange = (choice: GstChoice) => {
    setGstChoice(choice);
    if (choice === 'skip') {
      patch({ gstin: '' });
    }
  };

  return (
    <View style={{ gap: 24 }}>
      <Text style={styles.eyebrow}>Step 5 of 6</Text>
      <View style={{ gap: 8 }}>
        <Text style={styles.title}>GST? Optional.</Text>
        <Text style={styles.sub}>
          Add it now or later in Settings. Adds GST line items to attendee receipts.
        </Text>
      </View>

      {/* GAP: checkbox-style pick options */}
      <View style={{ gap: 8 }}>
        <Pressable
          onPress={() => handleChoiceChange('registered')}
          style={[styles.pickRow, gstChoice === 'registered' && styles.pickRowOn]}
        >
          <CheckBox on={gstChoice === 'registered'} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.pickTitle, { color: gstChoice === 'registered' ? TEXT_0 : TEXT_1 }]}>
              I'm registered for GST
            </Text>
            <Text style={[styles.pickSub, { color: gstChoice === 'registered' ? TEXT_2 : TEXT_3 }]}>
              15-character GSTIN required
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => handleChoiceChange('skip')}
          style={[styles.pickRow, gstChoice === 'skip' && styles.pickRowOn]}
        >
          <CheckBox on={gstChoice === 'skip'} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.pickTitle, { color: gstChoice === 'skip' ? TEXT_0 : TEXT_1 }]}>
              Skip · I'll add later
            </Text>
            <Text style={[styles.pickSub, { color: gstChoice === 'skip' ? TEXT_2 : TEXT_3 }]}>
              Most teachers & small organizers don't need this
            </Text>
          </View>
        </Pressable>
      </View>

      {/* GSTIN input — revealed only when registered is chosen */}
      {gstChoice === 'registered' && (
        <View style={{ gap: 6 }}>
          <Text style={styles.fieldLabel}>GSTIN · 15 characters</Text>
          <TextInput
            value={draft.gstin}
            onChangeText={(t) => patch({ gstin: t.toUpperCase() })}
            placeholder="22ABCDE1234F1Z5"
            placeholderTextColor={TEXT_3}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={15}
            style={[styles.input, styles.monoInput, showHint && styles.inputError]}
          />
          {showHint && (
            <Text style={styles.hintRed}>Invalid GSTIN format</Text>
          )}
        </View>
      )}

      {/* Info note */}
      <View style={[styles.noteCard, { borderColor: HAIRLINE, backgroundColor: SURFACE }]}>
        <Info size={13} color={TEXT_2} style={{ marginTop: 1 }} />
        <Text style={[styles.noteText, { color: TEXT_2 }]}>
          If your yearly NETSA earnings cross ₹20 lakh, you'll need GST. We'll remind you.
        </Text>
      </View>

      <View style={styles.navRow}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          onPress={onNext}
          disabled={!canContinue}
          style={[styles.continueBtn, !canContinue && styles.continueBtnDisabled]}
        >
          <Text style={[styles.continueText, !canContinue && { color: TEXT_3 }]}>Continue →</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Step 6: Review ─────────────────────────────────────── */
function StepReview({
  draft,
  patch,
  submitting,
  submitError,
  onSubmit,
  onBack,
  onEditStep,
}: {
  draft: PayoutDraft;
  patch: (p: Partial<PayoutDraft>) => void;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
  onBack: () => void;
  onEditStep: (step: number) => void;
}) {
  const businessLabel = BUSINESS_TYPES.find((b) => b.value === draft.businessType)?.label ?? draft.businessType ?? '—';
  const maskedPan = draft.pan.length === 10
    ? `${draft.pan.slice(0, 5)}★★★★${draft.pan.slice(9)}`
    : draft.pan || '—';
  const maskedAccount =
    draft.bankAccount.length > 4
      ? `★★★★${draft.bankAccount.slice(-4)}`
      : draft.bankAccount || '—';
  const emailValid = EMAIL_REGEX.test(draft.email);
  const canSubmit = !submitting && draft.email.length > 0 && emailValid;

  return (
    <View style={{ gap: 24 }}>
      <Text style={styles.eyebrow}>Step 6 of 6</Text>
      <View style={{ gap: 8 }}>
        <Text style={styles.title}>Looks right?</Text>
        <Text style={styles.sub}>
          Submit sends it to Razorpay. Most accounts verify in seconds.
        </Text>
      </View>

      {/* Summary card with GAP: edit links per row */}
      <View style={styles.summaryCard}>
        <ReviewRow
          label="TYPE"
          value={businessLabel}
          onEdit={() => onEditStep(2)}
        />
        <View style={styles.summaryDivider} />
        <ReviewRow
          label="PAN"
          value={maskedPan}
          valueSub={draft.accountHolderName || undefined}
          mono
          onEdit={() => onEditStep(3)}
        />
        <View style={styles.summaryDivider} />
        <ReviewRow
          label="BANK"
          value={maskedAccount}
          valueSub={draft.ifsc ? `${draft.ifsc}` : undefined}
          mono
          onEdit={() => onEditStep(4)}
        />
        <View style={styles.summaryDivider} />
        <ReviewRow
          label="GST"
          value={draft.gstin || 'Skipped · add later'}
          mono={!!draft.gstin}
          onEdit={() => onEditStep(5)}
          last
        />
      </View>

      {/* Email */}
      <View style={{ gap: 6 }}>
        <Text style={styles.fieldLabel}>Email address · for Razorpay notifications</Text>
        <TextInput
          value={draft.email}
          onChangeText={(t) => patch({ email: t.trim() })}
          placeholder="you@example.com"
          placeholderTextColor={TEXT_3}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={[
            styles.input,
            draft.email.length > 0 && !emailValid && styles.inputError,
          ]}
        />
        {draft.email.length > 0 && !emailValid && (
          <Text style={styles.hintRed}>Enter a valid email address</Text>
        )}
      </View>

      {/* Terms note */}
      <View style={[styles.noteCard, { borderColor: `${BLUE}44`, backgroundColor: BLUE_SOFT }]}>
        <Info size={13} color={BLUE} style={{ marginTop: 1 }} />
        <Text style={[styles.noteText, { color: TEXT_1 }]}>
          Your data is sent securely to Razorpay for KYC. NETSA doesn't store your raw account numbers.
        </Text>
      </View>

      {/* Submit error */}
      {submitError ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{submitError}</Text>
        </View>
      ) : null}

      <View style={styles.navRow}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit || submitting}
          style={[styles.continueBtn, (!canSubmit || submitting) && styles.continueBtnDisabled]}
        >
          {submitting ? (
            <ActivityIndicator color={ORANGE_INK} size="small" />
          ) : (
            <Text style={[styles.continueText, (!canSubmit || submitting) && { color: TEXT_3 }]}>
              Submit →
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/* ─── Review row with edit link ───────────────────────────── */
function ReviewRow({
  label,
  value,
  valueSub,
  mono,
  last,
  onEdit,
}: {
  label: string;
  value: string;
  valueSub?: string;
  mono?: boolean;
  last?: boolean;
  onEdit?: () => void;
}) {
  return (
    <View style={styles.reviewRow}>
      <View style={{ minWidth: 48 }}>
        <Text style={styles.reviewLabel}>{label}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.reviewValue, mono && styles.monoValue]} numberOfLines={1}>
          {value}
        </Text>
        {valueSub ? (
          <Text style={styles.reviewValueSub} numberOfLines={1}>{valueSub}</Text>
        ) : null}
      </View>
      {onEdit ? (
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text style={styles.editLink}>Edit</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ─── Shared UI primitives ───────────────────────────────── */
function RadioDot({ on }: { on: boolean }) {
  return (
    <View style={[styles.radio, { borderColor: on ? ORANGE : TEXT_4 }]}>
      {on ? <View style={styles.radioInner} /> : null}
    </View>
  );
}

function CheckBox({ on }: { on: boolean }) {
  return (
    <View
      style={[
        styles.checkBox,
        on
          ? { borderColor: ORANGE, backgroundColor: ORANGE_SOFT }
          : { borderColor: TEXT_4, backgroundColor: 'transparent' },
      ]}
    >
      {on ? <Text style={styles.checkMark}>✓</Text> : null}
    </View>
  );
}

/* ─── StyleSheet ─────────────────────────────────────────── */
const styles = StyleSheet.create({
  /* Shell */
  shell: {
    flex: 1,
    backgroundColor: BG,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 20,
    color: TEXT_0,
    letterSpacing: -0.3,
  },

  /* Wizard dots */
  dotsRow: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  dot: {
    flex: 1,
    height: 3,
    borderRadius: 2,
  },
  dotDone: { backgroundColor: TEXT_0 },
  dotCurrent: { backgroundColor: ORANGE },
  dotFuture: { backgroundColor: SURFACE_HI },

  /* Scroll */
  scrollContent: {
    padding: 20,
    paddingBottom: 44,
  },

  /* Typography */
  eyebrow: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: ORANGE,
    marginBottom: 2,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 28,
    color: TEXT_0,
    letterSpacing: -0.4,
    lineHeight: 34,
  },
  sub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13.5,
    color: TEXT_1,
    lineHeight: 20,
  },
  monoLabel: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: TEXT_3,
    marginBottom: 4,
  },
  fieldLabel: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 9.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: TEXT_3,
  },

  /* Inputs */
  input: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: TEXT_0,
    fontFamily: 'Outfit-Regular',
    fontSize: 14.5,
  },
  monoInput: {
    fontFamily: 'SpaceMono-Bold',
    letterSpacing: 1,
    fontSize: 13,
  },
  inputError: {
    borderColor: RED,
  },

  /* Hints */
  hintRed: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11.5,
    color: RED,
    marginTop: 2,
  },

  /* Match pill */
  matchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: GREEN_SOFT,
    borderRadius: 99,
    marginTop: 2,
  },
  matchDot: {
    width: 7,
    height: 7,
    borderRadius: 99,
    backgroundColor: GREEN,
  },
  matchText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 11,
    color: GREEN,
  },

  /* Note cards */
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  noteText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    lineHeight: 17,
    flex: 1,
  },

  /* Ready rows (Step 1) */
  readyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readyTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13.5,
    color: TEXT_0,
  },
  readySub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11.5,
    color: TEXT_2,
  },

  /* Pick rows (Step 2, 5) */
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 10,
  },
  pickRowOn: {
    backgroundColor: ORANGE_SOFT,
    borderColor: ORANGE_LINE,
  },
  pickTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13.5,
  },
  pickSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11.5,
  },

  /* Radio dot */
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ORANGE,
  },

  /* Checkbox */
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: ORANGE,
    fontSize: 11,
    lineHeight: 13,
    fontFamily: 'Outfit-Bold',
  },

  /* IFSC lookup card */
  ifscCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: GREEN_SOFT,
    borderWidth: 1,
    borderColor: `${GREEN}44`,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginTop: 2,
  },
  ifscBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ifscBadgeText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
    color: '#0a1f0a',
  },
  ifscBank: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 13,
    color: TEXT_0,
  },
  ifscBranch: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11.5,
    color: TEXT_2,
  },

  /* Summary card (Step 6) */
  summaryCard: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderRadius: 12,
    overflow: 'hidden',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: HAIRLINE,
  },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  reviewLabel: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: TEXT_3,
  },
  reviewValue: {
    fontFamily: 'Outfit-Medium',
    fontSize: 13,
    color: TEXT_0,
  },
  reviewValueSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_2,
    marginTop: 1,
  },
  monoValue: {
    fontFamily: 'SpaceMono-Bold',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  editLink: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 12,
    color: ORANGE,
  },

  /* Error card */
  errorCard: {
    backgroundColor: `${RED}1a`,
    borderWidth: 1,
    borderColor: `${RED}4d`,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 11,
  },
  errorText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: RED,
  },

  /* Nav row */
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  backBtn: {
    flex: 1,
    height: 48,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 13.5,
    color: TEXT_2,
  },
  continueBtn: {
    flex: 1,
    height: 48,
    borderRadius: 11,
    backgroundColor: TEXT_0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: HAIRLINE,
  },
  continueText: {
    fontFamily: 'Outfit-Bold',
    fontSize: 14,
    color: ORANGE_INK,
  },
});
