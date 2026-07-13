import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Menu as MenuIcon, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import theme from '../theme.config';

export default function Navbar() {
  const { totalItems, toggleCart, openCart } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const prevTotal = useRef(totalItems);
  const location = useLocation();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  // Animar ícone do carrinho quando item é adicionado
  useEffect(() => {
    if (totalItems > prevTotal.current) {
      setCartBounce(true);
      setTimeout(() => setCartBounce(false), 500);
    }
    prevTotal.current = totalItems;
  }, [totalItems]);

  const isHome = location.pathname === '/';

  return (
    <motion.header
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`fixed top-0 left-0 right-0 z-30 transition-all duration-300 ${
        scrolled || !isHome
          ? 'bg-white shadow-md py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt={theme.restaurantName} className="h-9" />
          ) : (
            <span className="text-2xl">🍽️</span>
          )}
          <span
            className={`font-bold text-lg transition-colors ${
              scrolled || !isHome ? 'text-gray-900' : 'text-white'
            }`}
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {theme.restaurantName}
          </span>
        </Link>

        {/* Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            to="/"
            className={`font-medium transition-colors hover:text-primary ${
              scrolled || !isHome ? 'text-gray-700' : 'text-white/90'
            }`}
          >
            Início
          </Link>
          <Link
            to="/menu"
            className={`font-medium transition-colors hover:text-primary ${
              scrolled || !isHome ? 'text-gray-700' : 'text-white/90'
            }`}
          >
            Cardápio
          </Link>
          <a
            href={`https://wa.me/${theme.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`font-medium transition-colors hover:text-primary ${
              scrolled || !isHome ? 'text-gray-700' : 'text-white/90'
            }`}
          >
            Contato
          </a>
        </nav>

        {/* Carrinho + menu mobile */}
        <div className="flex items-center gap-3">
          {/* Botão do carrinho */}
          <motion.button
            onClick={toggleCart}
            className="relative p-2"
            animate={cartBounce ? { scale: [1, 1.35, 0.9, 1.1, 1] } : {}}
            transition={{ duration: 0.4 }}
            aria-label="Abrir carrinho"
          >
            <ShoppingCart
              size={26}
              className={`transition-colors ${
                scrolled || !isHome ? 'text-gray-800' : 'text-white'
              }`}
            />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {totalItems > 9 ? '9+' : totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Menu mobile */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className={`md:hidden p-2 transition-colors ${
              scrolled || !isHome ? 'text-gray-800' : 'text-white'
            }`}
          >
            {mobileOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Menu mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="flex flex-col px-4 py-4 gap-4">
              <Link to="/" onClick={() => setMobileOpen(false)} className="text-gray-700 font-medium py-2">Início</Link>
              <Link to="/menu" onClick={() => setMobileOpen(false)} className="text-gray-700 font-medium py-2">Cardápio</Link>
              <a
                href={`https://wa.me/${theme.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-700 font-medium py-2"
              >
                Contato via WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
