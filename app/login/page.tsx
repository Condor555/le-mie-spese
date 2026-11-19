'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const router = useRouter();

  async function login(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);
    setMessage('');

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);

    if (error) {
      setMessage(
        error.message === 'Invalid login credentials'
          ? 'Email o password non corretti.'
          : error.message
      );
      return;
    }

    router.replace('/onboarding');
    router.refresh();
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">€</div>

      <h1>Le Mie Spese</h1>
      <p>Accedi al tuo spazio finanziario</p>

      <form className="surface auth-panel" onSubmit={login}>
        <label>Email</label>

        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@email.it"
        />

        <label>Password</label>

        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="La tua password"
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Nascondi' : 'Mostra'}
          </button>
        </div>

        <button className="auth-submit" disabled={busy}>
          {busy ? 'Accesso...' : 'Accedi'}
        </button>

        {message && (
          <div className="auth-error">
            {message}
          </div>
        )}

        <p className="auth-switch">
          Non hai un account?{' '}
          <Link href="/registrati">
            Registrati
          </Link>
        </p>
      </form>
    </div>
  );
}
