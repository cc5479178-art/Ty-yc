import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import { useApp } from '../context';

export default function Cart() {
  const { user, cart, cartTotal, updateQty, clearCart } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', address: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user) {
    return (
      <main className="container narrow">
        <div className="auth-card">
          <h2>Please log in to order</h2>
          <p className="muted">Only registered users can place orders.</p>
          <button className="btn primary wide" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn ghost wide" onClick={() => navigate('/register')}>Register</button>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="container narrow center-page">
        <h2>Your cart is empty</h2>
        <button className="btn primary" onClick={() => navigate('/')}>Browse ornaments</button>
      </main>
    );
  }

  const checkout = async () => {
    setBusy(true);
    setError('');
    try {
      const data = await api('/orders', {
        method: 'POST',
        body: {
          items: cart.map(i => ({ product_id: i.product_id, qty: i.qty })),
          customer_name: form.customer_name || user.name,
          customer_phone: form.customer_phone,
          address: form.address
        }
      });
      clearCart();
      if (data.checkout_url) window.location.href = data.checkout_url;
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="container">
      <h2>Your cart</h2>
      <div className="cart-layout">
        <div>
          {cart.map(i => (
            <div className="cart-row" key={i.product_id}>
              <img src={i.image_url || 'https://placehold.co/100x100?text='} alt="" />
              <div className="grow">
                <strong>{i.name}</strong>
                <div className="muted">{money(i.price_cents)} each</div>
              </div>
              <div className="qty">
                <button onClick={() => updateQty(i.product_id, i.qty - 1)}>−</button>
                <span>{i.qty}</span>
                <button onClick={() => updateQty(i.product_id, i.qty + 1)}>+</button>
              </div>
              <strong>{money(i.price_cents * i.qty)}</strong>
              <button className="btn ghost" onClick={() => updateQty(i.product_id, 0)}>✕</button>
            </div>
          ))}
        </div>
        <div className="checkout-card">
          <h3>Delivery details</h3>
          {error && <p className="error">{error}</p>}
          <input
            placeholder="Full name"
            defaultValue={user.name}
            onChange={e => setForm({ ...form, customer_name: e.target.value })}
          />
          <input
            placeholder="Phone / WhatsApp number"
            value={form.customer_phone}
            onChange={e => setForm({ ...form, customer_phone: e.target.value })}
          />
          <textarea
            placeholder="Full delivery address"
            rows={3}
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
          />
          <div className="cart-foot">
            <span>Total</span>
            <strong>{money(cartTotal)}</strong>
          </div>
          <button className="btn primary wide" disabled={busy || !form.customer_phone || !form.address} onClick={checkout}>
            {busy ? 'Starting payment…' : 'Pay & place order'}
          </button>
          <p className="muted small">Secure payment via Stripe. The seller is notified instantly with your order.</p>
        </div>
      </div>
    </main>
  );
}
