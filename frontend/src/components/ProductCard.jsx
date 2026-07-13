import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Clock } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import theme from '../theme.config';
import ProductModal from './ProductModal';

export default function ProductCard({ product, index = 0 }) {
  const [showModal, setShowModal] = useState(false);
  const [flyAnim, setFlyAnim] = useState(false);
  const cardRef = useRef(null);

  function handleAddClick(e) {
    e.stopPropagation();
    if (product.options?.length > 0) {
      setShowModal(true);
    } else {
      triggerFlyAnimation();
    }
  }

  function triggerFlyAnimation() {
    setFlyAnim(true);
    setTimeout(() => setFlyAnim(false), 700);
  }

  const hasPromo = product.promo_price && product.promo_price < product.price;
  const displayPrice = hasPromo ? product.promo_price : product.price;

  return (
    <>
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay: index * theme.animation.staggerDelay,
          ease: 'easeOut',
        }}
        whileHover={{
          y: -4,
          scale: theme.animation.cardHoverScale,
          boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
        }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowModal(true)}
        className="card cursor-pointer group bg-white"
        style={{ transition: 'box-shadow 0.3s ease' }}
      >
        {/* Imagem com zoom no hover */}
        <div className="relative overflow-hidden aspect-[4/3]">
          {product.image_url ? (
            <motion.img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              onError={e => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=60'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl"
              style={{ background: 'linear-gradient(135deg, #f5f5f5, #e8e8e8)' }}>
              🍽️
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.featured === 1 && (
              <span className="badge badge-accent flex items-center gap-1">
                <Star size={10} /> Destaque
              </span>
            )}
            {hasPromo && (
              <span className="promo-tag">
                -{Math.round((1 - product.promo_price / product.price) * 100)}%
              </span>
            )}
          </div>

          {/* Porções */}
          {product.serves > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
              Serve {product.serves}
            </div>
          )}

          {/* Animação "voo" ao adicionar sem opções */}
          <AnimatePresence>
            {flyAnim && (
              <motion.div
                initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                animate={{ opacity: 0, scale: 0.3, x: 150, y: -200 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeIn' }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl pointer-events-none z-20"
              >
                🛒
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Conteúdo do card */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-base leading-snug mb-1 line-clamp-2">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          {/* Preço e botão de adicionar */}
          <div className="flex items-center justify-between mt-auto">
            <div>
              {hasPromo ? (
                <>
                  <span className="text-gray-400 text-sm line-through mr-1">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-lg font-bold text-accent">
                    {formatCurrency(displayPrice)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(displayPrice)}
                </span>
              )}
            </div>

            <motion.button
              onClick={handleAddClick}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}
              aria-label={`Adicionar ${product.name}`}
            >
              <Plus size={20} strokeWidth={2.5} />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Modal de detalhes / opções */}
      <AnimatePresence>
        {showModal && (
          <ProductModal
            product={product}
            onClose={() => setShowModal(false)}
            onAdded={triggerFlyAnimation}
          />
        )}
      </AnimatePresence>
    </>
  );
}
