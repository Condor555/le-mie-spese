'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function Registrati() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const router = useRouter();

  async function signup(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage('Le password non coincidono.');
      return;
    }

    if (password.length < 8) {
      setMessage(
        'La password deve contenere almeno 8 caratteri.'
      );
      return;
    }

    setBusy(true);
    setMessage('');

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.session) {
      router.replace('/');
      router.refresh();
      return;
    }

    setMessage(
      'Account creato. Ora puoi accedere.'
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">€</div>

      <h1>Crea account</h1>
      <p>Inizia a gestire le tue spese</p>

      <form className="surface auth-panel" onSubmit={signup}>
        <label>Email</label>

        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>

        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Nascondi' : 'Mostra'}
          </button>
        </div>

        <label>Ripeti password</label>

        <div className="password-field">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            minLength={8}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() =>
              setShowConfirmPassword(!showConfirmPassword)
            }
          >
            {showConfirmPassword ? 'Nascondi' : 'Mostra'}
          </button>
        </div>

        <button className="auth-submit" disabled={busy}>
          {busy ? 'Creazione...' : 'Crea account'}
        </button>

        {message && (
          <div className="notice">
            {message}
          </div>
        )}

        <p className="auth-switch">
          Hai già un account?{' '}
          <Link href="/login">
            Accedi
          </Link>
        </p>
      </form>
    </div>
  );
}
