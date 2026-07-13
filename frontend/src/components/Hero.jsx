import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import theme from '../theme.config';

export default function Hero({ onScrollToMenu }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { images, floatingIcons, ctaText, ctaSecondaryText } = theme.hero;

  // Rotação automática do carrossel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(s => (s + 1) % images.length);
    }, theme.animation.heroCarouselInterval);
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
      {/* Carrossel de imagens de fundo */}
      <AnimatePresence mode="sync">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={images[currentSlide]}
            alt="Prato em destaque"
            className="w-full h-full object-cover"
            loading={currentSlide === 0 ? 'eager' : 'lazy'}
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay gradiente */}
      <div className="absolute inset-0 hero-overlay" />

      {/* Ícones flutuantes de fundo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingIcons.map((icon, i) => (
          <motion.span
            key={i}
            className="absolute text-3xl select-none opacity-20"
            style={{
              left: `${8 + (i * 12) % 85}%`,
              top: `${10 + (i * 17) % 70}%`,
              animationDelay: `${i * 0.8}s`,
            }}
            animate={{
              y: [0, -15, -8, -15, 0],
              rotate: [0, 5, -3, 5, 0],
            }}
            transition={{
              duration: 6 + (i % 3) * 2,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 0.6,
            }}
          >
            {icon}
          </motion.span>
        ))}
      </div>

      {/* Conteúdo central do Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-6">
        {/* Logo / Nome do restaurante */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt={theme.restaurantName} className="h-24 mx-auto mb-4 drop-shadow-lg" />
          ) : (
            <div className="mb-2">
              <span className="text-6xl">🍽️</span>
            </div>
          )}
          <h1
            className="text-5xl md:text-7xl font-bold text-white mb-3 drop-shadow-lg"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {theme.restaurantName}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-white/85 text-xl md:text-2xl mb-10 font-light"
        >
          {theme.restaurantSlogan}
        </motion.p>

        {/* Botões de ação */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <motion.button
            onClick={onScrollToMenu}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary text-lg px-8 py-4 shadow-xl"
          >
            🍴 {ctaText}
          </motion.button>
          <motion.button
            onClick={onScrollToMenu}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="bg-white/15 backdrop-blur-sm border-2 border-white/50 text-white font-semibold text-lg px-8 py-4 rounded-xl hover:bg-white/25 transition-all"
          >
            📱 {ctaSecondaryText}
          </motion.button>
        </motion.div>

        {/* Indicadores do carrossel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex gap-2 mt-10"
        >
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </motion.div>
      </div>

      {/* Seta para rolar */}
      <motion.button
        onClick={onScrollToMenu}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 hover:text-white"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        aria-label="Rolar para o cardápio"
      >
        <ChevronDown size={36} />
      </motion.button>
    </section>
  );
}
