import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, Package, Truck, Home } from 'lucide-react';
import { STATUS_STEPS, STATUS_LABELS } from '../utils/format';

const STEP_ICONS = {
  received: Package,
  preparing: Clock,
  out_for_delivery: Truck,
  delivered: Home,
};

export default function OrderStatus({ status }) {
  const currentIndex = STATUS_STEPS.indexOf(status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <span className="text-4xl">❌</span>
        <p className="text-red-600 font-semibold mt-2">Pedido Cancelado</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      {/* Barra de progresso */}
      <div className="relative mb-6">
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full mx-10" />
        <motion.div
          className="absolute top-5 left-0 h-1 rounded-full mx-10"
          style={{ backgroundColor: 'var(--color-primary)' }}
          initial={{ width: '0%' }}
          animate={{
            width: currentIndex === 0 ? '0%'
              : currentIndex === 1 ? '33%'
              : currentIndex === 2 ? '66%'
              : '100%',
          }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />

        {/* Etapas */}
        <div className="relative flex justify-between">
          {STATUS_STEPS.map((step, i) => {
            const Icon = STEP_ICONS[step];
            const isDone = i < currentIndex;
            const isCurrent = i === currentIndex;

            return (
              <div key={step} className="flex flex-col items-center gap-2 flex-1">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{
                    scale: isCurrent ? [1, 1.15, 1] : 1,
                  }}
                  transition={isCurrent ? { duration: 0.5, repeat: Infinity, repeatDelay: 2 } : {}}
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    isDone
                      ? 'border-primary bg-primary text-white'
                      : isCurrent
                      ? 'border-primary bg-white text-primary shadow-lg'
                      : 'border-gray-200 bg-white text-gray-300'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle size={20} />
                  ) : (
                    <Icon size={18} />
                  )}
                </motion.div>
                <span className={`text-xs font-medium text-center leading-tight ${
                  isCurrent ? 'text-primary' : isDone ? 'text-gray-600' : 'text-gray-300'
                }`}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status atual destacado */}
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-3 rounded-xl"
        style={{ backgroundColor: 'var(--color-primary)10', border: '1px solid var(--color-primary)30' }}
      >
        <p className="font-semibold text-primary">{STATUS_LABELS[status]}</p>
      </motion.div>
    </div>
  );
}
