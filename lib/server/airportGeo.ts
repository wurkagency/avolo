import fs from "fs";
import path from "path";

export interface AirportGeo {
  iataCode: string;
  name: string;
  municipality: string | null;
  country: string;
  lat: number;
  lon: number;
  type: string; // "large_airport" | "medium_airport" | ...
}

let geoCache: AirportGeo[] | null = null;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') { inQuotes = !inQuotes; }
    else if (ch === "," && !inQuotes) { result.push(current.trim()); current = ""; }
    else { current += ch; }
  }
  result.push(current.trim());
  return result;
}

function toRad(deg: number) { return deg * (Math.PI / 180); }

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function loadAirportGeo(): AirportGeo[] {
  if (geoCache !== null) return geoCache;

  const candidates = [
    path.join(process.cwd(), "source", "airports.csv"),
    path.join(process.cwd(), "..", "source", "airports.csv"),
  ];
  const csvPath = candidates.find((p) => fs.existsSync(p));
  if (!csvPath) { geoCache = []; return []; }

  const lines = fs.readFileSync(csvPath, "utf-8").split(/\r?\n/);
  const [headerLine, ...dataLines] = lines;
  if (!headerLine) { geoCache = []; return []; }

  const headers = parseCsvLine(headerLine);
  const col = (n: string) => headers.indexOf(n);
  const typeIdx = col("type");
  const nameIdx = col("name");
  const countryIdx = col("iso_country");
  const municipalityIdx = col("municipality");
  const scheduledIdx = col("scheduled_service");
  const iataIdx = col("iata_code");
  const latIdx = col("latitude_deg");
  const lonIdx = col("longitude_deg");

  const airports: AirportGeo[] = [];
  for (const line of dataLines) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);
    const iataCode = (cols[iataIdx] ?? "").replace(/"/g, "").trim();
    if (!iataCode) continue;

    const type = (cols[typeIdx] ?? "").replace(/"/g, "").trim();
    const scheduled = (cols[scheduledIdx] ?? "").replace(/"/g, "").trim() === "yes";
    if (type !== "large_airport" && type !== "medium_airport" && !scheduled) continue;

    const lat = parseFloat((cols[latIdx] ?? "").replace(/"/g, ""));
    const lon = parseFloat((cols[lonIdx] ?? "").replace(/"/g, ""));
    if (isNaN(lat) || isNaN(lon)) continue;

    airports.push({
      iataCode,
      name: (cols[nameIdx] ?? "").replace(/"/g, "").trim(),
      municipality: (cols[municipalityIdx] ?? "").replace(/"/g, "").trim() || null,
      country: (cols[countryIdx] ?? "").replace(/"/g, "").trim(),
      lat,
      lon,
      type,
    });
  }

  geoCache = airports;
  return airports;
}

export function findAirportByIata(iata: string): AirportGeo | undefined {
  return loadAirportGeo().find((a) => a.iataCode === iata.toUpperCase());
}

/** Returns the nearest major (large first, then medium) airport to the given coordinates. */
export function findNearestAirportByCoords(lat: number, lon: number): AirportGeo | null {
  const all = loadAirportGeo();
  if (all.length === 0) return null;

  // Prefer large airports; fall back to the full set
  const pool = all.some((a) => a.type === "large_airport")
    ? all.filter((a) => a.type === "large_airport")
    : all;

  let nearest: AirportGeo | null = null;
  let minDist = Infinity;
  for (const a of pool) {
    const d = haversineKm(lat, lon, a.lat, a.lon);
    if (d < minDist) { minDist = d; nearest = a; }
  }
  return nearest;
}

export function findNearbyAirports(iata: string, radiusKm = 100): AirportGeo[] {
  const origin = findAirportByIata(iata);
  if (!origin) return [];
  const all = loadAirportGeo();
  return all
    .filter((a) => a.iataCode !== iata.toUpperCase() && haversineKm(origin.lat, origin.lon, a.lat, a.lon) <= radiusKm)
    .sort((a, b) => haversineKm(origin.lat, origin.lon, a.lat, a.lon) - haversineKm(origin.lat, origin.lon, b.lat, b.lon))
    .slice(0, 8);
}
