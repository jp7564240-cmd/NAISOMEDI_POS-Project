import { TOTP, Secret } from 'otpauth';
import {
  TOTP_ALGORITHM,
  TOTP_DIGITS,
  TOTP_PERIOD_SECONDS,
} from './auth.shared';

const ISSUER = 'NaiSoMedi Pharmacy';

function toBase32Secret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

export function createTotpEnrollment(accountName: string): { secret: string; otpauthUrl: string } {
  const secret = toBase32Secret();
  const totp = new TOTP({
    issuer: ISSUER,
    label: accountName,
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    secret: Secret.fromBase32(secret),
  });
  return { secret, otpauthUrl: totp.toString() };
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const normalized = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(normalized)) return false;
  const totp = new TOTP({
    issuer: ISSUER,
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD_SECONDS,
    secret: Secret.fromBase32(secret),
  });
  const delta = totp.validate({ token: normalized, window: 1 });
  return delta !== null;
}

export async function createTotpEnrollmentWithTauri(
  accountName: string,
): Promise<{ secret: string; otpauthUrl: string }> {
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const [secret, otpauthUrl] = await invoke<[string, string]>('enroll_totp', { accountName });
    return { secret, otpauthUrl };
  } catch {
    return createTotpEnrollment(accountName);
  }
}

export async function verifyTotpCodeWithTauri(secret: string, code: string): Promise<boolean> {
  if (verifyTotpCode(secret, code)) return true;
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke<{ accepted: boolean }>('verify_totp', { userId: '1', code });
    return result.accepted;
  } catch {
    return false;
  }
}
