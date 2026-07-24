'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  createTotpEnrollment,
  verifyTotpCode,
} from '@/features/auth/lib/totp.client';
import {
  hasActiveSession,
  isTotpEnrolled,
  sessionUserKey,
  writeTotpRecord,
  TOTP_RECORD_VERSION,
} from '@/features/auth/lib/totp.storage';

export function TotpEnrollmentScreen() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [secret, setSecret] = useState('');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hasActiveSession()) {
      window.location.replace('/login');
      return;
    }
    if (isTotpEnrolled()) {
      window.location.replace('/home');
      return;
    }

    const accountName = sessionUserKey() ?? 'NaiSoMedi User';
    Promise.resolve(createTotpEnrollment(`${accountName}@naisomedi.local`))
      .then(({ secret: s, otpauthUrl: url }) => {
        setSecret(s);
        setOtpauthUrl(url);
      })
      .catch(() => setError('Unable to prepare authenticator enrollment.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!otpauthUrl || !canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, otpauthUrl, {
      width: 220,
      margin: 2,
      color: { dark: '#1a0033', light: '#ffffff' },
    }).catch(() => setError('Unable to render QR code.'));
  }, [otpauthUrl]);

  const completeEnrollment = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const accepted = verifyTotpCode(secret, code);
    if (!accepted) {
      setError('Invalid code. Open Google Authenticator or Microsoft Authenticator and try again.');
      setSubmitting(false);
      return;
    }
    writeTotpRecord({
      version: TOTP_RECORD_VERSION,
      secret,
      otpauthUrl,
      accountName: sessionUserKey() ?? 'NaiSoMedi User',
      enrolledAt: new Date().toISOString(),
    });
    localStorage.setItem('nsm_auth_stage', 'ready');
    window.location.replace('/home');
  };

  return (
    <main className="enroll-shell">
      <div className="enroll-card">
        <p className="enroll-eyebrow">Offline Security Layer</p>
        <h1>Register Authenticator</h1>
        <p className="enroll-lead">
          Scan this QR code with Google Authenticator or Microsoft Authenticator. Works fully offline.
        </p>

        {loading ? (
          <p className="enroll-muted">Preparing secure enrollment…</p>
        ) : (
          <>
            <div className="enroll-qr-wrap">
              <canvas ref={canvasRef} aria-label="Authenticator QR code" />
            </div>
            <div className="enroll-secret">
              <span>Manual entry secret</span>
              <code>{secret}</code>
            </div>
            <form onSubmit={completeEnrollment} className="enroll-form">
              <label>
                6-digit verification code
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  required
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </label>
              {error && <p className="enroll-error">{error}</p>}
              <button type="submit" disabled={submitting}>
                {submitting ? 'Verifying…' : 'Activate & Continue to Home'}
              </button>
            </form>
          </>
        )}
      </div>

      <style jsx>{`
        .enroll-shell {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background:
            radial-gradient(900px 700px at 85% -10%, rgba(249, 115, 22, 0.35), transparent 60%),
            radial-gradient(800px 600px at -10% 20%, rgba(107, 33, 168, 0.45), transparent 55%),
            #020012;
          font-family: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
        }
        .enroll-card {
          width: min(560px, 100%);
          border-radius: 2rem;
          padding: 2.5rem 2rem;
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: linear-gradient(180deg, rgba(15, 8, 30, 0.92), rgba(8, 4, 18, 0.88));
          box-shadow: 0 0 80px rgba(124, 58, 237, 0.25);
          color: #fff;
        }
        .enroll-eyebrow {
          margin: 0;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-size: 0.72rem;
          color: #e4c577;
          font-family: 'Inter', system-ui, sans-serif;
        }
        h1 {
          margin: 0.6rem 0 0;
          font-size: clamp(2rem, 4vw, 2.6rem);
          font-weight: 600;
          letter-spacing: 0.02em;
        }
        .enroll-lead,
        .enroll-muted {
          margin-top: 0.75rem;
          color: rgba(255, 255, 255, 0.72);
          line-height: 1.6;
          font-size: 1.05rem;
        }
        .enroll-qr-wrap {
          margin: 1.75rem auto 1rem;
          width: fit-content;
          padding: 1rem;
          border-radius: 1.25rem;
          background: #fff;
          border: 1px solid rgba(212, 175, 55, 0.45);
        }
        .enroll-secret {
          display: grid;
          gap: 0.45rem;
          margin-bottom: 1.25rem;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .enroll-secret span {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .enroll-secret code {
          word-break: break-all;
          padding: 0.85rem 1rem;
          border-radius: 0.85rem;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 0.95rem;
          letter-spacing: 0.08em;
        }
        .enroll-form {
          display: grid;
          gap: 0.85rem;
          font-family: 'Inter', system-ui, sans-serif;
        }
        .enroll-form label {
          display: grid;
          gap: 0.45rem;
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.65);
        }
        .enroll-form input {
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 0.85rem;
          background: rgba(0, 0, 0, 0.35);
          color: #fff;
          padding: 0.85rem 1rem;
          font-size: 1.25rem;
          letter-spacing: 0.35em;
          text-align: center;
        }
        .enroll-form button {
          margin-top: 0.35rem;
          border: 0;
          border-radius: 0.85rem;
          padding: 0.9rem 1rem;
          font-weight: 600;
          color: #25181b;
          background: linear-gradient(135deg, #e4c577, #a87627);
        }
        .enroll-form button:disabled {
          opacity: 0.65;
        }
        .enroll-error {
          margin: 0;
          color: #fca5a5;
          font-size: 0.85rem;
        }
      `}</style>
    </main>
  );
}
