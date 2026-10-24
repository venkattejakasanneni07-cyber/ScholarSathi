import {
  AppConfig,
  PortfolioSet,
  Profile,
  Scheme,
  SchemeEvaluationResult,
  SchemeScore,
  WeightsConfig,
} from './types';
import { evaluateScheme } from './rules';
import { computeCompletionMetrics } from './completion';

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Compute the planning score (utility U) for a single scheme:
 *
 * pElig: 1 for MET, 0 for UNMET, config.unknownPElig (default 0.5) for UNKNOWN.
 * (ambiguous scheme: average of interpretations, each 1 or 0)
 *
 * base = pElig * pFinish
 * a = award / maxAward (0..1)
 * s = clamp(slackDays / 10, 0, 1)
 * e = effortHours / availableHours
 * U = wAward·a·base + wChance·base + wSlack·s·base - wEffort·e
 */
export function computeSchemeScore(
  scheme: Scheme,
  evalResult: SchemeEvaluationResult,
  profile: Profile,
  config: AppConfig,
  weights: WeightsConfig,
  todayStr: string,
  maxAward: number,
  availableHours: number
): SchemeScore {
  const completion = computeCompletionMetrics(scheme, profile, config, todayStr);

  // Compute pElig
  let pElig = 0;
  if (evalResult.status === 'MET') {
    pElig = 1;
  } else if (evalResult.status === 'UNMET') {
    pElig = 0;
  } else {
    // UNKNOWN
    if (evalResult.ambiguous) {
      // Find ambiguous rule
      const ambigRule = evalResult.ruleResults.find((r) => r.ambiguous);
      if (ambigRule && ambigRule.interpretationsResult && ambigRule.interpretationsResult.length > 0) {
        const sum = ambigRule.interpretationsResult.reduce((acc, ir) => {
          return acc + (ir.status === 'MET' ? 1 : 0);
        }, 0);
        pElig = sum / ambigRule.interpretationsResult.length; // e.g. (1 + 0) / 2 = 0.5
      } else {
        pElig = config.unknownPElig;
      }
    } else {
      pElig = config.unknownPElig;
    }
  }

  const pFinish = completion.pFinish;
  const base = pElig * pFinish;

  const a = maxAward > 0 ? scheme.award / maxAward : 0;
  const s = clamp(completion.slackDays / 10, 0, 1);
  const e = availableHours > 0 ? scheme.effortHours / availableHours : 1;

  // Normalized weights summing to 1
  const sumWeights = weights.award + weights.chance + weights.slack + weights.effort;
  const wAward = sumWeights > 0 ? weights.award / sumWeights : 0.4;
  const wChance = sumWeights > 0 ? weights.chance / sumWeights : 0.3;
  const wSlack = sumWeights > 0 ? weights.slack / sumWeights : 0.1;
  const wEffort = sumWeights > 0 ? weights.effort / sumWeights : 0.2;

  const utility = Number(
    (wAward * a * base + wChance * base + wSlack * s * base - wEffort * e).toFixed(4)
  );

  return {
    schemeId: scheme.id,
    scheme,
    pElig,
    pFinish,
    base,
    awardNorm: a,
    slackNorm: s,
    effortNorm: e,
    utility,
    latestSafeStart: completion.latestSafeStart,
    slackDays: completion.slackDays,
    status: evalResult.status,
    timingStatus: evalResult.timingStatus,
  };
}

export interface OptimizerResult {
  bestSet: PortfolioSet;
  alternativeSets: PortfolioSet[];
  allSchemeScores: Record<string, SchemeScore>;
  availableHours: number;
  mandatoryRenewalHours: number;
}

/**
 * Search the optimal portfolio across subsets of schemes
 */
export function optimizePortfolio(
  schemes: Scheme[],
  profile: Profile,
  config: AppConfig,
  weights: WeightsConfig,
  todayStr: string
): OptimizerResult {
  const mandatoryRenewalHours = profile.existingScholarship
    ? profile.existingScholarship.renewalHours
    : 0;
  const availableHours = Math.max(0, profile.freeHoursThisWeek - mandatoryRenewalHours);

  const maxAward = schemes.reduce((m, s) => Math.max(m, s.award), 0);

  // Evaluate all schemes
  const allEvals = schemes.map((s) => evaluateScheme(s, profile, todayStr));
  const allSchemeScores: Record<string, SchemeScore> = {};

  schemes.forEach((s, idx) => {
    allSchemeScores[s.id] = computeSchemeScore(
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

  // Filter candidates: schemes open now and NOT UNMET
  const candidateSchemes = schemes.filter((s) => {
    const sc = allSchemeScores[s.id];
    return sc.timingStatus === 'open' && sc.status !== 'UNMET';
  });

  // Generate all 2^N subsets of all open schemes to evaluate constraints & alternatives
  const openSchemes = schemes.filter(
    (s) => allSchemeScores[s.id].timingStatus === 'open'
  );

  interface ScoredCandidateSet {
    schemeIds: string[];
    schemes: Scheme[];
    totalAward: number;
    totalEffortHours: number;
    totalUtility: number;
    valid: boolean;
    invalidReason?: string;
  }

  const allPossibleSets: ScoredCandidateSet[] = [];

  const n = openSchemes.length;
  const totalSubsets = 1 << n;

  for (let i = 0; i < totalSubsets; i++) {
    const subset: Scheme[] = [];
    for (let j = 0; j < n; j++) {
      if ((i & (1 << j)) !== 0) {
        subset.push(openSchemes[j]);
      }
    }

    const schemeIds = subset.map((s) => s.id);
    const totalAward = subset.reduce((sum, s) => sum + s.award, 0);
    const totalEffortHours = subset.reduce((sum, s) => sum + s.effortHours, 0);
    const totalUtility = Number(
      subset.reduce((sum, s) => sum + allSchemeScores[s.id].utility, 0).toFixed(4)
    );

    // Validate constraints
    let valid = true;
    let invalidReason: string | undefined = undefined;

    // Constraint 1: must not contain UNMET schemes
    const unmetScheme = subset.find((s) => allSchemeScores[s.id].status === 'UNMET');
    if (unmetScheme) {
      valid = false;
      invalidReason = `Includes ${unmetScheme.name} which is Unmet`;
    }

    // Constraint 2: total effortHours <= availableHours
    if (valid && totalEffortHours > availableHours) {
      valid = false;
      invalidReason = `Uses ${totalEffortHours} h, budget is ${availableHours} h`;
    }

    // Constraint 3: no pair in excludesWith
    if (valid) {
      for (const s of subset) {
        for (const exId of s.excludesWith) {
          if (schemeIds.includes(exId)) {
            const exScheme = subset.find((x) => x.id === exId);
            valid = false;
            invalidReason = `Includes both ${s.name} and ${exScheme ? exScheme.name : exId}, which cannot be combined`;
            break;
          }
        }
        if (!valid) break;
      }
    }

    // Constraint 4: latestSafeStart must not be before today minus 0 days
    if (valid) {
      const tooLateScheme = subset.find((s) => {
        const sc = allSchemeScores[s.id];
        return sc.slackDays < 0;
      });
      if (tooLateScheme) {
        valid = false;
        invalidReason = `${tooLateScheme.name} is too late to finish safely`;
      }
    }

    allPossibleSets.push({
      schemeIds,
      schemes: subset,
      totalAward,
      totalEffortHours,
      totalUtility,
      valid,
      invalidReason,
    });
  }

  // Find valid sets sorted by totalUtility descending
  const validSets = allPossibleSets
    .filter((s) => s.valid)
    .sort((a, b) => b.totalUtility - a.totalUtility);

  const best = validSets.length > 0 ? validSets[0] : null;

  const bestSet: PortfolioSet = best
    ? {
        schemeIds: best.schemeIds,
        schemes: best.schemes,
        totalAward: best.totalAward,
        totalEffortHours: best.totalEffortHours,
        totalUtility: best.totalUtility,
        whyChosen: [
          'Maximizes estimated utility within your weekly hours budget',
          ...schemes
            .filter((s) => allSchemeScores[s.id].status === 'UNMET')
            .map((s) => `${s.name} is Unmet so it is not recommended`),
          ...schemes
            .filter((s) => s.excludesWith.length > 0 && best.schemeIds.includes(s.id))
            .map((s) => `${s.name} excludes ${s.excludesWith.join(', ')}, chosen for higher score`),
        ],
      }
    : {
        schemeIds: [],
        schemes: [],
        totalAward: 0,
        totalEffortHours: 0,
        totalUtility: 0,
        whyChosen: ['No eligible open schemes fit the current hours and constraints.'],
      };

  // Find 4 best alternative sets
  // Alternatives can be valid sets with lower utility, or notable constrained sets
  const remainingValidSets = validSets.slice(1);
  const invalidInterestingSets = allPossibleSets
    .filter((s) => !s.valid && s.schemeIds.length > 0)
    .sort((a, b) => b.totalAward - a.totalAward);

  const alternativeSets: PortfolioSet[] = [];

  // Add lower-scoring valid sets first
  for (const vs of remainingValidSets) {
    if (alternativeSets.length >= 4) break;
    const diff = Number((bestSet.totalUtility - vs.totalUtility).toFixed(4));
    alternativeSets.push({
      schemeIds: vs.schemeIds,
      schemes: vs.schemes,
      totalAward: vs.totalAward,
      totalEffortHours: vs.totalEffortHours,
      totalUtility: vs.totalUtility,
      whyNotChosen: `Lower planning score by ${diff}`,
    });
  }

  // If still need alternatives, take notable invalid sets (e.g. over-budget or mutually exclusive)
  for (const is of invalidInterestingSets) {
    if (alternativeSets.length >= 4) break;
    // Avoid duplicates of already included schemeIds combinations
    const key = is.schemeIds.sort().join(',');
    const alreadyIn = alternativeSets.some((a) => a.schemeIds.sort().join(',') === key);
    if (!alreadyIn && key !== bestSet.schemeIds.sort().join(',')) {
      alternativeSets.push({
        schemeIds: is.schemeIds,
        schemes: is.schemes,
        totalAward: is.totalAward,
        totalEffortHours: is.totalEffortHours,
        totalUtility: is.totalUtility,
        whyNotChosen: is.invalidReason || 'Violates constraints',
      });
    }
  }

  return {
    bestSet,
    alternativeSets,
    allSchemeScores,
    availableHours,
    mandatoryRenewalHours,
  };
}
