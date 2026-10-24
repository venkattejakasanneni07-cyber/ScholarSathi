import { describe, it, expect } from 'vitest';
import { triAnd, triAndAll, triOr, triOrAll, triNot } from '../tri';
import { evaluateRule, evaluateScheme } from '../rules';
import { computeCompletionMetrics } from '../completion';
import { computeRenewalCompletionMetrics } from '../renewal';
import { optimizePortfolio } from '../optimizer';
import { computeNaiveBaseline } from '../baseline';
import { detectContradictions } from '../contradictions';
import { runFairnessTest } from '../fairness';
import { analyzeSensitivity } from '../sensitivity';
import { evaluateAccuracy } from '../evaluation';
import { submitApplicationDemo } from '../../store/submissions';

import schemesV1 from '../../data/schemes.v1.json';
import schemesV2 from '../../data/schemes.v2.json';
import profiles from '../../data/profiles.json';
import config from '../../data/config.json';
import goldLabels from '../../data/gold.json';
import enStrings from '../../data/i18n.en.json';
import hiStrings from '../../data/i18n.hi.json';
import teStrings from '../../data/i18n.te.json';

import { AppConfig, GoldLabel, Profile, Scheme } from '../types';

const typedConfig = config as AppConfig;
const typedSchemesV1 = schemesV1 as unknown as Scheme[];
const typedSchemesV2 = schemesV2 as unknown as Scheme[];
const typedProfiles = profiles as unknown as Profile[];
const typedGold = goldLabels as unknown as GoldLabel[];

describe('Kleene Three-Valued Logic (tri.ts)', () => {
  it('correctly computes triAnd', () => {
    expect(triAnd('MET', 'MET')).toBe('MET');
    expect(triAnd('MET', 'UNKNOWN')).toBe('UNKNOWN');
    expect(triAnd('MET', 'UNMET')).toBe('UNMET');
    expect(triAnd('UNKNOWN', 'UNKNOWN')).toBe('UNKNOWN');
    expect(triAnd('UNKNOWN', 'UNMET')).toBe('UNMET');
    expect(triAnd('UNMET', 'UNMET')).toBe('UNMET');
  });

  it('correctly computes triAndAll', () => {
    expect(triAndAll(['MET', 'MET', 'MET'])).toBe('MET');
    expect(triAndAll(['MET', 'UNKNOWN', 'MET'])).toBe('UNKNOWN');
    expect(triAndAll(['MET', 'UNKNOWN', 'UNMET'])).toBe('UNMET');
    expect(triAndAll([])).toBe('UNKNOWN');
  });

  it('correctly computes triOr and triNot', () => {
    expect(triOr('MET', 'UNMET')).toBe('MET');
    expect(triOr('UNMET', 'UNKNOWN')).toBe('UNKNOWN');
    expect(triOr('UNMET', 'UNMET')).toBe('UNMET');
    expect(triNot('MET')).toBe('UNMET');
    expect(triNot('UNMET')).toBe('MET');
    expect(triNot('UNKNOWN')).toBe('UNKNOWN');
  });
});

describe('Sanity Values for Asha P1 (Section 5.5 of Brief)', () => {
  const asha = typedProfiles.find((p) => p.id === 'P1')!;
  const today = '2026-10-26';

  it('hoursPerDay = 11 / 7 = 1.5714', () => {
    const hoursPerDay = asha.freeHoursThisWeek / 7;
    expect(Number(hoursPerDay.toFixed(3))).toBe(1.571);
  });

  it('Overall v1 status matches section 5.5 sanity values', () => {
    const evalA = evaluateScheme(typedSchemesV1.find((s) => s.id === 'A')!, asha, today);
    const evalB = evaluateScheme(typedSchemesV1.find((s) => s.id === 'B')!, asha, today);
    const evalC = evaluateScheme(typedSchemesV1.find((s) => s.id === 'C')!, asha, today);
    const evalD = evaluateScheme(typedSchemesV1.find((s) => s.id === 'D')!, asha, today);
    const evalE = evaluateScheme(typedSchemesV1.find((s) => s.id === 'E')!, asha, today);

    // A = UNKNOWN (A2 unknown because the two income values 280k and 240k fall on different sides of 260000)
    expect(evalA.status).toBe('UNKNOWN');

    // B = UNMET (both incomes 280k and 240k exceed 200000)
    expect(evalB.status).toBe('UNMET');

    // C = UNKNOWN (C3 gap not documented)
    expect(evalC.status).toBe('UNKNOWN');

    // D = not open yet (opens 2026-11-02, today is 2026-10-26)
    expect(evalD.timingStatus).toBe('not_open_yet');

    // E = UNKNOWN (ambiguous: I1 Met, I2 Unmet)
    expect(evalE.status).toBe('UNKNOWN');
    expect(evalE.ambiguous).toBe(true);
  });

  it('Latest safe start dates match section 5.5 exactly', () => {
    const compA = computeCompletionMetrics(typedSchemesV1.find((s) => s.id === 'A')!, asha, typedConfig, today);
    const compB = computeCompletionMetrics(typedSchemesV1.find((s) => s.id === 'B')!, asha, typedConfig, today);
    const compC = computeCompletionMetrics(typedSchemesV1.find((s) => s.id === 'C')!, asha, typedConfig, today);
    const compE = computeCompletionMetrics(typedSchemesV1.find((s) => s.id === 'E')!, asha, typedConfig, today);
    const compRenewal = computeRenewalCompletionMetrics(asha.existingScholarship!, asha, typedConfig, today);

    expect(compA.latestSafeStart).toBe('2026-11-02');
    expect(compB.latestSafeStart).toBe('2026-10-27');
    expect(compC.latestSafeStart).toBe('2026-11-13');
    expect(compE.latestSafeStart).toBe('2026-11-03');
    expect(compRenewal.latestSafeStart).toBe('2026-11-07');
  });

  it('Naive baseline picks B first (largest award), but ScholarSathi portfolio does NOT recommend B', () => {
    const baseline = computeNaiveBaseline(typedSchemesV1, asha, typedConfig, typedConfig.defaultWeights, today);
    expect(baseline.schemeIds).toContain('B');

    const optimizerRes = optimizePortfolio(typedSchemesV1, asha, typedConfig, typedConfig.defaultWeights, today);
    expect(optimizerRes.bestSet.schemeIds).not.toContain('B');
  });

  it('Optimizer enforces exclusion constraint: A and C are never together in the recommended set', () => {
    const optimizerRes = optimizePortfolio(typedSchemesV1, asha, typedConfig, typedConfig.defaultWeights, today);
    const hasA = optimizerRes.bestSet.schemeIds.includes('A');
    const hasC = optimizerRes.bestSet.schemeIds.includes('C');
    expect(hasA && hasC).toBe(false);
  });

  it('Optimizer respects available hours budget (free hours 11 - renewal 2 = 9 available)', () => {
    const optimizerRes = optimizePortfolio(typedSchemesV1, asha, typedConfig, typedConfig.defaultWeights, today);
    expect(optimizerRes.availableHours).toBe(9);
    expect(optimizerRes.bestSet.totalEffortHours).toBeLessThanOrEqual(9);
  });
});

describe('Mid-Event Rule Update v2 Behavior', () => {
  const asha = typedProfiles.find((p) => p.id === 'P1')!;
  const today = '2026-10-26';

  it('Applying v2 turns Scheme A into MET for Asha because income 280k <= 300k and 240k <= 300k', () => {
    const evalA_v1 = evaluateScheme(typedSchemesV1.find((s) => s.id === 'A')!, asha, today);
    expect(evalA_v1.status).toBe('UNKNOWN');

    const evalA_v2 = evaluateScheme(typedSchemesV2.find((s) => s.id === 'A')!, asha, today);
    expect(evalA_v2.status).toBe('MET');
  });

  it('Applying v2 extends Scheme C deadline to 2026-11-30', () => {
    const sC_v1 = typedSchemesV1.find((s) => s.id === 'C')!;
    const sC_v2 = typedSchemesV2.find((s) => s.id === 'C')!;
    expect(sC_v1.deadline).toBe('2026-11-18');
    expect(sC_v2.deadline).toBe('2026-11-30');
  });
});

describe('Contradictions, Toggles, and Audit Log', () => {
  const asha = typedProfiles.find((p) => p.id === 'P1')!;
  const today = '2026-10-26';

  it('flags parent income conflict as Must-fix when crossing open scheme limit', () => {
    const conflicts = detectContradictions(asha, typedSchemesV1, today);
    const incConflict = conflicts.find((c) => c.field === 'parentIncome');
    expect(incConflict).toBeDefined();
    expect(incConflict!.severity).toBe('Must-fix');
  });

  it('warning when certificate expires before open scheme deadlines', () => {
    const conflicts = detectContradictions(asha, typedSchemesV1, today);
    const certConflict = conflicts.find((c) => c.field === 'incomeCertificate');
    expect(certConflict).toBeDefined();
    expect(certConflict!.severity).toBe('Warning');
  });

  it('toggling/adding a conflicting declaration marks rule as UNKNOWN and keeps history', () => {
    const ravi = typedProfiles.find((p) => p.id === 'P2')!;
    const ruleA2 = typedSchemesV1.find((s) => s.id === 'A')!.rules.find((r) => r.id === 'A2')!;
    const evalInitial = evaluateRule(ruleA2, ravi);
    expect(evalInitial.status).toBe('MET');

    const modifiedRavi: Profile = {
      ...ravi,
      parentIncome: [
        ...ravi.parentIncome,
        { value: 290000, source: 'Student edit', enteredAt: '2026-10-26T14:00:00Z' },
      ],
    };
    const evalToggled = evaluateRule(ruleA2, modifiedRavi);
    expect(evalToggled.status).toBe('UNKNOWN');
    expect(evalToggled.valuesUsed.length).toBe(3);
  });
});

describe('Sensitivity Analysis', () => {
  const asha = typedProfiles.find((p) => p.id === 'P1')!;
  const today = '2026-10-26';

  it('analyzes non-Met scheme A and reports flipping rule', () => {
    const schemeA = typedSchemesV1.find((s) => s.id === 'A')!;
    const sens = analyzeSensitivity(schemeA, asha, today);
    expect(sens).not.toBeNull();
    expect(sens!.blockingRules).toContain('A2');
    const flipA2 = sens!.flippingRules.find((f) => f.ruleId === 'A2');
    expect(flipA2).toBeDefined();
    expect(flipA2!.message).toBe('If rule A2 is confirmed as met, the overall result becomes Met.');
    expect(sens!.conflictAdvice).toBe('Check the original documents and confirm which value is correct.');
  });
});

describe('Fairness Test (Proxy-Swap Test)', () => {
  it('twin pairs produce unexplained gap = 0 and pass = true', () => {
    const fairness = runFairnessTest(typedProfiles, typedSchemesV1, typedConfig, '2026-10-26');
    expect(fairness.overallUnexplainedGap).toBe(0);
    expect(fairness.pass).toBe(true);

    for (const pair of fairness.pairs) {
      const diffD = pair.differences.find((d) => d.schemeId === 'D');
      expect(diffD).toBeDefined();
      expect(diffD!.isExplained).toBe(true);
      expect(diffD!.documentedReason).toContain('Scheme D is limited to listed districts');
    }
  });
});

describe('Gold Accuracy vs Hand-Written Labels', () => {
  it('achieves 100% accuracy on all 35 gold labels', () => {
    const acc = evaluateAccuracy(typedProfiles, typedSchemesV1, typedGold, '2026-10-26');
    expect(acc.totalEvaluated).toBe(35);
    expect(acc.matches).toBe(35);
    expect(acc.accuracyPct).toBe(100);
    expect(acc.mismatches.length).toBe(0);
  });
});

describe('Forbidden Phrase Scan (Hard Rule 4)', () => {
  const forbiddenPhrases = [
    'guaranteed',
    'you will get',
    'you will win',
    'high chance of winning',
    'sure',
    'win probability',
  ];

  const checkObjectForForbidden = (obj: Record<string, unknown>, path: string = '') => {
    for (const [key, val] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      if (typeof val === 'string') {
        const lower = val.toLowerCase();
        for (const phrase of forbiddenPhrases) {
          expect(
            lower.includes(phrase),
            `Forbidden phrase "${phrase}" found at ${fullPath}: "${val}"`
          ).toBe(false);
        }
      } else if (typeof val === 'object' && val !== null) {
        checkObjectForForbidden(val as Record<string, unknown>, fullPath);
      }
    }
  };

  it('English translations have no forbidden phrases', () => {
    checkObjectForForbidden(enStrings as Record<string, unknown>);
  });

  it('Hindi translations have no forbidden phrases', () => {
    checkObjectForForbidden(hiStrings as Record<string, unknown>);
  });

  it('Telugu translations have no forbidden phrases', () => {
    checkObjectForForbidden(teStrings as Record<string, unknown>);
  });
});

describe('Idempotent Submissions', () => {
  it('deduplicates identical submissionId and marks duplicate', async () => {
    const subId = `test-sub-${Date.now()}`;
    const payload = { test: true };

    const first = await submitApplicationDemo(subId, 'A', payload, 'P1', 'Asha', true);
    expect(first.isDuplicate).toBe(false);
    expect(first.record.submissionId).toBe(subId);

    const second = await submitApplicationDemo(subId, 'A', payload, 'P1', 'Asha', true);
    expect(second.isDuplicate).toBe(true);
    expect(second.record.submissionId).toBe(subId);
  });
});
