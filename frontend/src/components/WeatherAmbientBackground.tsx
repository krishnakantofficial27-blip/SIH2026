import React, { useEffect, useRef, useState } from 'react';
import './WeatherAmbient.css';

export type WeatherConditionType = 'auto' | 'clear' | 'rain' | 'storm' | 'fog' | 'cloudy' | 'night';

export interface WeatherAmbientProps {
  currentCondition: WeatherConditionType;
  resolvedCondition: 'clear' | 'rain' | 'storm' | 'fog' | 'cloudy' | 'night';
  weatherDetails?: {
    temp?: number;
    rainfall?: number;
    conditionName?: string;
    locationName?: string;
  };
}

interface Particle {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  size: number;
  dx?: number;
  dy?: number;
  twinkleSpeed?: number;
  pulsePhase?: number;
}

export const WeatherAmbientBackground: React.FC<WeatherAmbientProps> = ({
  resolvedCondition,
  weatherDetails,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lightningFlash, setLightningFlash] = useState(false);

  // Storm lightning periodic flashes
  useEffect(() => {
    if (resolvedCondition !== 'storm') {
      setLightningFlash(false);
      return;
    }

    let timeoutId: number;
    const triggerLightning = () => {
      // Random delay between 4 to 10 seconds
      const nextDelay = Math.random() * 6000 + 4000;
      timeoutId = window.setTimeout(() => {
        setLightningFlash(true);
        // Double flash effect
        setTimeout(() => {
          setLightningFlash(false);
          setTimeout(() => {
            setLightningFlash(true);
            setTimeout(() => {
              setLightningFlash(false);
              triggerLightning();
            }, 60);
          }, 80);
        }, 100);
      }, nextDelay);
    };

    triggerLightning();
    return () => clearTimeout(timeoutId);
  }, [resolvedCondition]);

  // Particle Canvas System (Rain, Storm, Fog, Sun motes, Stars)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Initialize particles based on condition
    const particles: Particle[] = [];
    const count = 
      resolvedCondition === 'storm' ? 160 :
      resolvedCondition === 'rain' ? 90 :
      resolvedCondition === 'fog' ? 24 :
      resolvedCondition === 'night' ? 75 :
      resolvedCondition === 'clear' ? 30 : 20;

    for (let i = 0; i < count; i++) {
      if (resolvedCondition === 'rain' || resolvedCondition === 'storm') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: resolvedCondition === 'storm' ? Math.random() * 25 + 18 : Math.random() * 18 + 10,
          speed: resolvedCondition === 'storm' ? Math.random() * 12 + 16 : Math.random() * 8 + 10,
          opacity: Math.random() * 0.4 + 0.25,
          size: Math.random() * 1.5 + 0.8,
          dx: resolvedCondition === 'storm' ? -3 - Math.random() * 2 : -1.5,
        });
      } else if (resolvedCondition === 'fog') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 0,
          speed: Math.random() * 0.3 + 0.1,
          opacity: Math.random() * 0.15 + 0.05,
          size: Math.random() * 180 + 120,
          dx: Math.random() * 0.4 + 0.1,
          dy: (Math.random() - 0.5) * 0.1,
        });
      } else if (resolvedCondition === 'night') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.75,
          length: 0,
          speed: 0,
          opacity: Math.random() * 0.7 + 0.2,
          size: Math.random() * 1.8 + 0.6,
          twinkleSpeed: Math.random() * 0.03 + 0.01,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      } else if (resolvedCondition === 'clear') {
        // Sun dust motes & golden floating particles
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 0,
          speed: Math.random() * 0.4 + 0.2,
          opacity: Math.random() * 0.45 + 0.15,
          size: Math.random() * 3 + 1,
          dx: (Math.random() - 0.5) * 0.3,
          dy: -Math.random() * 0.5 - 0.2,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      } else {
        // Cloudy soft drift
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.6,
          length: 0,
          speed: Math.random() * 0.2 + 0.05,
          opacity: Math.random() * 0.08 + 0.03,
          size: Math.random() * 140 + 80,
          dx: Math.random() * 0.3 + 0.05,
        });
      }
    }

    // Shooting star state for night
    let shootingStar: { x: number; y: number; dx: number; dy: number; length: number; opacity: number; active: boolean } = {
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      length: 0,
      opacity: 0,
      active: false,
    };

    let frameCount = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      frameCount++;

      if (resolvedCondition === 'rain' || resolvedCondition === 'storm') {
        ctx.strokeStyle = resolvedCondition === 'storm' ? 'rgba(186, 230, 253, 0.65)' : 'rgba(125, 211, 252, 0.45)';
        ctx.lineWidth = resolvedCondition === 'storm' ? 1.6 : 1.2;
        ctx.beginPath();

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          ctx.moveTo(p.x, p.y);
          const endX = p.x + (p.dx || -1.5) * (p.length / 8);
          const endY = p.y + p.length;
          ctx.lineTo(endX, endY);

          p.x += p.dx || -1.5;
          p.y += p.speed;

          if (p.y > height) {
            p.y = -p.length;
            p.x = Math.random() * (width + 100);
          }
          if (p.x < -50) {
            p.x = width + 50;
          }
        }
        ctx.stroke();

        // Subtle splash ripples on bottom for storm/rain
        if (resolvedCondition === 'storm' && frameCount % 3 === 0) {
          ctx.fillStyle = 'rgba(186, 230, 253, 0.2)';
          for (let s = 0; s < 4; s++) {
            const rx = Math.random() * width;
            const ry = height - Math.random() * 40;
            ctx.beginPath();
            ctx.ellipse(rx, ry, Math.random() * 8 + 3, Math.random() * 2 + 1, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else if (resolvedCondition === 'fog') {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(204, 251, 241, ${p.opacity})`);
          grad.addColorStop(0.6, `rgba(153, 246, 228, ${p.opacity * 0.4})`);
          grad.addColorStop(1, 'rgba(153, 246, 228, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.dx || 0.2;
          p.y += p.dy || 0;
          if (p.x - p.size > width) {
            p.x = -p.size;
            p.y = Math.random() * height;
          }
        }
      } else if (resolvedCondition === 'night') {
        // Twinkling stars
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.pulsePhase = (p.pulsePhase || 0) + (p.twinkleSpeed || 0.02);
          const currentOpacity = Math.max(0.1, p.opacity * (0.6 + 0.4 * Math.sin(p.pulsePhase)));

          ctx.fillStyle = `rgba(240, 249, 255, ${currentOpacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Subtle star cross glow for larger stars
          if (p.size > 1.4 && currentOpacity > 0.6) {
            ctx.strokeStyle = `rgba(224, 242, 254, ${currentOpacity * 0.4})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x - p.size * 3, p.y);
            ctx.lineTo(p.x + p.size * 3, p.y);
            ctx.moveTo(p.x, p.y - p.size * 3);
            ctx.lineTo(p.x, p.y + p.size * 3);
            ctx.stroke();
          }
        }

        // Periodic shooting star
        if (!shootingStar.active && Math.random() < 0.005) {
          shootingStar = {
            x: Math.random() * (width * 0.7) + width * 0.2,
            y: Math.random() * (height * 0.3),
            dx: -(Math.random() * 8 + 12),
            dy: Math.random() * 5 + 6,
            length: Math.random() * 80 + 60,
            opacity: 1,
            active: true,
          };
        }

        if (shootingStar.active) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${shootingStar.opacity})`;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(shootingStar.x, shootingStar.y);
          ctx.lineTo(
            shootingStar.x - (shootingStar.dx / 15) * shootingStar.length,
            shootingStar.y - (shootingStar.dy / 15) * shootingStar.length
          );
          ctx.stroke();

          shootingStar.x += shootingStar.dx;
          shootingStar.y += shootingStar.dy;
          shootingStar.opacity -= 0.025;

          if (shootingStar.opacity <= 0) {
            shootingStar.active = false;
          }
        }
      } else if (resolvedCondition === 'clear') {
        // Floating luminous golden sun motes
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.pulsePhase = (p.pulsePhase || 0) + 0.02;
          const currentSize = p.size * (0.8 + 0.2 * Math.sin(p.pulsePhase));

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 2.5);
          grad.addColorStop(0, `rgba(254, 240, 138, ${p.opacity})`);
          grad.addColorStop(0.5, `rgba(251, 191, 36, ${p.opacity * 0.4})`);
          grad.addColorStop(1, 'rgba(251, 191, 36, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize * 2.5, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.dx || 0;
          p.y += p.dy || -0.3;

          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x > width + 10) p.x = -10;
          if (p.x < -10) p.x = width + 10;
        }
      } else {
        // Cloudy rolling mist
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(148, 163, 184, ${p.opacity})`);
          grad.addColorStop(0.8, `rgba(100, 116, 139, ${p.opacity * 0.3})`);
          grad.addColorStop(1, 'rgba(71, 85, 105, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.dx || 0.15;
          if (p.x - p.size > width) {
            p.x = -p.size;
            p.y = Math.random() * (height * 0.6);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [resolvedCondition]);

  return (
    <div className={`weather-ambient-wrapper condition-${resolvedCondition} ${lightningFlash ? 'lightning-active' : ''}`}>
      {/* Background Gradient Mesh Layers */}
      <div className="weather-ambient-backdrop" />
      <div className="weather-ambient-light-glow" />
      <div className="weather-ambient-topography-tint" />

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="weather-ambient-canvas" />

      {/* Lightning Flash Overlay (for Storm) */}
      <div className="weather-lightning-overlay" />
    </div>
  );
};
