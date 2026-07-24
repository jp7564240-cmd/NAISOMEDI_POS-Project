'use client';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function TotpEnrollmentModal({ onComplete }: { onComplete: () => void }) {
  const [secret, setSecret] = useState('');
  const [url, setUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    invoke<[string, string]>('enroll_totp', { accountName: 'Atelier Pharmacie Admin' })
      .then(([s, u]) => { setSecret(s); setUrl(u); })
      .catch(e => setError(String(e)));
  }, []);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await invoke<{accepted: boolean, message: string | null}>('verify_totp', { userId: "1", code });
      if (res.accepted) {
        onComplete();
      } else {
        setError(res.message || 'Invalid code');
      }
    } catch (e) {
      setError(String(e));
    }
  };

  return (
    <div className="modal">
      <h2>Set up Authenticator</h2>
      <p>Scan the QR code or enter the secret manually: <strong>{secret}</strong></p>
      {/* In a real app we'd render the URL as a QR code here */}
      <form onSubmit={verify}>
        <input 
          value={code} 
          onChange={e => setCode(e.target.value)} 
          placeholder="6-digit code" 
          maxLength={6} 
          pattern="[0-9]{6}" 
          required 
        />
        {error && <div className="error">{error}</div>}
        <button type="submit">Verify & Activate</button>
      </form>
    </div>
  );
}
