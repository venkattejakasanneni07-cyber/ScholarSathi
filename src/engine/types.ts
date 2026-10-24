export type Tri = 'MET' | 'UNMET' | 'UNKNOWN';

export interface Declaration<T> {
  value: T;
  source: string;
  enteredAt: string;
}

export interface Semester {
  name: string;
  status: 'completed' | 'gap';
}

export interface GapExplanation {
  text: string;
  documentName: string;
}

export interface IncomeCertificate {
  issuedOn: string;
  expiresOn: string;
  reissue: {
    requested: boolean;
    etaDate: string | null;
  };
}

export interface ExistingScholarship {
  name: string;
  renewalDue: string;
  renewalHours: number;
}

export interface Profile {
  id: string;
  label: string;
  synthetic: true;
  district: string;
  category: Declaration<string>[];
  marksPct: Declaration<number>[];
  attendancePct: Declaration<number>[];
  parentIncome: Declaration<number>[];
  otherHouseholdIncome: number;
  semesters: Semester[];
  gapExplanation: GapExplanation | null;
  incomeCertificate: IncomeCertificate;
  existingScholarship: ExistingScholarship | null;
  freeHoursThisWeek: number;
  connectivity: 'good' | 'unreliable';
}

export interface Interpretation {
  id: string;
  label: string;
  field: string;
}

export interface ProxyUse {
  attribute: 'district';
  documentedReason: string;
}

export interface Rule {
  id: string;
  text: string;
  field: 'marksPct' | 'attendancePct' | 'parentIncome' | 'householdIncome' | 'district' | 'gapDocumented';
  op: '>=' | '<=' | '<' | 'in' | 'documented';
  value: number | string[] | null;
  evidence: string[];
  interpretations?: Interpretation[];
  usesProxy?: ProxyUse;
}

export interface Scheme {
  id: string;
  name: string;
  synthetic: true;
  opensOn: string;
  deadline: string;
  award: number;
  effortHours: number;
  rules: Rule[];
  excludesWith: string[];
  officiallyConfirmed: boolean;
  version: string;
  changeNote?: string;
  effectiveOn?: string;
}

export interface RuleEvaluationResult {
  ruleId: string;
  status: Tri;
  ruleText: string;
  evidence: string[];
  valuesUsed: (string | number)[];
  ambiguous?: boolean;
  interpretationsResult?: {
    id: string;
    label: string;
    status: Tri;
    valueUsed: string | number;
  }[];
}

export interface SchemeEvaluationResult {
  schemeId: string;
  scheme: Scheme;
  status: Tri;
  timingStatus: 'not_open_yet' | 'open' | 'closed';
  ruleResults: RuleEvaluationResult[];
  ambiguous: boolean;
  officiallyConfirmed: boolean;
}

export interface SensitivityReport {
  schemeId: string;
  overallStatus: Tri;
  blockingRules: string[];
  flippingRules: {
    ruleId: string;
    ruleText: string;
    message: string;
  }[];
  conflictAdvice?: string;
}

export interface CompletionMetrics {
  schemeId: string;
  workDays: number;
  evidenceWaitDays: number;
  bufferDays: number;
  latestSafeStart: string; // YYYY-MM-DD
  slackDays: number;
  pEvidence: number;
  pTime: number;
  pConnectivity: number;
  pFinish: number;
  statusTag: 'comfortable' | 'tight' | 'too_late';
  evidenceMissing: boolean;
}

export interface SchemeScore {
  schemeId: string;
  scheme: Scheme;
  pElig: number;
  pFinish: number;
  base: number;
  awardNorm: number;
  slackNorm: number;
  effortNorm: number;
  utility: number; // U
  latestSafeStart: string;
  slackDays: number;
  status: Tri;
  timingStatus: 'not_open_yet' | 'open' | 'closed';
}

export interface PortfolioSet {
  schemeIds: string[];
  schemes: Scheme[];
  totalAward: number;
  totalEffortHours: number;
  totalUtility: number;
  isBaseline?: boolean;
  whyChosen?: string[];
  whyNotChosen?: string;
}

export interface WeightsConfig {
  award: number;
  chance: number;
  slack: number;
  effort: number;
}

export interface Contradiction {
  id: string;
  field: string;
  severity: 'Must-fix' | 'Warning' | 'Info';
  message: string;
  involved: (string | number)[];
  howToResolve: string;
  resolved?: boolean;
}

export interface QuestionForOffice {
  id: string;
  schemeId: string;
  schemeName: string;
  ruleId: string;
  ruleText: string;
  interpretations: { id: string; label: string }[];
  questionText: string;
  status: 'Open' | 'Answered';
  studentAnswer?: string;
}

export interface GoldLabel {
  profileId: string;
  schemeId: string;
  label: Tri;
  reason: string;
}

export interface AppConfig {
  demoToday: string;
  defaultReissueDays: number;
  bufferDaysGood: number;
  bufferDaysUnreliable: number;
  pEvidenceValid: number;
  pEvidenceReissueBeforeSafe: number;
  pEvidenceReissueAfterSafe: number;
  pEvidenceMissing: number;
  pTimeHighSlack: number;
  pTimeLowSlack: number;
  pTimeNegativeSlack: number;
  pConnectivityGood: number;
  pConnectivityUnreliable: number;
  unknownPElig: number;
  defaultWeights: WeightsConfig;
}
