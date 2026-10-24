import {
  AppConfig,
  GoldLabel,
  PortfolioSet,
  Profile,
  Scheme,
  Tri,
} from './types';
import { evaluateScheme } from './rules';
import { optimizePortfolio } from './optimizer';
import { computeNaiveBaseline } from './baseline';
import { runFairnessTest, FairnessReport } from './fairness';

export interface EligibilityAccuracyReport {
  totalEvaluated: number;
  matches: number;
  accuracyPct: number;
  confusionMatrix: {
    MET: { MET: number; UNMET: number; UNKNOWN: number };
    UNMET: { MET: number; UNMET: number; UNKNOWN: number };
    UNKNOWN: { MET: number; UNMET: number; UNKNOWN: number };
  };
  mismatches: {
    profileId: string;
    schemeId: string;
    expected: Tri;
    actual: Tri;
    reason: string;
  }[];
}

export interface PortfolioBaselineComparison {
  profileId: string;
  profileLabel: string;
  scholarSathiSet: PortfolioSet;
  baselineSet: PortfolioSet;
  scholarSathiUtility: number;
  baselineUtility: number;
  utilityDiff: number;
}

export interface StabilityReport {
  totalRuns: number;
  consistentRuns: number;
  consistencyPct: number;
  baseSetIds: string[];
  mostCommonAlternativeIds: string[];
  alternativeCount: number;
}

export interface FullEvaluationReport {
  timestamp: string;
  accuracy: EligibilityAccuracyReport;
  baselineComparisons: PortfolioBaselineComparison[];
  stability: StabilityReport;
  fairness: FairnessReport;
}

/**
 * 1. Compute Eligibility Accuracy vs gold.json
 */
export function evaluateAccuracy(
  profiles: Profile[],
  schemes: Scheme[],
  goldLabels: GoldLabel[],
  todayStr: string
): EligibilityAccuracyReport {
  const confusionMatrix: EligibilityAccuracyReport['confusionMatrix'] = {
    MET: { MET: 0, UNMET: 0, UNKNOWN: 0 },
    UNMET: { MET: 0, UNMET: 0, UNKNOWN: 0 },
    UNKNOWN: { MET: 0, UNMET: 0, UNKNOWN: 0 },
  };

  const mismatches: EligibilityAccuracyReport['mismatches'] = [];
  let matches = 0;

  for (const gold of goldLabels) {
    const prof = profiles.find((p) => p.id === gold.profileId);
    const scheme = schemes.find((s) => s.id === gold.schemeId);

    if (!prof || !scheme) continue;

    const evalRes = evaluateScheme(scheme, prof, todayStr);
    const actual = evalRes.status;
    const expected = gold.label;

    confusionMatrix[expected][actual] += 1;

    if (actual === expected) {
      matches += 1;
    } else {
      mismatches.push({
        profileId: gold.profileId,
        schemeId: gold.schemeId,
        expected,
        actual,
        reason: gold.reason,
      });
    }
  }

  const totalEvaluated = goldLabels.length;
  const accuracyPct =
    totalEvaluated > 0 ? Number(((matches / totalEvaluated) * 100).toFixed(1)) : 0;

  return {
    totalEvaluated,
    matches,
    accuracyPct,
    confusionMatrix,
    mismatches,
  };
}

/**
 * 2. Portfolio Value vs Naive Baseline for P1, P2, P3, P5
 */
export function evaluateBaselineComparisons(
  profiles: Profile[],
  schemes: Scheme[],
  config: AppConfig,
  todayStr: string
): PortfolioBaselineComparison[] {
  const targetProfileIds = ['P1', 'P2', 'P3', 'P5'];
  const comparisons: PortfolioBaselineComparison[] = [];

  for (const pid of targetProfileIds) {
    const prof = profiles.find((p) => p.id === pid);
    if (!prof) continue;

    const optRes = optimizePortfolio(schemes, prof, config, config.defaultWeights, todayStr);
    const baseSet = computeNaiveBaseline(schemes, prof, config, config.defaultWeights, todayStr);

    const ssU = optRes.bestSet.totalUtility;
    const bU = baseSet.totalUtility;
    const diff = Number((ssU - bU).toFixed(4));

    comparisons.push({
      profileId: prof.id,
      profileLabel: prof.label,
      scholarSathiSet: optRes.bestSet,
      baselineSet: baseSet,
      scholarSathiUtility: ssU,
      baselineUtility: bU,
      utilityDiff: diff,
    });
  }

  return comparisons;
}

/**
 * Simple pseudo-random number generator (LCG) for reproducible seeding
 */
class SeededRandom {
  private seed: number;
  constructor(seed: number = 42) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }
  next(): number {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

/**
 * 3. Stability Test: 100 perturbed runs
 * Perturbations:
 * - free hours ± 1
 * - income ± 5%
 * - marks ± 2 points
 * - attendance ± 2 points
 */
export function evaluateStability(
  baseProfile: Profile,
  schemes: Scheme[],
  config: AppConfig,
  todayStr: string,
  runs: number = 100
): StabilityReport {
  const rng = new SeededRandom(2026);
  const baseRes = optimizePortfolio(schemes, baseProfile, config, config.defaultWeights, todayStr);
  const baseSetKey = baseRes.bestSet.schemeIds.slice().sort().join(',');

  let consistentRuns = 0;
  const altMap = new Map<string, number>();

  for (let i = 0; i < runs; i++) {
    // Perturbations
    const dHours = Math.round(rng.nextRange(-1, 1));
    const dIncomePct = rng.nextRange(-0.05, 0.05);
    const dMarks = Math.round(rng.nextRange(-2, 2));
    const dAtt = Math.round(rng.nextRange(-2, 2));

    const perturbedProfile: Profile = {
      ...baseProfile,
      freeHoursThisWeek: Math.max(1, baseProfile.freeHoursThisWeek + dHours),
      parentIncome: baseProfile.parentIncome.map((d) => ({
        ...d,
        value: Math.round(d.value * (1 + dIncomePct)),
      })),
      marksPct: baseProfile.marksPct.map((d) => ({
        ...d,
        value: Math.min(100, Math.max(0, d.value + dMarks)),
      })),
      attendancePct: baseProfile.attendancePct.map((d) => ({
        ...d,
        value: Math.min(100, Math.max(0, d.value + dAtt)),
      })),
    };

    const perturbedRes = optimizePortfolio(
      schemes,
      perturbedProfile,
      config,
      config.defaultWeights,
      todayStr
    );
    const setKey = perturbedRes.bestSet.schemeIds.slice().sort().join(',');

    if (setKey === baseSetKey) {
      consistentRuns += 1;
    } else {
      altMap.set(setKey, (altMap.get(setKey) || 0) + 1);
    }
  }

  let mostCommonAltKey = '';
  let maxAltCount = 0;
  for (const [key, count] of altMap.entries()) {
    if (count > maxAltCount) {
      maxAltCount = count;
      mostCommonAltKey = key;
    }
  }

  return {
    totalRuns: runs,
    consistentRuns,
    consistencyPct: Number(((consistentRuns / runs) * 100).toFixed(1)),
    baseSetIds: baseRes.bestSet.schemeIds,
    mostCommonAlternativeIds: mostCommonAltKey ? mostCommonAltKey.split(',') : [],
    alternativeCount: maxAltCount,
  };
}

/**
 * 4. Run All Evaluations Live
 */
export function runAllEvaluations(
  profiles: Profile[],
  schemes: Scheme[],
  goldLabels: GoldLabel[],
  config: AppConfig,
  todayStr: string
): FullEvaluationReport {
  const ashaProfile = profiles.find((p) => p.id === 'P1') || profiles[0];

  const accuracy = evaluateAccuracy(profiles, schemes, goldLabels, todayStr);
  const baselineComparisons = evaluateBaselineComparisons(profiles, schemes, config, todayStr);
  const stability = evaluateStability(ashaProfile, schemes, config, todayStr, 100);
  const fairness = runFairnessTest(profiles, schemes, config, todayStr);

  return {
    timestamp: new Date().toISOString(),
    accuracy,
    baselineComparisons,
    stability,
    fairness,
  };
}
