import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, MapPin, Package, CreditCard, ArrowLeft, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency, buildWhatsAppLink } from '../utils/format';
import api from '../utils/api';
import toast from 'react-hot-toast';
import theme from '../theme.config';

const STEPS = ['Resumo', 'Entrega', 'Pagamento', 'Confirmar'];

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    order_type: 'delivery',
    payment_method: 'pix',
    notes: '',
    address: { street: '', number: '', complement: '', neighborhood: '', city: 'São Paulo' },
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  const neighborhoods = settings?.delivery_neighborhoods || [];

  // Calcular taxa de entrega
  const selectedNeighborhood = neighborhoods.find(n => n.neighborhood === form.address.neighborhood);
  const deliveryFee = form.order_type === 'delivery'
    ? (selectedNeighborhood?.fee ?? (neighborhoods.length === 0 ? (settings?.delivery_fee_value || 0) : null))
    : 0;

  const total = totalPrice + (deliveryFee || 0);

  function updateForm(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  function updateAddress(field, value) {
    setForm(prev => ({ ...prev, address: { ...prev.address, [field]: value } }));
  }

  function validateStep() {
    if (step === 0) {
      if (!form.customer_name.trim()) { toast.error('Informe seu nome'); return false; }
      if (!form.customer_phone.replace(/\D/g, '').length >= 10) { toast.error('Informe seu telefone'); return false; }
    }
    if (step === 1 && form.order_type === 'delivery') {
      if (!form.address.street.trim()) { toast.error('Informe a rua'); return false; }
      if (!form.address.number.trim()) { toast.error('Informe o número'); return false; }
      if (!form.address.neighborhood) { toast.error('Selecione o bairro'); return false; }
    }
    return true;
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const payload = {
        customer_name: form.customer_name,
        customer_phone: form.customer_phone.replace(/\D/g, ''),
        order_type: form.order_type,
        payment_method: form.payment_method,
        notes: form.notes || undefined,
        address: form.order_type === 'delivery' ? form.address : undefined,
        items: items.map(i => ({
          product_id: i.product_id,
          product_name: i.product_name,
          quantity: i.quantity,
          notes: i.notes,
          selected_options: i.selected_options,
        })),
      };

      const { data: order } = await api.post('/orders', payload);

      // Adicionar itens ao objeto de ordem para o link do WhatsApp
      order.items = items.map(i => ({
        product_name: i.product_name,
        quantity: i.quantity,
        unit_price: i.unit_price,
        total_price: i.unit_price * i.quantity,
        notes: i.notes,
      }));

      setCompletedOrder(order);
      clearCart();

      // Abrir WhatsApp automaticamente
      // ⚙️ PERSONALIZAÇÃO: O WhatsApp de destino vem das configurações do restaurante ou do theme.config.js
      const waLink = buildWhatsAppLink(settings?.whatsapp || theme.whatsapp, order);
      setTimeout(() => window.open(waLink, '_blank'), 800);

    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao fazer pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // Tela de pedido confirmado
  if (completedOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20"
        style={{ backgroundColor: 'var(--color-background)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <CheckCircle size={80} className="mx-auto text-green-500 mb-6" />
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pedido Confirmado!</h1>
          <p className="text-gray-500 mb-2">Pedido {completedOrder.order_number}</p>
          <p className="text-gray-600 mb-8">
            Seu pedido foi enviado para o restaurante via WhatsApp.
            Se a janela não abriu, toque no botão abaixo.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={buildWhatsAppLink(settings?.whatsapp || theme.whatsapp, completedOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary justify-center text-lg py-4"
              style={{ backgroundColor: '#25D366' }}
            >
              💬 Abrir WhatsApp
            </a>
            <button onClick={() => navigate('/')} className="text-gray-500 hover:text-gray-700 py-2">
              Voltar ao início
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Redirecionar se carrinho vazio
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center pt-20">
        <div>
          <span className="text-7xl">🛒</span>
          <p className="text-gray-500 text-xl mt-4 mb-6">Seu carrinho está vazio</p>
          <button onClick={() => navigate('/menu')} className="btn-primary">Ver Cardápio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">
            {step === 0 ? 'Seu Pedido' : step === 1 ? 'Entrega / Retirada' : step === 2 ? 'Pagamento' : 'Confirmar'}
          </h1>
        </div>

        {/* Indicador de steps */}
        <div className="flex gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-all duration-400 ${
                i <= step ? 'bg-primary' : 'bg-gray-200'
              }`} />
              <p className={`text-xs mt-1 font-medium ${i === step ? 'text-primary' : 'text-gray-400'}`}>{s}</p>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 0: Resumo + dados do cliente */}
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Itens do pedido */}
              <div className="card p-4 mb-4">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-primary" /> Itens
                </h2>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800 text-sm">{item.quantity}x {item.product_name}</span>
                        {item.notes && <p className="text-xs text-gray-400 italic">"{item.notes}"</p>}
                        {item.selected_options?.length > 0 && (
                          <p className="text-xs text-gray-400">{item.selected_options.map(o => o.name).join(', ')}</p>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900 ml-4">
                        {formatCurrency(item.unit_price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-bold">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              {/* Dados do cliente */}
              <div className="card p-4 mb-6">
                <h2 className="font-semibold text-gray-800 mb-4">Seus dados</h2>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Seu nome completo *"
                    value={form.customer_name}
                    onChange={e => updateForm('customer_name', e.target.value)}
                    className="input-field"
                  />
                  <input
                    type="tel"
                    placeholder="Seu WhatsApp / Telefone *"
                    value={form.customer_phone}
                    onChange={e => updateForm('customer_phone', e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Tipo de entrega e endereço */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {/* Delivery ou Retirada */}
              {theme.enableDelivery && theme.enablePickup && (
                <div className="card p-4 mb-4">
                  <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Package size={18} className="text-primary" /> Como quer receber?
                  </h2>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'delivery', label: '🛵 Entrega', desc: 'Na sua porta' },
                      { value: 'pickup', label: '🏪 Retirada', desc: 'No restaurante' },
                    ].map(opt => (
                      <motion.button
                        key={opt.value}
                        onClick={() => updateForm('order_type', opt.value)}
                        whileTap={{ scale: 0.97 }}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          form.order_type === opt.value
                            ? 'border-primary bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-semibold text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-1">{opt.desc}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Endereço (delivery) */}
              <AnimatePresence>
                {form.order_type === 'delivery' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="card p-4 mb-4 overflow-hidden"
                  >
                    <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <MapPin size={18} className="text-primary" /> Endereço de entrega
                    </h2>
                    <div className="space-y-3">
                      <input type="text" placeholder="Rua / Avenida *" value={form.address.street}
                        onChange={e => updateAddress('street', e.target.value)} className="input-field" />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Número *" value={form.address.number}
                          onChange={e => updateAddress('number', e.target.value)} className="input-field" />
                        <input type="text" placeholder="Complemento" value={form.address.complement}
                          onChange={e => updateAddress('complement', e.target.value)} className="input-field" />
                      </div>

                      {/* Seletor de bairro com taxas */}
                      {neighborhoods.length > 0 ? (
                        <select
                          value={form.address.neighborhood}
                          onChange={e => updateAddress('neighborhood', e.target.value)}
                          className="input-field"
                        >
                          <option value="">Selecione o bairro *</option>
                          {neighborhoods.map(n => (
                            <option key={n.id} value={n.neighborhood}>
                              {n.neighborhood} — Taxa: {formatCurrency(n.fee)} ({n.min_time}-{n.max_time} min)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input type="text" placeholder="Bairro *" value={form.address.neighborhood}
                          onChange={e => updateAddress('neighborhood', e.target.value)} className="input-field" />
                      )}

                      <input type="text" placeholder="Cidade" value={form.address.city}
                        onChange={e => updateAddress('city', e.target.value)} className="input-field" />

                      {selectedNeighborhood && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm"
                        >
                          <p className="text-green-700 font-medium">
                            Taxa de entrega: {formatCurrency(selectedNeighborhood.fee)}
                          </p>
                          <p className="text-green-600">
                            Tempo estimado: {selectedNeighborhood.min_time}–{selectedNeighborhood.max_time} min
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Observações */}
              <div className="card p-4 mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observações gerais <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => updateForm('notes', e.target.value)}
                  placeholder='Ex: "Interfone não funciona — ligar ao chegar"'
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </motion.div>
          )}

          {/* STEP 2: Pagamento */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="card p-4 mb-4">
                <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-primary" /> Forma de pagamento
                </h2>
                {/* ⚠️ INTEGRAÇÃO FUTURA: Substituir estas opções por SDK do Mercado Pago ou Stripe
                    - Mercado Pago: https://www.mercadopago.com.br/developers/pt/docs
                    - Stripe (para pagamentos internacionais): https://stripe.com/docs
                    - Por enquanto, apenas seleção de método sem cobrança online */}
                <div className="space-y-3">
                  {theme.paymentMethods.map(method => (
                    <motion.button
                      key={method.id}
                      onClick={() => updateForm('payment_method', method.id)}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        form.payment_method === method.id
                          ? 'border-primary bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-semibold text-gray-800">{method.label}</span>
                      {form.payment_method === method.id && (
                        <CheckCircle size={18} className="ml-auto text-primary" />
                      )}
                    </motion.button>
                  ))}
                </div>

                {form.payment_method === 'pix' && settings?.pix_key && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm"
                  >
                    <p className="text-blue-700 font-medium">Chave PIX do restaurante:</p>
                    <p className="text-blue-600 font-mono mt-1">{settings.pix_key}</p>
                    <p className="text-blue-500 text-xs mt-1">Pague após confirmar o pedido</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Confirmação final */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="card p-4 mb-4">
                <h2 className="font-semibold text-gray-800 mb-4">Resumo do pedido</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Nome</span><span className="font-medium">{form.customer_name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Telefone</span><span className="font-medium">{form.customer_phone}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tipo</span><span className="font-medium">{form.order_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}</span></div>
                  {form.order_type === 'delivery' && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Endereço</span>
                      <span className="font-medium text-right ml-4">
                        {form.address.street}, {form.address.number} — {form.address.neighborhood}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between"><span className="text-gray-500">Pagamento</span><span className="font-medium">{theme.paymentMethods.find(m => m.id === form.payment_method)?.label}</span></div>
                </div>
              </div>

              {/* Totais */}
              <div className="card p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(totalPrice)}</span></div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500">Taxa de entrega</span><span>{formatCurrency(deliveryFee)}</span></div>
                  )}
                  <div className="border-t border-gray-100 pt-2 mt-2 flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Botão de avançar / confirmar */}
        <motion.button
          onClick={() => {
            if (!validateStep()) return;
            if (step < 3) setStep(s => s + 1);
            else handleConfirm();
          }}
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary w-full text-lg py-4 disabled:opacity-60"
        >
          {loading ? (
            <span className="flex items-center gap-2 justify-center">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.3"/>
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" fill="none"/>
              </svg>
              Enviando...
            </span>
          ) : step < 3 ? 'Continuar →' : '✅ Confirmar Pedido'}
        </motion.button>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary) 15%, transparent);
        }
      `}</style>
    </div>
  );
}
