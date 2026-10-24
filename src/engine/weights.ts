import { AppConfig, Profile, Scheme, SchemeScore, WeightsConfig } from './types';
import { optimizePortfolio } from './optimizer';

export interface RankingDiffItem {
  schemeId: string;
  schemeName: string;
  oldRank: number;
  newRank: number;
  rankDelta: number; // positive = moved up, negative = moved down
  oldUtility: number;
  newUtility: number;
  utilityDelta: number;
  newScore: SchemeScore;
}

/**
 * Compare rankings between old and new weights
 */
export function computeRankingDiff(
  schemes: Scheme[],
  profile: Profile,
  config: AppConfig,
  oldWeights: WeightsConfig,
  newWeights: WeightsConfig,
  todayStr: string
): RankingDiffItem[] {
  const oldRes = optimizePortfolio(schemes, profile, config, oldWeights, todayStr);
  const newRes = optimizePortfolio(schemes, profile, config, newWeights, todayStr);

  const oldRanked = [...schemes].sort(
    (a, b) => oldRes.allSchemeScores[b.id].utility - oldRes.allSchemeScores[a.id].utility
  );
  const newRanked = [...schemes].sort(
    (a, b) => newRes.allSchemeScores[b.id].utility - newRes.allSchemeScores[a.id].utility
  );

  return schemes.map((s) => {
    const oldRank = oldRanked.findIndex((x) => x.id === s.id) + 1;
    const newRank = newRanked.findIndex((x) => x.id === s.id) + 1;
    const oldUtility = oldRes.allSchemeScores[s.id].utility;
    const newUtility = newRes.allSchemeScores[s.id].utility;

    return {
      schemeId: s.id,
      schemeName: s.name,
      oldRank,
      newRank,
      rankDelta: oldRank - newRank, // If was 3, now 1 -> +2 (up 2 spots)
      oldUtility,
      newUtility,
      utilityDelta: Number((newUtility - oldUtility).toFixed(4)),
      newScore: newRes.allSchemeScores[s.id],
    };
  });
}

/**
 * Generate counterfactual sentences:
 * For each of the four weights (Award, Chance, Slack, Effort),
 * try values 0, 25, 50, 75, 100 (others held),
 * and report the smallest change that alters:
 * (a) the top-ranked scheme or
 * (b) the selected portfolio set.
 *
 * Format: "If the [factor] weight drops to [value] (or rises to [value]), [impact]."
 */
export function generateCounterfactuals(
  schemes: Scheme[],
  profile: Profile,
  config: AppConfig,
  currentWeights: WeightsConfig,
  todayStr: string
): string[] {
  const baseRes = optimizePortfolio(schemes, profile, config, currentWeights, todayStr);
  const baseScores = baseRes.allSchemeScores;
  const baseSorted = [...schemes].sort(
    (a, b) => baseScores[b.id].utility - baseScores[a.id].utility
  );
  const baseTopId = baseSorted.length > 0 ? baseSorted[0].id : '';
  const baseSetKey = baseRes.bestSet.schemeIds.sort().join(',');

  const factors: (keyof WeightsConfig)[] = ['award', 'chance', 'slack', 'effort'];
  const testValues = [0, 25, 50, 75, 100];
  const factorLabels: Record<keyof WeightsConfig, string> = {
    award: 'award',
    chance: 'chance of finishing',
    slack: 'slack',
    effort: 'effort',
  };

  const sentences: string[] = [];

  for (const factor of factors) {
    const currentVal = currentWeights[factor];
    let foundChange = false;

    // Sort candidate values by distance from current value
    const sortedTestValues = [...testValues].sort(
      (a, b) => Math.abs(a - currentVal) - Math.abs(b - currentVal)
    );

    for (const testVal of sortedTestValues) {
      if (testVal === currentVal) continue;

      const modifiedWeights: WeightsConfig = {
        ...currentWeights,
        [factor]: testVal,
      };

      const modRes = optimizePortfolio(schemes, profile, config, modifiedWeights, todayStr);
      const modScores = modRes.allSchemeScores;
      const modSorted = [...schemes].sort(
        (a, b) => modScores[b.id].utility - modScores[a.id].utility
      );
      const modTopId = modSorted.length > 0 ? modSorted[0].id : '';
      const modSetKey = modRes.bestSet.schemeIds.sort().join(',');

      const direction = testVal > currentVal ? 'rises' : 'drops';

      if (modTopId !== baseTopId) {
        const prevTopScheme = schemes.find((s) => s.id === baseTopId);
        const newTopScheme = schemes.find((s) => s.id === modTopId);
        sentences.push(
          `If the ${factorLabels[factor]} weight ${direction} to ${testVal}, Scheme ${newTopScheme ? newTopScheme.id : modTopId} ranks above Scheme ${prevTopScheme ? prevTopScheme.id : baseTopId}.`
        );
        foundChange = true;
        break;
      } else if (modSetKey !== baseSetKey) {
        const added = modRes.bestSet.schemeIds.filter((id) => !baseRes.bestSet.schemeIds.includes(id));
        const removed = baseRes.bestSet.schemeIds.filter((id) => !modRes.bestSet.schemeIds.includes(id));
        let changeDesc = '';
        if (added.length > 0 && removed.length > 0) {
          changeDesc = `Scheme ${added.join(', ')} replaces Scheme ${removed.join(', ')} in the recommended set`;
        } else if (added.length > 0) {
          changeDesc = `Scheme ${added.join(', ')} is added to the recommended set`;
        } else if (removed.length > 0) {
          changeDesc = `Scheme ${removed.join(', ')} is removed from the recommended set`;
        } else {
          changeDesc = `the recommended set changes to [${modRes.bestSet.schemeIds.join(', ')}]`;
        }

        sentences.push(
          `If the ${factorLabels[factor]} weight ${direction} to ${testVal}, ${changeDesc}.`
        );
        foundChange = true;
        break;
      }
    }

    if (!foundChange) {
      // No change found across 0..100 for this factor
    }
  }

  if (sentences.length === 0) {
    sentences.push(
      'The current recommendations are robust: small weight shifts within 0 to 100 do not change the selected set or top rank.'
    );
  }

  return sentences;
}
