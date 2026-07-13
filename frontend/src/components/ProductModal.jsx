import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductModal({ product, onClose, onAdded }) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [selectedOptions, setSelectedOptions] = useState({});

  const hasPromo = product.promo_price && product.promo_price < product.price;
  const basePrice = hasPromo ? product.promo_price : product.price;

  // Calcular preço total com extras
  const extrasTotal = Object.values(selectedOptions).flat().reduce((sum, item) => {
    return sum + (item.extra_price || 0);
  }, 0);
  const unitPrice = basePrice + extrasTotal;
  const totalPrice = unitPrice * quantity;

  function toggleOption(optionId, item, type) {
    setSelectedOptions(prev => {
      if (type === 'single') {
        return { ...prev, [optionId]: [item] };
      }
      // multiple
      const current = prev[optionId] || [];
      const exists = current.some(i => i.id === item.id);
      return {
        ...prev,
        [optionId]: exists
          ? current.filter(i => i.id !== item.id)
          : [...current, item],
      };
    });
  }

  function isSelected(optionId, itemId) {
    return (selectedOptions[optionId] || []).some(i => i.id === itemId);
  }

  function canAdd() {
    if (!product.options) return true;
    for (const opt of product.options) {
      if (opt.required && !(selectedOptions[opt.id]?.length > 0)) return false;
    }
    return true;
  }

  function handleAdd() {
    if (!canAdd()) {
      toast.error('Selecione as opções obrigatórias');
      return;
    }

    const allSelected = Object.values(selectedOptions).flat();
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      unit_price: unitPrice,
      quantity,
      notes: notes.trim() || null,
      selected_options: allSelected,
      image_url: product.image_url,
    });

    toast.success(`${product.name} adicionado!`, {
      icon: '🛒',
      style: { borderRadius: '12px', background: '#333', color: '#fff' },
    });

    onAdded?.();
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-white w-full sm:w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Imagem */}
        <div className="relative h-52 sm:h-64 flex-shrink-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl bg-gray-100">🍽️</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white transition-all shadow-md"
          >
            <X size={20} />
          </button>
        </div>

        {/* Conteúdo scrollável */}
        <div className="overflow-y-auto flex-1 p-5">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-xl font-bold text-gray-900 flex-1 pr-4">{product.name}</h2>
            <div className="text-right flex-shrink-0">
              {hasPromo && (
                <p className="text-sm text-gray-400 line-through">{formatCurrency(product.price)}</p>
              )}
              <p className="text-xl font-bold text-primary">{formatCurrency(basePrice)}</p>
            </div>
          </div>

          {product.description && (
            <p className="text-gray-500 text-sm leading-relaxed mb-4">{product.description}</p>
          )}

          {/* Opções do produto */}
          {product.options?.map(option => (
            <div key={option.id} className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-800">{option.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  option.required
                    ? 'bg-red-100 text-red-600'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {option.required ? 'Obrigatório' : 'Opcional'}
                </span>
              </div>
              <div className="space-y-2">
                {option.items?.map(item => {
                  const selected = isSelected(option.id, item.id);
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => toggleOption(option.id, item, option.type)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left ${
                        selected
                          ? 'border-primary bg-red-50'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <span className="text-sm font-medium text-gray-800">{item.name}</span>
                      <div className="flex items-center gap-3">
                        {item.extra_price > 0 && (
                          <span className="text-sm text-accent font-semibold">
                            +{formatCurrency(item.extra_price)}
                          </span>
                        )}
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          selected ? 'border-primary bg-primary' : 'border-gray-300'
                        }`}>
                          {selected && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Observações */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Observações <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder='Ex: "Sem cebola", "Bem passado", "Tirar o molho"...'
              rows={2}
              maxLength={200}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {/* Barra inferior fixa */}
        <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Controle de quantidade */}
            <div className="flex items-center gap-3 bg-gray-100 rounded-xl p-1">
              <motion.button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                whileTap={{ scale: 0.85 }}
                className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center"
              >
                <Minus size={16} />
              </motion.button>
              <span className="w-6 text-center font-bold text-gray-900">{quantity}</span>
              <motion.button
                onClick={() => setQuantity(q => q + 1)}
                whileTap={{ scale: 0.85 }}
                className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center"
              >
                <Plus size={16} />
              </motion.button>
            </div>

            {/* Botão de adicionar */}
            <motion.button
              onClick={handleAdd}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              disabled={!canAdd()}
              className="flex-1 btn-primary justify-between disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                <ShoppingCart size={18} /> Adicionar
              </span>
              <span className="font-bold">{formatCurrency(totalPrice)}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
