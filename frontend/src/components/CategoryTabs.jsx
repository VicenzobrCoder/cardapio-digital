import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CategoryTabs({ categories, activeId, onChange }) {
  const tabsRef = useRef(null);
  const activeRef = useRef(null);

  // Scroll automático para a categoria ativa em mobile
  useEffect(() => {
    if (activeRef.current && tabsRef.current) {
      const container = tabsRef.current;
      const el = activeRef.current;
      const offset = el.offsetLeft - container.offsetWidth / 2 + el.offsetWidth / 2;
      container.scrollTo({ left: offset, behavior: 'smooth' });
    }
  }, [activeId]);

  return (
    <div className="sticky top-[60px] z-20 bg-white/95 backdrop-blur-sm shadow-sm">
      <div
        ref={tabsRef}
        className="flex overflow-x-auto scrollbar-hide max-w-6xl mx-auto px-4 gap-2 py-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {categories.map(cat => {
          const isActive = cat.id === activeId;
          return (
            <motion.button
              key={cat.id}
              ref={isActive ? activeRef : null}
              onClick={() => onChange(cat.id)}
              whileTap={{ scale: 0.95 }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={isActive ? { backgroundColor: 'var(--color-primary)' } : {}}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              {cat.product_count > 0 && (
                <span className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                  ({cat.product_count})
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
