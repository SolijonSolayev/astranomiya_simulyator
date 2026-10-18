import { Sun, Moon, Timer, Gauge, Compass, MapPin, Sparkles, Eclipse } from 'lucide-react';
import type { LiveAstronomy, Countdown, UpcomingEclipse } from '@/utils/astronomy';
import type { City } from '@/utils/geo';

interface TelemetryPanelProps {
  city: City;
  live: LiveAstronomy | null;
  countdown: Countdown | null;
  upcoming: UpcomingEclipse | null;
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="rounded-xl bg-slate-900/60 ring-1 ring-white/10 p-3 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-400">
        {icon}
        <span>{label}</span>
      </div>
      <div className={`mt-1 text-lg font-semibold tabular-nums ${accent}`}>{value}</div>
    </div>
  );
}

function fmtUtc(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())} UTC`;
}

function fmtDate(date: Date): string {
  const months = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
  return `${date.getUTCDate()}-${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export default function TelemetryPanel({ city, live, countdown, upcoming }: TelemetryPanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Gauge className="h-4 w-4 text-sky-300" />
          Telemetriya
        </h3>
        <span className="flex items-center gap-1 rounded-full bg-slate-800/70 px-2 py-0.5 text-[10px] text-slate-300">
          <MapPin className="h-3 w-3" /> {city.name}, {city.country}
        </span>
      </div>

      {live && countdown && upcoming ? (
        <>
          <Stat icon={<Sun className="h-3 w-3 text-amber-300" />} label="Quyosh balandligi" value={`${live.sun.altitude.toFixed(1)}°`} accent="text-amber-200" />
          <Stat icon={<Compass className="h-3 w-3 text-rose-300" />} label="Quyosh azimuti" value={`${live.sun.azimuth.toFixed(1)}°`} accent="text-rose-200" />
          <Stat icon={<Moon className="h-3 w-3 text-slate-200" />} label="Oy fazasi" value={live.moon.phaseName} accent="text-slate-100" />
          <Stat
            icon={<Sparkles className="h-3 w-3 text-violet-300" />}
            label="Oy yoritilganlik"
            value={`${(live.moon.phaseFraction * 100).toFixed(1)}%`}
            accent="text-violet-200"
          />
          <Stat icon={<Sun className="h-3 w-3 text-orange-300" />} label="Quyosh zenit (kenglik)" value={`${live.subsolar.lat.toFixed(2)}°`} accent="text-orange-200" />
          <Stat icon={<Sun className="h-3 w-3 text-yellow-300" />} label="Quyosh zenit (uzunlik)" value={`${live.subsolar.lon.toFixed(2)}°`} accent="text-yellow-200" />

          {/* Countdown to next eclipse */}
          <div className="mt-1 rounded-2xl bg-gradient-to-br from-rose-600/25 to-orange-500/20 p-4 ring-1 ring-rose-400/30 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-rose-200">
              <Eclipse className="h-4 w-4" />
              Keyingi quyosh tutilishigacha
            </div>
            <div className="mt-1 text-sm font-semibold text-white">{upcoming.kindLabel}</div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {[
                ['Kun', countdown.days],
                ['Soat', countdown.hours],
                ['Daqiqa', countdown.minutes],
                ['Soniya', countdown.seconds],
              ].map(([label, val]) => (
                <div key={label as string} className="rounded-lg bg-slate-900/60 py-2">
                  <div className="font-mono text-2xl font-bold tabular-nums text-white">{(val as number).toString().padStart(2, '0')}</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-rose-200/80">
              <Timer className="h-3 w-3" />
              <span>{fmtDate(upcoming.peak)} · {fmtUtc(upcoming.peak)}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-xl bg-slate-900/60 p-4 text-center text-sm text-slate-400">Hisoblanmoqda…</div>
      )}
    </div>
  );
}
