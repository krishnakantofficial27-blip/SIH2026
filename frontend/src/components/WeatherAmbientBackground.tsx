import React, { useEffect, useRef, useState } from 'react';
import './WeatherAmbient.css';

export type WeatherConditionType = 'auto' | 'clear' | 'rain' | 'storm' | 'fog' | 'cloudy' | 'night';

export interface WeatherAmbientProps {
  resolvedCondition: 'clear' | 'rain' | 'storm' | 'fog' | 'cloudy' | 'night';
  weatherDetails?: {
    temp?: number;
    rainfall?: number;
    conditionName?: string;
    locationName?: string;
    windspeed?: number;
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
  layer?: number; // 0: background (slow/small), 1: midground, 2: foreground (fast/large)
  twinkleSpeed?: number;
  pulsePhase?: number;
}

interface LightningBranch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
  branches: LightningBranch[];
}

export const WeatherAmbientBackground: React.FC<WeatherAmbientProps> = ({
  resolvedCondition,
  weatherDetails,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [lightningActive, setLightningActive] = useState(false);
  const lightningBoltRef = useRef<LightningBranch[]>([]);

  // ── Procedural Branching Lightning Bolt Generator ──
  const generateLightningBolt = (startX: number, startY: number, length: number, angle: number, depth: number): LightningBranch => {
    const endX = startX + Math.sin(angle) * length;
    const endY = startY + Math.cos(angle) * length;
    const branch: LightningBranch = {
      x1: startX,
      y1: startY,
      x2: endX,
      y2: endY,
      alpha: 1,
      branches: [],
    };

    if (depth > 0) {
      const subSegments = Math.floor(Math.random() * 2) + 1;
      for (let i = 0; i < subSegments; i++) {
        const branchLength = length * (Math.random() * 0.4 + 0.5);
        const branchAngle = angle + (Math.random() - 0.5) * 0.8;
        branch.branches.push(generateLightningBolt(endX, endY, branchLength, branchAngle, depth - 1));
      }
    }
    return branch;
  };

  // Storm Lightning Trigger Loop
  useEffect(() => {
    if (resolvedCondition !== 'storm') {
      setLightningActive(false);
      lightningBoltRef.current = [];
      return;
    }

    let timerId: number;

    const triggerStrike = () => {
      const nextStrikeDelay = Math.random() * 5000 + 3500;
      timerId = window.setTimeout(() => {
        // Generate main fork strike
        const canvas = canvasRef.current;
        const w = canvas ? canvas.width : window.innerWidth;
        const startX = Math.random() * (w * 0.7) + w * 0.15;
        const root = generateLightningBolt(startX, 0, Math.random() * 50 + 60, (Math.random() - 0.5) * 0.4, 4);
        lightningBoltRef.current = [root];
        setLightningActive(true);

        // Multi-stage pulse flash
        setTimeout(() => {
          setLightningActive(false);
          setTimeout(() => {
            setLightningActive(true);
            setTimeout(() => {
              setLightningActive(false);
              lightningBoltRef.current = [];
              triggerStrike();
            }, 80);
          }, 60);
        }, 120);
      }, nextStrikeDelay);
    };

    triggerStrike();
    return () => clearTimeout(timerId);
  }, [resolvedCondition]);

  // ── High-Performance Multi-Layer Particle & Atmosphere Canvas ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Multi-depth 3D Particles
    const particles: Particle[] = [];
    const count =
      resolvedCondition === 'storm' ? 220 :
      resolvedCondition === 'rain' ? 140 :
      resolvedCondition === 'fog' ? 32 :
      resolvedCondition === 'night' ? 95 :
      resolvedCondition === 'clear' ? 45 : 28;

    for (let i = 0; i < count; i++) {
      const layer = Math.floor(Math.random() * 3); // 0 = bg, 1 = mid, 2 = fg
      if (resolvedCondition === 'rain' || resolvedCondition === 'storm') {
        const speedMultiplier = layer === 2 ? 1.4 : layer === 1 ? 1.0 : 0.65;
        particles.push({
          x: Math.random() * (width + 200) - 100,
          y: Math.random() * height,
          length: (resolvedCondition === 'storm' ? Math.random() * 26 + 18 : Math.random() * 18 + 10) * speedMultiplier,
          speed: (resolvedCondition === 'storm' ? Math.random() * 14 + 18 : Math.random() * 10 + 12) * speedMultiplier,
          opacity: (layer === 2 ? 0.65 : layer === 1 ? 0.4 : 0.2),
          size: (layer === 2 ? 1.8 : layer === 1 ? 1.2 : 0.8),
          dx: (resolvedCondition === 'storm' ? -3.5 : -1.8) * speedMultiplier,
          layer,
        });
      } else if (resolvedCondition === 'fog') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 0,
          speed: Math.random() * 0.35 + 0.1,
          opacity: Math.random() * 0.14 + 0.04,
          size: Math.random() * 240 + 140,
          dx: Math.random() * 0.5 + 0.15,
          dy: (Math.random() - 0.5) * 0.1,
          layer,
        });
      } else if (resolvedCondition === 'night') {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.8),
          length: 0,
          speed: 0,
          opacity: Math.random() * 0.75 + 0.25,
          size: Math.random() * 2.2 + 0.6,
          twinkleSpeed: Math.random() * 0.035 + 0.012,
          pulsePhase: Math.random() * Math.PI * 2,
          layer,
        });
      } else if (resolvedCondition === 'clear') {
        // Golden sun motes & floating pollen
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          length: 0,
          speed: Math.random() * 0.5 + 0.2,
          opacity: Math.random() * 0.5 + 0.2,
          size: Math.random() * 3.5 + 1.2,
          dx: (Math.random() - 0.5) * 0.4,
          dy: -Math.random() * 0.6 - 0.2,
          pulsePhase: Math.random() * Math.PI * 2,
          layer,
        });
      } else {
        // Cloudy vapor drift
        particles.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.65),
          length: 0,
          speed: Math.random() * 0.25 + 0.08,
          opacity: Math.random() * 0.1 + 0.03,
          size: Math.random() * 180 + 100,
          dx: Math.random() * 0.35 + 0.1,
          layer,
        });
      }
    }

    // Shooting Star for Night
    let shootingStar: { x: number; y: number; dx: number; dy: number; length: number; opacity: number; active: boolean } = {
      x: 0, y: 0, dx: 0, dy: 0, length: 0, opacity: 0, active: false
    };

    let frame = 0;

    // Helper to draw recursive lightning branches
    const renderLightningBranch = (b: LightningBranch, alpha: number) => {
      ctx.strokeStyle = `rgba(224, 231, 255, ${alpha * 0.9})`;
      ctx.shadowColor = 'rgba(147, 197, 253, 0.9)';
      ctx.shadowBlur = 16;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();

      // Inner core glow
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.0;
      ctx.stroke();

      for (const sub of b.branches) {
        renderLightningBranch(sub, alpha * 0.75);
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.shadowBlur = 0;
      frame++;

      // ── 1. RAIN & STORM RENDERING ──
      if (resolvedCondition === 'rain' || resolvedCondition === 'storm') {
        // Draw falling multi-depth rain streaks
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          ctx.strokeStyle = p.layer === 2 
            ? 'rgba(224, 242, 254, 0.75)'
            : p.layer === 1 
            ? 'rgba(186, 230, 253, 0.45)'
            : 'rgba(125, 211, 252, 0.25)';
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + (p.dx || -1.8) * (p.length / 8), p.y + p.length);
          ctx.stroke();

          p.x += p.dx || -1.8;
          p.y += p.speed;

          if (p.y > height) {
            p.y = -p.length;
            p.x = Math.random() * (width + 150);
          }
          if (p.x < -60) p.x = width + 60;
        }

        // Draw ground & viewport edge splash ripples
        if (frame % 2 === 0) {
          ctx.fillStyle = resolvedCondition === 'storm' ? 'rgba(224, 242, 254, 0.25)' : 'rgba(186, 230, 253, 0.15)';
          const splashCount = resolvedCondition === 'storm' ? 5 : 2;
          for (let s = 0; s < splashCount; s++) {
            const rx = Math.random() * width;
            const ry = height - Math.random() * 35;
            ctx.beginPath();
            ctx.ellipse(rx, ry, Math.random() * 9 + 4, Math.random() * 2.5 + 1, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Draw active lightning bolts if triggered
        if (lightningBoltRef.current.length > 0) {
          for (const bolt of lightningBoltRef.current) {
            renderLightningBranch(bolt, 1);
          }
        }
      }

      // ── 2. SUNNY & CLEAR (Volumetric God-Rays & Golden Motives) ──
      else if (resolvedCondition === 'clear') {
        // Volumetric Sunbeams / God-Rays from top right
        const sunX = width * 0.88;
        const sunY = -20;
        const rayAngle = Math.sin(frame * 0.008) * 0.04;

        for (let r = 0; r < 4; r++) {
          const rayGrad = ctx.createLinearGradient(sunX, sunY, width * 0.3 - r * 120, height);
          rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.08)');
          rayGrad.addColorStop(0.5, 'rgba(251, 191, 36, 0.04)');
          rayGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');

          ctx.fillStyle = rayGrad;
          ctx.beginPath();
          ctx.moveTo(sunX - 40 - r * 50, sunY);
          ctx.lineTo(sunX + 60 + r * 50, sunY);
          ctx.lineTo(width * 0.4 - r * 180 + rayAngle * 200, height);
          ctx.lineTo(width * 0.1 - r * 180 + rayAngle * 200, height);
          ctx.closePath();
          ctx.fill();
        }

        // Floating golden sun motes
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.pulsePhase = (p.pulsePhase || 0) + 0.025;
          const currentSize = p.size * (0.8 + 0.25 * Math.sin(p.pulsePhase));

          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 3);
          grad.addColorStop(0, `rgba(254, 240, 138, ${p.opacity})`);
          grad.addColorStop(0.4, `rgba(251, 191, 36, ${p.opacity * 0.45})`);
          grad.addColorStop(1, 'rgba(251, 191, 36, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize * 3, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.dx || 0;
          p.y += p.dy || -0.3;

          if (p.y < -15) {
            p.y = height + 15;
            p.x = Math.random() * width;
          }
          if (p.x > width + 20) p.x = -20;
          if (p.x < -20) p.x = width + 20;
        }
      }

      // ── 3. MOUNTAIN MIST & FOG (Flowing Undulating Waves) ──
      else if (resolvedCondition === 'fog') {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(204, 251, 241, ${p.opacity})`);
          grad.addColorStop(0.5, `rgba(153, 246, 228, ${p.opacity * 0.5})`);
          grad.addColorStop(1, 'rgba(153, 246, 228, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.dx || 0.25;
          p.y += Math.sin(frame * 0.01 + i) * 0.2;

          if (p.x - p.size > width) {
            p.x = -p.size;
            p.y = Math.random() * height;
          }
        }
      }

      // ── 4. MIDNIGHT STARGAZE & NEBULA (Twinkling Cosmic Starfield) ──
      else if (resolvedCondition === 'night') {
        // Starfield
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.pulsePhase = (p.pulsePhase || 0) + (p.twinkleSpeed || 0.02);
          const currentOpacity = Math.max(0.12, p.opacity * (0.55 + 0.45 * Math.sin(p.pulsePhase)));

          ctx.fillStyle = `rgba(240, 249, 255, ${currentOpacity})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          // Star cross diffraction spikes for bright stars
          if (p.size > 1.6 && currentOpacity > 0.6) {
            ctx.strokeStyle = `rgba(224, 242, 254, ${currentOpacity * 0.35})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x - p.size * 3.5, p.y);
            ctx.lineTo(p.x + p.size * 3.5, p.y);
            ctx.moveTo(p.x, p.y - p.size * 3.5);
            ctx.lineTo(p.x, p.y + p.size * 3.5);
            ctx.stroke();
          }
        }

        // Shooting Star
        if (!shootingStar.active && Math.random() < 0.007) {
          shootingStar = {
            x: Math.random() * (width * 0.7) + width * 0.2,
            y: Math.random() * (height * 0.35),
            dx: -(Math.random() * 10 + 14),
            dy: Math.random() * 6 + 7,
            length: Math.random() * 100 + 70,
            opacity: 1,
            active: true,
          };
        }

        if (shootingStar.active) {
          const tailGrad = ctx.createLinearGradient(
            shootingStar.x, shootingStar.y,
            shootingStar.x - (shootingStar.dx / 12) * shootingStar.length,
            shootingStar.y - (shootingStar.dy / 12) * shootingStar.length
          );
          tailGrad.addColorStop(0, `rgba(255, 255, 255, ${shootingStar.opacity})`);
          tailGrad.addColorStop(0.3, `rgba(186, 230, 253, ${shootingStar.opacity * 0.7})`);
          tailGrad.addColorStop(1, 'rgba(147, 197, 253, 0)');

          ctx.strokeStyle = tailGrad;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(shootingStar.x, shootingStar.y);
          ctx.lineTo(
            shootingStar.x - (shootingStar.dx / 12) * shootingStar.length,
            shootingStar.y - (shootingStar.dy / 12) * shootingStar.length
          );
          ctx.stroke();

          shootingStar.x += shootingStar.dx;
          shootingStar.y += shootingStar.dy;
          shootingStar.opacity -= 0.024;

          if (shootingStar.opacity <= 0) {
            shootingStar.active = false;
          }
        }
      }

      // ── 5. CLOUDY & OVERCAST (Volumetric Cloud Mass Drift) ──
      else {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          grad.addColorStop(0, `rgba(148, 163, 184, ${p.opacity})`);
          grad.addColorStop(0.7, `rgba(100, 116, 139, ${p.opacity * 0.4})`);
          grad.addColorStop(1, 'rgba(71, 85, 105, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.dx || 0.18;
          if (p.x - p.size > width) {
            p.x = -p.size;
            p.y = Math.random() * (height * 0.7);
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [resolvedCondition]);

  return (
    <div className={`weather-ambient-wrapper condition-${resolvedCondition} ${lightningActive ? 'lightning-active' : ''}`}>
      {/* Dynamic Background Image with Smooth Cross-fading */}
      <div className="weather-ambient-backdrop" />

      {/* Topographic Contour Mesh & Mountain Elevation Silhouette */}
      <div className="weather-ambient-topo-contours" />

      {/* Atmospheric Radial Light Glow & Nebula Layer */}
      <div className="weather-ambient-light-glow" />

      {/* Cinematic Color Grading Mesh */}
      <div className="weather-ambient-topography-tint" />

      {/* 60fps Particle & Atmosphere Canvas */}
      <canvas ref={canvasRef} className="weather-ambient-canvas" />

      {/* Glass Moisture / Rain Condensation Overlay for Monsoon & Storm */}
      {(resolvedCondition === 'rain' || resolvedCondition === 'storm') && (
        <div className="weather-glass-droplets-overlay" />
      )}

      {/* Lightning Flash Overlay (for Storm) */}
      <div className="weather-lightning-overlay" />
    </div>
  );
};
