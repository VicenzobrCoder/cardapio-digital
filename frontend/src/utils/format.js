// Formatar valor em reais (pt-BR)
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value ?? 0);
}

// Formatar data/hora pt-BR
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d);
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(d);
}

// Formatar telefone
export function formatPhone(phone) {
  const digits = phone?.replace(/\D/g, '') || '';
  if (digits.length === 11) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  }
  return phone;
}

// Gerar link do WhatsApp com mensagem do pedido
export function buildWhatsAppLink(whatsapp, order) {
  const items = order.items.map(i =>
    `• ${i.quantity}x ${i.product_name}${i.notes ? ` (${i.notes})` : ''} — ${formatCurrency(i.total_price)}`
  ).join('\n');

  const paymentLabels = { pix: 'PIX', card: 'Cartão na entrega', cash: 'Dinheiro' };
  const orderTypeLabel = order.order_type === 'delivery' ? 'Entrega' : 'Retirada no local';

  let address = '';
  if (order.order_type === 'delivery' && order.address_street) {
    address = `\n📍 *Endereço:* ${order.address_street}, ${order.address_number}${order.address_complement ? ' ' + order.address_complement : ''} - ${order.address_neighborhood}`;
  }

  const msg = `🍽️ *Novo Pedido ${order.order_number}*

👤 *Cliente:* ${order.customer_name}
📞 *Telefone:* ${formatPhone(order.customer_phone)}
🛵 *Tipo:* ${orderTypeLabel}${address}

📋 *Itens:*
${items}

💰 *Subtotal:* ${formatCurrency(order.subtotal)}${order.delivery_fee ? `\n🛵 *Entrega:* ${formatCurrency(order.delivery_fee)}` : ''}
💵 *Total:* ${formatCurrency(order.total)}
💳 *Pagamento:* ${paymentLabels[order.payment_method] || order.payment_method}
${order.notes ? `\n📝 *Obs:* ${order.notes}` : ''}`;

  const number = whatsapp?.replace(/\D/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(msg)}`;
}

// Labels de status do pedido em pt-BR
export const STATUS_LABELS = {
  received: 'Recebido',
  preparing: 'Em preparo',
  out_for_delivery: 'Saiu para entrega',
  delivered: 'Entregue',
  cancelled: 'Cancelado',
};

export const STATUS_STEPS = ['received', 'preparing', 'out_for_delivery', 'delivered'];
