import {
  AstroTime,
  Body,
  Equator,
  EclipseKind,
  GeoVector,
  Horizon,
  Illumination,
  MoonPhase,
  Observer,
  SearchGlobalSolarEclipse,
  SiderealTime,
  SphereFromVector,
} from 'astronomy-engine';

export interface SubsolarPoint {
  lon: number; // degrees, -180..180
  lat: number; // degrees
}

export interface SunHorizontal {
  altitude: number; // degrees
  azimuth: number; // degrees
  rightAscension: number;
  declination: number;
}

export interface MoonIllumination {
  phaseAngle: number; // degrees 0..180
  phaseFraction: number; // 0..1 (fraction illuminated)
  phaseName: string;
  elongation: number; // degrees
  magnitude: number;
}

export interface LiveAstronomy {
  date: Date;
  subsolar: SubsolarPoint;
  sun: SunHorizontal;
  moon: MoonIllumination;
  moonSublon: number;
  gmstHours: number;
}

export interface UpcomingEclipse {
  peak: Date;
  kind: 'total' | 'annular' | 'partial' | 'penumbral';
  kindLabel: string;
  obscuration: number;
}

const ECLIPSE_KIND_LABEL: Record<UpcomingEclipse['kind'], string> = {
  total: 'To\'liq quyosh tutilishi',
  annular: 'Halqasimon quyosh tutilishi',
  partial: 'Qisman quyosh tutilishi',
  penumbral: 'Tungi oy tutilishi',
};

// Hozirgi vaqtdan keyin keladigan keyingi quyosh tutilishini topadi (avtomatik).
export function getUpcomingEclipse(from: Date): UpcomingEclipse {
  const t = new AstroTime(from);
  const e = SearchGlobalSolarEclipse(t);
  const kind = e.kind as UpcomingEclipse['kind'];
  return {
    peak: e.peak.date,
    kind,
    kindLabel: ECLIPSE_KIND_LABEL[kind],
    obscuration: e.obscuration as number,
  };
}

const RAD = Math.PI / 180;

export function getSubsolarPoint(date: Date): SubsolarPoint {
  const t = new AstroTime(date);
  const v = GeoVector(Body.Sun, t, true);
  const s = SphereFromVector(v);
  let lon = (s.lon as number);
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return { lon, lat: s.lat as number };
}

export function getSubsolarAtLong(lonDeg: number, date: Date): { lat: number } {
  const t = new AstroTime(date);
  const v = GeoVector(Body.Sun, t, true);
  const s = SphereFromVector(v);
  let lon = s.lon as number;
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  void lonDeg;
  return { lat: s.lat as number };
}

export function getSunHorizontal(lat: number, lon: number, date: Date): SunHorizontal {
  const t = new AstroTime(date);
  const obs = new Observer(lat, lon, 0);
  const eq = Equator(Body.Sun, t, obs, true, true);
  const hor = Horizon(t, obs, eq.ra, eq.dec, 'normal');
  return {
    altitude: hor.altitude as number,
    azimuth: hor.azimuth as number,
    rightAscension: eq.ra as number,
    declination: eq.dec as number,
  };
}

export function getMoonIllumination(date: Date): MoonIllumination {
  const t = new AstroTime(date);
  const ill = Illumination(Body.Moon, t);
  const phaseAngle = ill.phase_angle as number;
  const phaseFraction = ill.phase_fraction as number;
  const phaseDeg = MoonPhase(t);
  const phaseName = moonPhaseName(phaseDeg);
  return {
    phaseAngle,
    phaseFraction,
    phaseName,
    elongation: phaseDeg,
    magnitude: ill.mag as number,
  };
}

export function getMoonSubsolarLongitude(date: Date): number {
  const t = new AstroTime(date);
  const gst = SiderealTime(t) as number;
  let lon = ((gst - 12) * 15) % 360;
  while (lon > 180) lon -= 360;
  while (lon < -180) lon += 360;
  return lon;
}

export function getGmstHours(date: Date): number {
  const t = new AstroTime(date);
  return SiderealTime(t) as number;
}

export function computeLiveAstronomy(lat: number, lon: number, date: Date): LiveAstronomy {
  return {
    date,
    subsolar: getSubsolarPoint(date),
    sun: getSunHorizontal(lat, lon, date),
    moon: getMoonIllumination(date),
    moonSublon: getMoonSubsolarLongitude(date),
    gmstHours: getGmstHours(date),
  };
}

export function moonPhaseName(phaseDeg: number): string {
  const p = ((phaseDeg % 360) + 360) % 360;
  if (p < 22.5 || p >= 337.5) return 'Yangi oy';
  if (p < 67.5) return 'Hilol (kresiy) — birinchi chorak';
  if (p < 112.5) return 'Birinchi chorak';
  if (p < 157.5) return 'O\'sib boruvchi Oy';
  if (p < 202.5) return 'To\'lin oy';
  if (p < 247.5) return 'Kamayuvchi Oy';
  if (p < 292.5) return 'Oxirgi chorak';
  return 'Hilol (eski) — oxirgi chorak';
}

export interface Countdown {
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

export function getCountdownToEclipse(from: Date, target: Date): Countdown {
  const diffMs = target.getTime() - from.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const isPast = diffMs <= 0;
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { totalSeconds, days, hours, minutes, seconds, isPast };
}

// Terminator (day/night boundary) sampling for a given date.
// Returns an array of [lat, lon] points forming the boundary on Earth.
export function getTerminator(date: Date, samples = 180): Array<[number, number]> {
  const t = new AstroTime(date);
  const sunV = GeoVector(Body.Sun, t, true);
  const sunS = SphereFromVector(sunV);
  const sunLat = (sunS.lat as number) * RAD;
  const sunLon = (sunS.lon as number) * RAD;
  const gst = (SiderealTime(t) as number) * 15 * RAD;

  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= samples; i++) {
    const ha = (i / samples) * 2 * Math.PI;
    // terminator occurs where sun altitude = 0; lat on terminator:
    // sin(lat) = -cos(ha) * cos(sunLat)
    const sinLat = -Math.cos(ha) * Math.cos(sunLat);
    const lat = Math.asin(Math.max(-1, Math.min(1, sinLat)));
    const lonRad = sunLon - gst + Math.PI - Math.atan2(
      Math.sin(ha),
      Math.tan(sunLat) > 0 ? Math.cos(ha) * Math.cos(sunLat) : Math.cos(ha) * Math.cos(sunLat),
    );
    let lon = (lonRad * 180) / Math.PI;
    while (lon > 180) lon -= 360;
    while (lon < -180) lon += 360;
    pts.push([(lat * 180) / Math.PI, lon]);
  }
  return pts;
}

void EclipseKind;

// Simple solar position by subsolar approximation for any (lat,lon,date).
// Returns apparent sun disk fraction above horizon (0..1) ignoring refraction.
export function daylightFraction(lat: number, lon: number, date: Date): number {
  const sun = getSubsolarPoint(date);
  const angularDist = Math.acos(
    Math.sin(lat * RAD) * Math.sin(sun.lat * RAD) +
      Math.cos(lat * RAD) * Math.cos(sun.lat * RAD) * Math.cos((lon - sun.lon) * RAD),
  );
  const alt = Math.PI / 2 - angularDist;
  if (alt >= 0.1) return 1;
  if (alt <= -0.1) return 0;
  return (alt + 0.1) / 0.2;
}
