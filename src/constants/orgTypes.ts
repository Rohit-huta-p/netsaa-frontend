// Canonical Creative Lead org-type taxonomy — the single source of truth.
// 5 CL types (performing-arts hiring orgs). Venue / Brand / Corporate are CLIENT
// types, deliberately excluded. See NETSA_CL_Onboarding_Handoff.md §5.
export const CL_ORG_TYPES = [
    { value: 'individual',           label: 'Independent' },
    { value: 'production_company',   label: 'Production company' },
    { value: 'performing_arts_group',label: 'Performing arts group' },
    { value: 'agency',               label: 'Agency' },
    { value: 'academy',              label: 'Training institute' },
] as const;

export type CLOrgTypeValue = (typeof CL_ORG_TYPES)[number]['value'];

/**
 * Legacy organizerTypeCategory values that predate the canonical 5. The backend enum
 * retains them for backwards-compat but every picker hides them; they are mapped
 * forward here so a stored legacy doc still shows a canonical label and preselects
 * the right option. (Mapping per NETSA_CL_Onboarding_Handoff.md §5.)
 */
export const LEGACY_ORG_TYPE_MAP: Record<string, CLOrgTypeValue> = {
    college:             'academy',
    institution:         'academy',
    registered_business: 'production_company',
    corporate:           'production_company',
    brand:               'production_company',
    company:             'production_company',
    venue:               'production_company', // 'venue' is really a Client type; closest CL fallback for legacy data
};

/** Fold a stored value (canonical or legacy) to a canonical CL type; '' if unmappable. */
export function normalizeOrgType(value: string | undefined): CLOrgTypeValue | '' {
    if (!value) return '';
    if (CL_ORG_TYPES.some(t => t.value === value)) return value as CLOrgTypeValue;
    return LEGACY_ORG_TYPE_MAP[value] ?? '';
}

export function orgTypeLabel(value: string | undefined): string {
    const norm = normalizeOrgType(value);
    if (norm) return CL_ORG_TYPES.find(t => t.value === norm)!.label;
    return value ?? ''; // unknown/foreign value — show raw (rare)
}
