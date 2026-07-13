import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Contexts
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';

// Componentes globais
import Navbar from './components/Navbar';
import Cart from './components/Cart';

// Páginas públicas
import Home from './pages/Home';
import MenuPage from './pages/Menu';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';

// Admin
import AdminLayout from './admin/components/AdminLayout';
import AdminLogin from './admin/pages/Login';
import Dashboard from './admin/pages/Dashboard';
import AdminOrders from './admin/pages/Orders';
import MenuAdmin from './admin/pages/MenuAdmin';
import AdminSettings from './admin/pages/Settings';

// Guard de autenticação do admin
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return children;
}

// Layout público (com Navbar e Cart)
function PublicLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
      <Cart />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: { borderRadius: '12px', fontSize: '14px' },
            }}
          />
          <Routes>
            {/* Site público */}
            <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
            <Route path="/menu" element={<PublicLayout><MenuPage /></PublicLayout>} />
            <Route path="/checkout" element={<PublicLayout><Checkout /></PublicLayout>} />
            <Route path="/pedido/:orderNumber" element={<PublicLayout><OrderTracking /></PublicLayout>} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={
              <RequireAuth>
                <AdminLayout><Dashboard /></AdminLayout>
              </RequireAuth>
            } />
            <Route path="/admin/pedidos" element={
              <RequireAuth>
                <AdminLayout><AdminOrders /></AdminLayout>
              </RequireAuth>
            } />
            <Route path="/admin/cardapio" element={
              <RequireAuth>
                <AdminLayout><MenuAdmin /></AdminLayout>
              </RequireAuth>
            } />
            <Route path="/admin/configuracoes" element={
              <RequireAuth>
                <AdminLayout><AdminSettings /></AdminLayout>
              </RequireAuth>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
