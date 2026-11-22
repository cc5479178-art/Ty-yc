import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useApp } from '../context';

export default function Auth({ mode }) {
  const { login } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await api(`/auth/${isRegister ? 'register' : 'login'}`, {
        method: 'POST',
        body: isRegister
          ? { name: form.name, email: form.email, password: form.password, phone: form.phone }
          : { email: form.email, password: form.password }
      });
      login(data.token, data.user);
      navigate(params.get('next') === 'shop' && !isRegister ? '/' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container narrow">
      <div className="auth-card">
        <h2>{isRegister ? 'Create your account' : 'Welcome back'}</h2>
        {isRegister && <p className="muted">Register to order handmade ornaments.</p>}
        {!isRegister && <p className="muted">Log in to order handmade ornaments.</p>}
        {error && <p className="error">{error}</p>}
        <form onSubmit={submit}>
          {isRegister && (
            <input
              placeholder="Full name"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          )}
          <input
            placeholder="Email"
            type="email"
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
          {isRegister && (
            <input
              placeholder="WhatsApp / phone number"
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
            />
          )}
          <input
            placeholder="Password (min 6 characters)"
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />
          <button className="btn primary wide" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Register' : 'Log in'}
          </button>
        </form>
        <p className="muted center">
          {isRegister ? (
            <>Already registered? <Link to="/login">Log in</Link></>
          ) : (
            <>New here? <Link to="/register">Create an account</Link></>
          )}
        </p>
      </div>
    </main>
  );
}
