import fs from "fs";
import path from "path";
import type { AirportOption } from "@/types/trip";

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function loadAirportsFromCsv(): AirportOption[] {
  const candidates = [
    path.join(process.cwd(), "source", "airports.csv"),
    path.join(process.cwd(), "..", "source", "airports.csv"),
  ];

  const csvPath = candidates.find((p) => fs.existsSync(p));
  if (!csvPath) {
    console.warn("[airportCsv] airports.csv not found — autocomplete will be empty");
    return [];
  }

  const lines = fs.readFileSync(csvPath, "utf-8").split(/\r?\n/);
  const [headerLine, ...dataLines] = lines;
  if (!headerLine) return [];

  const headers = parseCsvLine(headerLine);
  const col = (name: string) => headers.indexOf(name);

  const typeIdx = col("type");
  const nameIdx = col("name");
  const countryIdx = col("iso_country");
  const municipalityIdx = col("municipality");
  const scheduledIdx = col("scheduled_service");
  const iataIdx = col("iata_code");

  const airports: AirportOption[] = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);

    const iataCode = (cols[iataIdx] ?? "").replace(/"/g, "").trim();
    if (!iataCode) continue;

    const type = (cols[typeIdx] ?? "").replace(/"/g, "").trim();
    const scheduled = (cols[scheduledIdx] ?? "").replace(/"/g, "").trim() === "yes";
    if (type !== "large_airport" && type !== "medium_airport" && !scheduled) continue;

    airports.push({
      iataCode,
      name: (cols[nameIdx] ?? "").replace(/"/g, "").trim(),
      municipality: (cols[municipalityIdx] ?? "").replace(/"/g, "").trim() || null,
      country: (cols[countryIdx] ?? "").replace(/"/g, "").trim(),
    });
  }

  return airports;
}
