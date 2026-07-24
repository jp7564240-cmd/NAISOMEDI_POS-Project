'use client';

import { useState } from 'react';
import { AUTH_FAILURE_MESSAGE } from '../lib/auth.shared';
import { verifyTotpCode } from '../lib/totp.client';
import { getConfiguredPassword } from '../lib/password.storage';
import { isTotpEnrolled, readTotpRecord } from '../lib/totp.storage';

const PROFILES = [
  { key: 'admin', label: 'ADMIN', email: 'admin@naisomedi.local', accent: '#a855f7' },
  { key: 'doctor', label: 'DOCTOR', email: 'doctor@naisomedi.local', accent: '#38bdf8' },
  { key: 'sales', label: 'SALES PHARMACIST', email: 'sales@naisomedi.local', accent: '#f59e0b' },
];

function createSession(user: string, profile: (typeof PROFILES)[number]): void {
  localStorage.setItem('nsm_session', JSON.stringify({ user, role: profile.label, email: profile.email, exp: Date.now() + 8 * 3600 * 1000 }));
}

export function LoginScreen() {
  const [profileKey, setProfileKey] = useState('');
  const [step, setStep] = useState<'profile' | 'password' | 'totp'>('profile');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const profile = PROFILES.find((item) => item.key === profileKey);

  const selectProfile = (key: string) => {
    setProfileKey(key);
    setPassword('');
    setCode('');
    setError('');
    setStep('password');
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!profile) return;
    setError('');
    setBusy(true);
    await new Promise((resolve) => window.setTimeout(resolve, 120));

    if (step === 'password') {
      if (password !== getConfiguredPassword(profile.key)) {
        setError('Invalid password.');
        setBusy(false);
        return;
      }
      createSession(profile.key, profile);
      if (!isTotpEnrolled()) {
        localStorage.setItem('nsm_auth_stage', 'enrollment');
        window.location.replace('/auth/enroll');
        return;
      }
      localStorage.setItem('nsm_auth_stage', 'verification');
      setStep('totp');
      setBusy(false);
      return;
    }

    const record = readTotpRecord();
    if (!record || !/^\d{6}$/.test(code) || !verifyTotpCode(record.secret, code)) {
      setError(AUTH_FAILURE_MESSAGE);
      setBusy(false);
      return;
    }
    localStorage.setItem('nsm_auth_stage', 'ready');
    window.location.replace('/home');
  };

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand"><span className="auth-mark">✦</span><span>NaiSoMedi <small>PHARMACY OS</small></span></div>
        <p className="auth-eyebrow">Offline security layer</p>
        <h1>{step === 'profile' ? 'Choose your profile' : step === 'password' ? 'Secure sign in' : 'Authenticator check'}</h1>
        <p className="auth-lead">{step === 'profile' ? 'Select the workspace you are authorized to use.' : step === 'password' ? 'Enter your password to continue.' : 'Open Google Authenticator or Microsoft Authenticator and enter its current six-digit code.'}</p>

        {step === 'profile' ? (
          <div className="profile-grid">{PROFILES.map((item) => <button className="profile-button" key={item.key} onClick={() => selectProfile(item.key)}><span className="profile-icon" style={{ background: item.accent }}>✦</span><span><strong>{item.label}</strong><small>{item.email}</small></span><b>→</b></button>)}</div>
        ) : (
          <form className="auth-form" onSubmit={submit}>
            <div className="selected-profile"><span className="profile-icon" style={{ background: profile?.accent }}>{profile?.label.slice(0, 1)}</span><span><strong>{profile?.label}</strong><small>{profile?.email}</small></span></div>
            {step === 'password' ? <label>Password<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="current-password" autoFocus required /></label> : <label>6-digit authenticator code<input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" autoFocus required /></label>}
            {error && <p className="auth-error">{error}</p>}
            <button className="auth-submit" disabled={busy}>{busy ? 'Checking…' : step === 'password' ? 'Continue to authenticator' : 'Verify & Continue'} <span>→</span></button>
            <button className="auth-back" type="button" onClick={() => { setStep('profile'); setError(''); }}>← Back to profiles</button>
          </form>
        )}
      </section>
      <style jsx>{`
        .auth-shell{min-height:100vh;display:grid;place-items:center;padding:28px;background:radial-gradient(circle at 80% 10%,#3b0764 0,transparent 42%),linear-gradient(135deg,#090014,#17021f);color:#fff;font-family:Inter,system-ui,sans-serif}
        .auth-card{width:min(560px,100%);padding:42px;border:1px solid rgba(255,255,255,.14);border-radius:28px;background:rgba(14,7,28,.9);box-shadow:0 24px 90px rgba(0,0,0,.38);animation:rise .35s ease-out}
        .auth-brand{display:flex;align-items:center;gap:12px;font-family:Georgia,serif;font-size:24px;margin-bottom:34px}.auth-brand small{display:block;font:10px Inter,sans-serif;letter-spacing:.16em;color:#a78bfa;margin-top:4px}.auth-mark,.profile-icon{display:grid;place-items:center;color:#fff;border-radius:14px}.auth-mark{width:48px;height:48px;background:linear-gradient(135deg,#7c3aed,#db2777)}
        .auth-eyebrow{margin:0;color:#f0c978;text-transform:uppercase;letter-spacing:.2em;font-size:11px}.auth-card h1{margin:10px 0 8px;font:600 clamp(32px,6vw,46px) Georgia,serif}.auth-lead{color:rgba(255,255,255,.65);line-height:1.6;margin:0 0 28px}
        .profile-grid,.auth-form{display:grid;gap:12px}.profile-button,.selected-profile{display:flex;align-items:center;gap:14px;padding:16px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:rgba(255,255,255,.05);color:#fff;text-align:left}.profile-button{cursor:pointer;transition:transform .16s ease,background .16s ease}.profile-button:hover{transform:translateY(-2px);background:rgba(255,255,255,.1)}.profile-button span:nth-child(2),.selected-profile span:nth-child(2){display:grid;gap:4px;flex:1}.profile-button small,.selected-profile small{color:rgba(255,255,255,.55);font-size:12px}.profile-button b{color:#c084fc}.profile-icon{width:44px;height:44px;flex:none}
        .auth-form label{display:grid;gap:8px;color:rgba(255,255,255,.7);font-size:13px}.auth-form input{border:1px solid rgba(255,255,255,.14);border-radius:14px;background:rgba(0,0,0,.28);padding:14px;color:#fff;font-size:18px;outline:none}.auth-form input:focus{border-color:#c084fc;box-shadow:0 0 0 3px rgba(192,132,252,.16)}.auth-error{margin:0;color:#fca5a5;font-size:13px}.auth-submit{border:0;border-radius:14px;padding:15px;background:linear-gradient(120deg,#7c3aed,#db2777);color:#fff;font-weight:700;font-size:15px;cursor:pointer}.auth-submit:disabled{opacity:.65}.auth-submit span{float:right}.auth-back{border:0;background:none;color:rgba(255,255,255,.55);cursor:pointer;padding:8px}@keyframes rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
      `}</style>
    </main>
  );
}
