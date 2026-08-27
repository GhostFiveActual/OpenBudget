const KEY = 'openbudget:v5';
const BACKUP_FORMAT = 'OpenBudgetBackup';
const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const V4_KEY = 'openbudget:v4';
const V3_KEY = 'openbudget:v3';
const V2_KEY = 'openbudget:v2';
const LEGACY_KEY = 'openbudget:v1';

export const defaultState = {
  schemaVersion: 5,
  meta: { createdAt: '', lastBackupAt: '', lastOpenedAt: '' },
  profile: {
    name: '', currency: 'USD', nextPayDate: '', payFrequency: 'biweekly',
    startingBalance: 0, emergencyFundTarget: 10000, monthStartsOn: 1
  },
  taxProfile: {
    taxYear: 2026, filingStatus: 'single', state: '', county: '',
    grossPay: 0, preTaxFederalDeductions: 0, preTaxFicaDeductions: 0, postTaxDeductions: 0,
    w4Step2Checked: false, w4OtherIncome: 0, w4Deductions: 0, w4Credits: 0, w4AdditionalWithholding: 0,
    socialSecurityWagesYTD: 0, medicareWagesYTD: 0, paystubActualTakeHome: 0,
    stateAnnualDeduction: 0, stateEffectiveRate: 0, localEffectiveRate: 0
  },
  accounts: [],
  income: [],
  bills: [],
  billPayments: [],
  budgets: [],
  transactions: [],
  debts: [],
  goals: [],
  investments: [],
  notes: [],
  purchasePlans: [],
  decisionScenarios: [],
  settings: {
    includeInvestmentsInPlan: true,
    includeGoalsInPlan: true,
    rolloverUnused: true,
    debtStrategy: 'avalanche',
    extraDebtPayment: 0,
    backupReminderDays: 30,
    onboardingComplete: false
  }
};

const clone = v => JSON.parse(JSON.stringify(v));
const stamp = () => new Date().toISOString();

function normalize(parsed = {}) {
  const base = clone(defaultState);
  const next = {
    ...base,
    ...parsed,
    schemaVersion: 5,
    meta: { ...base.meta, ...(parsed.meta || {}) },
    profile: { ...base.profile, ...(parsed.profile || {}) },
    taxProfile: { ...base.taxProfile, ...(parsed.taxProfile || {}) },
    settings: { ...base.settings, ...(parsed.settings || {}) }
  };
  for (const key of ['accounts','income','bills','billPayments','budgets','transactions','debts','goals','investments','notes','purchasePlans','decisionScenarios']) {
    if (!Array.isArray(next[key])) next[key] = [];
  }
  // Migrate legacy tax-profile field names into the 2026 W-4 model.
  if (parsed.taxProfile) {
    const old = parsed.taxProfile;
    if (next.taxProfile.preTaxFederalDeductions === 0 && old.preTaxDeductions) next.taxProfile.preTaxFederalDeductions = Number(old.preTaxDeductions);
    if (next.taxProfile.w4OtherIncome === 0 && old.annualOtherIncome) next.taxProfile.w4OtherIncome = Number(old.annualOtherIncome);
    if (next.taxProfile.w4Credits === 0 && old.annualCredits) next.taxProfile.w4Credits = Number(old.annualCredits);
    if (next.taxProfile.w4AdditionalWithholding === 0 && old.additionalWithholding) next.taxProfile.w4AdditionalWithholding = Number(old.additionalWithholding);
  }
  if (!next.meta.createdAt) next.meta.createdAt = stamp();
  next.meta.lastOpenedAt = stamp();
  return next;
}

function migrateLegacy() {
  try {
    const raw = localStorage.getItem(V4_KEY) || localStorage.getItem(V3_KEY) || localStorage.getItem(V2_KEY) || localStorage.getItem(LEGACY_KEY);
    if (!raw) return null;
    const old = JSON.parse(raw);
    const migrated = normalize(old);
    migrated.settings.onboardingComplete = Boolean(old.profile?.nextPayDate && old.income?.length);
    localStorage.setItem(KEY, JSON.stringify(migrated));
    return migrated;
  } catch { return null; }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return migrateLegacy() || normalize();
    return normalize(JSON.parse(raw));
  } catch { return normalize(); }
}

export function saveState(state) {
  const normalized = normalize(state);
  localStorage.setItem(KEY, JSON.stringify(normalized));
  return normalized;
}

export function resetState() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(V4_KEY);
  localStorage.removeItem(V3_KEY);
  localStorage.removeItem(V2_KEY);
  localStorage.removeItem(LEGACY_KEY);
}

export function exportBackup(state) {
  const copy = normalize(state);
  copy.meta.lastBackupAt = stamp();
  const payload = { format: BACKUP_FORMAT, backupVersion: 1, exportedAt: copy.meta.lastBackupAt, data: copy };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `OpenBudget-backup-${stamp().slice(0,10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
  return copy.meta.lastBackupAt;
}

function validateBackupData(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('That file is not a valid OpenBudget backup.');
  const candidate = parsed.format === BACKUP_FORMAT ? parsed.data : parsed; // legacy direct-state backups remain supported.
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) throw new Error('This backup does not contain OpenBudget data.');
  if (!Array.isArray(candidate.transactions)) throw new Error('This backup is missing required OpenBudget data.');
  const collections=['accounts','income','bills','transactions','debts','goals','investments'];
  for (const key of collections) if (candidate[key] != null && !Array.isArray(candidate[key])) throw new Error(`Invalid backup section: ${key}.`);
  return candidate;
}

export async function importBackup(file) {
  if (!file) throw new Error('Choose an OpenBudget backup file first.');
  if (Number(file.size||0) > MAX_BACKUP_BYTES) throw new Error('That backup is larger than 10 MB. OpenBudget refused to load it for safety.');
  let parsed;
  try { parsed = JSON.parse(await file.text()); }
  catch { throw new Error('That file is not valid JSON.'); }
  const next = normalize(validateBackupData(parsed));
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
