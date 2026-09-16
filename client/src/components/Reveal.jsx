import { motion, useReducedMotion } from 'framer-motion';

const OFFSETS = {
  up: { y: 28, x: 0 },
  down: { y: -28, x: 0 },
  left: { x: 32, y: 0 },
  right: { x: -32, y: 0 },
  none: { x: 0, y: 0 }
};

/**
 * Görünüm alanına girince bir kez oynayan yumuşak giriş animasyonu.
 */
export default function Reveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  amount = 0.18,
  style
}) {
  const reduced = useReducedMotion();
  const offset = OFFSETS[direction] || OFFSETS.up;

  if (reduced) return <div style={style}>{children}</div>;

  return (
    <motion.div
      initial={{ opacity: 0, ...offset }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, amount, margin: '0px 0px -80px 0px' }}
      transition={{ duration, delay, ease: [0.22, 0.61, 0.36, 1] }}
      style={{ willChange: 'transform, opacity', ...style }}
    >
      {children}
    </motion.div>
  );
}
