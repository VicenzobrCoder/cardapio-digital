import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, DollarSign, Clock, TrendingUp, ChevronRight,
  XCircle, BarChart2, Download, Printer,
} from 'lucide-react';
import { formatCurrency, formatDate, STATUS_LABELS } from '../../utils/format';
import api from '../../utils/api';

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const PAYMENT_LABELS = { pix: 'PIX', card: 'Cartão', cash: 'Dinheiro' };

const STATUS_COLORS = {
  received: 'bg-blue-100 text-blue-700',
  preparing: 'bg-yellow-100 text-yellow-700',
  out_for_delivery: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

/* ────────────────────────────────────────── helpers ── */

function fc(v) { return formatCurrency(v ?? 0); }

function downloadCSV(data) {
  const pl = data.period_label;
  const s = data.summary;
  const rows = [
    [`DEMONSTRATIVO DE RESULTADO — ${pl}`],
    [],
    ['RECEITAS'],
    ['Receita de Vendas', fc(s.revenue - s.delivery_revenue)],
    ['(+) Receita de Taxa de Entrega', fc(s.delivery_revenue)],
    ['= RECEITA TOTAL', fc(s.revenue)],
    [],
    ['VOLUME DE OPERAÇÕES'],
    ['Pedidos Realizados', s.total_orders],
    ['Pedidos Cancelados', s.cancelled_orders],
    ['Ticket Médio', fc(s.avg_ticket)],
    [],
    ['FORMAS DE PAGAMENTO'],
    ...data.by_payment.map(p => [
      `${PAYMENT_LABELS[p.payment_method] || p.payment_method} (${p.count} pedidos)`,
      fc(p.revenue),
    ]),
    [],
    ['TIPO DE PEDIDO'],
    ...data.by_type.map(t => [
      `${t.order_type === 'delivery' ? 'Delivery' : 'Retirada'} (${t.count} pedidos)`,
      fc(t.revenue),
    ]),
    [],
    ['TOP 10 PRODUTOS', 'Qtd.', 'Receita'],
    ...data.top_products.map((p, i) => [`${i + 1}. ${p.product_name}`, `${p.total_sold} un`, fc(p.revenue)]),
  ];
  if (data.by_day.length) {
    rows.push([], ['RESULTADO POR DIA', 'Pedidos', 'Receita']);
    data.by_day.forEach(d => {
      rows.push([
        new Date(d.day + 'T12:00:00').toLocaleDateString('pt-BR'),
        d.orders,
        fc(d.revenue),
      ]);
    });
  }
  const csv = rows.map(r => r.join(';')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DRE_${data.period_label.replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function printDRE(data) {
  const s = data.summary;
  const pl = data.period_label;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="utf-8">
<title>DRE — ${pl}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,sans-serif;padding:40px;color:#333;font-size:13px}
  h1{font-size:20px;font-weight:700;margin-bottom:2px}
  .sub{color:#888;font-size:12px;margin-bottom:28px}
  h3{font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:#aaa;margin:22px 0 6px}
  table{width:100%;border-collapse:collapse;margin-bottom:4px}
  td{padding:5px 2px;border-bottom:1px solid #f0f0f0}
  td:last-child{text-align:right;font-weight:600}
  .total{background:#f5f5f5}
  .total td{padding:7px 4px;font-weight:700}
  .footer{margin-top:48px;font-size:11px;color:#bbb;text-align:center;border-top:1px solid #eee;padding-top:12px}
  @media print{body{padding:24px}}
</style></head><body>
<h1>Demonstrativo de Resultado</h1>
<p class="sub">${pl} &nbsp;·&nbsp; Gerado em ${new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' })}</p>

<h3>Receitas</h3>
<table>
  <tr><td>Receita de Vendas</td><td>${fc(s.revenue - s.delivery_revenue)}</td></tr>
  <tr><td>(+) Receita de Taxa de Entrega</td><td>${fc(s.delivery_revenue)}</td></tr>
  <tr class="total"><td>= RECEITA TOTAL</td><td>${fc(s.revenue)}</td></tr>
</table>

<h3>Volume de Operações</h3>
<table>
  <tr><td>Pedidos Realizados</td><td>${s.total_orders}</td></tr>
  <tr><td>Pedidos Cancelados</td><td>${s.cancelled_orders}</td></tr>
  <tr><td>Ticket Médio</td><td>${fc(s.avg_ticket)}</td></tr>
</table>

${data.by_type.length ? `<h3>Por Tipo de Pedido</h3><table>${data.by_type.map(t =>
  `<tr><td>${t.order_type === 'delivery' ? 'Delivery' : 'Retirada'} (${t.count} pedidos)</td><td>${fc(t.revenue)}</td></tr>`
).join('')}</table>` : ''}

${data.by_payment.length ? `<h3>Formas de Pagamento</h3><table>${data.by_payment.map(p =>
  `<tr><td>${PAYMENT_LABELS[p.payment_method] || p.payment_method} (${p.count} pedidos)</td><td>${fc(p.revenue)}</td></tr>`
).join('')}</table>` : ''}

${data.top_products.length ? `<h3>Top 10 Produtos</h3><table>
  <tr style="background:#f8f8f8"><td><b>Produto</b></td><td style="text-align:center"><b>Qtd.</b></td><td><b>Receita</b></td></tr>
  ${data.top_products.map((p, i) =>
    `<tr><td>${i + 1}. ${p.product_name}</td><td style="text-align:center">${p.total_sold} un</td><td>${fc(p.revenue)}</td></tr>`
  ).join('')}
</table>` : ''}

${data.by_day.length ? `<h3>Resultado por Dia</h3><table>
  <tr style="background:#f8f8f8"><td><b>Data</b></td><td style="text-align:center"><b>Pedidos</b></td><td><b>Receita</b></td></tr>
  ${data.by_day.map(d =>
    `<tr><td>${new Date(d.day + 'T12:00:00').toLocaleDateString('pt-BR')}</td><td style="text-align:center">${d.orders}</td><td>${fc(d.revenue)}</td></tr>`
  ).join('')}
</table>` : ''}

<p class="footer">Relatório gerado automaticamente · Sistema de Cardápio Digital</p>
<script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}</script>
</body></html>`);
  w.document.close();
}

/* ────────────────────────────────────────── components ── */

function StatCard({ icon: Icon, title, value, sub, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white rounded-2xl p-6 shadow-sm"
    >
      <div className="mb-4">
        <div className={`inline-flex p-3 rounded-xl ${color}`}>
          <Icon size={22} className="opacity-80" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-gray-500 text-sm mt-1">{title}</p>
      {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
    </motion.div>
  );
}

function DRELine({ label, value, bold, muted, highlight }) {
  return (
    <div className={`flex items-center justify-between py-2 px-3 ${highlight ? 'bg-gray-50 rounded-lg my-1' : ''}`}>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : muted ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </span>
      <span className={`text-sm ${bold ? 'font-bold text-gray-900' : 'font-semibold text-gray-800'}`}>
        {value}
      </span>
    </div>
  );
}

function DREReport({ data }) {
  const s = data.summary;
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex items-center gap-2">
        <BarChart2 size={18} className="text-primary opacity-70" />
        <div>
          <h2 className="font-bold text-gray-900">DRE — {data.period_label}</h2>
          <p className="text-xs text-gray-400">Demonstrativo de Resultado do Exercício</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* RECEITAS */}
        <section>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Receitas</p>
          <DRELine label="Receita de Vendas" value={fc(s.revenue - s.delivery_revenue)} />
          <DRELine label="(+) Receita de Taxa de Entrega" value={fc(s.delivery_revenue)} />
          <DRELine label="= RECEITA TOTAL" value={fc(s.revenue)} bold highlight />
        </section>

        {/* OPERAÇÕES */}
        <section>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Volume de Operações</p>
          <DRELine label="Pedidos Realizados" value={s.total_orders} />
          <DRELine label="Pedidos Cancelados" value={s.cancelled_orders} />
          <DRELine label="Ticket Médio" value={fc(s.avg_ticket)} />
        </section>

        {/* TIPO */}
        {data.by_type.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Por Tipo de Pedido</p>
            {data.by_type.map(t => (
              <DRELine
                key={t.order_type}
                label={`${t.order_type === 'delivery' ? '🛵 Delivery' : '🏪 Retirada'} (${t.count} pedidos)`}
                value={fc(t.revenue)}
              />
            ))}
          </section>
        )}

        {/* PAGAMENTO */}
        {data.by_payment.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Formas de Pagamento</p>
            {data.by_payment.map(p => (
              <DRELine
                key={p.payment_method}
                label={`${PAYMENT_LABELS[p.payment_method] || p.payment_method} (${p.count} pedidos)`}
                value={fc(p.revenue)}
              />
            ))}
          </section>
        )}

        {/* TOP PRODUTOS */}
        {data.top_products.length > 0 && (
          <section>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Top 10 Produtos</p>
            <div className="space-y-2">
              {data.top_products.map((p, i) => (
                <div key={p.product_name} className="flex items-center gap-3">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: i === 0 ? '#F1A208' : i === 1 ? '#9CA3AF' : i === 2 ? '#CD7F32' : '#d1d5db' }}
                  >
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{p.product_name}</p>
                    <p className="text-xs text-gray-400">{p.total_sold} unidades</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-700 flex-shrink-0">{fc(p.revenue)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────── main page ── */

export default function Dashboard() {
  const navigate = useNavigate();
  const now = new Date();
  const [period, setPeriod] = useState('today');
  const [selMonth, setSelMonth] = useState(now.getMonth() + 1);
  const [selYear, setSelYear] = useState(now.getFullYear());

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const { data: dashData, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/orders/dashboard').then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: reportData, isLoading: reportLoading } = useQuery({
    queryKey: ['reports', period, selMonth, selYear],
    queryFn: () => api.get('/orders/reports', {
      params: { period, month: selMonth, year: selYear },
    }).then(r => r.data),
    enabled: period !== 'today',
  });

  const isLoading = period === 'today' ? dashLoading : reportLoading;

  const periodLabel =
    period === 'today' ? 'Hoje' :
    period === 'month' ? `${MONTHS[selMonth - 1]} de ${selYear}` :
    `Ano ${selYear}`;

  const stats =
    period === 'today'
      ? {
          orders: dashData?.today_orders ?? 0,
          revenue: dashData?.today_revenue ?? 0,
          openOrders: dashData?.open_orders ?? 0,
          avgTicket: dashData?.today_orders > 0
            ? (dashData.today_revenue ?? 0) / dashData.today_orders : 0,
        }
      : {
          orders: reportData?.summary?.total_orders ?? 0,
          revenue: reportData?.summary?.revenue ?? 0,
          cancelled: reportData?.summary?.cancelled_orders ?? 0,
          avgTicket: reportData?.summary?.avg_ticket ?? 0,
        };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          Dashboard
        </h1>
        <p className="text-gray-500 capitalize">
          {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </motion.div>

      {/* Period bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-wrap items-center gap-3 mb-6 bg-white rounded-2xl p-4 shadow-sm"
      >
        {/* Tabs */}
        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm font-medium">
          {[['today', 'Hoje'], ['month', 'Mês'], ['year', 'Ano']].map(([v, label]) => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className={`px-4 py-2 transition-colors ${
                period === v ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Month picker */}
        {period === 'month' && (
          <select
            value={selMonth}
            onChange={e => setSelMonth(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-primary"
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        )}

        {/* Year picker */}
        {(period === 'month' || period === 'year') && (
          <select
            value={selYear}
            onChange={e => setSelYear(Number(e.target.value))}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:border-primary"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}

        <span className="text-sm text-gray-500 font-medium">{periodLabel}</span>

        {/* Download buttons — visible when period has report data */}
        {period !== 'today' && reportData && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => downloadCSV(reportData)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors"
            >
              <Download size={15} />
              Baixar CSV
            </button>
            <button
              onClick={() => printDRE(reportData)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              <Printer size={15} />
              Imprimir / PDF
            </button>
          </div>
        )}
      </motion.div>

      {/* Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 h-36 shimmer" />
          ))}
        </div>
      )}

      {/* Stats cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={ShoppingBag} delay={0}
            title={`Pedidos — ${periodLabel}`}
            value={stats.orders}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            icon={DollarSign} delay={0.1}
            title={`Faturamento — ${periodLabel}`}
            value={fc(stats.revenue)}
            color="bg-green-50 text-green-600"
          />
          {period === 'today' ? (
            <StatCard
              icon={Clock} delay={0.2}
              title="Pedidos em aberto"
              value={stats.openOrders}
              sub="Aguardando ação"
              color="bg-orange-50 text-orange-600"
            />
          ) : (
            <StatCard
              icon={XCircle} delay={0.2}
              title={`Cancelamentos — ${periodLabel}`}
              value={stats.cancelled ?? 0}
              color="bg-red-50 text-red-500"
            />
          )}
          <StatCard
            icon={TrendingUp} delay={0.3}
            title="Ticket Médio"
            value={fc(stats.avgTicket)}
            color="bg-purple-50 text-purple-600"
          />
        </div>
      )}

      {/* ── TODAY VIEW ── */}
      {period === 'today' && !isLoading && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
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
              {dashData?.recent_orders?.length === 0 && (
                <p className="p-6 text-gray-400 text-center">Nenhum pedido ainda hoje</p>
              )}
              {dashData?.recent_orders?.map(order => (
                <motion.button
                  key={order.id}
                  onClick={() => navigate(`/admin/pedidos/${order.id}`)}
                  whileHover={{ backgroundColor: '#f9fafb' }}
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
                      <p className="text-gray-500 text-xs mt-0.5">
                        {order.customer_name} · {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 text-sm">{fc(order.total)}</p>
                      <p className="text-gray-400 text-xs">
                        {order.order_type === 'delivery' ? '🛵 Entrega' : '🏪 Retirada'}
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Top products today */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Mais Vendidos Hoje</h2>
            </div>
            <div className="p-6">
              {dashData?.top_products?.length === 0 ? (
                <p className="text-gray-400 text-center text-sm">Sem vendas hoje ainda</p>
              ) : (
                <div className="space-y-4">
                  {dashData?.top_products?.map((p, i) => (
                    <div key={p.product_name} className="flex items-center gap-3">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: i === 0 ? '#F1A208' : i === 1 ? '#9CA3AF' : '#CD7F32' }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.product_name}</p>
                        <p className="text-xs text-gray-400">{p.total_sold} vendidos</p>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">{fc(p.revenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* ── MÊS / ANO VIEW — DRE ── */}
      {period !== 'today' && !isLoading && reportData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="grid lg:grid-cols-3 gap-6"
        >
          {/* DRE */}
          <div className="lg:col-span-2">
            <DREReport data={reportData} />
          </div>

          {/* By-day panel */}
          {reportData.by_day?.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Resultado por Dia</h2>
              </div>
              <div className="overflow-y-auto flex-1 max-h-[520px]">
                {reportData.by_day.map(d => (
                  <div key={d.day} className="flex items-center justify-between px-6 py-3 border-b border-gray-50">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {new Date(d.day + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </p>
                      <p className="text-xs text-gray-400">{d.orders} pedido{d.orders !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{fc(d.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty state */}
      {period !== 'today' && !isLoading && reportData?.summary?.total_orders === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center py-16 text-gray-400"
        >
          <BarChart2 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum pedido neste período</p>
          <p className="text-sm mt-1">Tente selecionar outro mês ou ano</p>
        </motion.div>
      )}
    </div>
  );
}
