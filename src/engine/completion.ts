import { differenceInCalendarDays, parseISO, subDays, format } from 'date-fns';
import { AppConfig, CompletionMetrics, Profile, Scheme } from './types';

/**
 * Check if a scheme requires Family Income Certificate
 */
function requiresIncomeCertificate(scheme: Scheme): boolean {
  return scheme.rules.some(
    (r) =>
      r.evidence.some((e) => e.toLowerCase().includes('income certificate')) ||
      r.field === 'parentIncome' ||
      r.field === 'householdIncome'
  );
}

/**
 * Compute completion model metrics for a scheme:
 * - hoursPerDay = freeHoursThisWeek / 7
 * - workDays = ceil(effortHours / hoursPerDay)
 * - evidenceWaitDays:
 *   - 0 if certificate held and valid on scheme deadline
 *   - if certificate expires before scheme deadline:
 *     - if reissue requested: wait = max(0, reissue.etaDate - today)
 *     - if reissue not requested: wait = config.defaultReissueDays (default 10)
 * - bufferDays = 2 if connectivity == 'good', 3 if 'unreliable'
 * - latestSafeStart = deadline - (workDays + evidenceWaitDays + bufferDays)
 * - slackDays = latestSafeStart - today
 * - pFinish = pEvidence * pTime * pConnectivity
 */
export function computeCompletionMetrics(
  scheme: Scheme,
  profile: Profile,
  config: AppConfig,
  todayStr: string
): CompletionMetrics {
  const today = parseISO(todayStr);
  const deadline = parseISO(scheme.deadline);

  // Available hours per day
  const freeHours = Math.max(0.1, profile.freeHoursThisWeek);
  const hoursPerDay = freeHours / 7;
  const workDays = Math.ceil(scheme.effortHours / hoursPerDay);

  // Evidence wait days
  let evidenceWaitDays = 0;
  let evidenceMissing = false;
  let pEvidence = config.pEvidenceValid;

  if (requiresIncomeCertificate(scheme)) {
    const cert = profile.incomeCertificate;
    const hasCert = cert && cert.expiresOn && cert.expiresOn.trim().length > 0;
    const expiresBeforeDeadline = hasCert ? cert.expiresOn < scheme.deadline : true;

    if (!hasCert || expiresBeforeDeadline) {
      if (cert && cert.reissue && cert.reissue.requested && cert.reissue.etaDate) {
        const eta = parseISO(cert.reissue.etaDate);
        evidenceWaitDays = Math.max(0, differenceInCalendarDays(eta, today));
      } else {
        evidenceWaitDays = config.defaultReissueDays;
        evidenceMissing = true;
      }
    }
  }

  // Buffer days based on connectivity
  const bufferDays =
    profile.connectivity === 'good'
      ? config.bufferDaysGood
      : config.bufferDaysUnreliable;

  // latestSafeStart calculation: deadline - (workDays + evidenceWaitDays + bufferDays)
  const totalOffsetDays = workDays + evidenceWaitDays + bufferDays;
  const safeStartDate = subDays(deadline, totalOffsetDays);
  const latestSafeStart = format(safeStartDate, 'yyyy-MM-dd');

  // slackDays = latestSafeStart - today
  const slackDays = differenceInCalendarDays(safeStartDate, today);

  // Compute pEvidence based on latestSafeStart and reissue ETA
  if (requiresIncomeCertificate(scheme)) {
    const cert = profile.incomeCertificate;
    const hasCert = cert && cert.expiresOn && cert.expiresOn.trim().length > 0;
    const expiresBeforeDeadline = hasCert ? cert.expiresOn < scheme.deadline : true;

    if (hasCert && !expiresBeforeDeadline) {
      pEvidence = config.pEvidenceValid; // 0.97
    } else if (cert && cert.reissue && cert.reissue.requested && cert.reissue.etaDate) {
      if (cert.reissue.etaDate <= latestSafeStart) {
        pEvidence = config.pEvidenceReissueBeforeSafe; // 0.85
      } else {
        pEvidence = config.pEvidenceReissueAfterSafe; // 0.40
      }
    } else {
      pEvidence = config.pEvidenceMissing; // 0.50
    }
  } else {
    pEvidence = config.pEvidenceValid; // 0.97
  }

  // Compute pTime
  let pTime = config.pTimeNegativeSlack; // 0.10
  if (todayStr > scheme.deadline || todayStr < scheme.opensOn) {
    pTime = 0; // Not open or deadline passed
  } else if (slackDays >= bufferDays) {
    pTime = config.pTimeHighSlack; // 0.95
  } else if (slackDays >= 0) {
    pTime = config.pTimeLowSlack; // 0.75
  } else {
    pTime = config.pTimeNegativeSlack; // 0.10
  }

  // Compute pConnectivity
  const pConnectivity =
    profile.connectivity === 'good'
      ? config.pConnectivityGood
      : config.pConnectivityUnreliable;

  // pFinish = pEvidence * pTime * pConnectivity
  const pFinish = Number((pEvidence * pTime * pConnectivity).toFixed(4));

  let statusTag: 'comfortable' | 'tight' | 'too_late' = 'comfortable';
  if (slackDays < 0) {
    statusTag = 'too_late';
  } else if (slackDays <= bufferDays) {
    statusTag = 'tight';
  }

  return {
    schemeId: scheme.id,
    workDays,
    evidenceWaitDays,
    bufferDays,
    latestSafeStart,
    slackDays,
    pEvidence,
    pTime,
    pConnectivity,
    pFinish,
    statusTag,
    evidenceMissing,
  };
}
