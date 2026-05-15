/**
 * Airport seed script — parses source/airports.csv and upserts usable airports.
 * Run: npm run db:seed
 *
 * Filter: large_airport | medium_airport | (scheduled_service=yes) AND iata_code non-empty
 * Result: ~4,000–8,000 airports globally
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import readline from "readline";

const db = new PrismaClient();

interface CsvRow {
  id: string;
  ident: string;
  type: string;
  name: string;
  latitude_deg: string;
  longitude_deg: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  scheduled_service: string;
  iata_code: string;
}

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

async function main() {
  const csvPath = path.join(__dirname, "..", "source", "airports.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`airports.csv not found at ${csvPath}`);
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(csvPath),
    crlfDelay: Infinity,
  });

  const lines = await new Promise<string[]>((resolve) => {
    const all: string[] = [];
    rl.on("line", (line) => all.push(line));
    rl.on("close", () => resolve(all));
  });

  const [headerLine, ...dataLines] = lines;
  if (!headerLine) {
    console.error("CSV has no header row");
    process.exit(1);
  }

  const headers = parseCsvLine(headerLine);
  const colIndex = (name: string) => headers.indexOf(name);

  const idIdx = colIndex("id");
  const identIdx = colIndex("ident");
  const typeIdx = colIndex("type");
  const nameIdx = colIndex("name");
  const latIdx = colIndex("latitude_deg");
  const lonIdx = colIndex("longitude_deg");
  const countryIdx = colIndex("iso_country");
  const regionIdx = colIndex("iso_region");
  const municipalityIdx = colIndex("municipality");
  const scheduledIdx = colIndex("scheduled_service");
  const iataIdx = colIndex("iata_code");

  const airports: Array<{
    id: number;
    ident: string;
    type: string;
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    region: string;
    municipality: string | null;
    iataCode: string;
    scheduledService: boolean;
  }> = [];

  for (const line of dataLines) {
    if (!line.trim()) continue;
    const cols = parseCsvLine(line);

    const id = parseInt(cols[idIdx] ?? "", 10);
    const iataCode = (cols[iataIdx] ?? "").replace(/"/g, "").trim();
    const type = (cols[typeIdx] ?? "").replace(/"/g, "").trim();
    const scheduledService = (cols[scheduledIdx] ?? "").replace(/"/g, "").trim() === "yes";

    if (!iataCode || isNaN(id)) continue;

    // Keep large + medium airports, or any scheduled-service airport with an IATA code
    const isRelevantType = type === "large_airport" || type === "medium_airport";
    if (!isRelevantType && !scheduledService) continue;

    const lat = parseFloat(cols[latIdx] ?? "0");
    const lon = parseFloat(cols[lonIdx] ?? "0");
    if (isNaN(lat) || isNaN(lon)) continue;

    const municipality = (cols[municipalityIdx] ?? "").replace(/"/g, "").trim() || null;

    airports.push({
      id,
      ident: (cols[identIdx] ?? "").replace(/"/g, "").trim(),
      type,
      name: (cols[nameIdx] ?? "").replace(/"/g, "").trim(),
      latitude: lat,
      longitude: lon,
      country: (cols[countryIdx] ?? "").replace(/"/g, "").trim(),
      region: (cols[regionIdx] ?? "").replace(/"/g, "").trim(),
      municipality,
      iataCode,
      scheduledService,
    });
  }

  console.log(`Parsed ${airports.length} usable airports from CSV.`);

  // Batch upsert in chunks of 500
  const CHUNK = 500;
  let upserted = 0;

  for (let i = 0; i < airports.length; i += CHUNK) {
    const chunk = airports.slice(i, i + CHUNK);
    await Promise.all(
      chunk.map((a) =>
        db.airport.upsert({
          where: { id: a.id },
          update: {
            ident: a.ident,
            type: a.type,
            name: a.name,
            latitude: a.latitude,
            longitude: a.longitude,
            country: a.country,
            region: a.region,
            municipality: a.municipality,
            iataCode: a.iataCode,
            scheduledService: a.scheduledService,
          },
          create: a,
        }),
      ),
    );
    upserted += chunk.length;
    process.stdout.write(`\rUpserted ${upserted}/${airports.length}...`);
  }

  console.log(`\nDone. ${upserted} airports seeded.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
