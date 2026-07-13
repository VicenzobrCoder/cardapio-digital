import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'cardapio_cart';

const initialState = {
  items: [],
  isOpen: false,
  cartIconRef: null,
};

function cartReducer(state, action) {
  switch (action.type) {
    case 'LOAD': return { ...state, items: action.items };

    case 'ADD_ITEM': {
      const key = itemKey(action.item);
      const existing = state.items.find(i => itemKey(i) === key);
      if (existing) {
        return {
          ...state,
          items: state.items.map(i =>
            itemKey(i) === key ? { ...i, quantity: i.quantity + (action.item.quantity || 1) } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { ...action.item, quantity: action.item.quantity || 1 }] };
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter(i => itemKey(i) !== action.key) };

    case 'UPDATE_QUANTITY': {
      if (action.quantity <= 0) {
        return { ...state, items: state.items.filter(i => itemKey(i) !== action.key) };
      }
      return {
        ...state,
        items: state.items.map(i =>
          itemKey(i) === action.key ? { ...i, quantity: action.quantity } : i
        ),
      };
    }

    case 'CLEAR': return { ...state, items: [] };
    case 'TOGGLE': return { ...state, isOpen: !state.isOpen };
    case 'OPEN': return { ...state, isOpen: true };
    case 'CLOSE': return { ...state, isOpen: false };

    default: return state;
  }
}

function itemKey(item) {
  const optionsStr = item.selected_options
    ? JSON.stringify(item.selected_options.map(o => o.id).sort())
    : '';
  return `${item.product_id}_${optionsStr}_${item.notes || ''}`;
}

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Carregar carrinho do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) dispatch({ type: 'LOAD', items: JSON.parse(saved) });
    } catch {}
  }, []);

  // Salvar no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
  }, [state.items]);

  const addItem = useCallback((item) => {
    dispatch({ type: 'ADD_ITEM', item });
  }, []);

  const removeItem = useCallback((key) => {
    dispatch({ type: 'REMOVE_ITEM', key });
  }, []);

  const updateQuantity = useCallback((key, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', key, quantity });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: 'CLEAR' }), []);
  const toggleCart = useCallback(() => dispatch({ type: 'TOGGLE' }), []);
  const openCart = useCallback(() => dispatch({ type: 'OPEN' }), []);
  const closeCart = useCallback(() => dispatch({ type: 'CLOSE' }), []);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + (i.unit_price * i.quantity), 0);
  const getItemKey = itemKey;

  return (
    <CartContext.Provider value={{
      items: state.items,
      isOpen: state.isOpen,
      totalItems,
      totalPrice,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      toggleCart,
      openCart,
      closeCart,
      getItemKey,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}
