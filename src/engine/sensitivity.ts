import { Profile, Scheme, SensitivityReport, Tri } from './types';
import { evaluateScheme } from './rules';
import { triAndAll } from './tri';

/**
 * For every scheme whose overall is not MET:
 * - for each non-MET rule, set only that rule to MET, re-evaluate
 * - if the scheme overall becomes MET, report:
 *   "If rule X is confirmed as met, the overall result becomes Met."
 * - list every rule that, on its own, blocks the result.
 * - This is information only. Never suggest changing a declared value.
 * - Where the cause is a conflict between documents, say:
 *   "Check the original documents and confirm which value is correct."
 */
export function analyzeSensitivity(
  scheme: Scheme,
  profile: Profile,
  today: string
): SensitivityReport | null {
  const currentEval = evaluateScheme(scheme, profile, today);
  if (currentEval.status === 'MET') {
    return null;
  }

  const blockingRules: string[] = [];
  const flippingRules: { ruleId: string; ruleText: string; message: string }[] = [];

  // Identify all non-MET rules
  const nonMetRules = currentEval.ruleResults.filter((r) => r.status !== 'MET');
  for (const nr of nonMetRules) {
    blockingRules.push(nr.ruleId);
  }

  // Check which single rule flipping to MET flips the entire scheme to MET
  currentEval.ruleResults.forEach((rResult, index) => {
    if (rResult.status !== 'MET') {
      const simulatedStatuses: Tri[] = currentEval.ruleResults.map((rr, idx) =>
        idx === index ? 'MET' : rr.status
      );
      const simulatedOverall = triAndAll(simulatedStatuses);

      if (simulatedOverall === 'MET') {
        flippingRules.push({
          ruleId: rResult.ruleId,
          ruleText: rResult.ruleText,
          message: `If rule ${rResult.ruleId} is confirmed as met, the overall result becomes Met.`,
        });
      }
    }
  });

  // Check if any rule had conflict between declarations
  const hasConflict = currentEval.ruleResults.some((rr) => {
    if (rr.ruleId === 'A2') {
      return (
        profile.parentIncome &&
        profile.parentIncome.length > 1 &&
        new Set(profile.parentIncome.map((p) => p.value)).size > 1
      );
    }
    return false;
  });

  return {
    schemeId: scheme.id,
    overallStatus: currentEval.status,
    blockingRules,
    flippingRules,
    conflictAdvice: hasConflict
      ? 'Check the original documents and confirm which value is correct.'
      : undefined,
  };
}

export function analyzeAllSensitivity(
  schemes: Scheme[],
  profile: Profile,
  today: string
): Record<string, SensitivityReport | null> {
  const result: Record<string, SensitivityReport | null> = {};
  for (const s of schemes) {
    result[s.id] = analyzeSensitivity(s, profile, today);
  }
  return result;
}
