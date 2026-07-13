import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Star, ArrowRight, Phone } from 'lucide-react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import api from '../utils/api';
import theme from '../theme.config';

export default function Home() {
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then(r => r.data),
  });

  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => api.get('/products?featured=1').then(r => r.data),
  });

  function scrollToMenu() {
    menuRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const openingHours = settings?.opening_hours || {};

  return (
    <div>
      <Hero onScrollToMenu={scrollToMenu} />

      {/* Faixa de informações */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {settings?.address && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-start gap-3"
            >
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--color-primary)15' }}>
                <MapPin size={20} className="text-primary" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Endereço</p>
                <p className="text-gray-500 text-sm">{settings.address}</p>
              </div>
            </motion.div>
          )}

          {Object.keys(openingHours).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex items-start gap-3"
            >
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--color-accent)15' }}>
                <Clock size={20} className="text-accent" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Horários</p>
                {Object.entries(openingHours).map(([days, hours]) => (
                  <p key={days} className="text-gray-500 text-sm">{days}: {hours}</p>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex items-start gap-3"
          >
            <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--color-secondary)15' }}>
              <Phone size={20} className="text-secondary" />
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm">Pedidos via WhatsApp</p>
              <a
                href={`https://wa.me/${theme.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-secondary text-sm hover:underline font-medium"
              >
                Clique para chamar
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Destaques do cardápio */}
      <section ref={menuRef} className="py-16 max-w-6xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 text-accent font-semibold text-sm px-4 py-2 rounded-full mb-4">
            <Star size={14} /> Mais Pedidos
          </div>
          <h2 className="section-title text-4xl mb-3">Destaques do Cardápio</h2>
          <div className="color-bar w-20 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Os pratos favoritos dos nossos clientes</p>
        </motion.div>

        {featuredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {featuredProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <span className="text-5xl">🍽️</span>
            <p className="mt-4">Nenhum destaque disponível no momento</p>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.button
            onClick={() => navigate('/menu')}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary text-lg px-10 py-4"
          >
            Ver Cardápio Completo <ArrowRight size={20} />
          </motion.button>
        </motion.div>
      </section>

      {/* Banner CTA final */}
      <section className="py-20 text-white text-center" style={{
        background: `linear-gradient(135deg, var(--color-primary), var(--color-secondary))`
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto px-4"
        >
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
            Peça agora pelo WhatsApp
          </h2>
          <p className="text-white/80 text-xl mb-8">
            Atendimento rápido e delivery na sua porta
          </p>
          <a
            href={`https://wa.me/${theme.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="bg-white font-bold text-lg px-10 py-4 rounded-xl shadow-xl hover:shadow-2xl transition-all"
              style={{ color: 'var(--color-primary)' }}
            >
              💬 Abrir WhatsApp
            </motion.button>
          </a>
        </motion.div>
      </section>

      {/* Rodapé simples */}
      <footer className="bg-gray-900 text-gray-400 py-8 text-center text-sm">
        <p>© {new Date().getFullYear()} {settings?.restaurant_name || theme.restaurantName}. Todos os direitos reservados.</p>
        {theme.instagram && (
          <p className="mt-1">Instagram: {theme.instagram}</p>
        )}
      </footer>
    </div>
  );
}
