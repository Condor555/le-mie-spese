'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

export default function Registrati() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const router = useRouter();

  async function signup(e: React.FormEvent) {
    e.preventDefault();

    if (displayName.trim().length < 2) {
      setMessage('Inserisci un nome di almeno 2 caratteri.');
      return;
    }

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
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          display_name: displayName.trim(),
          invite_code: inviteCode.trim().toUpperCase() || null,
        },
      },
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    localStorage.setItem('onboarding_display_name', displayName.trim());
    if (inviteCode.trim()) {
      localStorage.setItem('onboarding_invite_code', inviteCode.trim().toUpperCase());
    } else {
      localStorage.removeItem('onboarding_invite_code');
    }

    if (data.session) {
      router.replace('/onboarding');
      router.refresh();
      return;
    }

    setMessage(
      'Account creato. Conferma l’email, poi accedi per completare il tuo spazio.'
    );
  }

  return (
    <div className="auth-screen">
      <div className="auth-logo">€</div>

      <h1>Crea account</h1>
      <p>Inizia a gestire le tue spese</p>

      <form className="surface auth-panel" onSubmit={signup}>
        <label>Nome visualizzato</label>

        <input
          type="text"
          autoComplete="name"
          required
          minLength={2}
          maxLength={60}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Es. Fabrizio"
        />

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

        <label>Codice invito <span className="optional-label">facoltativo</span></label>

        <input
          type="text"
          autoCapitalize="characters"
          maxLength={24}
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          placeholder="Per entrare nello spazio Famiglia"
        />

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
