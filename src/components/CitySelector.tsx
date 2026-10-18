import type { City } from '@/utils/geo';
import { CITIES } from '@/utils/geo';
import { Check, MapPin } from 'lucide-react';

interface CitySelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function CitySelector({ selectedId, onSelect }: CitySelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        <MapPin className="h-3.5 w-3.5" /> Kuzatuv shahri
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {CITIES.map((c: City) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
              c.id === selectedId
                ? 'bg-amber-500/20 ring-1 ring-amber-400/50 text-amber-100'
                : 'bg-slate-900/50 ring-1 ring-white/5 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <span>
              <span className="block font-semibold">{c.name}</span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-500">{c.tzLabel} · {c.country}</span>
            </span>
            {c.id === selectedId && <Check className="h-3.5 w-3.5 text-amber-300" />}
          </button>
        ))}
      </div>
    </div>
  );
}
