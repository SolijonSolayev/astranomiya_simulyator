export interface City {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  tzLabel: string;
  tzOffsetHours: number;
}

export const CITIES: City[] = [
  { id: 'tashkent', name: 'Toshkent', country: 'O\'zbekiston', lat: 41.31, lon: 69.24, tzLabel: 'UZT', tzOffsetHours: 5 },
  { id: 'nuuk', name: 'Nuuk', country: 'Grenlandiya', lat: 64.17, lon: -51.74, tzLabel: 'WGT', tzOffsetHours: -2 },
  { id: 'reykjavik', name: 'Reykjavik', country: 'Islandiya', lat: 64.13, lon: -21.94, tzLabel: 'GMT', tzOffsetHours: 0 },
  { id: 'oviedo', name: 'Oviedo', country: 'Ispaniya', lat: 43.36, lon: -5.84, tzLabel: 'CEST', tzOffsetHours: 2 },
  { id: 'palma', name: 'Palma', country: 'Ispaniya', lat: 39.57, lon: 2.65, tzLabel: 'CEST', tzOffsetHours: 2 },
  { id: 'tenerife', name: 'Tenerife', country: 'Kanar orollari', lat: 28.29, lon: -16.62, tzLabel: 'WEST', tzOffsetHours: 1 },
  { id: 'london', name: 'London', country: 'Britaniya', lat: 51.51, lon: -0.13, tzLabel: 'BST', tzOffsetHours: 1 },
  { id: 'newyork', name: 'New York', country: 'AQSh', lat: 40.71, lon: -74.0, tzLabel: 'EDT', tzOffsetHours: -4 },
];

export function getCityById(id: string): City {
  return CITIES.find((c) => c.id === id) ?? CITIES[0];
}

export const DEFAULT_CITY_ID = 'tashkent';

// Orthographic (globe) projection helpers
export function projectOrthographic(lat: number, lon: number, centerLat: number, centerLon: number, radius: number): { x: number; y: number; visible: boolean } {
  const R = Math.PI / 180;
  const latR = lat * R;
  const lonR = lon * R;
  const cLat = centerLat * R;
  const cLon = centerLon * R;
  const cosC = Math.sin(cLat) * Math.sin(latR) + Math.cos(cLat) * Math.cos(latR) * Math.cos(lonR - cLon);
  const visible = cosC >= -0.001;
  if (cosC < 0) {
    return { x: radius * Math.cos(latR) * Math.sin(lonR - cLon), y: -radius * (Math.cos(cLat) * Math.sin(latR) - Math.sin(cLat) * Math.cos(latR) * Math.cos(lonR - cLon)), visible: false };
  }
  const x = radius * Math.cos(latR) * Math.sin(lonR - cLon);
  const y = -radius * (Math.cos(cLat) * Math.sin(latR) - Math.sin(cLat) * Math.cos(latR) * Math.cos(lonR - cLon));
  return { x, y, visible };
}

export function formatTimeWithOffset(date: Date, offsetHours: number): string {
  const ms = date.getTime() + offsetHours * 3600 * 1000;
  const d = new Date(ms);
  const hh = d.getUTCHours().toString().padStart(2, '0');
  const mm = d.getUTCMinutes().toString().padStart(2, '0');
  const ss = d.getUTCSeconds().toString().padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

export function formatDateLong(date: Date): string {
  const months = ['YANVAR', 'FEVRAL', 'MART', 'APREL', 'MAY', 'IYUN', 'IYUL', 'AVGUST', 'SENTABR', 'OKTABR', 'NOYABR', 'DEKABR'];
  return `${date.getUTCDate()}-${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatLocalDateLong(date: Date): string {
  const months = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
  return `${date.getDate()}-${months[date.getMonth()]} ${date.getFullYear()}`;
}
