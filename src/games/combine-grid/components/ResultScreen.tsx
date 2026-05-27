import React from 'react';
import { motion } from 'motion/react';

interface SummaryScreenProps {
  trophies: number;
  points: number;
  timeTaken: number;
  stars: number;
  target: number;
  isFinal?: boolean;
  onContinue: () => void;
  onRestart: () => void;
  onHome: () => void;
}

export default function SummaryScreen({
  trophies,
  points,
  timeTaken,
  stars,
  target,
  isFinal = false,
  onContinue,
  onRestart,
  onHome,
}: SummaryScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 32,
        fontFamily: 'Nunito, sans-serif',
        background: 'rgba(26, 26, 26, 0.95)',
        backdropFilter: 'blur(4px)',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 2000,
        padding: 24,
        boxSizing: 'border-box',
      }}
    >
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ textAlign: 'center' }}
      >
        <div style={{ color: '#F8A460', fontSize: 13, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
          {isFinal ? '🏆 SESSION COMPLETE 🏆' : `✨ Target Cleared: ${target} ✨`}
        </div>
        <div style={{ color: '#FFFFFF', fontSize: 42, fontWeight: 900, lineHeight: 1.1 }}>
          {isFinal ? 'Impressive Work!' : 'ROUND COMPLETE'}
        </div>
      </motion.div>

      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
        style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '12px 20px', borderRadius: 100 }}
      >
        {[1, 2, 3, 4, 5].map(i => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4 + i * 0.1 }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill={i <= stars ? "#FFD700" : "rgba(255,255,255,0.1)"}>
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </motion.div>
        ))}
      </motion.div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: 12, 
        width: '100%', 
        maxWidth: 360,
      }}>
        <StatCard label="Trophies" value={trophies} delay={0.6} highlight />
        <StatCard label="Score" value={points} delay={0.7} />
        <StatCard label="Speed" value={`${timeTaken}s`} delay={0.8} />
        <StatCard label="Target Cleared" value={target} delay={0.9} />
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1 }}
        style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 300, marginTop: 12 }}
      >
        {!isFinal && (
          <ActionButton label="Next Level" onClick={onContinue} primary />
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <ActionButton label={isFinal ? "Play Again" : "Retry"} onClick={onRestart} />
          <ActionButton label="Quit" onClick={onHome} />
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({ label, value, delay, highlight = false }: { label: string; value: string | number; delay: number; highlight?: boolean }) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay }}
      style={{
        background: highlight ? 'linear-gradient(135deg, rgba(248, 164, 96, 0.2) 0%, rgba(248, 164, 96, 0.05) 100%)' : 'rgba(255, 255, 255, 0.08)',
        padding: '16px 8px',
        borderRadius: 20,
        border: highlight ? '1px solid rgba(248, 164, 96, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center',
        boxShadow: highlight ? '0 0 20px rgba(248, 164, 96, 0.1)' : 'none',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 800, color: highlight ? '#F8A460' : '#A0A0A0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: highlight ? '#F8A460' : '#FFFFFF' }}>{value}</div>
    </motion.div>
  );
}

function ActionButton({ label, onClick, primary = false }: { label: string; onClick: () => void; primary?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{
        flex: 1,
        padding: primary ? '18px 0' : '14px 0',
        borderRadius: 18,
        border: 'none',
        background: primary ? '#F8A460' : 'rgba(255,255,255,0.1)',
        color: primary ? '#000' : '#FFF',
        fontSize: primary ? 18 : 15,
        fontWeight: 900,
        cursor: 'pointer',
        boxShadow: primary ? '0 6px 0 #D67A50' : '0 4px 0 rgba(0,0,0,0.2)',
        textTransform: 'uppercase',
        letterSpacing: 1,
      }}
    >
      {label}
    </motion.button>
  );
}