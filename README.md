# 🍽️ Cardápio Digital + Pedidos Online

Sistema web completo de **cardápio digital e pedidos** para restaurantes e delivery.  
Arquitetura **white-label** — fácil de reskinar para cada cliente novo.

---

## ✨ Funcionalidades

### Site público (cliente final)
- Hero animado com carrossel automático de imagens e ícones flutuantes
- Cardápio agrupado por categoria com busca em tempo real
- Cards com micro-interações (zoom, sombra, elevação no hover/toque)
- Animação de "voo" ao adicionar item ao carrinho
- Transição escalonada (stagger) ao mudar de categoria
- Carrinho lateral com slide-in animado (persistido no localStorage)
- Checkout em 4 etapas: resumo → entrega/retirada → pagamento → confirmar
- Taxa de entrega por bairro ou fixa
- Confirmação envia pedido via WhatsApp (`wa.me`) e salva no banco
- Tela de acompanhamento do pedido com barra de status animada
- Atualização automática do status a cada 30 segundos

### Painel admin
- Login seguro com JWT (token expira em 8 horas)
- Dashboard com pedidos do dia, faturamento e últimos pedidos
- Gestão de cardápio: criar/editar/remover categorias e produtos
- Ativar/desativar item sem deletar (toggle de disponibilidade)
- Gestão de pedidos com avance de status e cancelamento
- Configurações: WhatsApp, PIX, horários, bairros e taxas de entrega
- Customização de cores do tema (primary, secondary, accent)

---

## 🚀 Como iniciar

### Pré-requisitos
- **Node.js 22.5+** (recomendado: 24.x) — utiliza `node:sqlite` nativo, sem compilação
- npm 9+

### 1. Instalar dependências

```bash
# Na pasta raiz do projeto
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configurar o backend

Edite `backend/.env`:
```env
PORT=3001
JWT_SECRET=troque_por_string_aleatoria_em_producao
RESTAURANT_NAME=Nome do Restaurante
RESTAURANT_WHATSAPP=5511999999999
```

### 3. Popular o banco com dados de exemplo

```bash
cd backend && npm run seed
```

Isso cria:
- Cardápio completo com 6 categorias e 20+ produtos
- 6 bairros de entrega com taxas e tempos
- Usuário admin: `admin@sabordochef.com` / senha: `admin123`
- 4 pedidos de exemplo para testar o dashboard

### 4. Iniciar o projeto

Abra **dois terminais**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Roda em http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Roda em http://localhost:5173
```

Acesse:
- 🛒 **Site público:** `http://localhost:5173`
- 📋 **Cardápio:** `http://localhost:5173/menu`
- 🔐 **Admin:** `http://localhost:5173/admin`

---

## 📁 Estrutura de pastas

```
Menu/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   │   ├── db.js          # Conexão SQLite (node:sqlite nativo)
│   │   │   └── seed.js        # Dados de exemplo
│   │   ├── middleware/
│   │   │   └── auth.js        # Validação JWT
│   │   ├── routes/
│   │   │   ├── auth.js        # Login e autenticação
│   │   │   ├── categories.js  # CRUD categorias
│   │   │   ├── products.js    # CRUD produtos
│   │   │   ├── orders.js      # Pedidos + dashboard + relatórios
│   │   │   └── settings.js    # Configurações + bairros
│   │   └── server.js          # Entry point Express
│   ├── uploads/               # Imagens enviadas pelo admin
│   ├── cardapio.db            # Banco SQLite (gerado pelo seed)
│   ├── .env                   # ⚙️ Variáveis de ambiente
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── admin/
│   │   │   ├── components/
│   │   │   │   └── AdminLayout.jsx   # Layout com sidebar
│   │   │   └── pages/
│   │   │       ├── Dashboard.jsx     # Resumo do dia
│   │   │       ├── Login.jsx         # Tela de login
│   │   │       ├── MenuAdmin.jsx     # Gestão de cardápio
│   │   │       ├── Orders.jsx        # Gestão de pedidos
│   │   │       └── Settings.jsx      # Configurações do restaurante
│   │   ├── components/
│   │   │   ├── Cart.jsx              # Carrinho lateral animado
│   │   │   ├── CategoryTabs.jsx      # Abas de categoria com scroll
│   │   │   ├── Hero.jsx              # Banner animado da home
│   │   │   ├── Navbar.jsx            # Barra de navegação
│   │   │   ├── OrderStatus.jsx       # Barra de progresso do pedido
│   │   │   ├── ProductCard.jsx       # Card do produto com animações
│   │   │   └── ProductModal.jsx      # Modal de opções / detalhes
│   │   ├── context/
│   │   │   ├── AuthContext.jsx       # Estado de autenticação do admin
│   │   │   └── CartContext.jsx       # Estado do carrinho (localStorage)
│   │   ├── pages/
│   │   │   ├── Checkout.jsx          # Fluxo de checkout em 4 etapas
│   │   │   ├── Home.jsx              # Página inicial com hero
│   │   │   ├── Menu.jsx              # Cardápio completo com busca
│   │   │   └── OrderTracking.jsx     # Acompanhar status do pedido
│   │   ├── utils/
│   │   │   ├── api.js                # Axios configurado + interceptors
│   │   │   └── format.js             # formatCurrency, buildWhatsAppLink etc.
│   │   ├── theme.config.js           # ⚙️ Configuração visual white-label
│   │   ├── App.jsx                   # Rotas React Router
│   │   ├── index.css                 # Tailwind + classes customizadas
│   │   └── main.jsx                  # Entry point + aplica CSS vars do tema
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── package.json   # Scripts convenientes para rodar os dois
└── README.md
```

---

## ⚙️ Como personalizar para um novo cliente

### Passo 1 — Alterar `frontend/src/theme.config.js`

```js
const theme = {
  restaurantName: 'Nome do Novo Cliente',
  restaurantSlogan: 'O slogan do restaurante',
  whatsapp: '5511888888888',   // WhatsApp de recebimento de pedidos

  colors: {
    primary: '#FF6B35',    // Cor principal (botões, destaques)
    secondary: '#2E4057',  // Cor secundária
    accent: '#FFD166',     // Cor de destaque / promoções
  },

  hero: {
    images: [
      // URLs das fotos do restaurante para o carrossel
      'https://...',
    ],
  },
};
```

### Passo 2 — Alterar `backend/.env`

```env
RESTAURANT_NAME=Nome do Novo Cliente
RESTAURANT_WHATSAPP=5511888888888
```

### Passo 3 — Popular com cardápio real

Edite `backend/src/database/seed.js` com as categorias e produtos reais do cliente, depois:

```bash
cd backend && npm run seed
```

### Passo 4 — Alterar as imagens

No seed ou pelo painel admin, troque as URLs de imagem por fotos reais do restaurante.

---

## 🔌 Integração com Gateway de Pagamento (futuro)

No arquivo `frontend/src/pages/Checkout.jsx`, encontre o comentário:

```jsx
{/* ⚠️ INTEGRAÇÃO FUTURA: Substituir estas opções por SDK do Mercado Pago ou Stripe */}
```

**Mercado Pago (Brasil):**
1. Instalar: `npm install @mercadopago/sdk-react`
2. Substituir a seleção de pagamento pelo componente `<Payment />` do SDK
3. Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-bricks/payment-brick/introduction

**Stripe:**
1. Instalar: `npm install @stripe/stripe-js @stripe/react-stripe-js`
2. Criar Payment Intent no backend via `stripe.paymentIntents.create()`
3. Documentação: https://stripe.com/docs/payments/quickstart

---

## 🛢️ Migração para PostgreSQL

O banco está em SQLite (arquivo `cardapio.db`). Para migrar para PostgreSQL em produção:

1. No `backend/src/database/db.js`, troque `require('node:sqlite')` por `pg` ou `knex`
2. As queries usam SQL padrão (sem recursos específicos do SQLite)
3. Troque as strings `datetime('now')` por `NOW()` no PostgreSQL

---

## 🔑 Segurança em produção

- Troque `JWT_SECRET` no `.env` por uma string aleatória longa (32+ caracteres)
- Altere a senha do admin pela tela de Configurações → Segurança
- Coloque o backend atrás de um proxy reverso (nginx/caddy) com HTTPS
- Configure CORS em `backend/src/server.js` para permitir apenas o domínio de produção

---

## 📡 Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/settings` | Config pública do restaurante |
| GET | `/api/categories` | Categorias ativas |
| GET | `/api/products/menu` | Cardápio completo agrupado |
| GET | `/api/products` | Lista de produtos (filtros via query) |
| POST | `/api/orders` | Criar pedido |
| GET | `/api/orders/track/:number` | Status público do pedido |
| POST | `/api/auth/login` | Login do admin |
| GET | `/api/orders` | **[Admin]** Lista de pedidos |
| GET | `/api/orders/dashboard` | **[Admin]** Resumo do dia |
| PATCH | `/api/orders/:id/status` | **[Admin]** Atualizar status |
| PUT | `/api/settings` | **[Admin]** Salvar configurações |
