import { Contradiction, Profile, Scheme } from './types';
import { getSchemeTimingStatus } from './rules';

/**
 * Return a list of contradictions:
 * - Income values differ between forms:
 *   - Must-fix if values lie on different sides of any open scheme's income limit
 *   - Warning if they differ by more than 5%
 *   - Info otherwise
 * - Category values differ: Must-fix
 * - Attendance values differ by > 2 points: Warning
 * - Income certificate expires before a scheme deadline: Warning, with re-issue status
 * - A declaration changed after an earlier answer: Info
 *
 * Rules:
 * - Neutral template. Never include words like "false", "fraud", "lie", "cheat", "inconsistent student".
 */
export function detectContradictions(
  profile: Profile,
  schemes: Scheme[],
  todayStr: string
): Contradiction[] {
  const contradictions: Contradiction[] = [];

  // 1. Parent Income differences
  if (profile.parentIncome && profile.parentIncome.length > 1) {
    const values = profile.parentIncome.map((d) => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);

    if (minVal !== maxVal) {
      // Check if values lie on different sides of any open scheme's income limit
      const openSchemes = schemes.filter(
        (s) => getSchemeTimingStatus(s, todayStr) === 'open'
      );

      let crossesLimit = false;
      let limitCrossed = 0;
      for (const s of openSchemes) {
        for (const r of s.rules) {
          if (r.field === 'parentIncome' && typeof r.value === 'number') {
            if (
              (minVal <= r.value && maxVal > r.value) ||
              (minVal < r.value && maxVal >= r.value)
            ) {
              crossesLimit = true;
              limitCrossed = r.value;
              break;
            }
          }
        }
        if (crossesLimit) break;
      }

      const pctDiff = ((maxVal - minVal) / minVal) * 100;
      let severity: 'Must-fix' | 'Warning' | 'Info' = 'Info';

      if (crossesLimit) {
        severity = 'Must-fix';
      } else if (pctDiff > 5) {
        severity = 'Warning';
      }

      const sourcesWithValues = profile.parentIncome
        .map((d) => `₹${d.value.toLocaleString('en-IN')} (${d.source})`)
        .join(' and ');

      contradictions.push({
        id: 'income-conflict',
        field: 'parentIncome',
        severity,
        message: `These two values differ (${sourcesWithValues}). Please check which document is correct.`,
        involved: values,
        howToResolve: crossesLimit
          ? `One declared amount is below the ₹${limitCrossed.toLocaleString('en-IN')} limit while the other is above it. Review your State and Central application forms and select the verified amount.`
          : 'Review both documents and confirm the verified family income.',
      });
    }
  }

  // 2. Category differences
  if (profile.category && profile.category.length > 1) {
    const cats = profile.category.map((c) => c.value);
    const uniqueCats = Array.from(new Set(cats));
    if (uniqueCats.length > 1) {
      contradictions.push({
        id: 'category-conflict',
        field: 'category',
        severity: 'Must-fix',
        message: 'These two values differ. Please check which document is correct.',
        involved: cats,
        howToResolve:
          'Verify your caste/community certificate and select the correct category declaration.',
      });
    }
  }

  // 3. Attendance differences (> 2 points)
  if (profile.attendancePct && profile.attendancePct.length > 1) {
    const attVals = profile.attendancePct.map((a) => a.value);
    const minAtt = Math.min(...attVals);
    const maxAtt = Math.max(...attVals);
    if (maxAtt - minAtt > 2) {
      contradictions.push({
        id: 'attendance-conflict',
        field: 'attendancePct',
        severity: 'Warning',
        message: 'These two values differ. Please check which document is correct.',
        involved: attVals,
        howToResolve:
          'Check the institution attendance register or certificate to confirm your official attendance percentage.',
      });
    }
  }

  // 4. Income certificate expiry vs scheme deadlines
  if (profile.incomeCertificate && profile.incomeCertificate.expiresOn) {
    const certExpiry = profile.incomeCertificate.expiresOn;
    const openSchemes = schemes.filter(
      (s) => getSchemeTimingStatus(s, todayStr) === 'open'
    );

    const affectedSchemes = openSchemes.filter(
      (s) =>
        s.deadline > certExpiry &&
        s.rules.some(
          (r) =>
            r.field === 'parentIncome' ||
            r.field === 'householdIncome' ||
            r.evidence.some((e) => e.toLowerCase().includes('income certificate'))
        )
    );

    if (affectedSchemes.length > 0) {
      const isReissueRequested = profile.incomeCertificate.reissue.requested;
      const eta = profile.incomeCertificate.reissue.etaDate;

      const reissueNote = isReissueRequested
        ? `Re-issue requested with expected arrival on ${eta || 'pending'}.`
        : 'No re-issue requested yet.';

      contradictions.push({
        id: 'certificate-expiry',
        field: 'incomeCertificate',
        severity: 'Warning',
        message: `Your Family Income Certificate expires on ${certExpiry}, before deadlines for ${affectedSchemes
          .map((s) => s.name)
          .join(', ')}. ${reissueNote}`,
        involved: [certExpiry, ...affectedSchemes.map((s) => s.deadline)],
        howToResolve: isReissueRequested
          ? 'Track your re-issue request to ensure it arrives before the latest safe application start date.'
          : 'Apply for certificate renewal at your local revenue authority as soon as possible.',
      });
    }
  }

  // 5. Declaration audit log changes (if history contains older different value)
  // Check marksPct, parentIncome, attendancePct if multiple chronological entries exist
  const checkAuditDiff = (
    fieldName: string,
    decls: { value: string | number; enteredAt: string }[]
  ) => {
    if (decls && decls.length > 1) {
      const sorted = [...decls].sort((a, b) => a.enteredAt.localeCompare(b.enteredAt));
      const latest = sorted[sorted.length - 1];
      const previous = sorted[sorted.length - 2];
      if (latest.value !== previous.value && fieldName !== 'parentIncome') {
        contradictions.push({
          id: `${fieldName}-audit-change`,
          field: fieldName,
          severity: 'Info',
          message: `This answer differs from your earlier answer (${previous.value} on ${previous.enteredAt.slice(
            0,
            10
          )}). Please confirm which is correct and attach the document.`,
          involved: [previous.value, latest.value],
          howToResolve: 'Confirm the accurate value with your official supporting document.',
        });
      }
    }
  };

  checkAuditDiff('marksPct', profile.marksPct);

  return contradictions;
}
