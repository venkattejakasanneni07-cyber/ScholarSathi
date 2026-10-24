import {
  AppConfig,
  PortfolioSet,
  Profile,
  Scheme,
  SchemeScore,
  WeightsConfig,
} from './types';
import { evaluateScheme } from './rules';
import { computeCompletionMetrics } from './completion';
import { computeSchemeScore } from './optimizer';

/**
 * Naive baseline:
 * - Sort all open schemes by award descending
 * - Add each if it fits the available hours and has no exclusion clash
 * - IGNORE eligibility and completion chance when choosing
 * - Then score that set with the SAME U formula and constraints for a fair comparison
 */
export function computeNaiveBaseline(
  schemes: Scheme[],
  profile: Profile,
  config: AppConfig,
  weights: WeightsConfig,
  todayStr: string
): PortfolioSet {
  const mandatoryRenewalHours = profile.existingScholarship
    ? profile.existingScholarship.renewalHours
    : 0;
  const availableHours = Math.max(0, profile.freeHoursThisWeek - mandatoryRenewalHours);
  const maxAward = schemes.reduce((m, s) => Math.max(m, s.award), 0);

  // Evaluate schemes for scoring purposes later
  const allEvals = schemes.map((s) => evaluateScheme(s, profile, todayStr));
  const scores: Record<string, SchemeScore> = {};
  schemes.forEach((s, idx) => {
    scores[s.id] = computeSchemeScore(
      s,
      allEvals[idx],
      profile,
      config,
      weights,
      todayStr,
      maxAward,
      availableHours > 0 ? availableHours : 1
    );
  });

  // Filter schemes open now
  const openSchemes = schemes.filter(
    (s) => scores[s.id].timingStatus === 'open'
  );

  // Sort open schemes by award descending (Naive greedy award approach)
  const sortedByAward = [...openSchemes].sort((a, b) => b.award - a.award);

  const selectedSchemes: Scheme[] = [];
  const selectedIds: string[] = [];
  let usedHours = 0;

  for (const s of sortedByAward) {
    // Check hours limit
    if (usedHours + s.effortHours <= availableHours) {
      // Check exclusion clash
      const hasClash = s.excludesWith.some((exId) => selectedIds.includes(exId));
      if (!hasClash) {
        selectedSchemes.push(s);
        selectedIds.push(s.id);
        usedHours += s.effortHours;
      }
    }
  }

  const totalAward = selectedSchemes.reduce((sum, s) => sum + s.award, 0);
  const totalEffortHours = selectedSchemes.reduce((sum, s) => sum + s.effortHours, 0);
  const totalUtility = Number(
    selectedSchemes.reduce((sum, s) => sum + scores[s.id].utility, 0).toFixed(4)
  );

  return {
    schemeIds: selectedIds,
    schemes: selectedSchemes,
    totalAward,
    totalEffortHours,
    totalUtility,
    isBaseline: true,
    whyChosen: [
      'Naive baseline: picks largest awards first without checking eligibility or completion risk.',
    ],
  };
}
