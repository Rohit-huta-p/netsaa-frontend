import { normalizeOrgType, orgTypeLabel, CL_ORG_TYPES } from '../orgTypes';

describe('normalizeOrgType', () => {
    it('passes canonical values through unchanged', () => {
        CL_ORG_TYPES.forEach((t) => expect(normalizeOrgType(t.value)).toBe(t.value));
    });
    it('folds legacy values forward to canonical', () => {
        expect(normalizeOrgType('registered_business')).toBe('production_company');
        expect(normalizeOrgType('corporate')).toBe('production_company');
        expect(normalizeOrgType('brand')).toBe('production_company');
        expect(normalizeOrgType('company')).toBe('production_company');
        expect(normalizeOrgType('venue')).toBe('production_company');
        expect(normalizeOrgType('college')).toBe('academy');
        expect(normalizeOrgType('institution')).toBe('academy');
    });
    it('returns "" for empty / unmappable values', () => {
        expect(normalizeOrgType(undefined)).toBe('');
        expect(normalizeOrgType('')).toBe('');
        expect(normalizeOrgType('totally_unknown')).toBe('');
    });
});

describe('orgTypeLabel', () => {
    it('labels canonical + legacy values with the canonical label', () => {
        expect(orgTypeLabel('individual')).toBe('Independent');
        expect(orgTypeLabel('production_company')).toBe('Production company');
        expect(orgTypeLabel('academy')).toBe('Training institute');
        expect(orgTypeLabel('registered_business')).toBe('Production company');
        expect(orgTypeLabel('college')).toBe('Training institute');
    });
    it('falls back to the raw value for unknown, and "" for empty', () => {
        expect(orgTypeLabel('weird_value')).toBe('weird_value');
        expect(orgTypeLabel(undefined)).toBe('');
    });
});
