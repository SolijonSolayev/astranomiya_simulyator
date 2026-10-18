import { Clock, Calendar, Globe2 } from 'lucide-react';
import { CITIES, formatLocalDateLong, formatTimeWithOffset } from '@/utils/geo';

interface HeaderClocksProps {
  liveDate: Date;
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

export default function HeaderClocks({ liveDate }: HeaderClocksProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-xl bg-slate-900/70 ring-1 ring-white/10 px-3 py-1.5 backdrop-blur-md">
        <Calendar className="h-4 w-4 text-rose-300" />
        <span className="text-sm font-semibold text-white">{formatLocalDateLong(liveDate)}</span>
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-slate-900/70 ring-1 ring-white/10 px-3 py-1.5 backdrop-blur-md">
        <Clock className="h-4 w-4 text-emerald-300" />
        <span className="font-mono text-sm font-semibold text-white tabular-nums">
          {pad(liveDate.getHours())}:{pad(liveDate.getMinutes())}:{pad(liveDate.getSeconds())}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400">Mahalliy</span>
      </div>
      <div className="hidden md:flex items-center gap-3 rounded-xl bg-slate-900/70 ring-1 ring-white/10 px-3 py-1.5 backdrop-blur-md">
        <Globe2 className="h-4 w-4 text-sky-300" />
        {CITIES.filter((c) => c.id !== 'tashkent').slice(0, 4).map((c) => (
          <div key={c.id} className="flex flex-col items-center leading-tight">
            <span className="text-[9px] uppercase tracking-wider text-slate-400">{c.tzLabel}</span>
            <span className="font-mono text-xs font-semibold text-slate-100 tabular-nums">{formatTimeWithOffset(liveDate, c.tzOffsetHours)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
