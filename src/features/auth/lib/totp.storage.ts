export const TOTP_STORAGE_KEY = 'nsm_totp';
export const TOTP_ENROLLED_KEY = 'nsm_totp_enrolled';
export const SESSION_KEY = 'nsm_session';
export const TOTP_RECORD_VERSION = 2;

export interface TotpRecord {
  version: number;
  secret: string;
  otpauthUrl: string;
  accountName: string;
  enrolledAt: string;
}

export function readTotpRecord(): TotpRecord | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(TOTP_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TotpRecord;
  } catch {
    return null;
  }
}

export function writeTotpRecord(record: TotpRecord): void {
  localStorage.setItem(TOTP_STORAGE_KEY, JSON.stringify(record));
  localStorage.setItem(TOTP_ENROLLED_KEY, 'true');
}

export function isTotpEnrolled(): boolean {
  if (typeof window === 'undefined') return false;
  const record = readTotpRecord();
  return localStorage.getItem(TOTP_ENROLLED_KEY) === 'true' && record?.version === TOTP_RECORD_VERSION;
}

export function hasActiveSession(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem(SESSION_KEY);
}

export function sessionUserKey(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { user?: string };
    return parsed.user ?? null;
  } catch {
    return null;
  }
}
