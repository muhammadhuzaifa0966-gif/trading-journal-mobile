import React from 'react';
import { motion } from 'framer-motion';

export const Page = ({ title, subtitle, children, right }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="px-4 pt-5 pb-6">
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </motion.div>
);

export const Card = ({ title, children, className = '' }) => (
  <div className={`rounded-2xl bg-gradient-to-br from-secondary to-primary border border-gray-700 p-4 ${className}`}>
    {title && <h2 className="text-base font-bold mb-3">{title}</h2>}
    {children}
  </div>
);

export const Stat = ({ label, value, sub, tone }) => (
  <div className="rounded-2xl bg-gradient-to-br from-secondary to-primary border border-gray-700 p-4">
    <p className="text-xs text-gray-400">{label}</p>
    <p className={`text-xl font-bold mt-1 ${tone === 'up' ? 'text-success' : tone === 'down' ? 'text-danger' : 'text-white'}`}>{value}</p>
    {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
  </div>
);

export const Empty = ({ children }) => <p className="text-center text-gray-400 text-sm py-10">{children}</p>;

export const inputClass =
  'w-full px-3.5 py-3 rounded-xl bg-primary border border-gray-600 text-white placeholder-gray-500 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 text-base';

export const Field = ({ label, children, hint }) => (
  <label className="block">
    <span className="block text-xs font-semibold text-gray-300 mb-1.5">{label}</span>
    {children}
    {hint && <span className="block text-[11px] text-gray-500 mt-1.5">{hint}</span>}
  </label>
);

export const tooltipProps = {
  contentStyle: { backgroundColor: '#1E293B', border: '1px solid #3B82F6', borderRadius: 10, color: '#F9FAFB' },
  itemStyle: { color: '#F9FAFB' },
  labelStyle: { color: '#FFFFFF', fontWeight: 600 },
  cursor: { fill: 'rgba(59,130,246,0.08)' },
};
export const tick = { fill: '#D1D5DB', fontSize: 11 };

// Slide-up sheet
export const Sheet = ({ open, onClose, title, children }) =>
  open ? (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[92%] overflow-y-auto rounded-t-3xl bg-secondary border-t border-gray-600 p-5 safe-bottom"
      >
        <div className="w-10 h-1 rounded-full bg-gray-600 mx-auto mb-4" />
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        {children}
      </motion.div>
    </div>
  ) : null;
