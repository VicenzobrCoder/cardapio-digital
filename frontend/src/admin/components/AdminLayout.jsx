import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag, Settings, LogOut,
  Menu as MenuIcon, X, ExternalLink, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import theme from '../../theme.config';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { path: '/admin/cardapio', icon: UtensilsCrossed, label: 'Cardápio' },
  { path: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  const isActive = (path, exact) =>
    exact ? location.pathname === path : location.pathname.startsWith(path);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo / Nome */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🍽️</span>
          <div>
            <p className="font-bold text-white text-sm leading-tight">{theme.restaurantName}</p>
            <p className="text-gray-400 text-xs">Painel Admin</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => {
          const active = isActive(item.path, item.exact);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                active
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
              style={active ? { backgroundColor: 'var(--color-primary)' } : {}}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
              {active && <ChevronRight size={16} className="ml-auto" />}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-all text-sm"
        >
          <ExternalLink size={16} /> Ver Site
        </a>
        <div className="flex items-center justify-between px-4 py-2.5">
          <div>
            <p className="text-white text-sm font-medium">{admin?.name}</p>
            <p className="text-gray-400 text-xs">{admin?.email}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/10 transition-all">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile (drawer) */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-gray-900 lg:hidden"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-gray-700 hover:bg-gray-100">
            <MenuIcon size={22} />
          </button>
          <span className="font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            {theme.restaurantName}
          </span>
          <div className="w-10" />
        </header>

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
