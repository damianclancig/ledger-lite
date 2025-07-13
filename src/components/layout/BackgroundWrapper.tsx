"use client";
import React, { useState, useEffect, useRef } from "react";

const ShootingStar = () => {
  const starRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const star = starRef.current;
    if (!star) return;

    // Configuración de la animación
    const startY = Math.random() * 100;
    const duration = 4000 + Math.random() * 2000;
    const delay = Math.random() * 3000;
    const startTime = Date.now() + delay;
    let animationFrame: number;

    const animate = () => {
      const currentTime = Date.now();
      if (currentTime < startTime) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Movimiento
      const xPos = easeProgress * 110;
      const yPos = Math.sin(progress * Math.PI) * 15;

      // Efectos visuales
      let opacity;
      if (progress < 0.2) {
        opacity = progress * 5;
      } else if (progress > 0.8) {
        opacity = 1 - ((progress - 0.8) * 5);
      } else {
        opacity = 1;
      }

      const size = 0.5 + Math.sin(progress * Math.PI);

      if (star) {
        star.style.transform = `translate(${xPos}vw, ${yPos}vh) scale(${size})`;
        star.style.opacity = `${opacity}`;
      }

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setVisible(false);
      }
    };

    // Estilo inicial
    star.style.top = `${startY}%`;
    star.style.left = `-30px`;
    star.style.opacity = '0';

    const timeout = setTimeout(() => {
      animationFrame = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  if (!visible) return null;

  return (
    <div 
      ref={starRef}
      className="absolute font-bold pointer-events-none"
      style={{
        color: '#1E3A8A',
        textShadow: '0 0 8px rgba(30, 58, 138, 0.8), 0 0 16px rgba(56, 103, 214, 0.6)',
        willChange: 'transform, opacity',
        transition: 'opacity 0.1s linear',
        zIndex: 10,
        fontSize: '24px'
      }}
    >
      $
    </div>
  );
};

export function BackgroundWrapper({ children }: { children: React.ReactNode }) {
  const [stars, setStars] = useState<number[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    const createStar = () => {
      setStars(prev => [...prev, counter.current++]);
    };

    const interval = setInterval(createStar, 500 + Math.random() * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (stars.length > 15) {
      setStars(prev => prev.slice(prev.length - 15));
    }
  }, [stars.length]);

  return (
    <div className="relative min-h-full w-full overflow-hidden bg-background">
      {/* Fondo original exactamente como lo tenías */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 animate-[gradient_15s_ease_infinite]"></div>
      
      {/* Estrellas fugaces */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {stars.map(id => <ShootingStar key={id} />)}
      </div>

      {/* Contenido */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}