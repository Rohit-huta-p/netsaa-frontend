import React, { useState } from 'react';
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
} from 'react-native';
import { ChevronLeft, X, Shield, Zap, Wallet } from 'lucide-react-native';
import { usePayoutWizardStore, type PayoutDraft } from '@/stores/payoutWizardStore';
import { payoutService } from '@/services/payoutService';
import type { PayoutStatus, PayoutAccount } from '@/services/payoutService';
import PayoutResultScreen from './PayoutResultScreen';

interface Props {
  visible: boolean;
  onClose: () => void;
  onDone?: (status: PayoutStatus) => void;
}

const BUSINESS_TYPES: { value: 'individual' | 'sole_prop' | 'partnership' | 'llp' | 'pvt_ltd'; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'sole_prop', label: 'Sole proprietor' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'llp', label: 'LLP' },
  { value: 'pvt_ltd', label: 'Private limited' },
];

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;

export default function PayoutSetupWizard({ visible, onClose, onDone }: Props) {
  const { step, draft, setStep, patch, reset } = usePayoutWizardStore();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<PayoutAccount | null>(null);

  const handleClose = () => {
    // Don't reset draft on close so user can resume
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
    setStep(3); // back to PAN step
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
          onPrimary={handleDone}
          onRetry={handleRetry}
        />
      );
    }

    switch (step) {
      case 1:
        return <StepIntro onNext={() => setStep(2)} />;
      case 2:
        return <StepBusinessType draft={draft} patch={patch} onNext={() => setStep(3)} />;
      case 3:
        return <StepPAN draft={draft} patch={patch} onNext={() => setStep(4)} />;
      case 4:
        return <StepBank draft={draft} patch={patch} onNext={() => setStep(5)} />;
      case 5:
        return <StepGST draft={draft} patch={patch} onNext={() => setStep(6)} />;
      case 6:
        return (
          <StepReview
            draft={draft}
            patch={patch}
            submitting={submitting}
            submitError={submitError}
            onSubmit={handleSubmit}
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
        className="flex-1 bg-event-bg"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 pt-5 pb-3 border-b border-event-border">
          {step > 1 && !result ? (
            <Pressable onPress={() => setStep(step - 1)} className="p-2 -ml-2">
              <ChevronLeft size={22} color="#9693A0" />
            </Pressable>
          ) : (
            <View className="w-10" />
          )}
          <View className="items-center">
            <Text className="font-outfit font-semibold text-event-textPrimary text-base">
              Payout setup
            </Text>
            {!result && (
              <Text className="font-mono text-event-textMuted text-[10px] tracking-widest mt-0.5">
                STEP {step} OF 6
              </Text>
            )}
          </View>
          <Pressable onPress={handleClose} className="p-2 -mr-2">
            <X size={20} color="#9693A0" />
          </Pressable>
        </View>

        {/* Step progress bar */}
        {!result && (
          <View className="h-0.5 bg-event-border mx-5 mt-1 rounded-full overflow-hidden">
            <View className="h-full bg-event-brand rounded-full" style={{ width: `${(step / 6) * 100}%` }} />
          </View>
        )}

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {renderStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ─── Step 1: Intro ─────────────────────────────────────── */
function StepIntro({ onNext }: { onNext: () => void }) {
  return (
    <View className="gap-8 mt-4">
      <View className="gap-3">
        <Text className="font-serif text-event-textPrimary text-4xl leading-tight">
          Get paid for your events
        </Text>
        <Text className="font-outfit text-event-textSecondary text-base leading-7">
          Link your bank account once and earn from every paid event you host.
        </Text>
      </View>

      <View className="gap-3">
        <InfoRow
          icon={<Zap size={18} color="#F59E0B" />}
          text="Razorpay Route instant split — money lands in your bank right when someone registers."
        />
        <InfoRow
          icon={<Wallet size={18} color="#22C55E" />}
          text="NETSA keeps just 0.5% platform fee. The rest is yours."
        />
        <InfoRow
          icon={<Shield size={18} color="#8B5CF6" />}
          text="Your details are secured by Razorpay's bank-grade encryption. We never store raw account numbers."
        />
      </View>

      <Pressable
        onPress={onNext}
        className="rounded-2xl py-4 items-center bg-event-brand mt-2"
      >
        <Text className="font-outfit font-bold text-white text-base">Get started</Text>
      </Pressable>
    </View>
  );
}

function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <View className="flex-row gap-3 rounded-2xl bg-event-surface border border-event-border px-4 py-4 items-start">
      <View className="mt-0.5">{icon}</View>
      <Text className="font-outfit text-event-textSecondary text-sm leading-5 flex-1">{text}</Text>
    </View>
  );
}

/* ─── Step 2: Business type ──────────────────────────────── */
function StepBusinessType({
  draft,
  patch,
  onNext,
}: {
  draft: PayoutDraft;
  patch: (p: Partial<PayoutDraft>) => void;
  onNext: () => void;
}) {
  const canContinue = !!draft.businessType;
  return (
    <View className="gap-6 mt-2">
      <View className="gap-1">
        <Text className="font-serif text-event-textPrimary text-3xl">Business type</Text>
        <Text className="font-outfit text-event-textSecondary text-sm">
          This matches how Razorpay will register your linked account.
        </Text>
      </View>

      <View className="gap-2">
        {BUSINESS_TYPES.map((bt) => {
          const active = draft.businessType === bt.value;
          return (
            <Pressable
              key={bt.value}
              onPress={() => patch({ businessType: bt.value })}
              className={`flex-row items-center gap-3 p-4 rounded-2xl border ${
                active ? 'border-event-brand bg-event-surface' : 'border-event-border bg-event-surfaceAlt'
              }`}
            >
              <RadioDot on={active} />
              <Text className={`font-outfit text-base ${active ? 'text-event-textPrimary font-semibold' : 'text-event-textSecondary'}`}>
                {bt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={onNext}
        disabled={!canContinue}
        className={`rounded-2xl py-4 items-center ${canContinue ? 'bg-event-brand' : 'bg-event-surface border border-event-border'}`}
      >
        <Text className={`font-outfit font-bold text-base ${canContinue ? 'text-white' : 'text-event-textMuted'}`}>
          Continue
        </Text>
      </Pressable>
    </View>
  );
}

/* ─── Step 3: PAN ───────────────────────────────────────── */
function StepPAN({
  draft,
  patch,
  onNext,
}: {
  draft: PayoutDraft;
  patch: (p: Partial<PayoutDraft>) => void;
  onNext: () => void;
}) {
  const panValid = PAN_REGEX.test(draft.pan);
  const nameValid = draft.accountHolderName.trim().length >= 2;
  const canContinue = panValid && nameValid;
  const showPanHint = draft.pan.length > 0 && !panValid;

  return (
    <View className="gap-6 mt-2">
      <View className="gap-1">
        <Text className="font-serif text-event-textPrimary text-3xl">PAN & name</Text>
        <Text className="font-outfit text-event-textSecondary text-sm">
          Razorpay needs your PAN to complete KYC.
        </Text>
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">PAN number</Text>
        <TextInput
          value={draft.pan}
          onChangeText={(t) => patch({ pan: t.toUpperCase() })}
          placeholder="ABCDE1234F"
          placeholderTextColor="#6E6C76"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          className={`font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border px-4 py-3 tracking-widest ${
            showPanHint ? 'border-red-500/60' : 'border-event-border'
          }`}
        />
        {showPanHint && (
          <Text className="font-outfit text-red-400 text-xs">
            PAN must be 10 characters · e.g. ABCDE1234F
          </Text>
        )}
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          Name as on PAN card
        </Text>
        <TextInput
          value={draft.accountHolderName}
          onChangeText={(t) => patch({ accountHolderName: t })}
          placeholder="Full legal name"
          placeholderTextColor="#6E6C76"
          autoCorrect={false}
          className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3"
        />
      </View>

      <Pressable
        onPress={onNext}
        disabled={!canContinue}
        className={`rounded-2xl py-4 items-center ${canContinue ? 'bg-event-brand' : 'bg-event-surface border border-event-border'}`}
      >
        <Text className={`font-outfit font-bold text-base ${canContinue ? 'text-white' : 'text-event-textMuted'}`}>
          Continue
        </Text>
      </Pressable>
    </View>
  );
}

/* ─── Step 4: Bank ──────────────────────────────────────── */
function StepBank({
  draft,
  patch,
  onNext,
}: {
  draft: PayoutDraft;
  patch: (p: Partial<PayoutDraft>) => void;
  onNext: () => void;
}) {
  const ifscValid = IFSC_REGEX.test(draft.ifsc);
  const accountFilled = draft.bankAccount.length > 0;
  const confirmFilled = draft.bankConfirm.length > 0;
  const accountMatch = accountFilled && confirmFilled && draft.bankAccount === draft.bankConfirm;
  const showMismatch = confirmFilled && draft.bankAccount !== draft.bankConfirm;
  const showIfscHint = draft.ifsc.length > 0 && !ifscValid;
  const canContinue = accountMatch && ifscValid;

  return (
    <View className="gap-6 mt-2">
      <View className="gap-1">
        <Text className="font-serif text-event-textPrimary text-3xl">Bank account</Text>
        <Text className="font-outfit text-event-textSecondary text-sm">
          Payouts will be settled to this account.
        </Text>
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          Account number
        </Text>
        <TextInput
          value={draft.bankAccount}
          onChangeText={(t) => patch({ bankAccount: t.replace(/\D/g, '') })}
          placeholder="Enter account number"
          placeholderTextColor="#6E6C76"
          keyboardType="number-pad"
          autoCorrect={false}
          className="font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border border-event-border px-4 py-3 tracking-widest"
        />
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          Confirm account number
        </Text>
        <TextInput
          value={draft.bankConfirm}
          onChangeText={(t) => patch({ bankConfirm: t.replace(/\D/g, '') })}
          placeholder="Re-enter account number"
          placeholderTextColor="#6E6C76"
          keyboardType="number-pad"
          autoCorrect={false}
          // Paste-block: contextMenuHidden hides long-press paste menu on iOS/Android
          contextMenuHidden={true}
          className={`font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border px-4 py-3 tracking-widest ${
            showMismatch ? 'border-red-500/60' : 'border-event-border'
          }`}
        />
        {showMismatch && (
          <Text className="font-outfit text-red-400 text-xs">
            Account numbers don't match
          </Text>
        )}
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">IFSC code</Text>
        <TextInput
          value={draft.ifsc}
          onChangeText={(t) => patch({ ifsc: t.toUpperCase() })}
          placeholder="HDFC0001234"
          placeholderTextColor="#6E6C76"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={11}
          className={`font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border px-4 py-3 tracking-widest ${
            showIfscHint ? 'border-red-500/60' : 'border-event-border'
          }`}
        />
        {showIfscHint && (
          <Text className="font-outfit text-red-400 text-xs">
            Invalid IFSC · format HDFC0001234 (4 letters, 0, 6 alphanumeric)
          </Text>
        )}
      </View>

      <Pressable
        onPress={onNext}
        disabled={!canContinue}
        className={`rounded-2xl py-4 items-center ${canContinue ? 'bg-event-brand' : 'bg-event-surface border border-event-border'}`}
      >
        <Text className={`font-outfit font-bold text-base ${canContinue ? 'text-white' : 'text-event-textMuted'}`}>
          Continue
        </Text>
      </Pressable>
    </View>
  );
}

/* ─── Step 5: GST ───────────────────────────────────────── */
function StepGST({
  draft,
  patch,
  onNext,
}: {
  draft: PayoutDraft;
  patch: (p: Partial<PayoutDraft>) => void;
  onNext: () => void;
}) {
  const hasGstin = draft.gstin.trim().length > 0;
  const gstinValid = !hasGstin || GSTIN_REGEX.test(draft.gstin);
  const showHint = hasGstin && !gstinValid;
  const canContinue = gstinValid;

  return (
    <View className="gap-6 mt-2">
      <View className="gap-1">
        <Text className="font-serif text-event-textPrimary text-3xl">GST number</Text>
        <Text className="font-outfit text-event-textSecondary text-sm">
          Optional. Add if your earnings exceed ₹20L/year or you're GST registered.
        </Text>
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          GSTIN · optional
        </Text>
        <TextInput
          value={draft.gstin}
          onChangeText={(t) => patch({ gstin: t.toUpperCase() })}
          placeholder="22ABCDE1234F1Z5"
          placeholderTextColor="#6E6C76"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={15}
          className={`font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border px-4 py-3 tracking-widest ${
            showHint ? 'border-red-500/60' : 'border-event-border'
          }`}
        />
        {showHint && (
          <Text className="font-outfit text-red-400 text-xs">
            Invalid GSTIN format
          </Text>
        )}
      </View>

      <View className="flex-row gap-3">
        <Pressable
          onPress={onNext}
          className="flex-1 rounded-2xl py-4 items-center bg-event-surface border border-event-border"
        >
          <Text className="font-outfit font-semibold text-base text-event-textSecondary">Skip</Text>
        </Pressable>
        <Pressable
          onPress={onNext}
          disabled={!canContinue}
          className={`flex-1 rounded-2xl py-4 items-center ${canContinue ? 'bg-event-brand' : 'bg-event-surface border border-event-border'}`}
        >
          <Text className={`font-outfit font-bold text-base ${canContinue ? 'text-white' : 'text-event-textMuted'}`}>
            Continue
          </Text>
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
}: {
  draft: PayoutDraft;
  patch: (p: Partial<PayoutDraft>) => void;
  submitting: boolean;
  submitError: string | null;
  onSubmit: () => void;
}) {
  const businessLabel = BUSINESS_TYPES.find((b) => b.value === draft.businessType)?.label ?? draft.businessType;
  const maskedAccount =
    draft.bankAccount.length > 4
      ? `****${draft.bankAccount.slice(-4)}`
      : draft.bankAccount || '—';
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email);
  const canSubmit = !submitting && draft.email.length > 0 && emailValid;

  return (
    <View className="gap-6 mt-2">
      <View className="gap-1">
        <Text className="font-serif text-event-textPrimary text-3xl">Review & submit</Text>
        <Text className="font-outfit text-event-textSecondary text-sm">
          Check everything before we send to Razorpay.
        </Text>
      </View>

      <View className="rounded-2xl bg-event-surface border border-event-border overflow-hidden">
        <ReviewRow label="Business type" value={businessLabel ?? '—'} />
        <ReviewRow label="PAN" value={draft.pan} mono />
        <ReviewRow label="Account holder" value={draft.accountHolderName} />
        <ReviewRow label="Bank account" value={maskedAccount} mono />
        <ReviewRow label="IFSC" value={draft.ifsc} mono />
        {draft.gstin ? <ReviewRow label="GSTIN" value={draft.gstin} mono last /> : null}
      </View>

      <View className="gap-2">
        <Text className="font-mono text-event-textMuted text-xs uppercase tracking-widest">
          Email address · for Razorpay notifications
        </Text>
        <TextInput
          value={draft.email}
          onChangeText={(t) => patch({ email: t.trim() })}
          placeholder="you@example.com"
          placeholderTextColor="#6E6C76"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          className={`font-outfit text-event-textPrimary text-base rounded-2xl bg-event-surface border px-4 py-3 ${
            draft.email.length > 0 && !emailValid ? 'border-red-500/60' : 'border-event-border'
          }`}
        />
        {draft.email.length > 0 && !emailValid && (
          <Text className="font-outfit text-red-400 text-xs">Enter a valid email address</Text>
        )}
      </View>

      {submitError ? (
        <View className="rounded-2xl bg-red-500/10 border border-red-500/30 px-4 py-3">
          <Text className="font-outfit text-red-400 text-sm">{submitError}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onSubmit}
        disabled={!canSubmit || submitting}
        className={`rounded-2xl py-4 items-center ${canSubmit && !submitting ? 'bg-event-brand' : 'bg-event-surface border border-event-border'}`}
      >
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className={`font-outfit font-bold text-base ${canSubmit && !submitting ? 'text-white' : 'text-event-textMuted'}`}>
            Submit for verification
          </Text>
        )}
      </Pressable>

      <Text className="font-outfit text-event-textMuted text-xs text-center leading-5">
        Your data is sent securely to Razorpay for KYC. NETSA doesn't store your raw account numbers.
      </Text>
    </View>
  );
}

function ReviewRow({
  label,
  value,
  mono,
  last,
}: {
  label: string;
  value: string;
  mono?: boolean;
  last?: boolean;
}) {
  return (
    <View className={`flex-row items-center justify-between px-4 py-3 ${!last ? 'border-b border-event-border' : ''}`}>
      <Text className="font-outfit text-event-textMuted text-sm flex-1">{label}</Text>
      <Text className={`${mono ? 'font-mono' : 'font-outfit'} text-event-textPrimary text-sm ml-4`}>
        {value}
      </Text>
    </View>
  );
}

/* ─── Shared UI ──────────────────────────────────────────── */
function RadioDot({ on }: { on: boolean }) {
  return (
    <View
      className={`w-5 h-5 rounded-full border-2 ${on ? 'border-event-brand' : 'border-event-border'} items-center justify-center`}
    >
      {on ? <View className="w-2.5 h-2.5 rounded-full bg-event-brand" /> : null}
    </View>
  );
}
