// src/features/contract-pdf/utils/buildContractData.ts
//
// Pure transform: takes a contract OR a gig (preview mode) and returns the
// flat data shape the HTML template renders. Same shape used everywhere so
// the template stays a single source of truth.

export type ContractPdfData = {
    title: string;                          // gig title
    gigSubtitle?: string;                   // event function · city · date
    hirerName: string;
    artistName: string;
    amount: number;
    paymentStructure: 'full' | 'advance_balance';
    cancellationPolicy: '24h' | '48h' | '72h';
    cancellationForfeitPct: number;
    /** Hirer-authored cancellation narrative. Rendered as a paragraph after
        the structured Window + Forfeit fields when present. Omitted otherwise. */
    cancellationCustomText?: string;
    customClauses: string[];
    scopeOfWork: string;
    termsAndConditions?: string;
    eventDate?: string;                     // ISO
    venue?: string;
    city?: string;
    state?: string;
    contractId?: string;                    // for finalized contracts; omitted in preview
    hirerSignedAt?: string;                 // ISO
    artistSignedAt?: string;                // ISO
    isPreview: boolean;                     // true if rendered from gig template (no signatures yet)
};

type GigShape = {
    _id?: string;
    title: string;
    eventFunction?: string;
    description?: string;
    schedule?: { startDate?: string };
    startDate?: string;
    location?: { city?: string; state?: string; venue?: string };
    compensation?: { amount?: number };
    paymentStructure?: 'full' | 'advance_balance';
    cancellationPolicy?: '24h' | '48h' | '72h';
    cancellationForfeitPct?: number;
    cancellationCustomText?: string;
    customClauses?: string[];
    termsAndConditions?: string;
};

type ContractShape = {
    _id?: string;
    gigId?: string;
    hirerSnapshot?: { displayName?: string };
    artistSnapshot?: { displayName?: string };
    hirerSignature?: { signedAt?: string };
    artistSignature?: { signedAt?: string };
    paymentMethod?: 'on_platform' | 'off_platform';
    terms?: {
        gigTitle?: string;
        amount?: number;
        paymentStructure?: 'full' | 'advance_balance';
        cancellationTerms?: string;
        customTerms?: string;
        scopeOfWork?: string;
        dates?: { start?: string };
        location?: { city?: string; state?: string; venue?: string };
    };
};

function shortDate(iso?: string): string {
    if (!iso) return '';
    try {
        return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return '';
    }
}

function parseClausesFromCustomTerms(customTerms?: string): string[] {
    if (!customTerms) return [];
    // HireConfirmModal joined clauses as `01. ...\n02. ...`. Reverse it.
    return customTerms
        .split('\n')
        .map((line) => line.replace(/^\d+\.\s*/, '').trim())
        .filter(Boolean);
}

export function buildFromGig(gig: GigShape, opts: {
    hirerName?: string;
    artistName?: string;
}): ContractPdfData {
    const startDate = gig.schedule?.startDate ?? gig.startDate;
    const meta = [gig.eventFunction, gig.location?.city, shortDate(startDate)].filter(Boolean).join(' · ');
    return {
        title: gig.title,
        gigSubtitle: meta || undefined,
        hirerName: opts.hirerName ?? 'You (the hirer)',
        artistName: opts.artistName ?? 'Artist (TBD at hire time)',
        amount: gig.compensation?.amount ?? 0,
        paymentStructure: gig.paymentStructure ?? 'full',
        cancellationPolicy: gig.cancellationPolicy ?? '48h',
        cancellationForfeitPct: gig.cancellationForfeitPct ?? 100,
        cancellationCustomText: gig.cancellationCustomText,
        customClauses: gig.customClauses ?? [],
        scopeOfWork: gig.description ?? gig.title,
        termsAndConditions: gig.termsAndConditions,
        eventDate: startDate,
        venue: gig.location?.venue,
        city: gig.location?.city,
        state: gig.location?.state,
        isPreview: true,
    };
}

export function buildFromContract(contract: ContractShape): ContractPdfData {
    const t = contract.terms ?? {};
    const meta = [t.location?.city, shortDate(t.dates?.start)].filter(Boolean).join(' · ');
    return {
        title: t.gigTitle ?? 'Untitled gig',
        gigSubtitle: meta || undefined,
        hirerName: contract.hirerSnapshot?.displayName ?? 'Hirer',
        artistName: contract.artistSnapshot?.displayName ?? 'Artist',
        amount: t.amount ?? 0,
        paymentStructure: t.paymentStructure ?? 'full',
        // contract.terms doesn't store policy enum — derive from cancellationTerms or default
        cancellationPolicy: '48h',
        cancellationForfeitPct: 100,
        // Hirer-authored cancellation narrative lands here when sealed at hire time.
        cancellationCustomText: t.cancellationTerms,
        customClauses: parseClausesFromCustomTerms(t.customTerms),
        scopeOfWork: t.scopeOfWork ?? '',
        eventDate: t.dates?.start,
        venue: t.location?.venue,
        city: t.location?.city,
        state: t.location?.state,
        contractId: contract._id,
        hirerSignedAt: contract.hirerSignature?.signedAt,
        artistSignedAt: contract.artistSignature?.signedAt,
        isPreview: false,
    };
}
