// src/features/contract-pdf/templates/contractTemplate.ts
//
// Pure HTML generator. Returns a self-contained string with inline CSS
// (expo-print needs a single string; can't link external resources).
// Designed to print well on A4 — fits within ~750px wide content box.

import type { ContractPdfData } from '../utils/buildContractData';

const STRUCTURE_LABEL: Record<string, string> = {
    full: 'Full upfront',
    advance_balance: '30/70 advance',
};

function escape(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function fmtDate(iso?: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        });
    } catch {
        return '—';
    }
}

function fmtDateShort(iso?: string): string {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    } catch {
        return '—';
    }
}

export function renderContractHtml(data: ContractPdfData): string {
    const inrAmount = `₹${(data.amount).toLocaleString('en-IN')}`;
    const advance = Math.floor(data.amount * 0.3);
    const balance = data.amount - advance;
    const isAdvance = data.paymentStructure === 'advance_balance';

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Contract · ${escape(data.title)}</title>
<style>
  @page { size: A4; margin: 24mm 18mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #14141B;
    font-size: 11pt;
    line-height: 1.55;
    margin: 0;
  }
  .doc-header {
    border-bottom: 2px solid #14141B;
    padding-bottom: 12pt;
    margin-bottom: 18pt;
  }
  .doc-eyebrow {
    font-size: 8pt; letter-spacing: 2px; text-transform: uppercase;
    color: #6B6878; font-weight: 700;
  }
  .doc-title {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 24pt; line-height: 1.1;
    margin: 4pt 0 6pt 0;
    color: #0A0A0F;
  }
  .doc-subtitle {
    font-size: 10pt; color: #6B6878;
  }
  .preview-watermark {
    background: #FFF3EE; color: #FF6B35;
    font-weight: 700; font-size: 9pt; letter-spacing: 1.5px; text-transform: uppercase;
    padding: 6pt 10pt; border-radius: 4pt; display: inline-block; margin-top: 8pt;
  }
  h2 {
    font-family: Georgia, serif;
    font-size: 13pt; margin: 18pt 0 6pt; color: #0A0A0F;
    border-bottom: 1px solid #E0DDD6; padding-bottom: 3pt;
  }
  .parties { display: flex; gap: 24pt; margin-bottom: 12pt; }
  .party { flex: 1; }
  .party-label { font-size: 8pt; letter-spacing: 1.5px; text-transform: uppercase; color: #6B6878; font-weight: 700; }
  .party-name { font-size: 13pt; font-weight: 700; margin-top: 4pt; }
  .field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8pt 24pt; margin-bottom: 6pt; }
  .field-label { font-size: 8pt; letter-spacing: 1.5px; text-transform: uppercase; color: #6B6878; font-weight: 700; }
  .field-value { font-size: 11pt; margin-top: 2pt; }
  .pay-split {
    background: #FFF8F4; border-left: 3px solid #FF6B35;
    padding: 8pt 12pt; margin-top: 8pt; border-radius: 2pt;
    font-size: 10pt;
  }
  .clauses-list { padding-left: 0; list-style: none; counter-reset: clause; }
  .clauses-list li {
    counter-increment: clause; padding: 6pt 0 6pt 30pt; position: relative;
    border-bottom: 1px dotted #E0DDD6;
  }
  .clauses-list li::before {
    content: counter(clause, decimal-leading-zero);
    position: absolute; left: 0; color: #FF6B35; font-weight: 700; font-family: 'Courier New', monospace;
  }
  .clauses-list li:last-child { border-bottom: none; }
  .terms-paragraph {
    font-size: 10pt; line-height: 1.7; color: #2A2735; white-space: pre-wrap;
    background: #FAFAF7; padding: 12pt; border-radius: 4pt;
  }
  .signatures { display: flex; gap: 32pt; margin-top: 28pt; page-break-inside: avoid; }
  .signature { flex: 1; border-top: 1px solid #14141B; padding-top: 8pt; }
  .sig-name { font-size: 11pt; font-weight: 700; }
  .sig-meta { font-size: 8pt; color: #6B6878; margin-top: 4pt; line-height: 1.5; }
  .sig-pending { color: #6B6878; font-style: italic; }
  .doc-footer {
    margin-top: 32pt; padding-top: 12pt; border-top: 1px solid #E0DDD6;
    font-size: 8pt; color: #9B9685; text-align: center; line-height: 1.6;
  }
  .doc-footer code { font-family: 'Courier New', monospace; }
</style>
</head>
<body>
  <div class="doc-header">
    <div class="doc-eyebrow">NETSA · Performance Booking Contract</div>
    <h1 class="doc-title">${escape(data.title)}</h1>
    ${data.gigSubtitle ? `<div class="doc-subtitle">${escape(data.gigSubtitle)}</div>` : ''}
    ${data.isPreview ? `<div class="preview-watermark">Preview · not yet signed</div>` : ''}
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Hirer</div>
      <div class="party-name">${escape(data.hirerName)}</div>
    </div>
    <div class="party">
      <div class="party-label">Artist</div>
      <div class="party-name">${escape(data.artistName)}</div>
    </div>
  </div>

  <h2>Engagement</h2>
  <div class="field-grid">
    <div>
      <div class="field-label">Event date</div>
      <div class="field-value">${fmtDate(data.eventDate)}</div>
    </div>
    <div>
      <div class="field-label">Venue</div>
      <div class="field-value">${escape(data.venue ?? '—')}${data.city ? ', ' + escape(data.city) : ''}</div>
    </div>
  </div>

  <h2>Scope of work</h2>
  <p class="terms-paragraph">${escape(data.scopeOfWork)}</p>

  <h2>Compensation</h2>
  <div class="field-grid">
    <div>
      <div class="field-label">Total payment</div>
      <div class="field-value"><strong>${inrAmount}</strong></div>
    </div>
    <div>
      <div class="field-label">Structure</div>
      <div class="field-value">${STRUCTURE_LABEL[data.paymentStructure] ?? data.paymentStructure}</div>
    </div>
  </div>
  ${isAdvance ? `<div class="pay-split">
    <strong>30/70 advance:</strong> ₹${advance.toLocaleString('en-IN')} on signing,
    ₹${balance.toLocaleString('en-IN')} after the gig.
  </div>` : ''}

  <h2>Cancellation policy</h2>
  <div class="field-grid">
    <div>
      <div class="field-label">Window</div>
      <div class="field-value">${escape(data.cancellationPolicy)}</div>
    </div>
    <div>
      <div class="field-label">Forfeit</div>
      <div class="field-value">${data.cancellationForfeitPct}%</div>
    </div>
  </div>
  ${data.cancellationCustomText && data.cancellationCustomText.trim() ? `
    <p class="terms-paragraph" style="margin-top: 8pt;">${escape(data.cancellationCustomText.trim())}</p>
  ` : ''}

  ${data.customClauses.length > 0 ? `
    <h2>Custom clauses</h2>
    <ol class="clauses-list">
      ${data.customClauses.map((c) => `<li>${escape(c)}</li>`).join('\n      ')}
    </ol>
  ` : ''}

  ${data.termsAndConditions ? `
    <h2>Additional terms</h2>
    <div class="terms-paragraph">${escape(data.termsAndConditions)}</div>
  ` : ''}

  <h2>Signatures</h2>
  <div class="signatures">
    <div class="signature">
      <div class="sig-name">${escape(data.hirerName)}</div>
      ${data.hirerSignedAt
        ? `<div class="sig-meta">Signed ${fmtDateShort(data.hirerSignedAt)}</div>`
        : `<div class="sig-meta sig-pending">${data.isPreview ? 'Signature pending — applies at hire' : 'Awaiting signature'}</div>`
      }
    </div>
    <div class="signature">
      <div class="sig-name">${escape(data.artistName)}</div>
      ${data.artistSignedAt
        ? `<div class="sig-meta">Signed ${fmtDateShort(data.artistSignedAt)}</div>`
        : `<div class="sig-meta sig-pending">${data.isPreview ? 'Signature pending — applies at hire' : 'Awaiting signature'}</div>`
      }
    </div>
  </div>

  <div class="doc-footer">
    ${data.contractId ? `Contract ID: <code>${escape(data.contractId)}</code> · ` : ''}
    Generated ${new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
    <br />
    NETSA · Bound under IT Act 2000 §5 + Indian Contract Act §10A
  </div>
</body>
</html>`;
}
