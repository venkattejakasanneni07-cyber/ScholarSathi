import {
  Declaration,
  Profile,
  Rule,
  RuleEvaluationResult,
  Scheme,
  SchemeEvaluationResult,
  Tri,
} from './types';
import { triAndAll } from './tri';

/**
 * Compare a single primitive value with a rule condition
 */
function evaluateSingleValue(
  val: number | string,
  op: Rule['op'],
  targetValue: Rule['value']
): boolean {
  if (op === '>=') {
    return typeof val === 'number' && typeof targetValue === 'number' && val >= targetValue;
  }
  if (op === '<=') {
    return typeof val === 'number' && typeof targetValue === 'number' && val <= targetValue;
  }
  if (op === '<') {
    return typeof val === 'number' && typeof targetValue === 'number' && val < targetValue;
  }
  if (op === 'in') {
    return Array.isArray(targetValue) && targetValue.includes(String(val));
  }
  return false;
}

/**
 * Multi-declaration evaluation:
 * - A profile field can hold several declarations.
 * - Evaluate against every declared value:
 *   - all satisfy -> MET
 *   - none satisfy -> UNMET
 *   - mixed -> UNKNOWN
 *   - no values -> UNKNOWN
 */
function evaluateDeclarations<T extends number | string>(
  decls: Declaration<T>[] | undefined,
  op: Rule['op'],
  targetValue: Rule['value']
): { status: Tri; valuesUsed: (string | number)[] } {
  if (!decls || decls.length === 0) {
    return { status: 'UNKNOWN', valuesUsed: [] };
  }

  const valuesUsed = decls.map((d) => d.value);
  const results = decls.map((d) => evaluateSingleValue(d.value, op, targetValue));

  const allPass = results.every(Boolean);
  const nonePass = results.every((r) => !r);

  if (allPass) return { status: 'MET', valuesUsed };
  if (nonePass) return { status: 'UNMET', valuesUsed };
  return { status: 'UNKNOWN', valuesUsed };
}

/**
 * Evaluate gapDocumented rule
 * - If no semester has status 'gap' -> MET
 * - If a gap exists and gapExplanation has both text and documentName -> MET
 * - Otherwise UNKNOWN (never UNMET)
 */
function evaluateGap(profile: Profile): Tri {
  const hasGap = profile.semesters.some((s) => s.status === 'gap');
  if (!hasGap) {
    return 'MET';
  }
  if (
    profile.gapExplanation &&
    profile.gapExplanation.text &&
    profile.gapExplanation.text.trim().length > 0 &&
    profile.gapExplanation.documentName &&
    profile.gapExplanation.documentName.trim().length > 0
  ) {
    return 'MET';
  }
  return 'UNKNOWN';
}

/**
 * Evaluate a single rule against a profile
 */
export function evaluateRule(rule: Rule, profile: Profile): RuleEvaluationResult {
  // Special case: gapDocumented
  if (rule.field === 'gapDocumented' || rule.op === 'documented') {
    const status = evaluateGap(profile);
    const semStatuses = profile.semesters.map((s) => `${s.name}: ${s.status}`).join(', ');
    const expl = profile.gapExplanation
      ? `Explanation: "${profile.gapExplanation.text}", Document: "${profile.gapExplanation.documentName}"`
      : 'No explanation document provided';
    return {
      ruleId: rule.id,
      status,
      ruleText: rule.text,
      evidence: rule.evidence,
      valuesUsed: [semStatuses, expl],
    };
  }

  // Special case: district
  if (rule.field === 'district') {
    const isMet = evaluateSingleValue(profile.district, rule.op, rule.value);
    return {
      ruleId: rule.id,
      status: isMet ? 'MET' : 'UNMET',
      ruleText: rule.text,
      evidence: rule.evidence,
      valuesUsed: [profile.district],
    };
  }

  // Ambiguous rule handling (e.g. E2)
  if (rule.interpretations && rule.interpretations.length > 0) {
    const interpResults = rule.interpretations.map((interp) => {
      if (interp.field === 'parentIncome') {
        const { status, valuesUsed } = evaluateDeclarations(profile.parentIncome, rule.op, rule.value);
        return {
          id: interp.id,
          label: interp.label,
          status,
          valueUsed: valuesUsed.join(', '),
        };
      } else if (interp.field === 'householdIncome') {
        // parentIncome + otherHouseholdIncome
        const decls = profile.parentIncome.map((d) => ({
          ...d,
          value: d.value + (profile.otherHouseholdIncome || 0),
        }));
        const { status, valuesUsed } = evaluateDeclarations(decls, rule.op, rule.value);
        return {
          id: interp.id,
          label: interp.label,
          status,
          valueUsed: valuesUsed.join(', '),
        };
      }
      return {
        id: interp.id,
        label: interp.label,
        status: 'UNKNOWN' as Tri,
        valueUsed: 'N/A',
      };
    });

    const allStatuses = interpResults.map((r) => r.status);
    const allSame = allStatuses.every((s) => s === allStatuses[0]);

    if (allSame) {
      return {
        ruleId: rule.id,
        status: allStatuses[0],
        ruleText: rule.text,
        evidence: rule.evidence,
        valuesUsed: interpResults.map((r) => `${r.label}: ${r.valueUsed}`),
        ambiguous: false,
        interpretationsResult: interpResults,
      };
    } else {
      return {
        ruleId: rule.id,
        status: 'UNKNOWN',
        ruleText: rule.text,
        evidence: rule.evidence,
        valuesUsed: interpResults.map((r) => `${r.label} (${r.status}): ${r.valueUsed}`),
        ambiguous: true,
        interpretationsResult: interpResults,
      };
    }
  }

  // Standard multi-declaration fields
  if (rule.field === 'marksPct') {
    const { status, valuesUsed } = evaluateDeclarations(profile.marksPct, rule.op, rule.value);
    return {
      ruleId: rule.id,
      status,
      ruleText: rule.text,
      evidence: rule.evidence,
      valuesUsed,
    };
  }

  if (rule.field === 'attendancePct') {
    const { status, valuesUsed } = evaluateDeclarations(profile.attendancePct, rule.op, rule.value);
    return {
      ruleId: rule.id,
      status,
      ruleText: rule.text,
      evidence: rule.evidence,
      valuesUsed,
    };
  }

  if (rule.field === 'parentIncome') {
    const { status, valuesUsed } = evaluateDeclarations(profile.parentIncome, rule.op, rule.value);
    return {
      ruleId: rule.id,
      status,
      ruleText: rule.text,
      evidence: rule.evidence,
      valuesUsed,
    };
  }

  if (rule.field === 'householdIncome') {
    const decls = profile.parentIncome.map((d) => ({
      ...d,
      value: d.value + (profile.otherHouseholdIncome || 0),
    }));
    const { status, valuesUsed } = evaluateDeclarations(decls, rule.op, rule.value);
    return {
      ruleId: rule.id,
      status,
      ruleText: rule.text,
      evidence: rule.evidence,
      valuesUsed,
    };
  }

  return {
    ruleId: rule.id,
    status: 'UNKNOWN',
    ruleText: rule.text,
    evidence: rule.evidence,
    valuesUsed: [],
  };
}

/**
 * Determine timing status: not_open_yet / open / closed
 */
export function getSchemeTimingStatus(
  scheme: Scheme,
  today: string
): 'not_open_yet' | 'open' | 'closed' {
  if (today < scheme.opensOn) return 'not_open_yet';
  if (today > scheme.deadline) return 'closed';
  return 'open';
}

/**
 * Evaluate an entire scheme against a profile
 */
export function evaluateScheme(
  scheme: Scheme,
  profile: Profile,
  today: string
): SchemeEvaluationResult {
  const ruleResults = scheme.rules.map((r) => evaluateRule(r, profile));
  const overallStatus = triAndAll(ruleResults.map((r) => r.status));
  const timingStatus = getSchemeTimingStatus(scheme, today);
  const ambiguous = ruleResults.some((r) => r.ambiguous);

  return {
    schemeId: scheme.id,
    scheme,
    status: overallStatus,
    timingStatus,
    ruleResults,
    ambiguous,
    officiallyConfirmed: scheme.officiallyConfirmed ?? false,
  };
}

/**
 * Evaluate all schemes against a profile
 */
export function evaluateAllSchemes(
  schemes: Scheme[],
  profile: Profile,
  today: string
): SchemeEvaluationResult[] {
  return schemes.map((s) => evaluateScheme(s, profile, today));
}
