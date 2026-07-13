import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { Filter, RefreshCw, ChevronRight, X, Check } from 'lucide-react';
import { formatCurrency, formatDate, STATUS_LABELS, STATUS_STEPS } from '../../utils/format';
import OrderStatus from '../../components/OrderStatus';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  received: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const NEXT_STATUS = {
  received: { value: 'preparing', label: 'Confirmar → Em preparo' },
  preparing: { value: 'out_for_delivery', label: 'Marcar → Saiu para entrega' },
  out_for_delivery: { value: 'delivered', label: 'Marcar → Entregue' },
};

export default function AdminOrders() {
  const qc = useQueryClient();
  const { orderId } = useParams();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Carregar pedido específico quando vem do Dashboard
  const { data: orderFromUrl } = useQuery({
    queryKey: ['order-by-id', orderId],
    queryFn: () => api.get(`/orders/${orderId}`).then(r => r.data),
    enabled: !!orderId,
  });

  useEffect(() => {
    if (orderFromUrl) setSelectedOrder(orderFromUrl);
  }, [orderFromUrl]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', filterStatus, filterDate],
    queryFn: () => api.get(`/orders?status=${filterStatus}&date=${filterDate}`).then(r => r.data),
    refetchInterval: 30000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status, cancelled_reason }) =>
      api.patch(`/orders/${id}/status`, { status, cancelled_reason }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      setSelectedOrder(res.data);
      toast.success(`Status atualizado: ${STATUS_LABELS[res.data.status]}`);
    },
    onError: () => toast.error('Erro ao atualizar status'),
  });

  function handleNextStatus(order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    updateStatus.mutate({ id: order.id, status: next.value });
  }

  function handleCancel() {
    if (!cancelReason.trim()) { toast.error('Informe o motivo do cancelamento'); return; }
    updateStatus.mutate({ id: selectedOrder.id, status: 'cancelled', cancelled_reason: cancelReason });
    setShowCancelModal(false);
    setCancelReason('');
  }

  const orders = data?.orders || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Pedidos
        </h1>
        <button onClick={() => refetch()} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          {['all', ...STATUS_STEPS, 'cancelled'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filterStatus === s ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={filterStatus === s ? { backgroundColor: 'var(--color-primary)' } : {}}
            >
              {s === 'all' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lista de pedidos */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 h-24 shimmer" />
            ))
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
              <span className="text-5xl block mb-3">📭</span>
              Nenhum pedido encontrado
            </div>
          ) : (
            orders.map(order => (
              <motion.button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`w-full text-left bg-white rounded-2xl p-4 shadow-sm border-2 transition-all ${
                  selectedOrder?.id === order.id ? 'border-primary' : 'border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-gray-900">{order.order_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{order.customer_name}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-400">{order.order_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}</p>
                    <p className="text-xs text-gray-400">{order.items?.length} iten(s)</p>
                  </div>
                </div>
                {NEXT_STATUS[order.status] && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={e => { e.stopPropagation(); handleNextStatus(order); }}
                      className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      <Check size={13} /> {NEXT_STATUS[order.status].label}
                    </button>
                  </div>
                )}
              </motion.button>
            ))
          )}
        </div>

        {/* Detalhe do pedido */}
        <div className="lg:sticky lg:top-6">
          <AnimatePresence mode="wait">
            {selectedOrder ? (
              <motion.div
                key={selectedOrder.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                  <h2 className="font-bold text-gray-900">Pedido {selectedOrder.order_number}</h2>
                  <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Status */}
                  <OrderStatus status={selectedOrder.status} />

                  {/* Cliente */}
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-2">Cliente</h3>
                    <p className="text-sm text-gray-700">{selectedOrder.customer_name}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.customer_phone}</p>
                    {selectedOrder.address_street && (
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedOrder.address_street}, {selectedOrder.address_number}
                        {selectedOrder.address_complement ? ` — ${selectedOrder.address_complement}` : ''}<br />
                        {selectedOrder.address_neighborhood}, {selectedOrder.address_city}
                      </p>
                    )}
                  </div>

                  {/* Itens */}
                  <div>
                    <h3 className="font-semibold text-gray-800 text-sm mb-2">Itens</h3>
                    <div className="space-y-2">
                      {selectedOrder.items?.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <div>
                            <span className="text-gray-700">{item.quantity}x {item.product_name}</span>
                            {item.notes && <p className="text-gray-400 text-xs italic">"{item.notes}"</p>}
                          </div>
                          <span className="text-gray-900 font-medium">{formatCurrency(item.total_price)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-sm">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span><span>{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>
                      {selectedOrder.delivery_fee > 0 && (
                        <div className="flex justify-between text-gray-500">
                          <span>Entrega</span><span>{formatCurrency(selectedOrder.delivery_fee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base pt-1">
                        <span>Total</span><span className="text-primary">{formatCurrency(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pagamento */}
                  <div className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Pagamento: </span>
                    {selectedOrder.payment_method === 'pix' ? '💠 PIX' : selectedOrder.payment_method === 'card' ? '💳 Cartão' : '💵 Dinheiro'}
                  </div>

                  {/* Ações */}
                  <div className="space-y-2 pt-2">
                    {NEXT_STATUS[selectedOrder.status] && (
                      <motion.button
                        onClick={() => handleNextStatus(selectedOrder)}
                        disabled={updateStatus.isPending}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary w-full justify-center disabled:opacity-60"
                      >
                        <Check size={18} /> {NEXT_STATUS[selectedOrder.status].label}
                      </motion.button>
                    )}
                    {!['delivered', 'cancelled'].includes(selectedOrder.status) && (
                      <button
                        onClick={() => setShowCancelModal(true)}
                        className="w-full py-2.5 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 text-sm font-medium transition-all"
                      >
                        Cancelar pedido
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center text-gray-400">
                <span className="text-5xl block mb-3">👈</span>
                <p>Selecione um pedido para ver detalhes</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de cancelamento */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
            >
              <h3 className="font-bold text-gray-900 mb-4">Cancelar Pedido</h3>
              <textarea
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                placeholder="Motivo do cancelamento..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => setShowCancelModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium">
                  Voltar
                </button>
                <button onClick={handleCancel} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                  Confirmar cancelamento
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
