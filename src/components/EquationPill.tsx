────────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';

interface EquationPillProps {
  values: number[];
  result: number;
  operator?: string;
  id?: string;
}

export const EquationPill: React.FC<EquationPillProps> = ({ 
  values, 
  result, 
  operator = '+',
  id 
}) => {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px 32px',
        borderRadius: 32,
        boxShadow: '0 10px 25px -5px rgba(15,23,42,0.1), 0 8px 10px -6px rgba(15,23,42,0.1)',
        border: '1.5px solid #e2e8f0',
        fontWeight: 850,
        fontSize: 'clamp(28px, 4vw, 48px)',
        color: '#1e293b',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: '94%'
      }}
    >
      <div style={{ 
        color: '#10b981', 
        display: 'flex', 
        alignItems: 'center' 
      }}>
        <CheckCircle2 size={24} strokeWidth={4} />
      </div>
      {values.join(` ${operator} `)} = {result}
    </motion.div>
  );
};
────────────────────────────────────────────────────────────────────────────────
