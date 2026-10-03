'use client';

import { useEffect, useRef } from 'react';
import { useUserPreferences, type AccentColor } from '@/context/UserPreferencesContext';
import { createKineticGrid } from '@/lib/kinetic-grid';

const ACCENT_COLORS: Record<AccentColor, string> = {
  indigo: '79,70,229',
  teal: '15,118,110',
  rose: '190,18,60',
};

export default function KineticGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { preferences } = useUserPreferences();
  const accentColor = ACCENT_COLORS[preferences.accent];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const grid = createKineticGrid(canvas, {
      accentColor,
      baseColor: '148,163,184',
    });

    return () => grid.destroy();
  }, [accentColor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-80"
    />
  );
}