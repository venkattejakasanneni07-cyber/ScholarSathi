import { submissionsStorage, getItem, saveItem, getMemoryStore } from './persistence';

export interface SubmissionRecord {
  submissionId: string;
  schemeId: string;
  payloadHash: string;
  status: 'submitted' | 'queued';
  submittedAt: string;
  profileId: string;
  profileLabel: string;
}

/**
 * Simple string hash for payload fingerprinting
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Idempotent submission:
 * - Each application gets a submissionId (UUID).
 * - "Submit (demo)" writes { submissionId, schemeId, payloadHash, status, submittedAt } to store with key submissionId.
 * - If a submission with that id already exists, return it and do NOT create another.
 * - If offline, set status 'queued'; on 'online' event, flush queued items using the same ids.
 */
export async function submitApplicationDemo(
  submissionId: string,
  schemeId: string,
  payload: Record<string, unknown>,
  profileId: string,
  profileLabel: string,
  isOnline: boolean
): Promise<{ record: SubmissionRecord; isDuplicate: boolean }> {
  // Check if existing record already exists for this submissionId
  const existing = await getItem<SubmissionRecord>(submissionsStorage, submissionId);
  if (existing) {
    return { record: existing, isDuplicate: true };
  }

  const payloadHash = simpleHash(JSON.stringify(payload));
  const record: SubmissionRecord = {
    submissionId,
    schemeId,
    payloadHash,
    status: isOnline ? 'submitted' : 'queued',
    submittedAt: new Date().toISOString(),
    profileId,
    profileLabel,
  };

  await saveItem(submissionsStorage, submissionId, record);
  return { record, isDuplicate: false };
}

/**
 * Get all submissions
 */
export async function getAllSubmissions(): Promise<SubmissionRecord[]> {
  const records: SubmissionRecord[] = [];
  try {
    await submissionsStorage.iterate<SubmissionRecord, void>((value) => {
      records.push(value);
    });
  } catch (err) {
    // Fallback to memory store if iterate fails in non-browser env
    const memStore = getMemoryStore('submissions');
    for (const val of memStore.values()) {
      records.push(val);
    }
  }
  return records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/**
 * Flush queued submissions when coming back online
 */
export async function flushQueuedSubmissions(): Promise<SubmissionRecord[]> {
  const flushed: SubmissionRecord[] = [];
  try {
    await submissionsStorage.iterate<SubmissionRecord, void>(async (value, key) => {
      if (value.status === 'queued') {
        const updated: SubmissionRecord = {
          ...value,
          status: 'submitted',
        };
        await saveItem(submissionsStorage, key, updated);
        flushed.push(updated);
      }
    });
  } catch (err) {
    const memStore = getMemoryStore('submissions');
    for (const [key, value] of memStore.entries()) {
      if (value.status === 'queued') {
        const updated: SubmissionRecord = {
          ...value,
          status: 'submitted',
        };
        memStore.set(key, updated);
        flushed.push(updated);
      }
    }
  }
  return flushed;
}
