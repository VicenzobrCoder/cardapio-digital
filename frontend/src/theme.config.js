// =======================================================
// ⚙️  ARQUIVO DE CONFIGURAÇÃO DO TEMA — WHITE LABEL
// =======================================================
// Para criar um novo cliente, basta alterar os valores
// abaixo. O resto do sistema usa essas variáveis.
// =======================================================

const theme = {
  // -------------------------------------------------------
  // IDENTIDADE DO RESTAURANTE
  // -------------------------------------------------------
  restaurantName: 'Sabor do Chef',
  restaurantSlogan: 'Tradição e sabor em cada prato',
  logoUrl: null,             // URL do logo — null usa texto
  faviconUrl: null,

  // -------------------------------------------------------
  // CORES — altere para a paleta do cliente
  // -------------------------------------------------------
  colors: {
    primary: '#E63946',      // Cor principal (botões, destaques)
    secondary: '#457B9D',    // Cor secundária
    accent: '#F1A208',       // Cor de destaque / promoções
    background: '#FAFAF8',   // Fundo geral
    surface: '#FFFFFF',      // Cards e painéis
    text: '#1D1D1B',         // Texto principal
    textMuted: '#6B7280',    // Texto secundário
  },

  // -------------------------------------------------------
  // HERO DA PÁGINA INICIAL
  // -------------------------------------------------------
  hero: {
    // Imagens do carrossel do banner principal
    // ⚙️ Troque pelas fotos do restaurante do cliente
    images: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1400&q=85',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=85',
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=1400&q=85',
      'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=1400&q=85',
    ],
    // Ícones flutuantes no hero (emojis de comida)
    floatingIcons: ['🍕', '🍖', '🥗', '🍜', '🥩', '🍋', '🌿', '🧀'],
    // Texto do botão principal
    ctaText: 'Ver Cardápio',
    ctaSecondaryText: 'Peça Agora',
  },

  // -------------------------------------------------------
  // CONTATO E LOCALIZAÇÃO
  // -------------------------------------------------------
  whatsapp: '5511999999999',  // ⚙️ Número com código do país + DDD
  address: 'Rua das Flores, 123 - Centro, São Paulo - SP',
  instagram: '@sabordochef',   // null para ocultar

  // -------------------------------------------------------
  // CONFIGURAÇÕES DE PEDIDO
  // -------------------------------------------------------
  enableDelivery: true,
  enablePickup: true,
  paymentMethods: [
    { id: 'pix', label: 'PIX', icon: '💠' },
    { id: 'card', label: 'Cartão na entrega', icon: '💳' },
    { id: 'cash', label: 'Dinheiro', icon: '💵' },
  ],

  // -------------------------------------------------------
  // ANIMAÇÕES — ajuste os timings se necessário
  // -------------------------------------------------------
  animation: {
    heroCarouselInterval: 5000,   // ms entre slides do hero
    staggerDelay: 0.08,           // delay entre cards (segundos)
    cardHoverScale: 1.03,
    transitionDuration: 0.3,
  },
};

export default theme;
