import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, DollarSign, Clock, TrendingUp, ChevronRight } from 'lucide-react';
import { formatCurrency, formatDate, STATUS_LABELS } from '../../utils/format';
import api from '../../utils/api';

const STATUS_COLORS = {
  received: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

function StatCard({ icon: Icon, title, value, sub, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-6 shadow-sm"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon size={22} className="opacity-80" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-gray-500 text-sm mt-1">{title}</p>
      {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/orders/dashboard').then(r => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="p-8 grid grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 h-36 shimmer" />
        ))}
      </div>
    );
  }

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Dashboard
        </h1>
        <p className="text-gray-500 capitalize">{today}</p>
      </motion.div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={ShoppingBag} title="Pedidos hoje" delay={0}
          value={data?.today_orders ?? 0}
          color="bg-blue-50 text-blue-600"
        />
        <StatCard
          icon={DollarSign} title="Faturamento hoje" delay={0.1}
          value={formatCurrency(data?.today_revenue ?? 0)}
          color="bg-green-50 text-green-600"
        />
        <StatCard
          icon={Clock} title="Pedidos em aberto" delay={0.2}
          value={data?.open_orders ?? 0}
          sub="Aguardando ação"
          color="bg-orange-50 text-orange-600"
        />
        <StatCard
          icon={TrendingUp} title="Ticket médio" delay={0.3}
          value={data?.today_orders > 0 ? formatCurrency((data?.today_revenue ?? 0) / data.today_orders) : formatCurrency(0)}
          color="bg-purple-50 text-purple-600"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pedidos recentes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Pedidos Recentes</h2>
            <button
              onClick={() => navigate('/admin/pedidos')}
              className="text-primary text-sm font-medium flex items-center gap-1 hover:underline"
            >
              Ver todos <ChevronRight size={16} />
            </button>
          </div>
          <div className="divide-y divide-gray-50">
            {data?.recent_orders?.length === 0 && (
              <p className="p-6 text-gray-400 text-center">Nenhum pedido ainda hoje</p>
            )}
            {data?.recent_orders?.map(order => (
              <motion.button
                key={order.id}
                onClick={() => navigate(`/admin/pedidos/${order.id}`)}
                whileHover={{ backgroundColor: '#f9f9f9' }}
                className="w-full text-left px-6 py-4 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 text-sm">{order.order_number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="text-gray-500 text-xs mt-0.5">{order.customer_name} • {formatDate(order.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">{formatCurrency(order.total)}</p>
                    <p className="text-gray-400 text-xs capitalize">{order.order_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Top produtos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Mais Vendidos Hoje</h2>
          </div>
          <div className="p-6">
            {data?.top_products?.length === 0 ? (
              <p className="text-gray-400 text-center text-sm">Sem vendas hoje ainda</p>
            ) : (
              <div className="space-y-4">
                {data?.top_products?.map((p, i) => (
                  <div key={p.product_name} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: i === 0 ? '#F1A208' : i === 1 ? '#9CA3AF' : '#CD7F32' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{p.product_name}</p>
                      <p className="text-xs text-gray-400">{p.total_sold} vendidos</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{formatCurrency(p.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
