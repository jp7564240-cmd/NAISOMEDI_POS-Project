'use client';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

export function BackupCodesModal({ onComplete }: { onComplete: () => void }) {
  const [codes, setCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<string[]>('generate_backup_codes_cmd')
      .then(res => { setCodes(res); setLoading(false); })
      .catch(console.error);
  }, []);

  return (
    <div className="modal">
      <h2>Backup Codes</h2>
      <p>Save these 10 codes in a secure place. Each code can only be used once.</p>
      {loading ? <p>Generating...</p> : (
        <ul style={{ listStyleType: 'none', padding: 0, fontFamily: 'monospace' }}>
          {codes.map(c => <li key={c}>{c}</li>)}
        </ul>
      )}
      <button onClick={onComplete}>I have saved them</button>
    </div>
  );
}
