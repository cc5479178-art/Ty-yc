import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, money, STATUS_LABELS } from '../api';
import { useApp } from '../context';

export default function MyOrders() {
  const { user, ready } = useApp();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ready && !user) {
      navigate('/login');
      return;
    }
    if (!user) return;
    api('/orders/mine').then(d => setOrders(d.orders)).catch(e => setError(e.message));
  }, [user, ready]);

  if (error) return <main className="container narrow"><p className="error">{error}</p></main>;

  return (
    <main className="container">
      <h2>My orders</h2>
      {orders.length === 0 && <p className="muted">No orders yet. <Link to="/">Start shopping</Link>.</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Order</th><th>Date</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>{new Date(o.created_at + 'Z').toLocaleString()}</td>
                <td>{money(o.total_cents, o.currency)}</td>
                <td><span className={`status ${o.status}`}>{STATUS_LABELS[o.status] || o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
