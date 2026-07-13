import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/format';

export default function Cart() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice, totalItems, getItemKey } = useCart();
  const navigate = useNavigate();

  function handleCheckout() {
    closeCart();
    navigate('/checkout');
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 z-40 bg-black/50"
          />

          {/* Painel lateral */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 280 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col"
          >
            {/* Header do carrinho */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <ShoppingBag size={22} className="text-primary" />
                <h2 className="font-bold text-gray-900 text-lg">Meu Pedido</h2>
                {totalItems > 0 && (
                  <span className="badge badge-primary">{totalItems}</span>
                )}
              </div>
              <motion.button
                onClick={closeCart}
                whileTap={{ scale: 0.9 }}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </motion.button>
            </div>

            {/* Lista de itens */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4 text-center px-8"
                >
                  <span className="text-7xl">🛒</span>
                  <p className="text-gray-500 text-lg">Seu carrinho está vazio</p>
                  <p className="text-gray-400 text-sm">Adicione itens do cardápio para começar</p>
                  <button onClick={closeCart} className="btn-primary mt-2">
                    Ver Cardápio
                  </button>
                </motion.div>
              ) : (
                <div className="p-4 space-y-3">
                  <AnimatePresence>
                    {items.map((item) => {
                      const key = getItemKey(item);
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                          animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.25 }}
                          className="bg-gray-50 rounded-2xl p-3 overflow-hidden"
                        >
                          <div className="flex gap-3">
                            {/* Imagem */}
                            {item.image_url && (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
                                {item.product_name}
                              </p>
                              {item.selected_options?.length > 0 && (
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {item.selected_options.map(o => o.name).join(', ')}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-gray-400 italic mt-0.5 truncate">
                                  "{item.notes}"
                                </p>
                              )}
                              <p className="text-primary font-bold text-sm mt-1">
                                {formatCurrency(item.unit_price * item.quantity)}
                              </p>
                            </div>
                          </div>

                          {/* Controles de quantidade */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => updateQuantity(key, item.quantity - 1)}
                                className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center border border-gray-200"
                              >
                                {item.quantity === 1 ? <Trash2 size={13} className="text-red-400" /> : <Minus size={13} />}
                              </motion.button>
                              <span className="w-5 text-center font-bold text-gray-800 text-sm">{item.quantity}</span>
                              <motion.button
                                whileTap={{ scale: 0.85 }}
                                onClick={() => updateQuantity(key, item.quantity + 1)}
                                className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center border border-gray-200"
                              >
                                <Plus size={13} />
                              </motion.button>
                            </div>
                            <button
                              onClick={() => removeItem(key)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Rodapé com total e botão */}
            {items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-gray-100 p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
                  <span className="font-bold text-gray-900 text-lg">{formatCurrency(totalPrice)}</span>
                </div>
                <p className="text-xs text-gray-400 mb-4 text-center">
                  + taxa de entrega calculada no checkout
                </p>
                <motion.button
                  onClick={handleCheckout}
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full text-base py-4 justify-between"
                >
                  <span>Finalizar Pedido</span>
                  <div className="flex items-center gap-1">
                    <span>{formatCurrency(totalPrice)}</span>
                    <ArrowRight size={18} />
                  </div>
                </motion.button>
              </motion.div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
