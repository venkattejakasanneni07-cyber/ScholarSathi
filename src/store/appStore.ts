import { useState, useEffect, useCallback } from 'react';
import {
  AppConfig,
  Declaration,
  GapExplanation,
  IncomeCertificate,
  Profile,
  QuestionForOffice,
  Scheme,
  WeightsConfig,
} from '../engine/types';

import rawConfig from '../data/config.json';
import rawSchemesV1 from '../data/schemes.v1.json';
import rawSchemesV2 from '../data/schemes.v2.json';
import rawProfiles from '../data/profiles.json';
import { appStorage, getItem, saveItem, draftsStorage, submissionsStorage } from './persistence';
import {
  getAllSubmissions,
  SubmissionRecord,
  submitApplicationDemo,
  flushQueuedSubmissions,
} from './submissions';

export interface AuditLogEntry {
  id: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  source: string;
  timestamp: string;
  profileId: string;
}

export interface ApplicationDraft {
  submissionId: string;
  schemeId: string;
  step: 'evidence' | 'form' | 'review' | 'submitted';
  formData: Record<string, unknown>;
  updatedAt: string;
}

export interface AppState {
  // Profiles
  profiles: Profile[];
  currentProfileId: string;
  showTestProfiles: boolean;

  // Configuration and schemes
  config: AppConfig;
  schemeVersion: 'v1' | 'v2';
  schemes: Scheme[];
  todayStr: string;

  // Planner
  weights: WeightsConfig;
  previousWeights: WeightsConfig | null;

  // Language & Connection simulation
  language: 'en' | 'hi' | 'te';
  simulatedOffline: boolean;
  isBrowserOnline: boolean;
  saveStatus: 'saved' | 'saving' | 'offline';

  // Audit log & Questions
  auditLog: AuditLogEntry[];
  questionsForOffice: QuestionForOffice[];

  // Submissions and Drafts
  submissions: SubmissionRecord[];
  drafts: Record<string, ApplicationDraft>;

  // Changelog for scheme updates
  changelog: { version: string; appliedAt: string; notes: string[] }[];
}

export function useAppStore() {
  const [state, setState] = useState<AppState>({
    profiles: rawProfiles as unknown as Profile[],
    currentProfileId: 'P1',
    showTestProfiles: false,
    config: rawConfig as AppConfig,
    schemeVersion: 'v1',
    schemes: rawSchemesV1 as unknown as Scheme[],
    todayStr: rawConfig.demoToday,
    weights: (rawConfig as AppConfig).defaultWeights,
    previousWeights: null,
    language: 'en',
    simulatedOffline: false,
    isBrowserOnline: navigator.onLine,
    saveStatus: 'saved',
    auditLog: [],
    questionsForOffice: [
      {
        id: 'q-E2',
        schemeId: 'E',
        schemeName: 'Rural Learner Support',
        ruleId: 'E2',
        ruleText: 'Annual family income from all sources is below ₹3,00,000',
        interpretations: [
          { id: 'I1', label: "parents' declared income only" },
          { id: 'I2', label: "parents' income plus income of other earning household members" },
        ],
        questionText:
          'Does Rule E2 evaluate only parents’ income or the combined income of all household members?',
        status: 'Open',
      },
    ],
    submissions: [],
    drafts: {},
    changelog: [],
  });

  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from IndexedDB on startup
  useEffect(() => {
    async function hydrate() {
      try {
        const savedProfiles = await getItem<Profile[]>(appStorage, 'profiles');
        const savedProfileId = await getItem<string>(appStorage, 'currentProfileId');
        const savedVersion = await getItem<'v1' | 'v2'>(appStorage, 'schemeVersion');
        const savedWeights = await getItem<WeightsConfig>(appStorage, 'weights');
        const savedLang = await getItem<'en' | 'hi' | 'te'>(appStorage, 'language');
        const savedToday = await getItem<string>(appStorage, 'todayStr');
        const savedAudit = await getItem<AuditLogEntry[]>(appStorage, 'auditLog');
        const savedQuestions = await getItem<QuestionForOffice[]>(
          appStorage,
          'questionsForOffice'
        );
        const savedChangelog = await getItem<{ version: string; appliedAt: string; notes: string[] }[]>(
          appStorage,
          'changelog'
        );
        const subRecords = await getAllSubmissions();

        setState((prev) => ({
          ...prev,
          profiles: savedProfiles || prev.profiles,
          currentProfileId: savedProfileId || prev.currentProfileId,
          schemeVersion: savedVersion || prev.schemeVersion,
          schemes:
            (savedVersion || prev.schemeVersion) === 'v2'
              ? (rawSchemesV2 as unknown as Scheme[])
              : (rawSchemesV1 as unknown as Scheme[]),
          weights: savedWeights || prev.weights,
          language: savedLang || prev.language,
          todayStr: savedToday || prev.todayStr,
          auditLog: savedAudit || prev.auditLog,
          questionsForOffice: savedQuestions || prev.questionsForOffice,
          submissions: subRecords,
          changelog: savedChangelog || prev.changelog,
        }));
      } catch (err) {
        console.error('Failed to hydrate state from IndexedDB:', err);
      } finally {
        setIsHydrated(true);
      }
    }

    hydrate();
  }, []);

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOnline = async () => {
      setState((prev) => ({ ...prev, isBrowserOnline: true }));
      // Flush queued submissions if not manually simulated offline
      if (!state.simulatedOffline) {
        const flushed = await flushQueuedSubmissions();
        if (flushed.length > 0) {
          const allSubs = await getAllSubmissions();
          setState((prev) => ({ ...prev, submissions: allSubs }));
        }
      }
    };
    const handleOffline = () => {
      setState((prev) => ({ ...prev, isBrowserOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [state.simulatedOffline]);

  // Derived connection state
  const isOnline = state.isBrowserOnline && !state.simulatedOffline;

  // Persist helper with debouncing
  const persist = useCallback(
    async (partial: Partial<AppState>) => {
      if (!isOnline) {
        setState((prev) => ({ ...prev, saveStatus: 'offline' }));
      } else {
        setState((prev) => ({ ...prev, saveStatus: 'saving' }));
      }

      for (const [k, v] of Object.entries(partial)) {
        await saveItem(appStorage, k, v);
      }

      if (isOnline) {
        setTimeout(() => {
          setState((prev) => ({ ...prev, saveStatus: 'saved' }));
        }, 300);
      }
    },
    [isOnline]
  );

  // Active current profile
  const currentProfile =
    state.profiles.find((p) => p.id === state.currentProfileId) || state.profiles[0];

  // Actions
  const setCurrentProfileId = (id: string) => {
    setState((prev) => ({ ...prev, currentProfileId: id }));
    persist({ currentProfileId: id });
  };

  const setLanguage = (lang: 'en' | 'hi' | 'te') => {
    setState((prev) => ({ ...prev, language: lang }));
    persist({ language: lang });
  };

  const setTodayStr = (dateStr: string) => {
    setState((prev) => ({ ...prev, todayStr: dateStr }));
    persist({ todayStr: dateStr });
  };

  const setShowTestProfiles = (show: boolean) => {
    setState((prev) => ({ ...prev, showTestProfiles: show }));
  };

  const setSimulatedOffline = async (simOffline: boolean) => {
    setState((prev) => ({
      ...prev,
      simulatedOffline: simOffline,
      saveStatus: simOffline ? 'offline' : 'saved',
    }));

    // If reconnecting, flush queued items
    if (!simOffline && state.isBrowserOnline) {
      await flushQueuedSubmissions();
      const subs = await getAllSubmissions();
      setState((prev) => ({ ...prev, submissions: subs }));
    }
  };

  const setWeights = (newWeights: WeightsConfig) => {
    setState((prev) => ({
      ...prev,
      previousWeights: prev.weights,
      weights: newWeights,
    }));
    persist({ weights: newWeights });
  };

  const resetWeights = () => {
    const def = state.config.defaultWeights;
    setState((prev) => ({
      ...prev,
      previousWeights: prev.weights,
      weights: def,
    }));
    persist({ weights: def });
  };

  // Update profile field declaration (toggle behavior: preserves history)
  const addDeclaration = <T extends string | number>(
    field: 'marksPct' | 'attendancePct' | 'parentIncome' | 'category',
    newValue: T,
    source: string
  ) => {
    const profile = currentProfile;
    const existingList = (profile[field] as unknown as Declaration<T>[]) || [];
    const lastDecl = existingList.length > 0 ? existingList[existingList.length - 1] : null;

    const newDecl: Declaration<T> = {
      value: newValue,
      source: source || 'Student declaration',
      enteredAt: new Date().toISOString(),
    };

    const updatedProfile: Profile = {
      ...profile,
      [field]: [...existingList, newDecl],
    };

    const updatedProfiles = state.profiles.map((p) =>
      p.id === profile.id ? updatedProfile : p
    );

    const logEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      field,
      oldValue: lastDecl ? lastDecl.value : null,
      newValue,
      source: newDecl.source,
      timestamp: newDecl.enteredAt,
      profileId: profile.id,
    };

    const newAudit = [logEntry, ...state.auditLog];

    setState((prev) => ({
      ...prev,
      profiles: updatedProfiles,
      auditLog: newAudit,
    }));

    persist({ profiles: updatedProfiles, auditLog: newAudit });
  };

  // Resolve conflict by explicitly keeping chosen verified declaration
  const resolveDeclarationConflict = (
    field: 'parentIncome' | 'category' | 'attendancePct',
    chosenValue: string | number,
    source: string
  ) => {
    addDeclaration(field as any, chosenValue as any, `${source} (Verified choice)`);
  };

  // Update gap explanation (never edits historical semesters)
  const setGapExplanation = (explanation: GapExplanation | null) => {
    const profile = currentProfile;
    const updatedProfile: Profile = {
      ...profile,
      gapExplanation: explanation,
    };
    const updatedProfiles = state.profiles.map((p) =>
      p.id === profile.id ? updatedProfile : p
    );

    setState((prev) => ({ ...prev, profiles: updatedProfiles }));
    persist({ profiles: updatedProfiles });
  };

  // Update other profile fields
  const updateProfileFields = (fields: Partial<Profile>) => {
    const profile = currentProfile;
    const updatedProfile: Profile = {
      ...profile,
      ...fields,
    };
    const updatedProfiles = state.profiles.map((p) =>
      p.id === profile.id ? updatedProfile : p
    );

    setState((prev) => ({ ...prev, profiles: updatedProfiles }));
    persist({ profiles: updatedProfiles });
  };

  // Apply Schemes v2 Mid-event update
  const applySchemesV2 = () => {
    const updatedSchemes = rawSchemesV2 as unknown as Scheme[];
    const notes = [
      'Scheme A (Rule A2): Income limit raised from ₹2,60,000 to ₹3,00,000.',
      'Scheme C: Deadline extended from 2026-11-18 to 2026-11-30.',
      'Scheme D (Rule D1): Marks threshold raised from 70% to 75%.',
    ];
    const changelogEntry = {
      version: 'v2',
      appliedAt: new Date().toISOString(),
      notes,
    };

    const newChangelog = [changelogEntry, ...state.changelog];

    setState((prev) => ({
      ...prev,
      schemeVersion: 'v2',
      schemes: updatedSchemes,
      changelog: newChangelog,
    }));

    persist({
      schemeVersion: 'v2',
      changelog: newChangelog,
    });
  };

  // Revert to Schemes v1
  const revertSchemesV1 = () => {
    const originalSchemes = rawSchemesV1 as unknown as Scheme[];
    const changelogEntry = {
      version: 'v1 (reverted)',
      appliedAt: new Date().toISOString(),
      notes: ['Reverted back to original baseline v1 rules.'],
    };

    const newChangelog = [changelogEntry, ...state.changelog];

    setState((prev) => ({
      ...prev,
      schemeVersion: 'v1',
      schemes: originalSchemes,
      changelog: newChangelog,
    }));

    persist({
      schemeVersion: 'v1',
      changelog: newChangelog,
    });
  };

  // Add question for the office
  const addQuestionForOffice = (question: Omit<QuestionForOffice, 'id' | 'status'>) => {
    const newQ: QuestionForOffice = {
      ...question,
      id: `q-${Date.now()}`,
      status: 'Open',
    };
    const updated = [newQ, ...state.questionsForOffice];
    setState((prev) => ({ ...prev, questionsForOffice: updated }));
    persist({ questionsForOffice: updated });
  };

  // Update question status
  const updateQuestionStatus = (
    id: string,
    status: 'Open' | 'Answered',
    studentAnswer?: string
  ) => {
    const updated = state.questionsForOffice.map((q) =>
      q.id === id ? { ...q, status, studentAnswer: studentAnswer || q.studentAnswer } : q
    );
    setState((prev) => ({ ...prev, questionsForOffice: updated }));
    persist({ questionsForOffice: updated });
  };

  // Application Drafts
  const saveDraft = async (schemeId: string, draft: Partial<ApplicationDraft>) => {
    const existing =
      state.drafts[schemeId] || {
        submissionId: `sub-${schemeId}-${Date.now()}`,
        schemeId,
        step: 'evidence',
        formData: {},
        updatedAt: new Date().toISOString(),
      };

    const updated: ApplicationDraft = {
      ...existing,
      ...draft,
      updatedAt: new Date().toISOString(),
    };

    await saveItem(draftsStorage, schemeId, updated);
    setState((prev) => ({
      ...prev,
      drafts: {
        ...prev.drafts,
        [schemeId]: updated,
      },
    }));
  };

  // Submit Application Demo (Idempotent)
  const submitApplication = async (schemeId: string, payload: Record<string, unknown>) => {
    const draft = state.drafts[schemeId] || {
      submissionId: `sub-${schemeId}-${Date.now()}`,
      schemeId,
      step: 'evidence',
      formData: {},
      updatedAt: new Date().toISOString(),
    };

    const { record, isDuplicate } = await submitApplicationDemo(
      draft.submissionId,
      schemeId,
      payload,
      currentProfile.id,
      currentProfile.label,
      isOnline
    );

    // Update draft step
    await saveDraft(schemeId, { step: 'submitted' });

    const allSubs = await getAllSubmissions();
    setState((prev) => ({
      ...prev,
      submissions: allSubs,
    }));

    return { record, isDuplicate };
  };

  // Reset demo data to defaults
  const resetDemoData = async () => {
    await appStorage.clear();
    await draftsStorage.clear();
    await submissionsStorage.clear();

    setState({
      profiles: rawProfiles as unknown as Profile[],
      currentProfileId: 'P1',
      showTestProfiles: false,
      config: rawConfig as AppConfig,
      schemeVersion: 'v1',
      schemes: rawSchemesV1 as unknown as Scheme[],
      todayStr: rawConfig.demoToday,
      weights: (rawConfig as AppConfig).defaultWeights,
      previousWeights: null,
      language: 'en',
      simulatedOffline: false,
      isBrowserOnline: navigator.onLine,
      saveStatus: 'saved',
      auditLog: [],
      questionsForOffice: [
        {
          id: 'q-E2',
          schemeId: 'E',
          schemeName: 'Rural Learner Support',
          ruleId: 'E2',
          ruleText: 'Annual family income from all sources is below ₹3,00,000',
          interpretations: [
            { id: 'I1', label: "parents' declared income only" },
            { id: 'I2', label: "parents' income plus income of other earning household members" },
          ],
          questionText:
            'Does Rule E2 evaluate only parents’ income or the combined income of all household members?',
          status: 'Open',
        },
      ],
      submissions: [],
      drafts: {},
      changelog: [],
    });
  };

  return {
    state,
    isHydrated,
    isOnline,
    currentProfile,
    setCurrentProfileId,
    setLanguage,
    setTodayStr,
    setShowTestProfiles,
    setSimulatedOffline,
    setWeights,
    resetWeights,
    addDeclaration,
    resolveDeclarationConflict,
    setGapExplanation,
    updateProfileFields,
    applySchemesV2,
    revertSchemesV1,
    addQuestionForOffice,
    updateQuestionStatus,
    saveDraft,
    submitApplication,
    resetDemoData,
  };
}
