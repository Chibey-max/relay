"use client";
// components/ParticleField.tsx
// A whisper-quiet drifting node field behind the page — echoes the actual
// product concept (funds on separate chains, quietly connecting) rather than
// being generic decoration. Respects reduced-motion and the in-app toggle.

import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

export default function ParticleField({ paused = false }: { paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The `paused` prop is the single source of truth (the page decides its
    // initial value from the OS preference, but the explicit in-app toggle
    // can override it). We don't re-check the OS setting here — doing so
    // would make the override impossible.
    if (paused) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let count = 0;

    function densityFor(h: number) {
      return Math.min(Math.max(Math.floor(h / 40), 30), 90);
    }

    function makeParticles(n: number): Particle[] {
      return Array.from({ length: n }, () => ({
        x: Math.random(),
        y: Math.random(),
        vx: (Math.random() - 0.5) * 0.00018,
        vy: (Math.random() - 0.5) * 0.00018,
        r: Math.random() * 1.3 + 0.6,
      }));
    }

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      width = parent.scrollWidth;
      height = parent.scrollHeight;
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Only rebuild the particle array when the target count would
      // meaningfully change (>10%) — a full regenerate on every pixel of
      // page growth would make particles visibly "pop" mid-drift.
      const nextCount = densityFor(height);
      if (count === 0 || Math.abs(nextCount - count) / count > 0.1) {
        count = nextCount;
        particlesRef.current = makeParticles(count);
      }
    }
    resize();
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // The first resize() can run before web fonts finish loading, especially
    // on mobile — the hero text reflows once the real font metrics land,
    // changing the parent's scrollHeight out from under the canvas we just
    // sized. That stale height is what produces the stray diagonal line
    // artifact (particles connecting across a taller-than-actual canvas).
    // Re-measure a couple of times after mount to catch that late shift;
    // ResizeObserver alone doesn't reliably fire for font-driven reflow.
    const raf1 = requestAnimationFrame(() => requestAnimationFrame(resize));
    const lateResize = setTimeout(resize, 200);

    function getColor() {
      const isDark = !document.documentElement.classList.contains("light");
      return isDark ? "92,92,82" : "156,154,140";
    }

    function tick() {
      ctx!.clearRect(0, 0, width, height);
      const col = getColor();
      const particles = particlesRef.current;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = (a.x - b.x) * width;
          const dy = (a.y - b.y) * height;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            ctx!.strokeStyle = `rgba(${col},${0.06 * (1 - dist / 130)})`;
            ctx!.lineWidth = 0.6;
            ctx!.beginPath();
            ctx!.moveTo(a.x * width, a.y * height);
            ctx!.lineTo(b.x * width, b.y * height);
            ctx!.stroke();
          }
        }
      }

      particles.forEach((p) => {
        ctx!.fillStyle = `rgba(${col},0.28)`;
        ctx!.beginPath();
        ctx!.arc(p.x * width, p.y * height, p.r, 0, Math.PI * 2);
        ctx!.fill();
      });

      rafRef.current = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      window.removeEventListener("resize", resize);
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(raf1);
      clearTimeout(lateResize);
    };
  }, [paused]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden="true"
    />
  );
}
