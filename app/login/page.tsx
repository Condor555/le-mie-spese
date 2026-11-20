'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
import {useI18n} from '../../components/LanguageProvider';
import QoomiaLogo from '../../components/QoomiaLogo';

export default function Login() {
  const {t}=useI18n();
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
          ? t('auth.invalidCredentials')
          : error.message
      );
      return;
    }

    router.replace('/onboarding');
    router.refresh();
  }

  return (
    <div className="auth-screen">
      <QoomiaLogo size={64} className="auth-logo" priority/>

      <h1>Qoomia</h1>
      <p>{t('auth.loginSubtitle')}</p>

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

        <label>{t('auth.password')}</label>

        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.passwordPlaceholder')}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword?t('profile.hide'):t('profile.show')}
          </button>
        </div>

        <button className="auth-submit" disabled={busy}>
          {busy?t('auth.signingIn'):t('auth.signIn')}
        </button>

        {message && (
          <div className="auth-error">
            {message}
          </div>
        )}

        <p className="auth-switch">
          {t('auth.noAccount')}{' '}
          <Link href="/registrati">
            {t('auth.signUp')}
          </Link>
        </p>
      </form>
    </div>
  );
}
