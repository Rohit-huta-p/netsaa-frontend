export const CL_ORG_TYPES = [
    { value: 'individual',           label: 'Independent' },
    { value: 'production_company',   label: 'Production company' },
    { value: 'performing_arts_group',label: 'Performing arts group' },
    { value: 'agency',               label: 'Agency' },
    { value: 'academy',              label: 'Training institute' },
] as const;

export type CLOrgTypeValue = (typeof CL_ORG_TYPES)[number]['value'];

export function orgTypeLabel(value: string | undefined): string {
    return CL_ORG_TYPES.find(t => t.value === value)?.label ?? value ?? '';
}
