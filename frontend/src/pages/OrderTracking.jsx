import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import OrderStatus from '../components/OrderStatus';
import { formatCurrency, formatDate } from '../utils/format';
import api from '../utils/api';

export default function OrderTracking() {
  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const fullNumber = `#${orderNumber}`;

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', fullNumber],
    queryFn: () => api.get(`/orders/track/${fullNumber}`).then(r => r.data),
    refetchInterval: order?.status !== 'delivered' && order?.status !== 'cancelled' ? 30000 : false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Buscando pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center">
          <span className="text-6xl">🔍</span>
          <p className="text-gray-600 text-xl mt-4 mb-2">Pedido não encontrado</p>
          <p className="text-gray-400 text-sm mb-6">Verifique o número do pedido e tente novamente</p>
          <button onClick={() => navigate('/')} className="btn-primary">Voltar ao início</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-gray-100">
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Pedido {order.order_number}</h1>
              <p className="text-gray-500 text-sm">{formatDate(order.created_at)}</p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
            title="Atualizar status"
          >
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Status animado */}
        <div className="card p-6 mb-4">
          <h2 className="font-semibold text-gray-800 mb-4">Status do Pedido</h2>
          <OrderStatus status={order.status} />
          {order.estimated_time && order.status !== 'delivered' && order.status !== 'cancelled' && (
            <p className="text-center text-gray-500 text-sm mt-3">
              ⏱ Tempo estimado: até {order.estimated_time} minutos
            </p>
          )}
          <p className="text-center text-gray-400 text-xs mt-2">
            Atualização automática a cada 30 segundos
          </p>
        </div>

        {/* Itens do pedido */}
        <div className="card p-4 mb-4">
          <h2 className="font-semibold text-gray-800 mb-3">Itens</h2>
          <div className="space-y-2">
            {order.items?.map((item, i) => (
              <div key={i} className="flex justify-between items-start text-sm">
                <div>
                  <span className="font-medium">{item.quantity}x {item.product_name}</span>
                  {item.notes && <p className="text-gray-400 text-xs italic">"{item.notes}"</p>}
                  {item.options_summary && <p className="text-gray-400 text-xs">{item.options_summary}</p>}
                </div>
                <span className="text-gray-700 font-medium ml-4">{formatCurrency(item.total_price)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Taxa de entrega</span><span>{formatCurrency(order.delivery_fee)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span><span className="text-primary">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Dados do pedido */}
        <div className="card p-4">
          <h2 className="font-semibold text-gray-800 mb-3">Detalhes</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tipo</span>
              <span className="font-medium">{order.order_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}</span>
            </div>
            {order.address_street && (
              <div className="flex justify-between">
                <span className="text-gray-500">Endereço</span>
                <span className="font-medium text-right ml-8">
                  {order.address_street}, {order.address_number} — {order.address_neighborhood}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Pagamento</span>
              <span className="font-medium">
                {order.payment_method === 'pix' ? '💠 PIX' : order.payment_method === 'card' ? '💳 Cartão' : '💵 Dinheiro'}
              </span>
            </div>
            {order.cancelled_reason && (
              <div className="bg-red-50 rounded-xl p-3 mt-2">
                <p className="text-red-600 text-xs font-medium">Motivo do cancelamento:</p>
                <p className="text-red-500 text-sm mt-0.5">{order.cancelled_reason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
