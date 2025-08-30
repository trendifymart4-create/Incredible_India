import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface FloatingParticlesProps {
  count?: number;
  color?: string;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  count = 20,
  color = '#ff6b35'
}) => {
  const [particles] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full opacity-20"
          style={{
            backgroundColor: color,
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`
          }}
          animate={{
            y: [0, -20, 0],
            x: [0, 10, 0],
            opacity: [0.1, 0.3, 0.1]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

export const DynamicGradientBackground: React.FC = () => {
  const [gradientState, setGradientState] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setGradientState(prev => (prev + 1) % 3);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const gradients = [
    'linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 154, 158, 0.1) 100%)',
    'linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(80, 200, 120, 0.1) 100%)',
    'linear-gradient(135deg, rgba(162, 155, 254, 0.1) 0%, rgba(255, 107, 53, 0.1) 100%)'
  ];

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: gradients[gradientState]
      }}
      animate={{
        background: gradients[gradientState]
      }}
      transition={{
        duration: 2,
        ease: "easeInOut"
      }}
    />
  );
};