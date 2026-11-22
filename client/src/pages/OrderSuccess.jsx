import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, money } from '../api';

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    let tries = 0;
    const load = () =>
      api(`/orders/${orderId}`)
        .then(d => {
          setOrder(d.order);
          setItems(d.items);
        })
        .catch(e => setError(e.message));
    load();
    const timer = setInterval(() => {
      tries += 1;
      if (tries > 5) return clearInterval(timer);
      load();
    }, 2000);
    return () => clearInterval(timer);
  }, [orderId]);

  if (error) return <main className="container narrow"><p className="error">{error}</p></main>;
  if (!order) return <main className="container narrow center-page"><p>Loading…</p></main>;

  return (
    <main className="container narrow center-page">
      <div className="auth-card">
        <h2>🎉 Thank you for your order!</h2>
        <p className="muted">
          Order #{order.id} — status: <strong>{order.status === 'pending_payment' ? 'Confirming payment…' : order.status}</strong>
        </p>
        <ul className="order-summary">
          {items.map(i => (
            <li key={i.id}>{i.name} × {i.qty} — {money(i.price_cents * i.qty, order.currency)}</li>
          ))}
        </ul>
        <p><strong>Total: {money(order.total_cents, order.currency)}</strong></p>
        <p className="muted small">We have received your order and will pack it shortly. This order has been shared with the seller.</p>
        <Link to="/" className="btn primary wide">Continue shopping</Link>
      </div>
    </main>
  );
}
