import { AppConfig, Profile, Scheme } from './types';
import { optimizePortfolio } from './optimizer';
import { evaluateScheme } from './rules';

export interface TwinDifference {
  schemeId: string;
  schemeName: string;
  statusA: string;
  statusB: string;
  pEligA: number;
  pEligB: number;
  utilityA: number;
  utilityB: number;
  scoreDiff: number;
  isExplained: boolean;
  documentedReason?: string;
}

export interface FairnessPairResult {
  pairId: string;
  profileA: string;
  profileB: string;
  swappedAttribute: string;
  swappedValueA: string;
  swappedValueB: string;
  differences: TwinDifference[];
  unexplainedGap: number;
  pass: boolean;
}

export interface FairnessReport {
  pairs: FairnessPairResult[];
  overallUnexplainedGap: number;
  pass: boolean;
}

/**
 * Fairness test (Proxy-swap test):
 * - For each twin pair (P1/P1b, P2/P2b):
 *   - run full pipeline on both
 *   - compare per-scheme status, pElig, U, rank and selected set
 *   - every difference must be traceable to a rule with usesProxy (district) on that scheme (here Scheme D)
 *   - unexplained gap = sum of absolute score differences not explained by a documented proxy rule
 *   - Pass only when unexplained gap = 0
 */
export function runFairnessTest(
  profiles: Profile[],
  schemes: Scheme[],
  config: AppConfig,
  todayStr: string
): FairnessReport {
  const twinPairDefinitions = [
    { idA: 'P1', idB: 'P1b', label: 'Twin Pair 1 (Asha P1 vs P1b)' },
    { idA: 'P2', idB: 'P2b', label: 'Twin Pair 2 (Ravi P2 vs P2b)' },
  ];

  const pairs: FairnessPairResult[] = [];
  let overallUnexplainedGap = 0;

  for (const def of twinPairDefinitions) {
    const profA = profiles.find((p) => p.id === def.idA);
    const profB = profiles.find((p) => p.id === def.idB);

    if (!profA || !profB) {
      continue;
    }

    const optA = optimizePortfolio(schemes, profA, config, config.defaultWeights, todayStr);
    const optB = optimizePortfolio(schemes, profB, config, config.defaultWeights, todayStr);

    const diffs: TwinDifference[] = [];
    let pairUnexplained = 0;

    for (const s of schemes) {
      const evalA = evaluateScheme(s, profA, todayStr);
      const evalB = evaluateScheme(s, profB, todayStr);
      const scoreA = optA.allSchemeScores[s.id];
      const scoreB = optB.allSchemeScores[s.id];

      const diffScore = Math.abs(scoreA.utility - scoreB.utility);
      const statusDifferent = evalA.status !== evalB.status;
      const scoreDifferent = diffScore > 0.0001;

      if (statusDifferent || scoreDifferent) {
        // Check if scheme has usesProxy rule on district
        const proxyRule = s.rules.find((r) => r.usesProxy && r.usesProxy.attribute === 'district');

        if (proxyRule && proxyRule.usesProxy) {
          diffs.push({
            schemeId: s.id,
            schemeName: s.name,
            statusA: evalA.status,
            statusB: evalB.status,
            pEligA: scoreA.pElig,
            pEligB: scoreB.pElig,
            utilityA: scoreA.utility,
            utilityB: scoreB.utility,
            scoreDiff: Number(diffScore.toFixed(4)),
            isExplained: true,
            documentedReason: proxyRule.usesProxy.documentedReason,
          });
        } else {
          // Unexplained difference!
          pairUnexplained += diffScore;
          diffs.push({
            schemeId: s.id,
            schemeName: s.name,
            statusA: evalA.status,
            statusB: evalB.status,
            pEligA: scoreA.pElig,
            pEligB: scoreB.pElig,
            utilityA: scoreA.utility,
            utilityB: scoreB.utility,
            scoreDiff: Number(diffScore.toFixed(4)),
            isExplained: false,
          });
        }
      }
    }

    const cleanPairUnexplained = Number(pairUnexplained.toFixed(4));
    overallUnexplainedGap += cleanPairUnexplained;

    pairs.push({
      pairId: `${def.idA}-${def.idB}`,
      profileA: `${profA.label} (${profA.district})`,
      profileB: `${profB.label} (${profB.district})`,
      swappedAttribute: 'district',
      swappedValueA: profA.district,
      swappedValueB: profB.district,
      differences: diffs,
      unexplainedGap: cleanPairUnexplained,
      pass: cleanPairUnexplained === 0,
    });
  }

  const cleanOverall = Number(overallUnexplainedGap.toFixed(4));

  return {
    pairs,
    overallUnexplainedGap: cleanOverall,
    pass: cleanOverall === 0,
  };
}
