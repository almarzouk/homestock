import { getProductByBarcode } from "./product.service";
import { BarcodeResult } from "@/types";

interface OpenFoodFactsProduct {
  product_name?: string;
  product_name_de?: string;
  image_url?: string;
  categories_tags?: string[];
}

interface OpenFoodFactsResponse {
  status: number;
  product?: OpenFoodFactsProduct;
}

async function fetchFromOpenFoodFacts(
  barcode: string
): Promise<OpenFoodFactsResponse | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "HomeStock/1.0 (household inventory app)",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    return res.json() as Promise<OpenFoodFactsResponse>;
  } catch {
    return null;
  }
}

function normalizeCategoryName(tags?: string[]): string | undefined {
  if (!tags || tags.length === 0) return undefined;
  const tag = tags[0];
  const parts = tag.split(":");
  const name = parts[parts.length - 1];
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function lookupBarcode(barcode: string): Promise<BarcodeResult> {
  // First check local database
  const localProduct = await getProductByBarcode(barcode);
  if (localProduct) {
    return {
      source: "database",
      product: {
        _id: String(localProduct._id),
        name: localProduct.name,
        barcode: localProduct.barcode!,
        image: localProduct.image,
      },
    };
  }

  // Fetch from Open Food Facts
  const offData = await fetchFromOpenFoodFacts(barcode);
  if (offData && offData.status === 1 && offData.product) {
    const p = offData.product;
    const name =
      p.product_name_de || p.product_name || "";

    if (name) {
      return {
        source: "open-food-facts",
        product: {
          name,
          barcode,
          image: p.image_url || undefined,
          categoryName: normalizeCategoryName(p.categories_tags),
        },
      };
    }
  }

  return { source: "none" };
}
