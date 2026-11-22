import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, loadCart, saveCart } from './api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(loadCart());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (getToken()) {
      api('/auth/me')
        .then(d => setUser(d.user))
        .catch(() => setToken(''))
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  const addToCart = (product) => {
    const next = [...cart];
    const found = next.find(i => i.product_id === product.id);
    if (found) found.qty += 1;
    else next.push({ product_id: product.id, name: product.name, price_cents: product.price_cents, image_url: product.image_url, qty: 1 });
    setCart(next);
    saveCart(next);
  };

  const updateQty = (productId, qty) => {
    let next = cart.map(i => (i.product_id === productId ? { ...i, qty: Math.max(1, qty) } : i));
    if (qty <= 0) next = next.filter(i => i.product_id !== productId);
    setCart(next);
    saveCart(next);
  };

  const clearCart = () => {
    setCart([]);
    saveCart([]);
  };

  const login = (token, u) => {
    setToken(token);
    setUser(u);
  };

  const logout = () => {
    setToken('');
    setUser(null);
  };

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const cartTotal = cart.reduce((sum, i) => sum + i.qty * i.price_cents, 0);

  return (
    <AppContext.Provider value={{ user, ready, cart, cartCount, cartTotal, addToCart, updateQty, clearCart, login, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
