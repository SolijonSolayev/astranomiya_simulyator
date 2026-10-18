import { useEffect, useMemo, useRef, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { CITIES, projectOrthographic } from '@/utils/geo';
import { getTerminator, getSubsolarPoint } from '@/utils/astronomy';

interface Earth3DProps {
  liveDate: Date;
  centerLat: number;
  centerLon: number;
  selectedCityId: string;
  onCenterChange: (lat: number, lon: number) => void;
}

const RADIUS = 170;
const TEX_URL = 'https://gsp.humboldt.edu/Archive/Libraries/ThreeJS/113/examples/textures/planets/earth_atmos_2048.jpg';

const RAD = Math.PI / 180;

// Map a (lat, lon) on the globe to pixel coordinates in the equirectangular texture.
function sampleTexCoords(lat: number, lon: number, texW: number, texH: number): { u: number; v: number } {
  const u = ((lon + 180) / 360) * texW;
  const v = ((90 - lat) / 180) * texH;
  return { u, v };
}

export default function Earth3D({ liveDate, centerLat, centerLon, selectedCityId, onCenterChange }: Earth3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [texLoaded, setTexLoaded] = useState(false);

  // Load the Earth texture once and cache its pixel data.
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const off = document.createElement('canvas');
      off.width = img.naturalWidth;
      off.height = img.naturalHeight;
      const octx = off.getContext('2d');
      if (octx) {
        octx.drawImage(img, 0, 0);
        const id = octx.getImageData(0, 0, off.width, off.height);
        texData = id.data;
        texDims.w = off.width;
        texDims.h = off.height;
      }
      setTexLoaded(true);
    };
    img.src = TEX_URL;
  }, []);

  const subsolar = useMemo(() => getSubsolarPoint(liveDate), [liveDate]);
  const terminator = useMemo(() => getTerminator(liveDate, 120), [liveDate]);

  // Render the textured globe whenever inputs change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H / 2;
    const R = RADIUS;

    // Space backdrop with subtle radial glow
    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R + 60);
    bgGrad.addColorStop(0, 'rgba(20,30,60,0.4)');
    bgGrad.addColorStop(1, 'rgba(2,3,10,0)');
    ctx.fillStyle = '#02030a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, R + 60, 0, Math.PI * 2);
    ctx.fill();

    if (texData.length > 0) {
      const texW = texDims.w;
      const texH = texDims.h;

      // Render globe per-pixel by sampling the equirectangular texture.
      // Use an offscreen ImageData for performance.
      const imgData = ctx.createImageData(W, H);
      const data = imgData.data;
      const cLatR = centerLat * RAD;
      const sinCLat = Math.sin(cLatR);
      const cosCLat = Math.cos(cLatR);

      for (let py = 0; py < H; py++) {
        for (let px = 0; px < W; px++) {
          const dx = px - cx;
          const dy = py - cy;
          const r2 = dx * dx + dy * dy;
          if (r2 > R * R) continue;
          // Convert screen pixel to 3D point on sphere (orthographic inverse)
          const nx = dx / R;
          const ny = -dy / R;
          const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
          // Rotate to lat/lon: inverse of orthographic projection
          const x = cosCLat * nz - sinCLat * ny;
          const y = sinCLat * nz + cosCLat * ny;
          const z = nx;
          const lat = Math.asin(Math.max(-1, Math.min(1, y))) / RAD;
          let lon = Math.atan2(z, x) / RAD + centerLon;
          while (lon > 180) lon -= 360;
          while (lon < -180) lon += 360;
          const { u, v } = sampleTexCoords(lat, lon, texW, texH);
          const tx = Math.floor(u) % texW;
          const ty = Math.floor(v);
          const src = (ty * texW + tx) * 4;
          const dst = (py * W + px) * 4;
          // Subtle limb darkening for realism
          const limb = 0.35 + 0.65 * nz;
          data[dst] = texData[src] * limb;
          data[dst + 1] = texData[src + 1] * limb;
          data[dst + 2] = texData[src + 2] * limb;
          data[dst + 3] = 255;
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // ... (overlay drawing happens via SVG below for crispness)
  }, [texLoaded, liveDate, centerLat, centerLon]);

  // Compute overlay coordinates (in the SVG viewBox space centered at 0,0)
  const sunPt = projectOrthographic(subsolar.lat, subsolar.lon, centerLat, centerLon, RADIUS);
  const antiSunLon = subsolar.lon + 180 > 180 ? subsolar.lon + 180 - 360 : subsolar.lon + 180;
  const antiSunPt = projectOrthographic(-subsolar.lat, antiSunLon, centerLat, centerLon, RADIUS);

  const terminatorPts = terminator
    .map(([lat, lon]) => projectOrthographic(lat, lon, centerLat, centerLon, RADIUS))
    .filter((p) => p.visible);
  const terminatorPath = terminatorPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Night-side polygon: terminator closes back via the far edge of the globe.
  // We build a path that follows the terminator then arcs around the visible night hemisphere.
  const nightPath = useMemo(() => {
    if (terminatorPts.length < 3) return '';
    // Sort points along the visible arc by angle around anti-sun (approx). Use as-is + close.
    const pts = terminatorPts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    // Close with the terminator itself; fill will cover the night half near the edge.
    return `M${pts.join(' L')} Z`;
  }, [terminatorPts]);

  const city = CITIES.find((c) => c.id === selectedCityId)!;

  return (
    <div className="relative flex flex-col items-center justify-center">
      <div className="relative" style={{ width: '100%', maxWidth: 420, aspectRatio: '1 / 1' }}>
        {/* Textured globe rendered on canvas */}
        <canvas
          ref={canvasRef}
          width={420}
          height={420}
          className="absolute inset-0 h-full w-full rounded-full"
          style={{ imageRendering: 'auto' }}
        />
        {/* SVG overlay for terminator, markers, cities */}
        <svg viewBox="-210 -210 420 420" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255,210,80,0.9)" />
              <stop offset="100%" stopColor="rgba(255,180,40,0)" />
            </radialGradient>
            <radialGradient id="rimShade" cx="50%" cy="50%" r="50%">
              <stop offset="70%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
            </radialGradient>
            <clipPath id="globeClipOverlay">
              <circle cx="0" cy="0" r={RADIUS} />
            </clipPath>
          </defs>

          {/* Rim shade for depth */}
          <circle cx="0" cy="0" r={RADIUS} fill="url(#rimShade)" pointerEvents="none" />
          <circle cx="0" cy="0" r={RADIUS} fill="none" stroke="rgba(150,200,255,0.3)" strokeWidth="1" />

          <g clipPath="url(#globeClipOverlay)">
            {/* Night-side darkening overlay */}
            {nightPath && <path d={nightPath} fill="rgba(2,3,15,0.72)" />}

            {/* Terminator (day/night boundary) */}
            {terminatorPath && <path d={terminatorPath} stroke="rgba(255,180,90,0.6)" strokeWidth="1.2" fill="none" />}

            {/* Subsolar point */}
            {sunPt.visible && (
              <>
                <circle cx={sunPt.x} cy={sunPt.y} r="14" fill="url(#sunGlow)" />
                <circle cx={sunPt.x} cy={sunPt.y} r="3" fill="#ffd24a" />
              </>
            )}

            {/* Anti-sun (midnight) marker */}
            {antiSunPt.visible && (
              <circle cx={antiSunPt.x} cy={antiSunPt.y} r="2" fill="rgba(120,120,180,0.7)" />
            )}

            {/* Cities */}
            {CITIES.map((c) => {
              const p = projectOrthographic(c.lat, c.lon, centerLat, centerLon, RADIUS);
              if (!p.visible) return null;
              const selected = c.id === selectedCityId;
              return (
                <g key={c.id}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={selected ? 4 : 2.5}
                    fill="#67e8f9"
                    stroke={selected ? '#fff' : 'rgba(0,0,0,0.5)'}
                    strokeWidth={selected ? 1.3 : 0.5}
                  />
                  {selected && <circle cx={p.x} cy={p.y} r="7" fill="none" stroke="#fff" strokeWidth="1" opacity="0.7" className="animate-pulse" />}
                </g>
              );
            })}
          </g>
        </svg>

        {!texLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 text-[10px] uppercase tracking-wider text-slate-400">
        <span className="flex items-center gap-1"><Sun className="h-3 w-3 text-amber-300" />Quyosh zenit</span>
        <span className="flex items-center gap-1"><Moon className="h-3 w-3 text-slate-300" />Tungi yarim</span>
      </div>
      <div className="mt-1 text-[10px] text-slate-500">
        <button
          onClick={() => onCenterChange(city.lat, city.lon)}
          className="rounded-full bg-slate-800/60 px-3 py-1 text-slate-300 hover:bg-slate-700/60 transition"
        >
          Tanlangan shaharga aylantir
        </button>
      </div>
    </div>
  );
}

// Reference to texture pixel data, populated when the image loads.
let texData: Uint8ClampedArray = new Uint8ClampedArray(0);
const texDims = { w: 0, h: 0 };
