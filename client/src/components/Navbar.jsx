import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context';

export default function Navbar() {
  const { user, logout, cartCount } = useApp();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <Link to="/" className="logo">🪔 CraftNest</Link>
      <nav>
        <NavLink to="/">Shop</NavLink>
        {user?.role === 'admin' && <NavLink to="/admin">Dashboard</NavLink>}
        <NavLink to="/cart">Cart {cartCount > 0 && <span className="badge">{cartCount}</span>}</NavLink>
        {user ? (
          <>
            <NavLink to="/orders">My orders</NavLink>
            <button className="btn ghost" onClick={() => { logout(); navigate('/'); }}>Log out</button>
          </>
        ) : (
          <>
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register" className="cta">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
