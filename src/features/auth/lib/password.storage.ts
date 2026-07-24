const DEFAULT_PASSWORDS: Record<string, string> = {
  admin: 'admin123',
  doctor: 'doctor123',
  sales: 'sales123',
};

function passwordKey(userKey: string): string {
  return `nsm_password_${userKey}`;
}

export function getConfiguredPassword(userKey: string): string {
  if (typeof window === 'undefined') return DEFAULT_PASSWORDS[userKey] ?? '';
  return localStorage.getItem(passwordKey(userKey)) ?? DEFAULT_PASSWORDS[userKey] ?? '';
}

export function setConfiguredPassword(userKey: string, password: string): void {
  localStorage.setItem(passwordKey(userKey), password);
}
