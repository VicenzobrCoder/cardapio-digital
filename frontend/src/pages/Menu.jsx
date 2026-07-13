import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import CategoryTabs from '../components/CategoryTabs';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';

export default function MenuPage() {
  const [activeCategory, setActiveCategory] = useState(null);
  const [search, setSearch] = useState('');
  const categoryRefs = useRef({});

  const { data: menu = [], isLoading } = useQuery({
    queryKey: ['menu'],
    queryFn: () => api.get('/products/menu').then(r => r.data),
  });

  // Definir primeira categoria como ativa
  useEffect(() => {
    if (menu.length > 0 && !activeCategory) {
      setActiveCategory(menu[0].id);
    }
  }, [menu, activeCategory]);

  // Filtrar por pesquisa
  const searchLower = search.toLowerCase().trim();
  const filteredMenu = searchLower
    ? menu.map(cat => ({
        ...cat,
        products: cat.products.filter(p =>
          p.name.toLowerCase().includes(searchLower) ||
          p.description?.toLowerCase().includes(searchLower)
        ),
      })).filter(cat => cat.products.length > 0)
    : menu;

  function handleCategoryClick(id) {
    setActiveCategory(id);
    const el = categoryRefs.current[id];
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  // Observer para atualizar aba ativa ao rolar
  useEffect(() => {
    if (!filteredMenu.length) return;
    const observers = [];
    filteredMenu.forEach(cat => {
      const el = categoryRefs.current[cat.id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveCategory(cat.id); },
        { rootMargin: '-40% 0px -55% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, [filteredMenu]);

  const categoriesForTabs = menu.map(c => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    product_count: c.products.length,
  }));

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Cabeçalho da página */}
      <div
        className="pt-24 pb-8 px-4 text-center"
        style={{ background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))` }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-white mb-2"
          style={{ fontFamily: 'Playfair Display, serif' }}
        >
          Nosso Cardápio
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-white/80 text-lg"
        >
          Escolha seus pratos favoritos
        </motion.p>

        {/* Campo de busca */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="max-w-md mx-auto mt-6 relative"
        >
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar pratos..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-10 py-3 rounded-xl bg-white text-gray-800 placeholder-gray-400 shadow-md focus:outline-none focus:ring-2 focus:ring-white/50 text-base"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
              <X size={16} />
            </button>
          )}
        </motion.div>
      </div>

      {/* Abas de categorias */}
      {!searchLower && (
        <CategoryTabs
          categories={categoriesForTabs}
          activeId={activeCategory}
          onChange={handleCategoryClick}
        />
      )}

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="shimmer aspect-[4/3]" />
                <div className="p-4 space-y-2">
                  <div className="shimmer h-4 rounded w-3/4" />
                  <div className="shimmer h-3 rounded w-full" />
                  <div className="shimmer h-3 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredMenu.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-6xl">🔍</span>
            <p className="text-gray-500 text-lg mt-4">Nenhum prato encontrado para "{search}"</p>
            <button onClick={() => setSearch('')} className="btn-primary mt-6">Limpar busca</button>
          </div>
        ) : (
          filteredMenu.map(category => (
            <section
              key={category.id}
              ref={el => { categoryRefs.current[category.id] = el; }}
              className="mb-14 scroll-mt-32"
            >
              {/* Cabeçalho da categoria */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 mb-6"
              >
                <span className="text-3xl">{category.icon}</span>
                <div>
                  <h2 className="section-title text-2xl">{category.name}</h2>
                  {category.description && (
                    <p className="text-gray-500 text-sm mt-0.5">{category.description}</p>
                  )}
                </div>
                <div className="flex-1 h-px bg-gray-200 ml-2" />
              </motion.div>

              {/* Grid de produtos com animação escalonada */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={category.id}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                  {category.products.map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
                </motion.div>
              </AnimatePresence>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
