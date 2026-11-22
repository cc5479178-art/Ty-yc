import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import { useApp } from '../context';

export default function Home() {
  const { user, cartCount, addToCart } = useApp();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('All');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/products').then(d => setProducts(d.products)).catch(e => setError(e.message));
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(products.map(p => p.category))],
    [products]
  );
  const visible = category === 'All' ? products : products.filter(p => p.category === category);

  const handleAdd = (p) => {
    if (!user) {
      navigate('/login?next=shop');
      return;
    }
    if (cartCount >= 20) return;
    addToCart(p);
  };

  return (
    <main className="container">
      <section className="hero">
        <h1>Handmade ornaments, made with love</h1>
        <p>Every piece is handcrafted by artisans. Order online — we pack and ship it to your door.</p>
      </section>

      {error && <p className="error">{error}</p>}

      <div className="filters">
        {categories.map(c => (
          <button key={c} className={`chip ${c === category ? 'active' : ''}`} onClick={() => setCategory(c)}>
            {c}
          </button>
        ))}
      </div>

      <div className="grid">
        {visible.map(p => (
          <div className="card" key={p.id}>
            <img src={p.image_url || 'https://placehold.co/600x400?text=Craft'} alt={p.name} loading="lazy" />
            <div className="card-body">
              <span className="cat">{p.category}</span>
              <h3>{p.name}</h3>
              <p className="desc">{p.description}</p>
              <div className="card-foot">
                <strong>{money(p.price_cents)}</strong>
                <button className="btn primary" disabled={p.stock <= 0} onClick={() => handleAdd(p)}>
                  {p.stock > 0 ? 'Add to cart' : 'Sold out'}
                </button>
              </div>
            </div>
          </div>
        ))}
        {visible.length === 0 && !error && <p>No products yet.</p>}
      </div>
    </main>
  );
}
