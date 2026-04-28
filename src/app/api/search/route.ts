import { NextRequest, NextResponse } from "next/server";

export interface SearchResult {
  barcode: string;
  name: string;
  image?: string;
  categoryName?: string;
  quantity?: string;
  brand?: string;
}

// In-memory cache — survives across requests in the same worker, 10-min TTL
const cache = new Map<string, { results: SearchResult[]; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickName(p: any): string {
  return (p.product_name_de || p.product_name_en || p.product_name || "").trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickImage(p: any): string | undefined {
  const u =
    p.image_front_small_url ||
    p.image_small_url ||
    p.image_front_url ||
    p.image_url;
  return u && typeof u === "string" && u.startsWith("http") ? u : undefined;
}

function pickCategory(tags?: string[]): string | undefined {
  if (!tags?.length) return undefined;
  const t =
    tags.find((x) => x.startsWith("de:")) ||
    tags.find((x) => x.startsWith("en:")) ||
    tags[0];
  const raw = (t.split(":").pop() ?? t).replace(/-/g, " ");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseProducts(products: any[], preferDe = false): SearchResult[] {
  const results: SearchResult[] = [];
  for (const p of products) {
    const barcode = String(p._id ?? p.code ?? "").trim();
    const name = pickName(p);
    if (!barcode || !name) continue;

    // When preferDe is true, skip products with no German or English name
    if (preferDe && !p.product_name_de && !p.product_name_en && !p.product_name) continue;

    results.push({
      barcode,
      name,
      image: pickImage(p),
      categoryName: pickCategory(p.categories_tags),
      quantity: p.quantity ? String(p.quantity) : undefined,
      brand: p.brands ? String(p.brands).split(",")[0].trim() : undefined,
    });
  }
  return results;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchOFF(query: string): Promise<SearchResult[] | null> {
  const headers = {
    "User-Agent": "HomeStock/1.0 (https://github.com/homestock; contact: jumaa.almarzouk@gmail.com)",
    Accept: "application/json",
  };

  const q = encodeURIComponent(query);
  // Try CGI endpoint first, then v2 as fallback — both filtered to Germany
  const endpoints = [
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&json=1&page_size=20&tagtype_0=countries&tag_contains_0=contains&tag_0=en%3Agermany`,
    `https://world.openfoodfacts.org/api/v2/search?search_terms=${q}&page_size=20&countries_tags_en=germany&fields=code,product_name,product_name_de,product_name_en,brands,quantity,image_front_small_url,image_small_url,categories_tags`,
    // fallback without country filter
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${q}&json=1&page_size=20`,
  ];

  for (let attempt = 0; attempt < 3; attempt++) {
    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 12000);

        const res = await fetch(url, {
          headers,
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(timer);

        if (res.status === 503) {
          console.warn(`[Search] 503 from OFF (attempt ${attempt + 1}), url=${url}`);
          await sleep(1500 * (attempt + 1));
          continue;
        }

        if (!res.ok) {
          console.error(`[Search] OFF ${res.status}`);
          continue;
        }

        const text = await res.text();
        if (!text?.trim()) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let data: any;
        try { data = JSON.parse(text); } catch { continue; }

        const raw = data.products ?? [];
        console.log(`[Search] q="${query}" attempt=${attempt + 1} → count=${data.count}, products=${raw.length}`);

        if (raw.length > 0) {
          // For Germany-filtered endpoints (first two), apply strict DE filter
          const isGermanyFiltered = url.includes("germany") || url.includes("en%3Agermany");
          return parseProducts(raw, isGermanyFiltered);
        }
      } catch (err) {
        console.error(`[Search] fetch error attempt ${attempt + 1}:`, err);
      }
    }

    if (attempt < 2) await sleep(1000 * (attempt + 1));
  }

  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Return fresh cache
  const cached = cache.get(query);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ results: cached.results, cached: true });
  }

  const results = await fetchOFF(query);

  if (results === null) {
    // All attempts failed — return stale cache if any
    if (cached) {
      return NextResponse.json({ results: cached.results, stale: true });
    }
    return NextResponse.json({ results: [], error: "service_unavailable" });
  }

  cache.set(query, { results, ts: Date.now() });
  return NextResponse.json({ results, total: results.length });
}
