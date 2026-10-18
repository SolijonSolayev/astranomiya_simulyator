import { useEffect, useMemo, useState } from 'react';
import { Telescope, Eclipse, Github, Info, Radio } from 'lucide-react';
import HeaderClocks from '@/components/HeaderClocks';
import Earth3D from '@/components/Earth3D';
import TelemetryPanel from '@/components/TelemetryPanel';
import SkyViewPanel from '@/components/SkyViewPanel';
import CitySelector from '@/components/CitySelector';
import { computeLiveAstronomy, getCountdownToEclipse, getUpcomingEclipse, type LiveAstronomy, type Countdown, type UpcomingEclipse } from '@/utils/astronomy';
import { getCityById, DEFAULT_CITY_ID } from '@/utils/geo';

function App() {
  const [liveDate, setLiveDate] = useState<Date>(new Date());
  const [cityId, setCityId] = useState<string>(DEFAULT_CITY_ID);
  const [centerLat, setCenterLat] = useState<number>(45);
  const [centerLon, setCenterLon] = useState<number>(-20);

  const city = getCityById(cityId);

  // Live ticker — 1 Hz, real vaqtda yangilanadi
  useEffect(() => {
    setLiveDate(new Date());
    const id = window.setInterval(() => setLiveDate(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const live: LiveAstronomy | null = useMemo(
    () => computeLiveAstronomy(city.lat, city.lon, liveDate),
    [city, liveDate],
  );

  const upcoming: UpcomingEclipse | null = useMemo(() => {
    try {
      return getUpcomingEclipse(liveDate);
    } catch {
      return null;
    }
  }, [liveDate]);

  const countdown: Countdown | null = useMemo(() => {
    if (!upcoming) return null;
    return getCountdownToEclipse(liveDate, upcoming.peak);
  }, [liveDate, upcoming]);

  const handleCitySelect = (id: string) => {
    setCityId(id);
    const c = getCityById(id);
    setCenterLat(c.lat);
    setCenterLon(c.lon);
  };

  const upcomingLabel = upcoming
    ? `${upcoming.kindLabel} · ${upcoming.peak.getUTCDate()}-${new Intl.DateTimeFormat('en', { month: 'long' }).format(upcoming.peak)} ${upcoming.peak.getUTCFullYear()}`
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02030a] via-[#070b1f] to-[#0a1530] text-slate-100">
      {/* Animated star backdrop */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden opacity-60">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(1px 1px at 20% 30%, white, transparent), radial-gradient(1px 1px at 60% 70%, white, transparent), radial-gradient(1.5px 1.5px at 80% 20%, rgba(255,255,255,0.7), transparent), radial-gradient(1px 1px at 40% 80%, white, transparent), radial-gradient(1px 1px at 90% 50%, rgba(255,255,255,0.6), transparent), radial-gradient(1.5px 1.5px at 15% 60%, white, transparent), radial-gradient(1px 1px at 75% 90%, rgba(255,255,255,0.5), transparent)',
          backgroundSize: '400px 400px',
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 via-cyan-500 to-blue-600 shadow-[0_0_24px_rgba(56,189,248,0.5)]">
            <Telescope className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-white md:text-xl">
              Jonli Astronomik Kuzatuv <span className="text-sky-300">·</span> Quyosh Tutilishi Taymeri
            </h1>
            <p className="text-xs text-slate-400">Real vaqtda Quyosh, Oy va keyingi tutilishgacha hisoblash</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <HeaderClocks liveDate={liveDate} />
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1.5 ring-1 ring-emerald-400/30 backdrop-blur-md">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <Radio className="h-3.5 w-3.5 text-emerald-300" />
            <span className="text-xs font-semibold tracking-wide text-emerald-200">JONLI</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-10">
        {/* Upcoming eclipse banner */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-rose-500/15 via-orange-500/10 to-transparent p-3 ring-1 ring-rose-400/20">
          <Eclipse className="h-5 w-5 shrink-0 text-rose-300" />
          <p className="text-xs text-rose-100/90 md:text-sm">
            <span className="font-semibold text-rose-200">Keyingi quyosh tutilishi:</span> {upcomingLabel || '…'}
            {countdown && (
              <> — <span className="font-mono font-bold">{countdown.days}k {countdown.hours}soat {countdown.minutes}daq {countdown.seconds}son</span> qoldi</>
            )}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Left: Globe + Sky */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            <div className="rounded-2xl bg-slate-900/40 p-4 ring-1 ring-white/10 backdrop-blur-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <span className="inline-block h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
                Yer globusi — Jonli Quyosh holati
              </h2>
              <Earth3D
                liveDate={liveDate}
                centerLat={centerLat}
                centerLon={centerLon}
                selectedCityId={cityId}
                onCenterChange={(lat, lon) => { setCenterLat(lat); setCenterLon(lon); }}
              />
            </div>
            <div className="rounded-2xl bg-slate-900/40 p-4 ring-1 ring-white/10 backdrop-blur-sm">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                Osmon ko'rinishi
              </h2>
              <SkyViewPanel city={city} live={live} />
            </div>
          </div>

          {/* Right: Telemetry + City selector */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <div className="rounded-2xl bg-slate-900/40 p-4 ring-1 ring-white/10 backdrop-blur-sm">
              <TelemetryPanel city={city} live={live} countdown={countdown} upcoming={upcoming} />
            </div>
            <div className="rounded-2xl bg-slate-900/40 p-4 ring-1 ring-white/10 backdrop-blur-sm">
              <CitySelector selectedId={cityId} onSelect={handleCitySelect} />
            </div>
          </div>
        </div>

        {/* Info footer */}
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {[
            { t: 'Jonli real vaqt', d: 'Bugungi sana va aniq soat. Quyoshning zenit nuqtasi, kunduz/tun chegarasi va Oy fazasi soniyasiga yangilanadi.' },
            { t: 'Keyingi tutilishgacha taymer', d: 'Avtomatik ravishda keyingi quyosh tutilishi sanasi topiladi va qolgan kun/soat/daqiqa/soniya hisoblanadi.' },
            { t: '8 ta kuzatuv shahri', d: 'Toshkent, Grenlandiya, Islandiya, Ispaniya, London, New York va boshqa shaharlar uchun aniq osmon ko\'rsatkichlari.' },
          ].map((c) => (
            <div key={c.t} className="rounded-xl bg-slate-900/40 p-3 ring-1 ring-white/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-sky-200"><Info className="h-3.5 w-3.5" />{c.t}</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">{c.d}</p>
            </div>
          ))}
        </div>

        <footer className="mt-6 flex items-center justify-between text-xs text-slate-500">
          <span>Astronomik hisob-kitoblar: astronomy-engine · Jonli real vaqt rejimi</span>
          <a href="https://github.com/cosinekitty/astronomy" target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-slate-300">
            <Github className="h-3.5 w-3.5" /> astronomy-engine
          </a>
        </footer>
      </main>
    </div>
  );
}

export default App;
