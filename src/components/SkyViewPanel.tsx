import { useMemo } from 'react';
import type { LiveAstronomy } from '@/utils/astronomy';
import type { City } from '@/utils/geo';

interface SkyViewPanelProps {
  city: City;
  live: LiveAstronomy | null;
}

function skyColors(altitude: number): { top: string; mid: string; horizon: string } {
  if (altitude > 20) return { top: '#0a4fa3', mid: '#3b8fd6', horizon: '#bfe3f7' };
  if (altitude > 5) return { top: '#0a3a73', mid: '#1f6fb0', horizon: '#f4b860' };
  if (altitude > -6) return { top: '#1a2b5a', mid: '#5b3a7a', horizon: '#e0703a' };
  if (altitude > -12) return { top: '#0a1530', mid: '#2a1b4a', horizon: '#5a2a3a' };
  return { top: '#02030a', mid: '#070b1a', horizon: '#101530' };
}

export default function SkyViewPanel({ city, live }: SkyViewPanelProps) {
  const sky = useMemo(() => {
    if (live) return skyColors(live.sun.altitude);
    return skyColors(0);
  }, [live]);

  const sunAlt = live ? live.sun.altitude : 0;
  const sunAzNorm = live ? live.sun.azimuth / 360 : 0.5;
  const sunVisible = sunAlt > -2;
  const sunY = 150 - (Math.max(-10, Math.min(90, sunAlt)) / 90) * 120;
  const sunX = -180 + sunAzNorm * 360;

  const showStars = live ? live.sun.altitude < -6 : false;
  const stars = useMemo(() => {
    if (!showStars) return [];
    return Array.from({ length: 40 }, () => ({
      x: -180 + Math.random() * 360,
      y: -150 + Math.random() * 120,
      r: Math.random() * 1.2 + 0.3,
      o: 0.4 + Math.random() * 0.6,
    }));
  }, [showStars]);

  return (
    <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10">
      <svg viewBox="-200 -160 400 320" className="w-full">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="-160" x2="0" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={sky.top} />
            <stop offset="60%" stopColor={sky.mid} />
            <stop offset="100%" stopColor={sky.horizon} />
          </linearGradient>
          <radialGradient id="sunDisk" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff8d0" />
            <stop offset="80%" stopColor="#ffd24a" />
            <stop offset="100%" stopColor="#ff9d2a" />
          </radialGradient>
          <radialGradient id="sunHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,230,120,0.6)" />
            <stop offset="100%" stopColor="rgba(255,200,60,0)" />
          </radialGradient>
        </defs>

        <rect x="-200" y="-160" width="400" height="320" fill="url(#skyGrad)" />

        {stars.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.o} />
        ))}

        <line x1="-200" y1="150" x2="200" y2="150" stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
        <rect x="-200" y="150" width="400" height="10" fill="rgba(0,0,0,0.4)" />

        {sunVisible && live && (
          <>
            <circle cx={sunX} cy={sunY} r="70" fill="url(#sunHalo)" />
            <circle cx={sunX} cy={sunY} r="22" fill="url(#sunDisk)" />
          </>
        )}

        {live && live.sun.altitude < 0 && live.moon.phaseFraction > 0.05 && (
          <g transform={`translate(${sunX + 120}, ${sunY - 60})`}>
            <circle r="18" fill="#e8e8f0" opacity="0.9" />
            <circle r="18" fill="#0a0a14" opacity={1 - live.moon.phaseFraction} />
          </g>
        )}
      </svg>

      <div className="absolute left-3 top-3 rounded-lg bg-slate-900/60 px-2 py-1 text-[10px] uppercase tracking-wider text-slate-300 backdrop-blur">
        Jonli osmon holati
      </div>
      <div className="absolute bottom-3 right-3 rounded-lg bg-slate-900/60 px-2 py-1 text-[10px] text-slate-300 backdrop-blur">
        {city.name}
      </div>
    </div>
  );
}
