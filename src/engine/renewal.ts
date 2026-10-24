import { differenceInCalendarDays, parseISO, subDays, format } from 'date-fns';
import { AppConfig, ExistingScholarship, Profile } from './types';

export interface RenewalCompletionMetrics {
  workDays: number;
  evidenceWaitDays: number;
  bufferDays: number;
  latestSafeStart: string;
  slackDays: number;
  statusTag: 'comfortable' | 'tight' | 'too_late';
}

export function computeRenewalCompletionMetrics(
  existing: ExistingScholarship,
  profile: Profile,
  config: AppConfig,
  todayStr: string
): RenewalCompletionMetrics {
  const today = parseISO(todayStr);
  const deadline = parseISO(existing.renewalDue);

  const freeHours = Math.max(0.1, profile.freeHoursThisWeek);
  const hoursPerDay = freeHours / 7;
  const workDays = Math.ceil(existing.renewalHours / hoursPerDay);

  const bufferDays =
    profile.connectivity === 'good'
      ? config.bufferDaysGood
      : config.bufferDaysUnreliable;

  const evidenceWaitDays = 0; // Renewal usually requires existing documents already verified
  const totalOffsetDays = workDays + evidenceWaitDays + bufferDays;
  const safeStartDate = subDays(deadline, totalOffsetDays);
  const latestSafeStart = format(safeStartDate, 'yyyy-MM-dd');
  const slackDays = differenceInCalendarDays(safeStartDate, today);

  let statusTag: 'comfortable' | 'tight' | 'too_late' = 'comfortable';
  if (slackDays < 0) {
    statusTag = 'too_late';
  } else if (slackDays <= bufferDays) {
    statusTag = 'tight';
  }

  return {
    workDays,
    evidenceWaitDays,
    bufferDays,
    latestSafeStart,
    slackDays,
    statusTag,
  };
}
